import { z } from "zod";

const moderatorTargetSchema = z.object({
  userId: z.string().min(1),
  name: z.string().optional(),
  email: z.string().optional(),
  dailyCallTarget: z.number().int().min(1).max(2000),
  dailyContactTarget: z.number().int().min(1).max(1000),
  dailyQualifiedTarget: z.number().int().min(0).max(500),
  dailyConversionTarget: z.number().int().min(0).max(200),
});

export const updateSettingsValidationSchema = z.object({
  body: z.object({
    dailyApproachTarget: z
      .number()
      .int("Daily approach target must be an integer")
      .min(1, "Daily target must be at least 1")
      .max(1000, "Daily target cannot exceed 1000")
      .optional(),
    dailyCallTarget: z
      .number()
      .int("Daily call target must be an integer")
      .min(1)
      .max(2000)
      .optional(),
    dailyQualifiedTarget: z
      .number()
      .int("Daily qualified target must be an integer")
      .min(0)
      .max(500)
      .optional(),
    dailyConversionTarget: z
      .number()
      .int("Daily conversion target must be an integer")
      .min(0)
      .max(200)
      .optional(),
    moderatorTargets: z.array(moderatorTargetSchema).optional(),
    dailyScrapeLimit: z
      .number()
      .int("Daily scrape limit must be an integer")
      .min(10, "Daily scrape limit must be at least 10")
      .max(50000, "Daily scrape limit cannot exceed 50,000")
      .optional(),
    updatedBy: z.string().optional(),
  }),
});
