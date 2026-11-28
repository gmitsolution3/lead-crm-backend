import { Document } from "mongoose";

export interface TTargetHistoryEntry {
  effectiveDate: string; // YYYY-MM-DD
  effectiveTimestamp: number;
  target: number;
  updatedBy?: string;
}

export interface TModeratorTargetConfig {
  userId: string;
  name?: string;
  email?: string;
  dailyCallTarget: number;
  dailyContactTarget: number;
  dailyQualifiedTarget: number;
  dailyConversionTarget: number;
  targetHistory?: TTargetHistoryEntry[];
}

export interface TSettings {
  key: string;
  dailyApproachTarget: number;
  dailyCallTarget?: number;
  dailyQualifiedTarget?: number;
  dailyConversionTarget?: number;
  targetHistory?: TTargetHistoryEntry[];
  moderatorTargets?: TModeratorTargetConfig[];
  dailyScrapeLimit: number;
  updatedBy?: string;
  createdAt: number;
  updatedAt: number;
}

export type TSettingsDocument = TSettings & Document;

export interface TUpdateSettingsPayload {
  dailyApproachTarget?: number;
  dailyCallTarget?: number;
  dailyQualifiedTarget?: number;
  dailyConversionTarget?: number;
  moderatorTargets?: TModeratorTargetConfig[];
  dailyScrapeLimit?: number;
  updatedBy?: string;
}
