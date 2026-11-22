import { SettingsModel } from "./settings.model";
import { TSettings, TUpdateSettingsPayload } from "./settings.types";

const WORKSPACE_SETTINGS_KEY = "workspace_settings";

const getSettings = async (): Promise<TSettings> => {
  let settings = await SettingsModel.findOne({ key: WORKSPACE_SETTINGS_KEY }).lean();

  if (!settings) {
    const now = Date.now();
    const created = await SettingsModel.create({
      key: WORKSPACE_SETTINGS_KEY,
      dailyApproachTarget: 25,
      dailyScrapeLimit: 200,
      createdAt: now,
      updatedAt: now,
    });
    return created.toObject();
  }

  return settings as TSettings;
};

const updateSettings = async (
  payload: TUpdateSettingsPayload,
): Promise<TSettings> => {
  const now = Date.now();
  const updateData: Partial<TSettings> = {
    updatedAt: now,
  };

  if (payload.dailyApproachTarget !== undefined) {
    updateData.dailyApproachTarget = payload.dailyApproachTarget;
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
};
