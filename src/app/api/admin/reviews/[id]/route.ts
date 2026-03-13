import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Review from "@/models/Review";
import User from "@/models/User";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ ok: false, message: "Invalid review id." }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get("role");
        const userId = searchParams.get("userId");

        if (!role || !userId) {
            return NextResponse.json({ ok: false, message: "role and userId are required." }, { status: 400 });
        }

        if (role !== "admin") {
            return NextResponse.json({ ok: false, message: "Unauthorized. Admin access required." }, { status: 403 });
        }

        await connectToDatabase();

        const currentUser = await User.findById(userId);
        if (!currentUser || currentUser.role !== "admin") {
            return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
        }

        const deleted = await Review.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ ok: false, message: "Review not found." }, { status: 404 });
        }

        return NextResponse.json(
            { ok: true, message: "Review deleted successfully." },
            { status: 200 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, message: "Failed to delete review.", error: message }, { status: 500 });
    }
}
