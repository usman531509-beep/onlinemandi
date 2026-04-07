import mongoose, { Model, Schema, Types } from "mongoose";

export type BroadcastDocument = {
    buyerId: Types.ObjectId;
    buyerName: string;
    buyerPhone: string;
    buyerEmail: string;
    group: string;
    category: string;
    subcategory: string;
    childCategory: string;
    grade: string;
    requirementDetails: string;
    requiredQuantity: string;
    targetPricePerMaund: string;
    city: string;
    deliveryLocation: string;
    paymentTerms: string;
    status: "active" | "closed";
    createdAt: Date;
    updatedAt: Date;
};

const broadcastSchema = new Schema<BroadcastDocument>(
    {
        buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        buyerName: { type: String, required: true, trim: true },
        buyerPhone: { type: String, required: true, trim: true },
        buyerEmail: { type: String, required: true, trim: true },
        group: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        subcategory: { type: String, default: "", trim: true },
        childCategory: { type: String, default: "", trim: true },
        grade: { type: String, default: "", trim: true },
        requirementDetails: { type: String, required: true, trim: true },
        requiredQuantity: { type: String, default: "", trim: true },
        targetPricePerMaund: { type: String, default: "", trim: true },
        city: { type: String, default: "", trim: true },
        deliveryLocation: { type: String, default: "", trim: true },
        paymentTerms: { type: String, default: "Cash on Delivery", trim: true },
        status: { type: String, enum: ["active", "closed"], default: "active" },
    },
    { timestamps: true }
);

const Broadcast =
    (mongoose.models.Broadcast as Model<BroadcastDocument>) ||
    mongoose.model<BroadcastDocument>("Broadcast", broadcastSchema);

export default Broadcast;
