import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentPlan from "@/models/PaymentPlan";

export async function GET() {
    try {
        await connectToDatabase();

        // Only fetch active plans for public display, sorted by price ascending
        const plans = await PaymentPlan.find({ isActive: true }).sort({ price: 1 }).lean();

        return NextResponse.json({ ok: true, plans }, { status: 200 });
    } catch (error) {
        console.error("Error fetching public payment plans:", error);
        return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
    }
}
