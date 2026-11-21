import { Schema, model } from "mongoose";
import { TSearchGroupDocument } from "./searchGroup.types";

const searchGroupSchema = new Schema<TSearchGroupDocument>(
  {
    groupId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
      index: true,
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

export const SearchGroupModel = model<TSearchGroupDocument>(
  "SearchGroup",
  searchGroupSchema,
);
