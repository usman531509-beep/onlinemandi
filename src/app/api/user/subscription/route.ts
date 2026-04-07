import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Subscription from "@/models/Subscription";
import Listing from "@/models/Listing";
import User from "@/models/User";
import Setting from "@/models/Setting";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const email = req.nextUrl.searchParams.get("email");

        if (!email) {
            return NextResponse.json({ ok: false, message: "Email is required" }, { status: 400 });
        }

        const activeSubscriptions = await Subscription.find({
            userEmail: email.toLowerCase(),
            status: "active",
        })
            .sort({ startDate: -1 })
            .lean();

        const [subscription, ...duplicates] = activeSubscriptions;

        if (duplicates.length > 0) {
            await Subscription.updateMany(
                { _id: { $in: duplicates.map((item) => item._id) } },
                { $set: { status: "expired" } }
            );
        }

        if (!subscription) {
            return NextResponse.json({ ok: true, subscription: null }, { status: 200 });
        }

        // Auto-expire if endDate has passed
        if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
            await Subscription.findByIdAndUpdate(subscription._id, { status: "expired" });
            return NextResponse.json({ ok: true, subscription: null }, { status: 200 });
        }

        const user = await User.findById(subscription.userId).select("listingsUsedCount");
        const freeListingLimitSetting = await Setting.findOne({ key: "freeListingLimit" });
        const freeListingLimit = Number(freeListingLimitSetting?.value || 0);
        const freeListingsUsed = user?.listingsUsedCount || 0;

        if (freeListingsUsed >= freeListingLimit) {
            const paidLiveListings = await Listing.countDocuments({
                createdBy: subscription.userId,
                createdAt: { $gte: new Date(subscription.startDate) },
            });

            if ((subscription.listingsUsedCount || 0) < paidLiveListings) {
                await Subscription.findByIdAndUpdate(subscription._id, {
                    $set: { listingsUsedCount: paidLiveListings },
                });
            }
        }

        const populatedSubscription = await Subscription.findById(subscription._id)
            .populate("planId")
            .lean();

        return NextResponse.json({ ok: true, subscription: populatedSubscription }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching subscription:", error);
        return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
    }
}
