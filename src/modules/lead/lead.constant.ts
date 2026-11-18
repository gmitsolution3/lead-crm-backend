export const LEAD_SOURCE = {
  GOOGLE_MAPS: "Google Maps",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  CSV_IMPORT: "CSV Import",
  UNKNOWN: "Unknown",
} as const;

export type TLeadSource = (typeof LEAD_SOURCE)[keyof typeof LEAD_SOURCE];
