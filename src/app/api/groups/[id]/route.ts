import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Group from "@/models/Group";
import Category from "@/models/Category";
import User from "@/models/User";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, role, name, description } = body;

    if (!userId || !role || !name) {
      return NextResponse.json({ ok: false, message: "Missing required fields." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user || user.role !== role || role !== "admin") {
      return NextResponse.json({ ok: false, message: "Unauthorized. Admin only." }, { status: 403 });
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return NextResponse.json({ ok: false, message: "Group name is required." }, { status: 400 });
    }

    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json({ ok: false, message: "Group not found." }, { status: 404 });
    }

    const existingGroup = await Group.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });
    if (existingGroup) {
      return NextResponse.json({ ok: false, message: "Another group with this name already exists." }, { status: 400 });
    }

    const oldName = group.name;

    group.name = trimmedName;
    if (description !== undefined) {
      group.description = description.trim();
    }
    await group.save();

    // Cascade name change to categories!
    if (oldName !== trimmedName) {
      await Category.updateMany({ group: oldName }, { $set: { group: trimmedName } });
    }

    return NextResponse.json({
      ok: true,
      message: "Group updated successfully.",
      group: {
        id: String(group._id),
        name: group.name,
        description: group.description,
      },
    });
  } catch (error) {
    console.error("PUT /api/groups/[id] Error:", error);
    return NextResponse.json({ ok: false, message: "Internal Server Error." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    if (!userId || !role) {
      return NextResponse.json({ ok: false, message: "Missing required fields." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user || user.role !== role || role !== "admin") {
      return NextResponse.json({ ok: false, message: "Unauthorized. Admin only." }, { status: 403 });
    }

    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json({ ok: false, message: "Group not found." }, { status: 404 });
    }

    const oldName = group.name;

    await group.deleteOne();

    // Delete orphaned categories that belonged to this group
    await Category.deleteMany({ group: oldName });

    return NextResponse.json({ ok: true, message: "Group deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/groups/[id] Error:", error);
    return NextResponse.json({ ok: false, message: "Internal Server Error." }, { status: 500 });
  }
}
