import crypto from "crypto";
import { LeadModel, SearchGroupModel } from "./lead.model";
import { searchGroupService } from "../searchGroup/searchGroup.service";
import {
  TKnownLeads,
  TSaveLeadPayload,
  TSaveLeadResult,
  TSearchGroupResponse,
  TGetLeadsQuery,
  TPaginatedLeadsResponse,
  TGetSearchGroupsQuery,
  TPaginatedSearchGroupsResponse,
} from "./lead.types";

export function normalizeUrl(url: string): string {
  if (!url) return "";
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

export function extractPhoneDigits(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

export function extractFacebook(url: string): string | undefined {
  if (!url) return undefined;
  try {
    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;
    const host = new URL(target).hostname.toLowerCase();
    if (
      host === "facebook.com" ||
      host.endsWith(".facebook.com") ||
      host === "fb.com" ||
      host.endsWith(".fb.com")
    ) {
      return url;
    }
  } catch {}
  return undefined;
}

export function extractInstagram(url: string): string | undefined {
  if (!url) return undefined;
  try {
    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;
    const host = new URL(target).hostname.toLowerCase();
    if (host === "instagram.com" || host.endsWith(".instagram.com")) {
      return url;
    }
  } catch {}
  return undefined;
}

export function extractLinkedIn(url: string): string | undefined {
  if (!url) return undefined;
  try {
    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;
    const host = new URL(target).hostname.toLowerCase();
    if (host === "linkedin.com" || host.endsWith(".linkedin.com")) {
      return url;
    }
  } catch {}
  return undefined;
}

export function extractWhatsApp(url: string): string | undefined {
  if (!url) return undefined;
  try {
    let target = url.trim();
    if (!/^https?:\/\//i.test(target)) target = "https://" + target;
    const host = new URL(target).hostname.toLowerCase();
    if (
      host === "wa.me" ||
      host.endsWith(".wa.me") ||
      host.includes("whatsapp.com")
    ) {
      return url;
    }
  } catch {}
  return undefined;
}

export function findDuplicateInfo(
  candidate: TSaveLeadPayload,
  existingLeads: any[],
): { index: number; by?: string } {
  const normName = (candidate.name || "").trim().toLowerCase();
  const candDigits = extractPhoneDigits(candidate.phone || "");
  const normWeb = (candidate.website || "").trim().toLowerCase();
  const normAddr = (candidate.address || "").trim().toLowerCase();
  const cleanCandWeb = normalizeUrl(candidate.website || "");
  const cleanCandFb = normalizeUrl(candidate.facebook || "");
  const cleanCandIg = normalizeUrl(candidate.instagram || "");
  const cleanCandLi = normalizeUrl(candidate.linkedin || "");
  const cleanCandWa =
    extractPhoneDigits(candidate.whatsapp || "") ||
    normalizeUrl(candidate.whatsapp || "");

  for (let i = 0; i < existingLeads.length; i++) {
    const l = existingLeads[i];

    // ID match
    if (candidate.id && (l.leadId === candidate.id || l.id === candidate.id)) {
      return { index: i, by: "id" };
    }

    // Phone match
    const exDigits = extractPhoneDigits(l.phone || "");
    if (candDigits.length >= 7 && exDigits.length >= 7) {
      if (candDigits === exDigits) return { index: i, by: "phone" };
      if (
        candDigits.length >= 10 &&
        exDigits.length >= 10 &&
        candDigits.slice(-10) === exDigits.slice(-10)
      ) {
        return { index: i, by: "phone" };
      }
    }

    // Social matches
    const cleanExFb = normalizeUrl(l.facebook || "");
    if (
      cleanCandFb.length > 12 &&
      cleanExFb.length > 12 &&
      cleanCandFb === cleanExFb
    ) {
      return { index: i, by: "facebook" };
    }

    const cleanExIg = normalizeUrl(l.instagram || "");
    if (
      cleanCandIg.length > 12 &&
      cleanExIg.length > 12 &&
      cleanCandIg === cleanExIg
    ) {
      return { index: i, by: "instagram" };
    }

    const cleanExLi = normalizeUrl(l.linkedin || "");
    if (
      cleanCandLi.length > 12 &&
      cleanExLi.length > 12 &&
      cleanCandLi === cleanExLi
    ) {
      return { index: i, by: "linkedin" };
    }

    const cleanExWa =
      extractPhoneDigits(l.whatsapp || "") || normalizeUrl(l.whatsapp || "");
    if (
      cleanCandWa.length >= 7 &&
      cleanExWa.length >= 7 &&
      cleanCandWa === cleanExWa
    ) {
      return { index: i, by: "whatsapp" };
    }

    const exNormName = (l.name || "").trim().toLowerCase();
    const sameName = normName === exNormName && normName.length > 0;

    if (sameName) {
      const exNormWeb = (l.website || "").trim().toLowerCase();
      if (
        normWeb.length > 10 &&
        exNormWeb.length > 10 &&
        normWeb === exNormWeb
      ) {
        return { index: i, by: "website" };
      }
      const cleanExWeb = normalizeUrl(l.website || "");
      if (
        cleanCandWeb.length > 6 &&
        cleanExWeb.length > 6 &&
        cleanCandWeb === cleanExWeb
      ) {
        return { index: i, by: "website" };
      }

      if (
        cleanCandFb.length > 12 &&
        cleanExFb.length > 12 &&
        cleanCandFb === cleanExFb
      ) {
        return { index: i, by: "facebook" };
      }

      if (
        cleanCandIg.length > 12 &&
        cleanExIg.length > 12 &&
        cleanCandIg === cleanExIg
      ) {
        return { index: i, by: "instagram" };
      }

      if (
        cleanCandLi.length > 12 &&
        cleanExLi.length > 12 &&
        cleanCandLi === cleanExLi
      ) {
        return { index: i, by: "linkedin" };
      }

      if (
        cleanCandWa.length >= 7 &&
        cleanExWa.length >= 7 &&
        cleanCandWa === cleanExWa
      ) {
        return { index: i, by: "whatsapp" };
      }

      const exNormAddr = (l.address || "").trim().toLowerCase();
      if (
        normAddr.length > 15 &&
        exNormAddr.length > 15 &&
        normAddr === exNormAddr
      ) {
        return { index: i, by: "address" };
      }
    }
  }

  return { index: -1 };
}

export function getSourcePriority(source?: string): number {
  const s = (source || "").toLowerCase().trim();
  if (s.includes("map") || s.includes("google")) return 1;
  if (s.includes("facebook") || s.includes("fb")) return 2;
  if (s.includes("linkedin")) return 3;
  return 4;
}

export function sortLeadsBySourcePriority<
  T extends { source?: string; createdAt?: number | string }
>(leads: T[]): T[] {
  return leads.sort((a, b) => {
    const pA = getSourcePriority(a.source);
    const pB = getSourcePriority(b.source);
    if (pA !== pB) {
      return pA - pB;
    }
    const tA =
      typeof a.createdAt === "number"
        ? a.createdAt
        : new Date(a.createdAt || 0).getTime();
    const tB =
      typeof b.createdAt === "number"
        ? b.createdAt
        : new Date(b.createdAt || 0).getTime();
    return tB - tA;
  });
}

const getSearchGroups = async (query?: any) => {
  return searchGroupService.getSearchGroups(query);
};

const getLeads = async (
  query: TGetLeadsQuery = {},
): Promise<TPaginatedLeadsResponse> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const matchConditions: any[] = [];

  // 1. Group / Query filter
  const targetGroup = (query.groupId || query.searchQuery || "").trim();
  if (targetGroup && targetGroup !== "all") {
    matchConditions.push({
      $or: [
        { groupId: targetGroup },
        { searchQuery: targetGroup },
        { searchQuery: new RegExp(`^${escapeRegex(targetGroup)}$`, "i") },
      ],
    });
  }

  // 2. Source filter
  const sourceFilter = (query.source || "").trim();
  if (sourceFilter && sourceFilter.toLowerCase() !== "all") {
    matchConditions.push({
      source: { $regex: new RegExp(`^${escapeRegex(sourceFilter)}$`, "i") },
    });
  }

  // 3. Website filter (Potential Client: no website)
  if (query.websiteFilter === "no-website") {
    matchConditions.push({
      $or: [
        { website: "" },
        { website: null },
        { website: { $exists: false } },
      ],
    });
  } else if (query.websiteFilter === "has-website") {
    matchConditions.push({
      website: { $exists: true, $ne: null, $gt: "" },
    });
  }

  // 4. Text search matching
  const search = (query.search || "").trim();
  if (search) {
    const sRegex = new RegExp(escapeRegex(search), "i");
    matchConditions.push({
      $or: [
        { name: sRegex },
        { phone: sRegex },
        { email: sRegex },
        { website: sRegex },
        { address: sRegex },
        { searchQuery: sRegex },
        { remark: sRegex },
      ],
    });
  }

  const finalMatch =
    matchConditions.length > 0 ? { $and: matchConditions } : {};

  // Group scope for toolbar counts (unfiltered totals for this group)
  const groupScope =
    targetGroup && targetGroup !== "all"
      ? {
          $or: [
            { groupId: targetGroup },
            { searchQuery: targetGroup },
            { searchQuery: new RegExp(`^${escapeRegex(targetGroup)}$`, "i") },
          ],
        }
      : {};

  const sourcePriorityField = {
    $addFields: {
      sourcePriority: {
        $switch: {
          branches: [
            {
              case: {
                $regexMatch: {
                  input: { $ifNull: ["$source", ""] },
                  regex: /map|google/i,
                },
              },
              then: 1,
            },
            {
              case: {
                $regexMatch: {
                  input: { $ifNull: ["$source", ""] },
                  regex: /facebook|fb/i,
                },
              },
              then: 2,
            },
            {
              case: {
                $regexMatch: {
                  input: { $ifNull: ["$source", ""] },
                  regex: /linkedin/i,
                },
              },
              then: 3,
            },
          ],
          default: 4,
        },
      },
    },
  };

  const sortStage: any =
    query.sortBy === "newest"
      ? { createdAt: -1 }
      : query.sortBy === "oldest"
      ? { createdAt: 1 }
      : query.sortBy === "name_asc"
      ? { name: 1 }
      : query.sortBy === "name_desc"
      ? { name: -1 }
      : { sourcePriority: 1, createdAt: -1 };

  const pipeline: any[] = [
    { $match: finalMatch },
    sourcePriorityField,
    { $sort: sortStage },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [facetResults, totalAllInScope, noWebsiteInScope] =
    await Promise.all([
      LeadModel.aggregate(pipeline),
      LeadModel.countDocuments(groupScope),
      LeadModel.countDocuments({
        ...groupScope,
        $or: [
          { website: "" },
          { website: null },
          { website: { $exists: false } },
        ],
      }),
    ]);

  const facet = facetResults[0] || { data: [], totalCount: [] };
  const total = facet.totalCount[0]?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const data = facet.data.map((lead: any) => ({
    id: lead.leadId,
    leadId: lead.leadId,
    groupId: lead.groupId,
    source: lead.source,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    website: lead.website,
    address: lead.address,
    facebook: lead.facebook,
    instagram: lead.instagram,
    linkedin: lead.linkedin,
    whatsapp: lead.whatsapp,
    remark: lead.remark || "",
    searchQuery: lead.searchQuery,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  }));

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
      totalAll: totalAllInScope,
      noWebsiteCount: noWebsiteInScope,
      hasWebsiteCount: Math.max(0, totalAllInScope - noWebsiteInScope),
    },
    data,
  };
};

const saveLead = async (payload: TSaveLeadPayload): Promise<TSaveLeadResult> => {
  if (!payload || !payload.name) {
    const total = await LeadModel.countDocuments();
    return { status: "ignored", count: total };
  }

  const activeQuery =
    (payload.searchQuery || "").trim().toLowerCase() || "direct extraction";
  const now = Date.now();

  // Find or create group (case-insensitive regex to match existing groups)
  let group = await SearchGroupModel.findOne({
    query: { $regex: new RegExp(`^${escapeRegex(activeQuery)}$`, "i") },
  });

  if (!group) {
    const newGroupId = `group-${now}-${Math.random().toString(36).slice(2, 9)}`;
    group = await SearchGroupModel.create({
      groupId: newGroupId,
      query: activeQuery,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    if (group.query !== activeQuery) {
      group.query = activeQuery;
    }
    group.updatedAt = now;
    await group.save();
  }

  const existingLeads = await LeadModel.find({ groupId: group.groupId });
  const dupInfo = findDuplicateInfo(payload, existingLeads);

  if (dupInfo.index !== -1) {
    const existing = existingLeads[dupInfo.index];
    let changed = false;

    if (!existing.phone && payload.phone) {
      existing.phone = payload.phone;
      changed = true;
    }
    if (!existing.email && payload.email) {
      existing.email = payload.email;
      changed = true;
    }
    if (!existing.website && payload.website) {
      if (extractFacebook(payload.website)) {
        if (!existing.facebook) {
          existing.facebook = payload.website;
          changed = true;
        }
      } else if (extractInstagram(payload.website)) {
        if (!existing.instagram) {
          existing.instagram = payload.website;
          changed = true;
        }
      } else if (extractLinkedIn(payload.website)) {
        if (!existing.linkedin) {
          existing.linkedin = payload.website;
          changed = true;
        }
      } else if (extractWhatsApp(payload.website)) {
        if (!existing.whatsapp) {
          existing.whatsapp = payload.website;
          changed = true;
        }
      } else {
        existing.website = payload.website;
        changed = true;
      }
    }
    if (!existing.address && payload.address) {
      existing.address = payload.address;
      changed = true;
    }
    if (!existing.facebook && payload.facebook) {
      existing.facebook = payload.facebook;
      changed = true;
    }
    if (!existing.instagram && payload.instagram) {
      existing.instagram = payload.instagram;
      changed = true;
    }
    if (!existing.linkedin && payload.linkedin) {
      existing.linkedin = payload.linkedin;
      changed = true;
    }
    if (!existing.whatsapp && payload.whatsapp) {
      existing.whatsapp = payload.whatsapp;
      changed = true;
    }
    if (payload.remark && payload.remark !== existing.remark) {
      existing.remark = payload.remark;
      changed = true;
    }

    if (changed) {
      existing.updatedAt = now;
      await existing.save();
      return {
        status: "merged",
        count: existingLeads.length,
        by: dupInfo.by,
      };
    }

    return {
      status: "duplicate",
      count: existingLeads.length,
      by: dupInfo.by,
    };
  }

  const leadId =
    payload.id ||
    (typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `lead-${now}-${Math.random().toString(36).slice(2, 9)}`);

  await LeadModel.create({
    leadId,
    groupId: group.groupId,
    searchQuery: activeQuery,
    source: payload.source || "Unknown",
    name: payload.name.trim(),
    phone: payload.phone || "",
    email: payload.email || "",
    website: payload.website || "",
    address: payload.address || "",
    facebook: payload.facebook || "",
    instagram: payload.instagram || "",
    linkedin: payload.linkedin || "",
    whatsapp: payload.whatsapp || "",
    remark: payload.remark || "",
    createdAt: now,
    updatedAt: now,
  });

  return {
    status: "ok",
    count: existingLeads.length + 1,
  };
};

const updateLeadRemark = async (
  leadId: string,
  remark: string,
  groupId?: string,
): Promise<TSearchGroupResponse[]> => {
  const now = Date.now();
  await LeadModel.updateOne(
    { leadId },
    { $set: { remark: remark || "", updatedAt: now } },
  );

  if (groupId) {
    await SearchGroupModel.updateOne(
      { groupId },
      { $set: { updatedAt: now } },
    );
  }

  const res = await getSearchGroups();
  return res.data;
};

const getKnownLeadsForQuery = async (query?: string): Promise<TKnownLeads> => {
  const cleanQ = (query || "").trim().toLowerCase();
  if (!cleanQ) {
    return { phoneDigits: [], normalizedNames: [], websites: [] };
  }

  const group = await SearchGroupModel.findOne({
    query: { $regex: new RegExp(`^${escapeRegex(cleanQ)}$`, "i") },
  }).lean();

  if (!group) {
    return { phoneDigits: [], normalizedNames: [], websites: [] };
  }

  const leads = await LeadModel.find({ groupId: group.groupId }).lean();

  const phoneDigits = Array.from(
    new Set(
      leads
        .map((l) => extractPhoneDigits(l.phone || ""))
        .filter((d) => d.length >= 7),
    ),
  );

  const normalizedNames = Array.from(
    new Set(
      leads
        .map((l) =>
          (l.name || "").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, ""),
        )
        .filter((n) => n.length > 0),
    ),
  );

  const websites = Array.from(
    new Set(
      leads
        .flatMap((l) => [
          normalizeUrl(l.website || ""),
          normalizeUrl(l.facebook || ""),
          normalizeUrl(l.instagram || ""),
          normalizeUrl(l.linkedin || ""),
          normalizeUrl(l.whatsapp || ""),
        ])
        .filter((w) => w.length > 6),
    ),
  );

  return { phoneDigits, normalizedNames, websites };
};

const deleteLead = async (
  groupId: string,
  leadId: string,
): Promise<TSearchGroupResponse[]> => {
  await LeadModel.deleteOne({ groupId, leadId });
  await SearchGroupModel.updateOne(
    { groupId },
    { $set: { updatedAt: Date.now() } },
  );
  const res = await getSearchGroups();
  return res.data;
};

const deleteSearchGroup = async (groupId: string): Promise<any> => {
  return searchGroupService.deleteSearchGroup(groupId);
};

const clearAll = async (): Promise<void> => {
  await LeadModel.deleteMany({});
  await SearchGroupModel.deleteMany({});
};

const importLeads = async (
  leads: TSaveLeadPayload[],
  groupName?: string,
  groupId?: string,
): Promise<{ searchGroups: TSearchGroupResponse[]; targetGroupId: string }> => {
  const now = Date.now();
  let targetGroup: any;

  if (groupId) {
    targetGroup = await SearchGroupModel.findOne({ groupId });
  }

  if (!targetGroup) {
    const activeName =
      (groupName || "imported leads").trim().toLowerCase() || "imported leads";

    // Try finding existing group with same name (case-insensitive)
    targetGroup = await SearchGroupModel.findOne({
      query: { $regex: new RegExp(`^${escapeRegex(activeName)}$`, "i") },
    });

    if (!targetGroup) {
      const newGroupId = `group-${now}-${Math.random().toString(36).slice(2, 9)}`;
      targetGroup = await SearchGroupModel.create({
        groupId: newGroupId,
        query: activeName,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      if (targetGroup.query !== activeName) {
        targetGroup.query = activeName;
      }
      targetGroup.updatedAt = now;
      await targetGroup.save();
    }
  } else {
    targetGroup.updatedAt = now;
    await targetGroup.save();
  }

  const existingLeads = await LeadModel.find({ groupId: targetGroup.groupId });

  for (const raw of leads) {
    if (!raw || !raw.name) continue;

    const dupIndex = findDuplicateInfo(raw, existingLeads).index;
    if (dupIndex !== -1) {
      const existing = existingLeads[dupIndex];
      let changed = false;
      if (!existing.phone && raw.phone) {
        existing.phone = raw.phone;
        changed = true;
      }
      if (!existing.email && raw.email) {
        existing.email = raw.email;
        changed = true;
      }
      if (!existing.website && raw.website) {
        existing.website = raw.website;
        changed = true;
      }
      if (!existing.address && raw.address) {
        existing.address = raw.address;
        changed = true;
      }
      if (!existing.facebook && raw.facebook) {
        existing.facebook = raw.facebook;
        changed = true;
      }
      if (!existing.instagram && raw.instagram) {
        existing.instagram = raw.instagram;
        changed = true;
      }
      if (!existing.linkedin && raw.linkedin) {
        existing.linkedin = raw.linkedin;
        changed = true;
      }
      if (!existing.whatsapp && raw.whatsapp) {
        existing.whatsapp = raw.whatsapp;
        changed = true;
      }
      if (raw.remark && raw.remark !== existing.remark) {
        existing.remark = raw.remark;
        changed = true;
      }
      if (changed) {
        existing.updatedAt = now;
        await existing.save();
      }
    } else {
      const leadId =
        raw.id ||
        (typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `lead-${now}-${Math.random().toString(36).slice(2, 9)}`);

      const newDoc = await LeadModel.create({
        leadId,
        groupId: targetGroup.groupId,
        searchQuery: targetGroup.query,
        source: raw.source || "CSV Import",
        name: raw.name.trim(),
        phone: raw.phone || "",
        email: raw.email || "",
        website: raw.website || "",
        address: raw.address || "",
        facebook: raw.facebook || "",
        instagram: raw.instagram || "",
        linkedin: raw.linkedin || "",
        whatsapp: raw.whatsapp || "",
        remark: raw.remark || "",
        createdAt: now,
        updatedAt: now,
      });
      existingLeads.push(newDoc);
    }
  }

  targetGroup.updatedAt = Date.now();
  await targetGroup.save();

  const groupsRes = await getSearchGroups();
  return { searchGroups: groupsRes.data, targetGroupId: targetGroup.groupId };
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const leadService = {
  getSearchGroups,
  getLeads,
  saveLead,
  updateLeadRemark,
  getKnownLeadsForQuery,
  deleteLead,
  deleteSearchGroup,
  clearAll,
  importLeads,
};
