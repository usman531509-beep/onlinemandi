import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Review from "@/models/Review";
import User from "@/models/User";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get("role");
        const userId = searchParams.get("userId");

        if (!role || !userId) {
            return NextResponse.json({ ok: false, message: "role and userId are required." }, { status: 400 });
        }

        if (role !== "admin") {
            return NextResponse.json({ ok: false, message: "Unauthorized. Admin access required." }, { status: 403 });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
        }

        await connectToDatabase();

        const currentUser = await User.findById(userId);
        if (!currentUser || currentUser.role !== "admin") {
            return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
        }

        // Populate listingId to get the listing title, and dynamically populate the nested seller profile
        const reviews = await Review.find()
            .populate({
                path: "listingId",
                select: "title createdBy",
                populate: {
                    path: "createdBy",
                    model: "User",
                    select: "fullName"
                }
            })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(
            { ok: true, reviews },
            { status: 200 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, message: "Failed to fetch reviews.", error: message }, { status: 500 });
    }
}
