import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";
import Listing from "@/models/Listing";
import User, { UserRole } from "@/models/User";
import Subscription from "@/models/Subscription";
import Setting from "@/models/Setting";

type ListingRole = UserRole;
type PopulatedPlan = {
  name?: string;
  listingLimit?: number;
};

type PopulatedListing = {
  _id: mongoose.Types.ObjectId;
  group?: string;
  title: string;
  category: string;
  city: string;
  quantity: string;
  pricePerMaund: number;
  description?: string;
  images?: string[];
  extraInfo?: { label: string; value: string }[];
  createdAt: Date;
  createdBy?:
  | {
    _id: mongoose.Types.ObjectId;
    fullName: string;
    email: string;
    role: UserRole;
    verificationStatus?: string;
  }
  | null;
};

function mapListing(listing: PopulatedListing) {
  return {
    id: String(listing._id),
    group: listing.group || "General",
    title: listing.title,
    category: listing.category,
    city: listing.city,
    quantity: listing.quantity,
    pricePerMaund: listing.pricePerMaund,
    description: listing.description || "",
    images: listing.images || [],
    extraInfo: listing.extraInfo || [],
    createdAt: listing.createdAt,
    createdBy: listing.createdBy
      ? {
        id: String(listing.createdBy._id),
        fullName: listing.createdBy.fullName,
        email: listing.createdBy.email,
        role: listing.createdBy.role,
        verificationStatus: listing.createdBy.verificationStatus || "unsubmitted",
      }
      : null,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as ListingRole | null;
    const userId = searchParams.get("userId");

    await connectToDatabase();
    let filter: Record<string, unknown> = {};

    if (role || userId) {
      if (!role || !userId) {
        return NextResponse.json({ ok: false, message: "role and userId are required together." }, { status: 400 });
      }

      if (!["admin", "buyer", "seller"].includes(role)) {
        return NextResponse.json({ ok: false, message: "Invalid role." }, { status: 400 });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
      }

      const user = await User.findById(userId);
      if (!user || user.role !== role) {
        return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
      }

      filter = role === "seller" ? { createdBy: user._id } : {};
    }

    const listings = await Listing.find(filter)
      .populate("createdBy", "fullName email role verificationStatus")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        ok: true,
        listings: listings.map((listing) => mapListing(listing as unknown as PopulatedListing)),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to fetch listings.", error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      role?: ListingRole;
      title?: string;
      group?: string;
      category?: string;
      city?: string;
      quantity?: string;
      pricePerMaund?: number;
      description?: string;
      images?: string[];
      extraInfo?: { label: string; value: string }[];
      onBehalfOfSellerId?: string;
    };

    const userId = body.userId;
    const role = body.role;

    if (!userId || !role) {
      return NextResponse.json({ ok: false, message: "userId and role are required." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
    }

    if (!["admin", "seller"].includes(role)) {
      return NextResponse.json({ ok: false, message: "Only admin and seller can create listings." }, { status: 403 });
    }

    const title = body.title?.trim();
    const group = body.group?.trim() || "General";
    const category = body.category?.trim();
    const city = body.city?.trim();
    const quantity = body.quantity?.trim();
    const description = body.description?.trim();
    const images = Array.isArray(body.images)
      ? body.images.filter((item) => typeof item === "string").slice(0, 8)
      : [];
    const extraInfo = Array.isArray(body.extraInfo)
      ? body.extraInfo.filter((item) => item.label).map(item => ({
        label: String(item.label).trim(),
        value: String(item.value ?? "").trim()
      }))
      : [];
    const pricePerMaund = Number(body.pricePerMaund);

    if (!title || !group || !category || !city || !quantity || Number.isNaN(pricePerMaund)) {
      return NextResponse.json({ ok: false, message: "Please fill all required listing fields." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user || user.role !== role) {
      return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
    }

    const categoryExists = await Category.findOne({
      $or: [
        { name: new RegExp(`^${category}$`, "i") },
        { "subcategories.name": new RegExp(`^${category}$`, "i") },
        { "subcategories.children.name": new RegExp(`^${category}$`, "i") },
      ],
    });
    if (!categoryExists) {
      return NextResponse.json({ ok: false, message: "Selected category does not exist." }, { status: 400 });
    }

    let authorId = user._id;
    let quotaOwner = user;
    if (body.onBehalfOfSellerId) {
      if (user.role !== "admin") {
        return NextResponse.json({ ok: false, message: "Only administrators can create listings on behalf of others." }, { status: 403 });
      }
      if (!mongoose.Types.ObjectId.isValid(body.onBehalfOfSellerId)) {
        return NextResponse.json({ ok: false, message: "Invalid onBehalfOfSellerId." }, { status: 400 });
      }
      const targetSeller = await User.findById(body.onBehalfOfSellerId);
      if (!targetSeller || targetSeller.role !== "seller") {
        return NextResponse.json({ ok: false, message: "The target user must be a registered seller." }, { status: 400 });
      }
      authorId = targetSeller._id;
      quotaOwner = targetSeller;
    }

    // Assignment check removed

    // --- Subscription-based listing limit enforcement ---
    let shouldIncrementFreeListings = false;
    let activeSubscriptionToIncrement: { _id: mongoose.Types.ObjectId } | null = null;
    if (quotaOwner.role !== "admin") {
      const freeListingLimitSetting = await Setting.findOne({ key: "freeListingLimit" });
      const freeListingLimit = Number(freeListingLimitSetting?.value || 0);
      const freeListingsUsed = quotaOwner.listingsUsedCount || 0;

      const activeSub = await Subscription.findOne({
        userEmail: quotaOwner.email.toLowerCase(),
        status: "active",
        $or: [{ endDate: null }, { endDate: { $gt: new Date() } }],
      })
        .sort({ startDate: -1, createdAt: -1, _id: -1 })
        .populate("planId");

      const plan = activeSub?.planId as PopulatedPlan | undefined;
      const paidListingLimit = plan?.listingLimit ?? 0;
      const paidListingsUsed = activeSub?.listingsUsedCount || 0;
      const hasPaidListingCapacity = !!activeSub && paidListingsUsed < paidListingLimit;
      const hasFreeListingCapacity = freeListingsUsed < freeListingLimit;

      if (hasPaidListingCapacity) {
        activeSubscriptionToIncrement = { _id: activeSub._id };
      } else if (hasFreeListingCapacity) {
        shouldIncrementFreeListings = true;
      } else {
        const message = activeSub
          ? `You have used all ${paidListingLimit} paid ${paidListingLimit === 1 ? "listing" : "listings"} in your "${plan?.name || "current"}" plan and all ${freeListingLimit} free ${freeListingLimit === 1 ? "listing" : "listings"}. Please upgrade your plan.`
          : `You have reached your limit of ${freeListingLimit} free ${freeListingLimit === 1 ? "listing" : "listings"}. Please purchase a plan to continue.`;
        return NextResponse.json({ ok: false, message }, { status: 403 });
      }
    }
    // --- End limit enforcement ---

    const created = await Listing.create({
      title,
      group,
      category,
      city,
      quantity,
      pricePerMaund,
      description,
      images,
      extraInfo,
      createdBy: authorId,
    });

    // Increment usage count for the author (seller/buyer) if not admin
    if (quotaOwner.role !== "admin") {
      if (activeSubscriptionToIncrement) {
        console.log(`[API:Listings] Incrementing paid listingsUsedCount for subscription ${activeSubscriptionToIncrement._id}`);
        const updatedSubscription = await Subscription.findOneAndUpdate(
          {
            _id: activeSubscriptionToIncrement._id,
            status: "active",
          },
          { $inc: { listingsUsedCount: 1 } },
          { new: true }
        );

        if (updatedSubscription) {
          const paidLiveListings = await Listing.countDocuments({
            createdBy: authorId,
            createdAt: { $gte: new Date(updatedSubscription.startDate) },
          });

          const reconciledPaidUsage = Math.max(
            Number(updatedSubscription.listingsUsedCount || 0),
            paidLiveListings
          );

          if (reconciledPaidUsage !== Number(updatedSubscription.listingsUsedCount || 0)) {
            await Subscription.findByIdAndUpdate(updatedSubscription._id, {
              $set: { listingsUsedCount: reconciledPaidUsage },
            });
          }
        }
      } else if (shouldIncrementFreeListings) {
        console.log(`[API:Listings] Incrementing free listingsUsedCount for ${authorId}`);
        await User.findByIdAndUpdate(authorId, { $inc: { listingsUsedCount: 1 } });
      }
    }

    const listing = await Listing.findById(created._id).populate("createdBy", "fullName email role verificationStatus").lean();

    return NextResponse.json(
      {
        ok: true,
        message: "Listing created successfully.",
        listing: listing ? mapListing(listing as unknown as PopulatedListing) : null,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to create listing.", error: message }, { status: 500 });
  }
}
