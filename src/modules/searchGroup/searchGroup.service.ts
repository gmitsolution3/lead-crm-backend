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
  const matchCondition: any = {};
  const search = (query.search || "").trim();
  if (search) {
    const sRegex = new RegExp(escapeRegex(search), "i");
    matchCondition.$or = [{ query: sRegex }, { groupId: sRegex }];
  }

  const sortQuery: any =
    query.sortBy === "oldest"
      ? { updatedAt: 1 }
      : query.sortBy === "query_asc"
      ? { query: 1 }
      : query.sortBy === "query_desc"
      ? { query: -1 }
      : { updatedAt: -1 };

  const page = Math.max(1, Number(query.page) || 1);
  const isPaginated = query.page !== undefined || query.limit !== undefined;
  const limit = isPaginated
    ? Math.max(1, Math.min(100, Number(query.limit) || 12))
    : 0;
  const skip = (page - 1) * limit;

  const lookupStage = getLookupStage();

  if (isPaginated && limit > 0) {
    const facetPipeline: any[] = [
      { $match: matchCondition },
      { $sort: sortQuery },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            lookupStage,
            projectStage,
          ],
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

  // Non-paginated query (fetches all groups with computed counts and leads)
  const nonPaginatedPipeline: any[] = [
    { $match: matchCondition },
    { $sort: sortQuery },
    lookupStage,
    projectStage,
  ];

  const data = await SearchGroupModel.aggregate(nonPaginatedPipeline);
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
