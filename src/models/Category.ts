import mongoose, { Model, Schema } from "mongoose";

export type CategoryDocument = {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  subcategories: {
    _id?: mongoose.Types.ObjectId;
    name: string;
    children: {
      _id?: mongoose.Types.ObjectId;
      name: string;
    }[];
  }[];
  createdAt: Date;
  updatedAt: Date;
};

const categoryChildSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { _id: true }
);

const categorySubSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    children: { type: [categoryChildSchema], default: [] },
  },
  { _id: true }
);

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subcategories: { type: [categorySubSchema], default: [] },
  },
  { timestamps: true }
);

const Category =
  (mongoose.models.Category as Model<CategoryDocument>) ||
  mongoose.model<CategoryDocument>("Category", categorySchema);

export default Category;
