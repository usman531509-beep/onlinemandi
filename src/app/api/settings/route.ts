import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import Setting from "@/models/Setting";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    await connectToDatabase();

    if (key) {
      const setting = await Setting.findOne({ key });
      return NextResponse.json({ ok: true, setting }, { status: 200 });
    } else {
      const settings = await Setting.find({});
      return NextResponse.json({ ok: true, settings }, { status: 200 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to fetch settings.", error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      key?: string;
      value?: any;
    };

    const { userId, key, value } = body;

    if (!userId || !key || value === undefined) {
      return NextResponse.json({ ok: false, message: "userId, key, and value are required." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, message: "Only an admin can modify settings." }, { status: 403 });
    }

    const setting = await Setting.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true, message: "Setting updated successfully.", setting }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to update setting.", error: message }, { status: 500 });
  }
}
