import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";
import User, { UserRole } from "@/models/User";

type RequestBody = {
  userId?: string;
  role?: UserRole;
  categoryIds?: string[];
};

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, message: "Invalid target user id." }, { status: 400 });
    }

    const body = (await request.json()) as RequestBody;
    const userId = body.userId;
    const role = body.role;
    const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : [];

    if (!userId || !role) {
      return NextResponse.json({ ok: false, message: "userId and role are required." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
    }

    if (!["admin", "buyer", "seller"].includes(role)) {
      return NextResponse.json({ ok: false, message: "Invalid role." }, { status: 400 });
    }

    if (!categoryIds.every((categoryId) => mongoose.Types.ObjectId.isValid(categoryId))) {
      return NextResponse.json({ ok: false, message: "Invalid category id provided." }, { status: 400 });
    }

    await connectToDatabase();

    const currentUser = await User.findById(userId);
    if (!currentUser || currentUser.role !== role) {
      return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json({ ok: false, message: "Only admin can assign categories." }, { status: 403 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ ok: false, message: "Target user not found." }, { status: 404 });
    }

    if (targetUser.role !== "seller") {
      return NextResponse.json({ ok: false, message: "Categories can only be assigned to sellers." }, { status: 400 });
    }

    const uniqueIds = Array.from(new Set(categoryIds));
    const categoriesCount = await Category.countDocuments({ _id: { $in: uniqueIds } });
    if (categoriesCount !== uniqueIds.length) {
      return NextResponse.json({ ok: false, message: "One or more categories do not exist." }, { status: 400 });
    }

    const assignedObjectIds = uniqueIds.map((categoryId) => new mongoose.Types.ObjectId(categoryId));
    await User.collection.updateOne({ _id: targetUser._id }, { $set: { assignedCategories: assignedObjectIds } });

    const refreshed = await User.collection.findOne(
      { _id: targetUser._id },
      { projection: { assignedCategories: 1 } }
    );
    const assignedCategoryIds = Array.isArray(refreshed?.assignedCategories)
      ? refreshed.assignedCategories.map((categoryId) => String(categoryId))
      : [];

    return NextResponse.json(
      {
        ok: true,
        message: "Seller categories updated successfully.",
        assignedCategoryIds,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to update seller categories.", error: message }, { status: 500 });
  }
}
