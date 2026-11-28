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
    initialNote: z.string().nullable().optional(),
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
        searchQuery: z.string().nullable().optional(),
      }).passthrough(),
    ),
    groupName: z.string().nullable().optional(),
    groupId: z.string().nullable().optional(),
  }).passthrough(),
});

export const updateLeadValidationSchema = z.object({
  params: z.object({
    leadId: z.string(),
  }),
  body: z.object({
    status: z
      .enum([
        "uncontacted",
        "called",
        "call_later",
        "interested",
        "not_interested",
        "converted",
        "invalid",
      ])
      .optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    followUpDate: z.number().nullable().optional(),
    dealValue: z.number().optional(),
    whatsapp: z.string().nullable().optional(),
    assignedTo: z
      .object({
        userId: z.string().optional(),
        name: z.string().optional(),
        email: z.string().optional(),
      })
      .optional(),
    lastContactedBy: z
      .object({
        userId: z.string().optional(),
        name: z.string().optional(),
        email: z.string().optional(),
      })
      .optional(),
    lastContactedAt: z.number().nullable().optional(),
    callCount: z.number().optional(),
    incrementCallCount: z.boolean().optional(),
    groupId: z.string().optional(),
  }).passthrough(),
});

export const addLeadNoteValidationSchema = z.object({
  params: z.object({
    leadId: z.string(),
  }),
  body: z.object({
    content: z.string().min(1, "Note content cannot be empty"),
    createdBy: z
      .object({
        userId: z.string().optional(),
        name: z.string().optional(),
        email: z.string().optional(),
      })
      .optional(),
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
