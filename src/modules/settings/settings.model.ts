import { Schema, model } from "mongoose";
import { TSettingsDocument } from "./settings.types";

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
