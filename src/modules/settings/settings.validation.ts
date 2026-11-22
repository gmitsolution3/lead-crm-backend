import { z } from "zod";

export const updateSettingsValidationSchema = z.object({
  body: z.object({
    dailyApproachTarget: z
      .number()
      .int("Daily approach target must be an integer")
      .min(1, "Daily target must be at least 1")
      .max(1000, "Daily target cannot exceed 1000")
      .optional(),
    dailyScrapeLimit: z
      .number()
      .int("Daily scrape limit must be an integer")
      .min(10, "Daily scrape limit must be at least 10")
      .max(50000, "Daily scrape limit cannot exceed 50,000")
      .optional(),
    updatedBy: z.string().optional(),
  }),
});
