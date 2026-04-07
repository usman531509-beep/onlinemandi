import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword } from "@/lib/password";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json() as {
      userId?: string;
      role?: string;
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      password?: string;
      isActive?: boolean;
    };

    if (!body.userId || body.role !== "admin") {
      return NextResponse.json({ ok: false, message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(body.userId)) {
      return NextResponse.json({ ok: false, message: "Invalid user identifier." }, { status: 400 });
    }

    await connectToDatabase();

    const adminUser = await User.findById(body.userId);
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ ok: false, message: "Target user not found." }, { status: 404 });
    }

    const updates: any = {};
    if (body.fullName) updates.fullName = body.fullName.trim();
    if (body.email) updates.email = body.email.trim();
    if (body.phoneNumber) updates.phoneNumber = body.phoneNumber.trim();
    if (body.password) {
      updates.passwordHash = hashPassword(body.password);
    }
    if (body.isActive !== undefined) {
      updates.isActive = String(body.isActive) === "true" || body.isActive === true;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).select("-passwordHash");

    return NextResponse.json({ ok: true, message: "User updated successfully.", user: updatedUser }, { status: 200 });

  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ ok: false, message: "Email already exists." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, message: "Failed to update user.", error: error?.message || "Unknown error" }, { status: 500 });
  }
}
