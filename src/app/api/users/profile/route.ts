import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import User, { UserRole, VerificationStatus } from "@/models/User";

type ProfileDocumentInput = {
  name?: string;
  fileUrl?: string;
};

type UpdateBody = {
  userId?: string;
  role?: UserRole;
  targetUserId?: string;
  businessName?: string;
  cnicNumber?: string;
  registeredMobileNumber?: string;
  address?: string;
  city?: string;
  notes?: string;
  documents?: ProfileDocumentInput[];
};

function sanitizeText(value?: string) {
  return value?.trim() || "";
}

function sanitizeDocuments(documents?: ProfileDocumentInput[]) {
  if (!Array.isArray(documents)) return [];
  return documents
    .map((doc) => ({
      name: sanitizeText(doc.name),
      fileUrl: sanitizeText(doc.fileUrl),
      uploadedAt: new Date(),
    }))
    .filter((doc) => doc.name && doc.fileUrl);
}

function serializeProfile(user: {
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
  verificationStatus?: VerificationStatus;
}) {
  return {
    verificationStatus: user.verificationStatus || "unsubmitted",
    profile: {
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
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as UserRole | null;
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
    const user = await User.findById(userId).select("role");

    if (!user || user.role !== role) {
      return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
    }

    if (user.role !== "seller") {
      return NextResponse.json({ ok: false, message: "Only seller profile is supported." }, { status: 400 });
    }

    const raw = await User.collection.findOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { projection: { sellerProfile: 1, verificationStatus: 1 } }
    );

    return NextResponse.json({ ok: true, ...serializeProfile((raw || {}) as any) }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to fetch profile.", error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as UpdateBody;
    const userId = body.userId;
    const role = body.role;

    if (!userId || !role) {
      return NextResponse.json({ ok: false, message: "userId and role are required." }, { status: 400 });
    }

    if (!["admin", "buyer", "seller"].includes(role)) {
      return NextResponse.json({ ok: false, message: "Invalid role." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(userId).select("role");

    if (!user || user.role !== role) {
      return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
    }

    // Determine which user's profile to update
    let targetId = userId;
    const isAdminEdit = user.role === "admin" && body.targetUserId;

    if (isAdminEdit) {
      if (!mongoose.Types.ObjectId.isValid(body.targetUserId!)) {
        return NextResponse.json({ ok: false, message: "Invalid targetUserId." }, { status: 400 });
      }
      const targetUser = await User.findById(body.targetUserId).select("role");
      if (!targetUser || targetUser.role !== "seller") {
        return NextResponse.json({ ok: false, message: "Target user must be a seller." }, { status: 400 });
      }
      targetId = body.targetUserId!;
    } else if (user.role !== "seller") {
      return NextResponse.json({ ok: false, message: "Only sellers can update this profile." }, { status: 400 });
    }

    // For admin edits, preserve existing documents if none provided
    let documents = sanitizeDocuments(body.documents);
    if (isAdminEdit && !body.documents) {
      const existing = await User.collection.findOne(
        { _id: new mongoose.Types.ObjectId(targetId) },
        { projection: { "sellerProfile.documents": 1 } }
      );
      documents = (existing as any)?.sellerProfile?.documents || [];
    }

    const hasProfileInput =
      Boolean(sanitizeText(body.businessName)) ||
      Boolean(sanitizeText(body.cnicNumber)) ||
      Boolean(sanitizeText(body.registeredMobileNumber)) ||
      Boolean(sanitizeText(body.address)) ||
      Boolean(sanitizeText(body.city)) ||
      Boolean(sanitizeText(body.notes)) ||
      documents.length > 0;

    const sellerProfile = {
      businessName: sanitizeText(body.businessName),
      cnicNumber: sanitizeText(body.cnicNumber),
      registeredMobileNumber: sanitizeText(body.registeredMobileNumber),
      address: sanitizeText(body.address),
      city: sanitizeText(body.city),
      notes: sanitizeText(body.notes),
      documents,
      submittedAt: hasProfileInput ? new Date() : undefined,
    };

    const updateFields: Record<string, unknown> = { sellerProfile };
    // Admin edits don't change verification status
    if (!isAdminEdit) {
      updateFields.verificationStatus = hasProfileInput ? "pending" : "unsubmitted";
    }

    await User.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(targetId) },
      { $set: updateFields }
    );

    const updated = await User.collection.findOne(
      { _id: new mongoose.Types.ObjectId(targetId) },
      { projection: { sellerProfile: 1, verificationStatus: 1 } }
    );

    return NextResponse.json(
      {
        ok: true,
        message: "Seller profile saved successfully.",
        ...serializeProfile((updated || {}) as any),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to save profile.", error: message }, { status: 500 });
  }
}
