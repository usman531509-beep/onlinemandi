import mongoose, { Model, Schema } from "mongoose";

export type SellRequestDocument = {
    group: string;
    cropType: string;
    subcategory?: string;
    childCategory?: string;
    variety?: string;
    moistureLevel?: number;
    qualityGrade?: string;
    totalQuantityTons: number;
    pricePerMaund: number;
    district: string;
    mobileNumber: string;
    email: string;
    farmPhotos?: string[];
    status: "pending" | "reviewed" | "closed";
    createdAt: Date;
    updatedAt: Date;
};

const sellRequestSchema = new Schema<SellRequestDocument>(
    {
        group: { type: String, required: true },
        cropType: { type: String, required: true },
        subcategory: { type: String },
        childCategory: { type: String },
        variety: { type: String },
        moistureLevel: { type: Number },
        qualityGrade: { type: String },
        totalQuantityTons: { type: Number, required: true },
        pricePerMaund: { type: Number, required: true },
        district: { type: String, required: true },
        mobileNumber: { type: String, required: true },
        email: { type: String, required: true },
        farmPhotos: { type: [String], default: [] },
        status: {
            type: String,
            enum: ["pending", "reviewed", "closed"],
            default: "pending"
        }
    },
    { timestamps: true }
);

const SellRequest =
    (mongoose.models.SellRequest as Model<SellRequestDocument>) ||
    mongoose.model<SellRequestDocument>("SellRequest", sellRequestSchema);

export default SellRequest;
