import mongoose, { Model, Schema } from "mongoose";

export type SettingDocument = {
  key: string;
  value: any;
  updatedAt: Date;
  createdAt: Date;
};

const settingSchema = new Schema<SettingDocument>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

const Setting =
  (mongoose.models.Setting as Model<SettingDocument>) ||
  mongoose.model<SettingDocument>("Setting", settingSchema);

export default Setting;
