import { Document } from "mongoose";

export interface TSettings {
  key: string;
  dailyApproachTarget: number;
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
