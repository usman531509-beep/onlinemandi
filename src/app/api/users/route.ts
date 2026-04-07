import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import User, { UserRole, VerificationStatus } from "@/models/User";

type UsersRole = UserRole;
const ALLOWED_ROLES: UserRole[] = ["admin", "buyer", "seller"];

type ListedUser = {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  assignedCategories?: mongoose.Types.ObjectId[];
  verificationStatus?: VerificationStatus;
  sellerProfile?: {
    businessName?: string;
    cnicNumber?: string;
    registeredMobileNumber?: string;
    address?: string;
    city?: string;
    notes?: string;
    submittedAt?: Date;
    documents?: { name: string; fileUrl: string; uploadedAt: Date }[];
  };
  isActive: boolean;
  createdAt: Date;
};

function mapUser(user: ListedUser) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    assignedCategoryIds: (user.assignedCategories || []).map((categoryId) => String(categoryId)),
    verificationStatus: user.verificationStatus || "unsubmitted",
    sellerProfile:
      user.role === "seller"
        ? {
            businessName: user.sellerProfile?.businessName || "",
            cnicNumber: user.sellerProfile?.cnicNumber || "",
            registeredMobileNumber: user.sellerProfile?.registeredMobileNumber || "",
            address: user.sellerProfile?.address || "",
            city: user.sellerProfile?.city || "",
            notes: user.sellerProfile?.notes || "",
            submittedAt: user.sellerProfile?.submittedAt || null,
            documents: (user.sellerProfile?.documents || []).map((doc) => ({
              name: doc.name,
              fileUrl: doc.fileUrl,
              uploadedAt: doc.uploadedAt,
            })),
          }
        : null,
    isActive: user.isActive ?? true,
    createdAt: user.createdAt,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as UsersRole | null;
    const userId = searchParams.get("userId");

    if (!role || !userId) {
      return NextResponse.json({ ok: false, message: "role and userId are required." }, { status: 400 });
    }

    if (!["admin", "buyer", "seller"].includes(role)) {
      return NextResponse.json({ ok: false, message: "Invalid role." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
    }

    await connectToDatabase();

    const currentUser = await User.findById(userId);
    if (!currentUser || currentUser.role !== role) {
      return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json({ ok: false, message: "Only admin can view all users." }, { status: 403 });
    }

    const users = await User.collection
      .find(
        {},
        {
          projection: {
            fullName: 1,
            email: 1,
            phoneNumber: 1,
            role: 1,
            assignedCategories: 1,
            verificationStatus: 1,
            sellerProfile: 1,
            isActive: 1,
            createdAt: 1,
          },
        }
      )
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      {
        ok: true,
        users: users.map((user) => mapUser(user as ListedUser)),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to fetch users.", error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      role?: UsersRole;
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      password?: string;
      newUserRole?: UserRole;
      assignedCategoryIds?: string[];
    };

    const userId = body.userId;
    const role = body.role;
    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phoneNumber = body.phoneNumber?.trim();
    const password = body.password;
    const newUserRole = body.newUserRole;
    const assignedCategoryIds = Array.isArray(body.assignedCategoryIds) ? body.assignedCategoryIds : [];

    if (!userId || !role || !fullName || !email || !phoneNumber || !password || !newUserRole) {
      return NextResponse.json({ ok: false, message: "All fields are required." }, { status: 400 });
    }

    if (!ALLOWED_ROLES.includes(role) || !ALLOWED_ROLES.includes(newUserRole)) {
      return NextResponse.json({ ok: false, message: "Invalid role selected." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const currentUser = await User.findById(userId);
    if (!currentUser || currentUser.role !== role) {
      return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json({ ok: false, message: "Only admin can create users." }, { status: 403 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ ok: false, message: "User already exists with this email." }, { status: 409 });
    }

    const user = await User.create({
      fullName,
      email,
      phoneNumber,
      role: newUserRole,
      passwordHash: hashPassword(password),
      assignedCategories:
        newUserRole === "seller"
          ? assignedCategoryIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id))
          : [],
    });

    return NextResponse.json(
      {
        ok: true,
        message: "User created successfully.",
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to create user.", error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // Admin ID
    const targetUserId = searchParams.get("targetUserId"); // User to delete

    if (!userId || !targetUserId) {
      return NextResponse.json({ ok: false, message: "userId and targetUserId are required." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ ok: false, message: "Invalid ID format." }, { status: 400 });
    }

    if (userId === targetUserId) {
      return NextResponse.json({ ok: false, message: "You cannot delete your own account." }, { status: 400 });
    }

    await connectToDatabase();

    const currentUser = await User.findById(userId);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ ok: false, message: "Only admin can delete users." }, { status: 403 });
    }

    // Perform cascading deletion
    // 1. Delete associated Listings
    const Listing = (await import("@/models/Listing")).default;
    await Listing.deleteMany({ createdBy: targetUserId });

    // 2. Delete associated Broadcasts
    const Broadcast = (await import("@/models/Broadcast")).default;
    await Broadcast.deleteMany({ buyerId: targetUserId });

    // 3. Delete associated Subscriptions
    const Subscription = (await import("@/models/Subscription")).default;
    await Subscription.deleteMany({ userId: targetUserId });

    // 4. Finally delete the user
    const deletedUser = await User.findByIdAndDelete(targetUserId);

    if (!deletedUser) {
      return NextResponse.json({ ok: false, message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: "User and all associated data deleted successfully." }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to delete user.", error: message }, { status: 500 });
  }
}
