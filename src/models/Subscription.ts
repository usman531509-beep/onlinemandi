import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    userEmail: string;
    planId: mongoose.Types.ObjectId;
    stripeSessionId: string;
    status: "active" | "canceled" | "expired";
    startDate: Date;
    endDate?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        userEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentPlan",
            required: true,
        },
        stripeSessionId: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["active", "canceled", "expired"],
            default: "active",
            required: true,
        },
        startDate: {
            type: Date,
            default: Date.now,
            required: true,
        },
        endDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Subscription || mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
