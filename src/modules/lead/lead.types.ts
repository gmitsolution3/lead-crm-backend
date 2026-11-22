import { Document } from "mongoose";

export type TLeadStatus =
  | "uncontacted"
  | "called"
  | "call_later"
  | "interested"
  | "not_interested"
  | "converted"
  | "invalid";

export type TLeadPriority = "low" | "medium" | "high";

export type TLeadUser = {
  userId?: string;
  name?: string;
  email?: string;
};

export type TLeadNote = {
  noteId: string;
  content: string;
  createdAt: number;
  createdBy?: TLeadUser;
};

export type TLead = {
  leadId: string;
  groupId: string;
  searchQuery: string;
  source: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
  status?: TLeadStatus;
  priority?: TLeadPriority;
  followUpDate?: number | null;
  dealValue?: number;
  lastContactedAt?: number | null;
  callCount?: number;
  assignedTo?: TLeadUser;
  lastContactedBy?: TLeadUser;
  notes?: TLeadNote[];
  createdAt: number;
  updatedAt: number;
};

export type TLeadDocument = TLead & Document;

export type TSearchGroup = {
  groupId: string;
  query: string;
  createdAt: number;
  updatedAt: number;
  leads?: TLeadResponse[];
};

export type TSearchGroupDocument = TSearchGroup & Document;

export type TLeadResponse = {
  id: string;
  leadId?: string;
  groupId?: string;
  source: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
  searchQuery?: string;
  status?: TLeadStatus;
  priority?: TLeadPriority;
  followUpDate?: number | null;
  dealValue?: number;
  lastContactedAt?: number | null;
  callCount?: number;
  assignedTo?: TLeadUser;
  lastContactedBy?: TLeadUser;
  notes?: TLeadNote[];
  createdAt?: number;
  updatedAt?: number;
};

export type TSearchGroupResponse = {
  id: string;
  groupId: string;
  query: string;
  createdAt: number;
  updatedAt?: number;
  leadCount?: number;
  potentialCount?: number;
  leads?: TLeadResponse[];
};

export type TGetSearchGroupsQuery = {
  page?: string | number;
  limit?: string | number;
  search?: string;
  sortBy?: string;
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

export type TKnownLeads = {
  phoneDigits: string[];
  normalizedNames: string[];
  websites: string[];
};

export type TSaveLeadPayload = {
  id?: string;
  groupId?: string;
  source?: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
  searchQuery?: string;
  initialNote?: string;
  notes?: TLeadNote[];
};

export type TSaveLeadResult = {
  status: "ok" | "merged" | "duplicate" | "ignored";
  count: number;
  by?: string;
  lead?: any;
};

export type TGetLeadsQuery = {
  page?: string | number;
  limit?: string | number;
  search?: string;
  source?: string;
  websiteFilter?: string;
  groupId?: string;
  searchQuery?: string;
  sortBy?: string;
  status?: string;
  priority?: string;
  followUpFilter?: string;
  assignedTo?: string;
};

export type TPaginatedLeadsResponse = {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    totalAll?: number;
    noWebsiteCount?: number;
    hasWebsiteCount?: number;
    interestedCount?: number;
    overdueCount?: number;
    convertedCount?: number;
  };
  data: TLeadResponse[];
};
