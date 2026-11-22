import { Schema, model } from "mongoose";
import { TLeadDocument } from "./lead.types";
import { SearchGroupModel } from "../searchGroup/searchGroup.model";

export { SearchGroupModel };

const leadUserSchema = new Schema(
  {
    userId: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
  },
  { _id: false },
);

const leadNoteSchema = new Schema(
  {
    noteId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Number, default: () => Date.now() },
    createdBy: { type: leadUserSchema, default: () => ({}) },
  },
  { _id: false },
);

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
      lowercase: true,
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
    status: {
      type: String,
      enum: [
        "uncontacted",
        "called",
        "call_later",
        "interested",
        "not_interested",
        "converted",
        "invalid",
      ],
      default: "uncontacted",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    followUpDate: {
      type: Number,
      default: null,
      index: true,
    },
    dealValue: {
      type: Number,
      default: 0,
    },
    lastContactedAt: {
      type: Number,
      default: null,
    },
    callCount: {
      type: Number,
      default: 0,
    },
    assignedTo: {
      type: leadUserSchema,
      default: () => ({}),
    },
    lastContactedBy: {
      type: leadUserSchema,
      default: () => ({}),
    },
    notes: {
      type: [leadNoteSchema],
      default: [],
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
leadSchema.index({ groupId: 1, status: 1 });
leadSchema.index({ groupId: 1, priority: 1 });
leadSchema.index({ groupId: 1, followUpDate: 1 });
leadSchema.index({ "assignedTo.userId": 1 });
leadSchema.index({ status: 1, followUpDate: 1 });

export const LeadModel = model<TLeadDocument>("Lead", leadSchema);
