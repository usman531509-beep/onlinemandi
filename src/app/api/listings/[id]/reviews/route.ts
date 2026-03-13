import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Review from "@/models/Review";
import Listing from "@/models/Listing";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ ok: false, message: "Invalid listing id." }, { status: 400 });
        }

        await connectToDatabase();

        const reviews = await Review.find({ listingId: id }).sort({ createdAt: -1 }).lean();

        return NextResponse.json(
            { ok: true, reviews },
            { status: 200 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, message: "Failed to fetch reviews.", error: message }, { status: 500 });
    }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ ok: false, message: "Invalid listing id." }, { status: 400 });
        }

        const body = await request.json();
        const { reviewerName, reviewerEmail, rating, comment } = body;

        if (!reviewerName || !reviewerEmail || !rating || !comment) {
            return NextResponse.json({ ok: false, message: "All fields are required." }, { status: 400 });
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ ok: false, message: "Rating must be between 1 and 5." }, { status: 400 });
        }

        await connectToDatabase();

        const listingExists = await Listing.findById(id);
        if (!listingExists) {
            return NextResponse.json({ ok: false, message: "Listing not found." }, { status: 404 });
        }

        const newReview = await Review.create({
            listingId: id,
            reviewerName: reviewerName.trim(),
            reviewerEmail: reviewerEmail.trim().toLowerCase(),
            rating: Number(rating),
            comment: comment.trim()
        });

        return NextResponse.json(
            { ok: true, message: "Review submitted successfully.", review: newReview },
            { status: 201 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, message: "Failed to submit review.", error: message }, { status: 500 });
    }
}
