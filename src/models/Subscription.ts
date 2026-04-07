import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    userEmail: string;
    planId: mongoose.Types.ObjectId;
    stripeSessionId: string;
    listingsUsedCount: number;
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
        listingsUsedCount: {
            type: Number,
            default: 0,
            min: 0,
            required: true,
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

const existingSubscriptionModel = mongoose.models.Subscription as mongoose.Model<ISubscription> | undefined;

// In dev, Next.js can retain an older compiled model after schema changes.
// If that cached model is missing newer paths like listingsUsedCount, rebuild it.
if (existingSubscriptionModel && !existingSubscriptionModel.schema.path("listingsUsedCount")) {
    delete mongoose.models.Subscription;
}

const Subscription =
    (mongoose.models.Subscription as mongoose.Model<ISubscription> | undefined) ||
    mongoose.model<ISubscription>("Subscription", SubscriptionSchema);

export default Subscription;
