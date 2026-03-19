import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";
import Listing from "@/models/Listing";
import User, { UserRole } from "@/models/User";
import Subscription from "@/models/Subscription";

type ListingRole = UserRole;

type PopulatedListing = {
  _id: mongoose.Types.ObjectId;
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
      category?: string;
      city?: string;
      quantity?: string;
      pricePerMaund?: number;
      description?: string;
      images?: string[];
      extraInfo?: { label: string; value: string }[];
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

    if (!title || !category || !city || !quantity || Number.isNaN(pricePerMaund)) {
      return NextResponse.json({ ok: false, message: "Please fill all required listing fields." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user || user.role !== role) {
      return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
    }

    const categoryExists = await Category.findOne({ name: new RegExp(`^${category}$`, "i") });
    if (!categoryExists) {
      return NextResponse.json({ ok: false, message: "Selected category does not exist." }, { status: 400 });
    }

    if (user.role === "seller") {
      const rawUser = await User.collection.findOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { projection: { assignedCategories: 1 } }
      );
      const sellerCategoryIds = Array.isArray(rawUser?.assignedCategories)
        ? rawUser.assignedCategories.map((categoryId) => String(categoryId))
        : [];
      const isAllowed = sellerCategoryIds.includes(String(categoryExists._id));
      if (!isAllowed) {
        return NextResponse.json(
          { ok: false, message: "You can only create listings in your assigned categories." },
          { status: 403 }
        );
      }
    }

    // --- Subscription-based listing limit enforcement ---
    if (user.role !== "admin") {
      const FREE_LISTING_LIMIT = 0;
      const currentListingCount = await Listing.countDocuments({ createdBy: user._id });

      const activeSub = await Subscription.findOne({
        userId: user._id,
        status: "active",
        $or: [{ endDate: null }, { endDate: { $gt: new Date() } }],
      }).populate("planId");

      const maxListings = activeSub?.planId?.listingLimit ?? FREE_LISTING_LIMIT;

      if (currentListingCount >= maxListings) {
        const planMsg = activeSub
          ? `Your "${activeSub.planId.name}" plan allows a maximum of ${maxListings} listings. Please upgrade your plan or remove existing listings.`
          : `You need an active subscription to create listings. Please subscribe to a plan first.`;
        return NextResponse.json({ ok: false, message: planMsg }, { status: 403 });
      }
    }
    // --- End limit enforcement ---

    const created = await Listing.create({
      title,
      category,
      city,
      quantity,
      pricePerMaund,
      description,
      images,
      extraInfo,
      createdBy: user._id,
    });

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
