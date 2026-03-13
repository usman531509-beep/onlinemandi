import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentPlan extends Document {
    name: string;
    description?: string;
    price: number;
    currency: string;
    interval: "month" | "year" | "one-time";
    features: string[];
    listingLimit: number;
    broadcastLimit: number;
    stripeProductId?: string;
    stripePriceId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentPlanSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "PKR",
            uppercase: true,
            trim: true,
            required: true,
        },
        interval: {
            type: String,
            enum: ["month", "year", "one-time"],
            required: true,
            default: "one-time",
        },
        features: {
            type: [String],
            default: [],
        },
        listingLimit: {
            type: Number,
            default: 10,
            min: 0,
        },
        broadcastLimit: {
            type: Number,
            default: 5,
            min: 0,
        },
        stripeProductId: {
            type: String,
            trim: true,
        },
        stripePriceId: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.PaymentPlan || mongoose.model<IPaymentPlan>("PaymentPlan", PaymentPlanSchema);
