import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import Listing from "@/models/Listing";
import User, { UserRole } from "@/models/User";

type StatsRole = UserRole;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as StatsRole | null;
    const userId = searchParams.get("userId");

    if (!role || !userId) {
      return NextResponse.json({ ok: false, message: "role and userId are required." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
    }

    if (!["admin", "buyer", "seller"].includes(role)) {
      return NextResponse.json({ ok: false, message: "Invalid role." }, { status: 400 });
    }

    await connectToDatabase();

    const currentUser = await User.findById(userId).select("role");
    if (!currentUser || currentUser.role !== role) {
      return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json({ ok: false, message: "Only admin can view dashboard stats." }, { status: 403 });
    }

    const [totalUsers, openListings, pendingVerifications] = await Promise.all([
      User.countDocuments({}),
      Listing.countDocuments({}),
      User.countDocuments({ role: "seller", $or: [{ assignedCategories: { $exists: false } }, { assignedCategories: { $size: 0 } }] }),
    ]);

    const revenue = 0;

    return NextResponse.json(
      {
        ok: true,
        stats: {
          totalUsers,
          openListings,
          pendingVerifications,
          revenue,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to fetch dashboard stats.", error: message }, { status: 500 });
  }
}
