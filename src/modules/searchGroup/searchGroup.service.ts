import { SearchGroupModel } from "./searchGroup.model";
import { LeadModel } from "../lead/lead.model";
import {
  TGetSearchGroupsQuery,
  TPaginatedSearchGroupsResponse,
  TSearchGroupResponse,
} from "./searchGroup.types";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const getLookupStage = () => ({
  $lookup: {
    from: LeadModel.collection.name,
    let: { grpId: "$groupId" },
    pipeline: [
      { $match: { $expr: { $eq: ["$groupId", "$$grpId"] } } },
      {
        $project: {
          _id: 0,
          id: "$leadId",
          leadId: 1,
          groupId: 1,
          searchQuery: 1,
          source: 1,
          name: 1,
          phone: 1,
          email: 1,
          website: 1,
          address: 1,
          facebook: 1,
          instagram: 1,
          linkedin: 1,
          whatsapp: 1,
          remark: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ],
    as: "leads",
  },
});

const projectStage = {
  $project: {
    _id: 0,
    id: "$groupId",
    groupId: 1,
    query: 1,
    createdAt: 1,
    updatedAt: 1,
    leadCount: { $size: "$leads" },
    potentialCount: {
      $size: {
        $filter: {
          input: "$leads",
          as: "l",
          cond: {
            $or: [
              { $eq: ["$$l.website", ""] },
              { $eq: ["$$l.website", null] },
              { $not: ["$$l.website"] },
            ],
          },
        },
      },
    },
    leads: "$leads",
  },
};

const getSearchGroups = async (
  query: TGetSearchGroupsQuery = {},
): Promise<TPaginatedSearchGroupsResponse> => {
  const initialMatch: any = {};
  const search = (query.search || "").trim();
  if (search) {
    const sRegex = new RegExp(escapeRegex(search), "i");
    initialMatch.$or = [{ query: sRegex }, { groupId: sRegex }];
  }

  const now = Date.now();
  if (query.dateRange === "today") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    initialMatch.updatedAt = { $gte: startOfToday.getTime() };
  } else if (query.dateRange === "7d") {
    initialMatch.updatedAt = { $gte: now - 7 * 24 * 60 * 60 * 1000 };
  } else if (query.dateRange === "30d") {
    initialMatch.updatedAt = { $gte: now - 30 * 24 * 60 * 60 * 1000 };
  }

  const postMatch: any = {};
  if (query.potentialFilter === "has_potential") {
    postMatch.potentialCount = { $gt: 0 };
  } else if (query.potentialFilter === "no_potential") {
    postMatch.potentialCount = { $eq: 0 };
  } else if (query.potentialFilter === "high_potential") {
    postMatch.potentialCount = { $gte: 5 };
  }

  if (query.sizeFilter === "has_leads") {
    postMatch.leadCount = { $gt: 0 };
  } else if (query.sizeFilter === "empty") {
    postMatch.leadCount = { $eq: 0 };
  } else if (query.sizeFilter === "10_plus") {
    postMatch.leadCount = { $gte: 10 };
  } else if (query.sizeFilter === "50_plus") {
    postMatch.leadCount = { $gte: 50 };
  }

  let sortQuery: any;
  switch (query.sortBy) {
    case "most_leads":
      sortQuery = { leadCount: -1, updatedAt: -1 };
      break;
    case "least_leads":
      sortQuery = { leadCount: 1, updatedAt: -1 };
      break;
    case "most_potential":
      sortQuery = { potentialCount: -1, updatedAt: -1 };
      break;
    case "oldest":
      sortQuery = { updatedAt: 1 };
      break;
    case "query_asc":
      sortQuery = { query: 1 };
      break;
    case "query_desc":
      sortQuery = { query: -1 };
      break;
    case "newest":
    default:
      sortQuery = { updatedAt: -1 };
      break;
  }

  const page = Math.max(1, Number(query.page) || 1);
  const isPaginated = query.page !== undefined || query.limit !== undefined;
  const limit = isPaginated
    ? Math.max(1, Math.min(100, Number(query.limit) || 12))
    : 0;
  const skip = (page - 1) * limit;

  const lookupStage = getLookupStage();

  const basePipeline: any[] = [
    { $match: initialMatch },
    lookupStage,
    projectStage,
  ];

  if (Object.keys(postMatch).length > 0) {
    basePipeline.push({ $match: postMatch });
  }

  basePipeline.push({ $sort: sortQuery });

  if (isPaginated && limit > 0) {
    const facetPipeline: any[] = [
      ...basePipeline,
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const results = await SearchGroupModel.aggregate(facetPipeline);
    const facet = results[0] || { data: [], totalCount: [] };
    const total = facet.totalCount[0]?.count || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
      data: facet.data,
    };
  }

  // Non-paginated query (fetches all groups matching filters)
  const data = await SearchGroupModel.aggregate(basePipeline);
  return {
    meta: {
      page: 1,
      limit: data.length,
      total: data.length,
      totalPages: 1,
    },
    data,
  };
};

const getSearchGroupById = async (
  groupId: string,
): Promise<TSearchGroupResponse | null> => {
  const cleanId = (groupId || "").trim();
  if (!cleanId) return null;

  const matchCondition: any = {
    $or: [
      { groupId: cleanId },
      { query: new RegExp(`^${escapeRegex(cleanId)}$`, "i") },
    ],
  };

  const results = await SearchGroupModel.aggregate([
    { $match: matchCondition },
    { $limit: 1 },
    getLookupStage(),
    projectStage,
  ]);

  return results[0] || null;
};

const deleteSearchGroup = async (
  groupId: string,
): Promise<TSearchGroupResponse[]> => {
  await LeadModel.deleteMany({ groupId });
  await SearchGroupModel.deleteOne({ groupId });
  const remaining = await getSearchGroups();
  return remaining.data;
};

export const searchGroupService = {
  getSearchGroups,
  getSearchGroupById,
  deleteSearchGroup,
};
