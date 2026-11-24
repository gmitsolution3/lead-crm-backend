import { SettingsModel } from "./settings.model";
import { TSettings, TTargetHistoryEntry, TUpdateSettingsPayload } from "./settings.types";

const WORKSPACE_SETTINGS_KEY = "workspace_settings";

const getTodayDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

    const existingHistory: TTargetHistoryEntry[] = currentSettings?.targetHistory
      ? [...currentSettings.targetHistory]
      : [];

    // Check if entry for today already exists
    const todayIndex = existingHistory.findIndex((h) => h.effectiveDate === todayStr);
    if (todayIndex >= 0) {
      existingHistory[todayIndex] = {
        ...existingHistory[todayIndex],
        target: payload.dailyApproachTarget,
        effectiveTimestamp: startOfToday,
        updatedBy: payload.updatedBy || existingHistory[todayIndex].updatedBy,
      };
    } else {
      existingHistory.push({
        effectiveDate: todayStr,
        effectiveTimestamp: startOfToday,
        target: payload.dailyApproachTarget,
        updatedBy: payload.updatedBy || "",
      });
    }

    // Keep history sorted chronologically
    existingHistory.sort((a, b) => a.effectiveTimestamp - b.effectiveTimestamp);
    updateData.targetHistory = existingHistory;
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

export const settingsService = {
  getSettings,
  updateSettings,
  getTargetForDate,
};
