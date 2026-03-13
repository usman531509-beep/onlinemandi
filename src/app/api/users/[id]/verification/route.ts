import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import User, { UserRole, VerificationStatus } from "@/models/User";

type RequestBody = {
  userId?: string;
  role?: UserRole;
  status?: VerificationStatus;
};

const ALLOWED_STATUSES: VerificationStatus[] = ["unsubmitted", "pending", "verified", "rejected"];

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, message: "Invalid target user id." }, { status: 400 });
    }

    const body = (await request.json()) as RequestBody;
    const userId = body.userId;
    const role = body.role;
    const status = body.status;

    if (!userId || !role || !status) {
      return NextResponse.json({ ok: false, message: "userId, role, and status are required." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
    }

    if (!["admin", "buyer", "seller"].includes(role)) {
      return NextResponse.json({ ok: false, message: "Invalid role." }, { status: 400 });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, message: "Invalid verification status." }, { status: 400 });
    }

    await connectToDatabase();

    const currentUser = await User.findById(userId).select("role");
    if (!currentUser || currentUser.role !== role) {
      return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json({ ok: false, message: "Only admin can verify sellers." }, { status: 403 });
    }

    const targetUser = await User.findById(id).select("role");
    if (!targetUser) {
      return NextResponse.json({ ok: false, message: "Target user not found." }, { status: 404 });
    }

    if (targetUser.role !== "seller") {
      return NextResponse.json({ ok: false, message: "Verification is only applicable to sellers." }, { status: 400 });
    }

    const targetObjectId = new mongoose.Types.ObjectId(id);
    const updateResult = await User.collection.updateOne(
      { _id: targetObjectId },
      { $set: { verificationStatus: status } }
    );

    if (!updateResult.matchedCount) {
      return NextResponse.json({ ok: false, message: "Target user not found." }, { status: 404 });
    }

    const refreshed = await User.collection.findOne(
      { _id: targetObjectId },
      { projection: { verificationStatus: 1 } }
    );
    const savedStatus = (refreshed?.verificationStatus as VerificationStatus | undefined) || "unsubmitted";

    return NextResponse.json(
      { ok: true, message: "Verification status updated.", status: savedStatus },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to update verification status.", error: message }, { status: 500 });
  }
}
