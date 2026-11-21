import { Document } from "mongoose";

export type TSearchGroup = {
  groupId: string;
  query: string;
  createdAt: number;
  updatedAt: number;
};

export type TSearchGroupDocument = TSearchGroup & Document;

export type TSearchGroupResponse = {
  id: string;
  groupId: string;
  query: string;
  createdAt: number;
  updatedAt: number;
  leadCount: number;
  potentialCount: number;
  leads?: any[];
};

export type TGetSearchGroupsQuery = {
  page?: string | number;
  limit?: string | number;
  search?: string;
  sortBy?: "newest" | "oldest" | "query_asc" | "query_desc" | string;
};

export type TPaginatedSearchGroupsResponse = {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: TSearchGroupResponse[];
};
