import { Document } from "mongoose";

export interface TTargetHistoryEntry {
  effectiveDate: string; // YYYY-MM-DD
  effectiveTimestamp: number;
  target: number;
  updatedBy?: string;
}

export interface TSettings {
  key: string;
  dailyApproachTarget: number;
  targetHistory?: TTargetHistoryEntry[];
  dailyScrapeLimit: number;
  updatedBy?: string;
  createdAt: number;
  updatedAt: number;
}

export type TSettingsDocument = TSettings & Document;

export interface TUpdateSettingsPayload {
  dailyApproachTarget?: number;
  dailyScrapeLimit?: number;
  updatedBy?: string;
}
