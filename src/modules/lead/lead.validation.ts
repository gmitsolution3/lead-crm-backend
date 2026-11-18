import { z } from "zod";

export const saveLeadValidationSchema = z.object({
  body: z.object({
    id: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    facebook: z.string().nullable().optional(),
    instagram: z.string().nullable().optional(),
    linkedin: z.string().nullable().optional(),
    whatsapp: z.string().nullable().optional(),
    remark: z.string().nullable().optional(),
    searchQuery: z.string().nullable().optional(),
  }).passthrough(),
});

export const importLeadsValidationSchema = z.object({
  body: z.object({
    leads: z.array(
      z.object({
        id: z.string().nullable().optional(),
        source: z.string().nullable().optional(),
        name: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
        website: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        facebook: z.string().nullable().optional(),
        instagram: z.string().nullable().optional(),
        linkedin: z.string().nullable().optional(),
        whatsapp: z.string().nullable().optional(),
        remark: z.string().nullable().optional(),
        searchQuery: z.string().nullable().optional(),
      }).passthrough(),
    ),
    groupName: z.string().nullable().optional(),
    groupId: z.string().nullable().optional(),
  }).passthrough(),
});

export const updateLeadRemarkValidationSchema = z.object({
  params: z.object({
    leadId: z.string(),
  }),
  body: z.object({
    remark: z.string(),
    groupId: z.string().optional(),
  }),
});

export const knownLeadsQueryValidationSchema = z.object({
  query: z.object({
    query: z.string().optional(),
  }),
});

export const deleteLeadValidationSchema = z.object({
  params: z.object({
    groupId: z.string(),
    leadId: z.string(),
  }),
});

export const deleteGroupValidationSchema = z.object({
  params: z.object({
    groupId: z.string(),
  }),
});
