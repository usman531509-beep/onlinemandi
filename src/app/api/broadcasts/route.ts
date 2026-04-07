import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Broadcast from "@/models/Broadcast";
import Subscription from "@/models/Subscription";
import mongoose from "mongoose";

type PopulatedPlan = {
    name?: string;
    broadcastLimit?: number;
};

// POST — Create a new broadcast requirement
export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();

        const body = await request.json();
        const {
            userId,
            group,
            category,
            subcategory,
            childCategory,
            grade,
            requirementDetails,
            requiredQuantity,
            targetPricePerMaund,
            city,
            deliveryLocation,
            paymentTerms,
        } = body;

        if (!userId || !group || !category || !requirementDetails) {
            return NextResponse.json(
                { ok: false, message: "Missing required fields." },
                { status: 400 }
            );
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json(
                { ok: false, message: "Invalid user ID." },
                { status: 400 }
            );
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { ok: false, message: "User not found." },
                { status: 404 }
            );
        }

        // --- Subscription-based broadcast limit enforcement ---
        if (user.role !== "admin") {
            const Setting = (await import("@/models/Setting")).default;
            const freeListingLimitSetting = await Setting.findOne({ key: "freeListingLimit" });
            const freeListingLimit = Number(freeListingLimitSetting?.value || 0);

            const currentBroadcastCount = user.broadcastsUsedCount || 0;

            const activeSub = await Subscription.findOne({
                userEmail: user.email.toLowerCase(),
                status: "active",
                $or: [{ endDate: null }, { endDate: { $gt: new Date() } }],
            }).populate("planId");

            const plan = activeSub?.planId as PopulatedPlan | undefined;
            const maxBroadcasts = plan?.broadcastLimit ?? freeListingLimit;

            if (currentBroadcastCount >= maxBroadcasts) {
                const planMsg = activeSub
                    ? `Your "${plan?.name || "current"}" plan allows a maximum of ${maxBroadcasts} broadcasts. Please upgrade your plan.`
                    : `You have reached your limit of ${freeListingLimit} free ${freeListingLimit === 1 ? "broadcast" : "broadcasts"}. Please purchase a plan to continue.`;
                return NextResponse.json({ ok: false, message: planMsg }, { status: 403 });
            }
        }
        // --- End limit enforcement ---

        const broadcast = await Broadcast.create({
            buyerId: user._id,
            buyerName: user.fullName,
            buyerPhone: user.phoneNumber,
            buyerEmail: user.email,
            group,
            category,
            subcategory: subcategory || "",
            childCategory: childCategory || "",
            grade: grade || "",
            requirementDetails,
            requiredQuantity: requiredQuantity || "",
            targetPricePerMaund: targetPricePerMaund || "",
            city: city || "",
            deliveryLocation: deliveryLocation || "",
            paymentTerms: paymentTerms || "Cash on Delivery",
        });

        // Increment usage count for the buyer if not admin
        if (user.role !== "admin") {
            console.log(`[API:Broadcasts] Incrementing broadcastsUsedCount for ${user._id}`);
            await User.findByIdAndUpdate(user._id, { $inc: { broadcastsUsedCount: 1 } });
        }

        return NextResponse.json({ ok: true, broadcast: { id: broadcast._id } }, { status: 201 });
    } catch (error) {
        console.error("POST /api/broadcasts error:", error);
        return NextResponse.json(
            { ok: false, message: "Server error." },
            { status: 500 }
        );
    }
}

// GET — Fetch broadcasts
// ?userId=xxx  → returns only that buyer's broadcasts
// no userId    → returns all active broadcasts (for sellers)
export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        let filter: Record<string, unknown> = { status: "active" };

        if (userId) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return NextResponse.json(
                    { ok: false, message: "Invalid user ID." },
                    { status: 400 }
                );
            }
            filter = { buyerId: new mongoose.Types.ObjectId(userId) };
        }

        const broadcasts = await Broadcast.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        const mapped = broadcasts.map((b) => ({
            id: String(b._id),
            buyerId: String(b.buyerId),
            buyerName: b.buyerName,
            buyerPhone: b.buyerPhone,
            buyerEmail: b.buyerEmail,
            group: b.group,
            category: b.category,
            subcategory: b.subcategory,
            childCategory: b.childCategory,
            grade: b.grade,
            requirementDetails: b.requirementDetails,
            requiredQuantity: b.requiredQuantity,
            targetPricePerMaund: b.targetPricePerMaund,
            city: b.city,
            deliveryLocation: b.deliveryLocation,
            paymentTerms: b.paymentTerms,
            status: b.status,
            createdAt: b.createdAt?.toISOString?.() ?? "",
        }));

        return NextResponse.json({ ok: true, broadcasts: mapped });
    } catch (error) {
        console.error("GET /api/broadcasts error:", error);
        return NextResponse.json(
            { ok: false, message: "Server error." },
            { status: 500 }
        );
    }
}
