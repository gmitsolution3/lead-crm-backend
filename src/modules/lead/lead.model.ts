import { Schema, model } from "mongoose";
import { TLeadDocument } from "./lead.types";
import { SearchGroupModel } from "../searchGroup/searchGroup.model";

export { SearchGroupModel };

const leadSchema = new Schema<TLeadDocument>(
  {
    leadId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    groupId: {
      type: String,
      required: true,
      index: true,
    },
    searchQuery: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    source: {
      type: String,
      default: "Unknown",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    facebook: {
      type: String,
      default: "",
    },
    instagram: {
      type: String,
      default: "",
    },
    linkedin: {
      type: String,
      default: "",
    },
    whatsapp: {
      type: String,
      default: "",
    },
    remark: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Number,
      default: () => Date.now(),
    },
    updatedAt: {
      type: Number,
      default: () => Date.now(),
    },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

// Compound indexes
leadSchema.index({ groupId: 1, phone: 1 });
leadSchema.index({ groupId: 1, name: 1 });

export const LeadModel = model<TLeadDocument>("Lead", leadSchema);
