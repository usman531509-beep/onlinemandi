import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Subscription from "@/models/Subscription";
import PaymentPlan from "@/models/PaymentPlan";

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const email = req.nextUrl.searchParams.get("email");

        if (!email) {
            return NextResponse.json({ ok: false, message: "Email is required" }, { status: 400 });
        }

        // Find the active subscription for this user, ensure it hasn't expired
        const subscription = await Subscription.findOne({
            userEmail: email.toLowerCase(),
            status: "active",
        })
            .populate("planId")
            .sort({ startDate: -1 })
            .lean();

        if (!subscription) {
            return NextResponse.json({ ok: true, subscription: null }, { status: 200 });
        }

        // Auto-expire if endDate has passed
        if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
            await Subscription.findByIdAndUpdate(subscription._id, { status: "expired" });
            return NextResponse.json({ ok: true, subscription: null }, { status: 200 });
        }

        return NextResponse.json({ ok: true, subscription }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching subscription:", error);
        return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
    }
}
