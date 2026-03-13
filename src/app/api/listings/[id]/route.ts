import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";
import Listing from "@/models/Listing";
import User, { UserRole } from "@/models/User";

type ListingRole = UserRole;

type PopulatedListing = {
  _id: mongoose.Types.ObjectId;
  title: string;
  category: string;
  grade?: string;
  moisture?: string;
  delivery?: string;
  city: string;
  quantity: string;
  pricePerMaund: number;
  description?: string;
  images?: string[];
  createdAt: Date;
  createdBy?:
  | {
    _id: mongoose.Types.ObjectId;
    fullName: string;
    email: string;
    role: UserRole;
    verificationStatus?: string;
    phoneNumber?: string;
    sellerProfile?: {
      registeredMobileNumber?: string;
      address?: string;
    };
  }
  | null;
};

function mapListing(listing: PopulatedListing) {
  return {
    id: String(listing._id),
    title: listing.title,
    category: listing.category,
    grade: listing.grade || "Unspecified",
    moisture: listing.moisture || "Not specified",
    delivery: listing.delivery || "Negotiable",
    city: listing.city,
    quantity: listing.quantity,
    pricePerMaund: listing.pricePerMaund,
    description: listing.description || "",
    images: listing.images || [],
    createdAt: listing.createdAt,
    createdBy: listing.createdBy
      ? {
        id: String(listing.createdBy._id),
        fullName: listing.createdBy.fullName,
        email: listing.createdBy.email,
        role: listing.createdBy.role,
        verificationStatus: listing.createdBy.verificationStatus || "unsubmitted",
        phoneNumber: listing.createdBy.sellerProfile?.registeredMobileNumber || listing.createdBy.phoneNumber || "",
        address: listing.createdBy.sellerProfile?.address || "",
      }
      : null,
  };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, message: "Invalid listing id." }, { status: 400 });
    }

    await connectToDatabase();

    const listing = await Listing.findById(id)
      .populate("createdBy", "fullName email role verificationStatus phoneNumber sellerProfile")
      .lean();

    if (!listing) {
      return NextResponse.json({ ok: false, message: "Listing not found." }, { status: 404 });
    }

    return NextResponse.json(
      { ok: true, listing: mapListing(listing as unknown as PopulatedListing) },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to fetch listing.", error: message }, { status: 500 });
  }
}

async function validateAccess(userId?: string, role?: ListingRole) {
  if (!userId || !role) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "userId and role are required." }, { status: 400 }),
    };
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 }),
    };
  }

  if (!["admin", "seller"].includes(role)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, message: "Only admin and seller can modify listings." },
        { status: 403 }
      ),
    };
  }

  const user = await User.findById(userId);
  if (!user || user.role !== role) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 }),
    };
  }

  return { ok: true as const, user };
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, message: "Invalid listing id." }, { status: 400 });
    }

    const body = (await request.json()) as {
      userId?: string;
      role?: ListingRole;
      title?: string;
      category?: string;
      grade?: string;
      moisture?: string;
      delivery?: string;
      city?: string;
      quantity?: string;
      pricePerMaund?: number;
      description?: string;
      images?: string[];
    };

    await connectToDatabase();

    const access = await validateAccess(body.userId, body.role);
    if (!access.ok) return access.response;

    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json({ ok: false, message: "Listing not found." }, { status: 404 });
    }

    const isOwner = String(listing.createdBy) === String(access.user._id);
    if (access.user.role !== "admin" && !isOwner) {
      return NextResponse.json({ ok: false, message: "You can edit only your own listings." }, { status: 403 });
    }

    const title = body.title?.trim();
    const category = body.category?.trim();
    const grade = body.grade?.trim() || "Unspecified";
    const moisture = body.moisture?.trim() || "Not specified";
    const delivery = body.delivery?.trim() || "Negotiable";
    const city = body.city?.trim();
    const quantity = body.quantity?.trim();
    const description = body.description?.trim();
    const images = Array.isArray(body.images)
      ? body.images.filter((item) => typeof item === "string").slice(0, 8)
      : [];
    const pricePerMaund = Number(body.pricePerMaund);

    if (!title || !category || !city || !quantity || Number.isNaN(pricePerMaund)) {
      return NextResponse.json({ ok: false, message: "Please fill all required listing fields." }, { status: 400 });
    }

    const categoryExists = await Category.findOne({ name: new RegExp(`^${category}$`, "i") });
    if (!categoryExists) {
      return NextResponse.json({ ok: false, message: "Selected category does not exist." }, { status: 400 });
    }

    if (access.user.role === "seller") {
      const rawUser = await User.collection.findOne(
        { _id: new mongoose.Types.ObjectId(String(access.user._id)) },
        { projection: { assignedCategories: 1 } }
      );
      const sellerCategoryIds = Array.isArray(rawUser?.assignedCategories)
        ? rawUser.assignedCategories.map((categoryId) => String(categoryId))
        : [];
      const isAllowed = sellerCategoryIds.includes(String(categoryExists._id));
      if (!isAllowed) {
        return NextResponse.json(
          { ok: false, message: "You can only use your assigned categories." },
          { status: 403 }
        );
      }
    }

    await Listing.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          title,
          category,
          grade,
          moisture,
          delivery,
          city,
          quantity,
          pricePerMaund,
          description,
          images,
          updatedAt: new Date(),
        },
      }
    );

    const populated = await Listing.findById(id).populate("createdBy", "fullName email role verificationStatus").lean();

    return NextResponse.json(
      {
        ok: true,
        message: "Listing updated successfully.",
        listing: populated ? mapListing(populated as unknown as PopulatedListing) : null,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to update listing.", error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, message: "Invalid listing id." }, { status: 400 });
    }

    const body = (await request.json()) as {
      userId?: string;
      role?: ListingRole;
    };

    await connectToDatabase();

    const access = await validateAccess(body.userId, body.role);
    if (!access.ok) return access.response;

    const listing = await Listing.findById(id);
    if (!listing) {
      return NextResponse.json({ ok: false, message: "Listing not found." }, { status: 404 });
    }

    const isOwner = String(listing.createdBy) === String(access.user._id);
    if (access.user.role !== "admin" && !isOwner) {
      return NextResponse.json({ ok: false, message: "You can delete only your own listings." }, { status: 403 });
    }

    await Listing.findByIdAndDelete(id);

    return NextResponse.json({ ok: true, message: "Listing deleted successfully." }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to delete listing.", error: message }, { status: 500 });
  }
}
