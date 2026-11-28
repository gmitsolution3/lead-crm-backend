import { SettingsModel } from "./settings.model";
import {
  TModeratorTargetConfig,
  TSettings,
  TTargetHistoryEntry,
  TUpdateSettingsPayload,
} from "./settings.types";

const WORKSPACE_SETTINGS_KEY = "workspace_settings";

const getTodayDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const upsertTargetHistory = (
  existingHistory: TTargetHistoryEntry[] = [],
  todayStr: string,
  startOfToday: number,
  target: number,
  updatedBy: string = "",
): TTargetHistoryEntry[] => {
  const history = [...existingHistory];
  const todayIndex = history.findIndex((h) => h.effectiveDate === todayStr);
  if (todayIndex >= 0) {
    history[todayIndex] = {
      ...history[todayIndex],
      target,
      effectiveTimestamp: startOfToday,
      updatedBy: updatedBy || history[todayIndex].updatedBy,
    };
  } else {
    history.push({
      effectiveDate: todayStr,
      effectiveTimestamp: startOfToday,
      target,
      updatedBy,
    });
  }
  history.sort((a, b) => a.effectiveTimestamp - b.effectiveTimestamp);
  return history;
};

export const getTargetForDate = (
  dateOrTimestamp: number | Date,
  history: TTargetHistoryEntry[] = [],
  fallbackTarget: number = 25,
): number => {
  if (!history || history.length === 0) {
    return fallbackTarget;
  }

  const queryTime = typeof dateOrTimestamp === "number" ? dateOrTimestamp : dateOrTimestamp.getTime();
  const sorted = [...history].sort((a, b) => a.effectiveTimestamp - b.effectiveTimestamp);

  // If query is before the earliest recorded history, return the earliest target or fallback
  if (queryTime < sorted[0].effectiveTimestamp) {
    return sorted[0].target ?? fallbackTarget;
  }

  let activeTarget = fallbackTarget;
  for (const entry of sorted) {
    if (entry.effectiveTimestamp <= queryTime) {
      activeTarget = entry.target;
    } else {
      break;
    }
  }

  return activeTarget;
};

const getSettings = async (): Promise<TSettings> => {
  let settings = await SettingsModel.findOne({ key: WORKSPACE_SETTINGS_KEY }).lean();

  if (!settings) {
    const now = Date.now();
    const d = new Date(now);
    const startOfToday = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
    const todayStr = getTodayDateString(d);

    const created = await SettingsModel.create({
      key: WORKSPACE_SETTINGS_KEY,
      dailyApproachTarget: 25,
      targetHistory: [
        {
          effectiveDate: todayStr,
          effectiveTimestamp: startOfToday,
          target: 25,
          updatedBy: "system",
        },
      ],
      dailyScrapeLimit: 200,
      createdAt: now,
      updatedAt: now,
    });
    return created.toObject();
  }

  // Auto-initialize targetHistory on existing settings if not present
  if (!settings.targetHistory || settings.targetHistory.length === 0) {
    const d = new Date();
    const startOfToday = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
    const todayStr = getTodayDateString(d);
    const initialHistory: TTargetHistoryEntry[] = [
      {
        effectiveDate: todayStr,
        effectiveTimestamp: startOfToday,
        target: settings.dailyApproachTarget || 25,
        updatedBy: "system",
      },
    ];

    await SettingsModel.updateOne(
      { key: WORKSPACE_SETTINGS_KEY },
      { $set: { targetHistory: initialHistory } },
    );
    settings.targetHistory = initialHistory;
  }

  return settings as TSettings;
};

const updateSettings = async (
  payload: TUpdateSettingsPayload,
): Promise<TSettings> => {
  const now = Date.now();
  const d = new Date(now);
  const startOfToday = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
  const todayStr = getTodayDateString(d);

  // Fetch existing settings to manage target history
  const currentSettings = await SettingsModel.findOne({ key: WORKSPACE_SETTINGS_KEY }).lean();

  const updateData: Partial<TSettings> & { targetHistory?: TTargetHistoryEntry[] } = {
    updatedAt: now,
  };

  if (payload.dailyApproachTarget !== undefined) {
    updateData.dailyApproachTarget = payload.dailyApproachTarget;
    updateData.targetHistory = upsertTargetHistory(
      currentSettings?.targetHistory,
      todayStr,
      startOfToday,
      payload.dailyApproachTarget,
      payload.updatedBy || "",
    );
  }

  if (payload.dailyCallTarget !== undefined) {
    updateData.dailyCallTarget = payload.dailyCallTarget;
  }
  if (payload.dailyQualifiedTarget !== undefined) {
    updateData.dailyQualifiedTarget = payload.dailyQualifiedTarget;
  }
  if (payload.dailyConversionTarget !== undefined) {
    updateData.dailyConversionTarget = payload.dailyConversionTarget;
  }

  if (payload.moderatorTargets !== undefined) {
    const existingList: TModeratorTargetConfig[] = currentSettings?.moderatorTargets || [];
    updateData.moderatorTargets = payload.moderatorTargets.map((item) => {
      const prev = existingList.find((m) => m.userId === item.userId);
      return {
        ...item,
        targetHistory: upsertTargetHistory(
          prev?.targetHistory,
          todayStr,
          startOfToday,
          item.dailyContactTarget,
          payload.updatedBy || "",
        ),
      };
    });
  }

  if (payload.dailyScrapeLimit !== undefined) {
    updateData.dailyScrapeLimit = payload.dailyScrapeLimit;
  }
  if (payload.updatedBy !== undefined) {
    updateData.updatedBy = payload.updatedBy;
  }

  const updated = await SettingsModel.findOneAndUpdate(
    { key: WORKSPACE_SETTINGS_KEY },
    {
      $set: updateData,
      $setOnInsert: {
        key: WORKSPACE_SETTINGS_KEY,
        createdAt: now,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  ).lean();

  return updated as TSettings;
};

export const getModeratorTargetsForDate = (
  userId: string | undefined,
  dateOrTimestamp: number | Date,
  settings: TSettings,
) => {
  const defaultContactTarget = getTargetForDate(
    dateOrTimestamp,
    settings.targetHistory,
    settings.dailyApproachTarget || 25,
  );
  const defaultCallTarget = settings.dailyCallTarget ?? 40;
  const defaultQualifiedTarget = settings.dailyQualifiedTarget ?? 5;
  const defaultConversionTarget = settings.dailyConversionTarget ?? 1;

  if (!userId || !settings.moderatorTargets?.length) {
    return {
      dailyCallTarget: defaultCallTarget,
      dailyContactTarget: defaultContactTarget,
      dailyQualifiedTarget: defaultQualifiedTarget,
      dailyConversionTarget: defaultConversionTarget,
      isCustom: false,
    };
  }

  const mod = settings.moderatorTargets.find((m) => m.userId === userId);
  if (!mod) {
    return {
      dailyCallTarget: defaultCallTarget,
      dailyContactTarget: defaultContactTarget,
      dailyQualifiedTarget: defaultQualifiedTarget,
      dailyConversionTarget: defaultConversionTarget,
      isCustom: false,
    };
  }

  return {
    dailyCallTarget: mod.dailyCallTarget ?? defaultCallTarget,
    dailyContactTarget: getTargetForDate(
      dateOrTimestamp,
      mod.targetHistory,
      mod.dailyContactTarget || defaultContactTarget,
    ),
    dailyQualifiedTarget: mod.dailyQualifiedTarget ?? defaultQualifiedTarget,
    dailyConversionTarget: mod.dailyConversionTarget ?? defaultConversionTarget,
    isCustom: true,
  };
};

export const settingsService = {
  getSettings,
  updateSettings,
  getTargetForDate,
  getModeratorTargetsForDate,
};
