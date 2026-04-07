import mongoose, { Model, Schema } from "mongoose";

export type GroupDocument = {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const groupSchema = new Schema<GroupDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Group =
  (mongoose.models.Group as Model<GroupDocument>) ||
  mongoose.model<GroupDocument>("Group", groupSchema);

export default Group;
