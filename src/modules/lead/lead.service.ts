import crypto from "crypto";
import { LeadModel, SearchGroupModel } from "./lead.model";
import {
  TKnownLeads,
  TSaveLeadPayload,
  TSaveLeadResult,
  TSearchGroupResponse,
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

const getSearchGroups = async (): Promise<TSearchGroupResponse[]> => {
  const groups = await SearchGroupModel.find({}).sort({ updatedAt: -1 }).lean();
  if (groups.length === 0) return [];

  const groupIds = groups.map((g) => g.groupId);
  const leads = await LeadModel.find({ groupId: { $in: groupIds } })
    .sort({ createdAt: 1 })
    .lean();

  const leadsByGroup = new Map<string, any[]>();
  for (const lead of leads) {
    const list = leadsByGroup.get(lead.groupId) || [];
    list.push({
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
    });
    leadsByGroup.set(lead.groupId, list);
  }

  return groups.map((g) => {
    const groupLeads = leadsByGroup.get(g.groupId) || [];
    sortLeadsBySourcePriority(groupLeads);
    return {
      id: g.groupId,
      groupId: g.groupId,
      query: g.query,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      leads: groupLeads,
    };
  });
};

const getLeads = async (): Promise<any[]> => {
  const leads = await LeadModel.find({}).lean();
  const formatted = leads.map((lead) => ({
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
  return sortLeadsBySourcePriority(formatted);
};

const saveLead = async (payload: TSaveLeadPayload): Promise<TSaveLeadResult> => {
  if (!payload || !payload.name) {
    const total = await LeadModel.countDocuments();
    return { status: "ignored", count: total };
  }

  const activeQuery = (payload.searchQuery || "").trim() || "Direct Extraction";
  const now = Date.now();

  // Find or create group
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

  return getSearchGroups();
};

const getKnownLeadsForQuery = async (query?: string): Promise<TKnownLeads> => {
  if (!query || !query.trim()) {
    return { phoneDigits: [], normalizedNames: [], websites: [] };
  }

  const group = await SearchGroupModel.findOne({
    query: { $regex: new RegExp(`^${escapeRegex(query.trim())}$`, "i") },
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
  return getSearchGroups();
};

const deleteSearchGroup = async (
  groupId: string,
): Promise<TSearchGroupResponse[]> => {
  await LeadModel.deleteMany({ groupId });
  await SearchGroupModel.deleteOne({ groupId });
  return getSearchGroups();
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
      (groupName || "Imported Leads").trim() || "Imported Leads";
    const newGroupId = `group-${now}-${Math.random().toString(36).slice(2, 9)}`;
    targetGroup = await SearchGroupModel.create({
      groupId: newGroupId,
      query: activeName,
      createdAt: now,
      updatedAt: now,
    });
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

  const groups = await getSearchGroups();
  return { searchGroups: groups, targetGroupId: targetGroup.groupId };
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
