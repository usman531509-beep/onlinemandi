import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Group from "@/models/Group";
import Category from "@/models/Category";
import User, { UserRole } from "@/models/User";

type GroupRole = UserRole;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role") as GroupRole | null;

    if (!userId || !role) {
      return NextResponse.json({ ok: false, message: "Missing credentials." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user || user.role !== role || (role !== "admin" && role !== "seller")) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 403 });
    }

    // AUTO-FIX: Check if there are any groups used in Categories that are missing from Group collection
    const categoryGroups = await Category.distinct("group");
    const existingGroups = await Group.find();
    const existingGroupNames = new Set(existingGroups.map(g => g.name.toLowerCase()));

    for (const catGroupName of categoryGroups) {
        if (catGroupName && !existingGroupNames.has(catGroupName.toLowerCase())) {
            // Create the missing group
            await Group.create({
                name: catGroupName,
                description: "Auto-generated from existing categories",
                createdBy: user._id
            });
            console.log(`Auto-created missing group: ${catGroupName}`);
        }
    }

    // AUTO-FIX: Assign groupless categories to the first available group
    const firstGroup = existingGroups[0] || await Group.findOne().sort({ createdAt: 1 });
    if (firstGroup) {
      const orphaned = await Category.countDocuments({ $or: [{ group: "" }, { group: null }, { group: { $exists: false } }] });
      if (orphaned > 0) {
        await Category.updateMany(
          { $or: [{ group: "" }, { group: null }, { group: { $exists: false } }] },
          { $set: { group: firstGroup.name } }
        );
        console.log(`Auto-assigned ${orphaned} groupless categories to group: ${firstGroup.name}`);
      }
    }

    // Re-fetch all groups after potentially auto-creating missing ones
    const groups = await Group.find().sort({ createdAt: -1 });

    return NextResponse.json({
      ok: true,
      groups: groups.map(g => ({
        id: String(g._id),
        name: g.name,
        description: g.description,
        createdAt: g.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/groups Error:", error);
    return NextResponse.json({ ok: false, message: "Failed to fetch groups." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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

    const existingGroup = await Group.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, "i") } });
    if (existingGroup) {
      return NextResponse.json({ ok: false, message: "Group with this name already exists." }, { status: 400 });
    }

    const group = await Group.create({
      name: trimmedName,
      description: description?.trim() || "",
      createdBy: user._id,
    });

    return NextResponse.json({
      ok: true,
      message: "Group created successfully.",
      group: {
        id: String(group._id),
        name: group.name,
        description: group.description,
        createdAt: group.createdAt,
      },
    });
  } catch (error) {
    console.error("POST /api/groups Error:", error);
    return NextResponse.json({ ok: false, message: "Internal Server Error." }, { status: 500 });
  }
}
