import mongoose, { Schema, Document, Model } from "mongoose";

export interface ReviewDocument extends Document {
    listingId: mongoose.Types.ObjectId;
    reviewerName: string;
    reviewerEmail: string;
    rating: number; // 1 to 5
    comment: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
    {
        listingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
        },
        reviewerName: {
            type: String,
            required: true,
            trim: true,
        },
        reviewerEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Review: Model<ReviewDocument> =
    mongoose.models.Review || mongoose.model<ReviewDocument>("Review", ReviewSchema);

export default Review;
