export const LEAD_SOURCE = {
  GOOGLE_MAPS: "Google Maps",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
  CSV_IMPORT: "CSV Import",
  UNKNOWN: "Unknown",
} as const;

export type TLeadSource = (typeof LEAD_SOURCE)[keyof typeof LEAD_SOURCE];

export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  uncontacted: ["called", "call_later", "interested", "not_interested", "invalid"],
  called: ["call_later", "interested", "not_interested", "converted", "invalid"],
  call_later: ["called", "interested", "not_interested", "converted", "invalid"],
  interested: ["call_later", "not_interested", "converted", "invalid"],
  not_interested: ["call_later", "interested", "invalid"],
  converted: ["not_interested"],
  invalid: ["uncontacted"],
};

export function isStatusTransitionAllowed(
  currentStatus?: string,
  targetStatus?: string
): boolean {
  if (!targetStatus) return true;
  const current = currentStatus || "uncontacted";
  if (current === targetStatus) return true;
  const allowed = ALLOWED_STATUS_TRANSITIONS[current];
  if (!allowed) return true;
  return allowed.includes(targetStatus);
}
