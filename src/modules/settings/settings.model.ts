import { Schema, model } from "mongoose";
import { TSettingsDocument, TTargetHistoryEntry } from "./settings.types";

const targetHistorySchema = new Schema<TTargetHistoryEntry>(
  {
    effectiveDate: {
      type: String,
      required: true,
    },
    effectiveTimestamp: {
      type: Number,
      required: true,
    },
    target: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },
    updatedBy: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const settingsSchema = new Schema<TSettingsDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "workspace_settings",
      index: true,
    },
    dailyApproachTarget: {
      type: Number,
      required: true,
      default: 25,
      min: 1,
      max: 1000,
    },
    targetHistory: {
      type: [targetHistorySchema],
      default: [],
    },
    dailyScrapeLimit: {
      type: Number,
      required: true,
      default: 200,
      min: 10,
      max: 50000,
    },
    updatedBy: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Number,
      default: () => Date.now(),
    },
    updatedAt: {
      type: Number,
      default: () => Date.now(),
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

export const SettingsModel = model<TSettingsDocument>("Settings", settingsSchema);
