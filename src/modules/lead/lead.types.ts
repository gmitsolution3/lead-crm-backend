import { Document } from "mongoose";

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
  remark?: string;
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
  remark?: string;
  createdAt?: number;
  updatedAt?: number;
};

export type TSearchGroupResponse = {
  id: string;
  groupId?: string;
  query: string;
  createdAt: number;
  updatedAt?: number;
  leads: TLeadResponse[];
};

export type TKnownLeads = {
  phoneDigits: string[];
  normalizedNames: string[];
  websites: string[];
};

export type TSaveLeadPayload = {
  id?: string;
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
  remark?: string;
};

export type TSaveLeadResult = {
  status: "ok" | "merged" | "duplicate" | "ignored";
  count: number;
  by?: string;
};
