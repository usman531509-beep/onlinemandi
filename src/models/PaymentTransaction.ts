import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentTransaction extends Document {
    userId?: mongoose.Types.ObjectId;
    userEmail: string;
    userName?: string;
    planId?: mongoose.Types.ObjectId;
    stripeSessionId: string;
    stripePaymentIntentId?: string;
    amount: number;
    currency: string;
    status: "completed" | "failed" | "pending";
    paymentDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentTransactionSchema: Schema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        userEmail: {
            type: String,
            required: true,
            trim: true,
        },
        userName: {
            type: String,
            trim: true,
        },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentPlan",
        },
        stripeSessionId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        stripePaymentIntentId: {
            type: String,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "PKR",
            uppercase: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["completed", "failed", "pending"],
            default: "pending",
            required: true,
        },
        paymentDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.PaymentTransaction || mongoose.model<IPaymentTransaction>("PaymentTransaction", PaymentTransactionSchema);
