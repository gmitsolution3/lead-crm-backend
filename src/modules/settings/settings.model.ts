import { Schema, model } from "mongoose";
import {
  TModeratorTargetConfig,
  TSettingsDocument,
  TTargetHistoryEntry,
} from "./settings.types";

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

const moderatorTargetSchema = new Schema<TModeratorTargetConfig>(
  {
    userId: { type: String, required: true },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    dailyCallTarget: { type: Number, required: true, default: 40, min: 1, max: 2000 },
    dailyContactTarget: { type: Number, required: true, default: 25, min: 1, max: 1000 },
    dailyQualifiedTarget: { type: Number, required: true, default: 5, min: 0, max: 500 },
    dailyConversionTarget: { type: Number, required: true, default: 1, min: 0, max: 200 },
    targetHistory: { type: [targetHistorySchema], default: [] },
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
    dailyCallTarget: {
      type: Number,
      default: 40,
      min: 1,
      max: 2000,
    },
    dailyQualifiedTarget: {
      type: Number,
      default: 5,
      min: 0,
      max: 500,
    },
    dailyConversionTarget: {
      type: Number,
      default: 1,
      min: 0,
      max: 200,
    },
    targetHistory: {
      type: [targetHistorySchema],
      default: [],
    },
    moderatorTargets: {
      type: [moderatorTargetSchema],
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
