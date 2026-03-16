import mongoose, { Model, Schema, Types } from "mongoose";

export type ListingDocument = {
  title: string;
  category: string;
  grade: string;
  moisture: string;
  delivery: string;
  city: string;
  quantity: string;
  pricePerMaund: number;
  description?: string;
  images: string[];
  extraInfo?: { label: string; value: string }[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const listingSchema = new Schema<ListingDocument>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true, default: "Unspecified" },
    moisture: { type: String, required: true, trim: true, default: "Not specified" },
    delivery: { type: String, required: true, trim: true, default: "Negotiable" },
    city: { type: String, required: true, trim: true },
    quantity: { type: String, required: true, trim: true },
    pricePerMaund: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    images: [{ type: String }],
    extraInfo: [
      {
        label: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Listing =
  (mongoose.models.Listing as Model<ListingDocument>) ||
  mongoose.model<ListingDocument>("Listing", listingSchema);

export default Listing;
