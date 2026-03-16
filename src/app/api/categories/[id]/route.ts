import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";
import User from "@/models/User";

type CategoryBody = {
  userId?: string;
  role?: string;
  name?: string;
  description?: string;
  subcategories?: {
    id?: string;
    name: string;
    children?: { id?: string; name: string }[];
  }[];
};

async function validateAdmin(userId?: string, role?: string) {
  if (!userId || !role) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "userId and role are required." }, { status: 400 }),
    };
  }

  if (role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "Only admin can modify categories." }, { status: 403 }),
    };
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 }),
    };
  }

  const user = await User.findById(userId);
  if (!user || user.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 }),
    };
  }

  return { ok: true as const };
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, message: "Invalid category id." }, { status: 400 });
    }

    const body = (await request.json()) as CategoryBody;
    const name = body.name?.trim();
    const description = body.description?.trim();
    const subcategories = body.subcategories;

    if (!name) {
      return NextResponse.json({ ok: false, message: "Category name is required." }, { status: 400 });
    }

    await connectToDatabase();

    const auth = await validateAdmin(body.userId, body.role);
    if (!auth.ok) return auth.response;

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ ok: false, message: "Category not found." }, { status: 404 });
    }

    const duplicate = await Category.findOne({
      _id: { $ne: id },
      name: new RegExp(`^${name}$`, "i"),
    });

    if (duplicate) {
      return NextResponse.json({ ok: false, message: "Category already exists." }, { status: 409 });
    }

    category.name = name;
    category.description = description;
    if (Array.isArray(subcategories)) {
      category.subcategories = subcategories
        .filter((subcategory) => subcategory.name && subcategory.name.trim().length > 0)
        .map((subcategory) => {
          const payload: {
            _id?: string;
            name: string;
            children: { _id?: string; name: string }[];
          } = {
            name: subcategory.name.trim(),
            children: Array.isArray(subcategory.children)
              ? subcategory.children
                  .filter((child) => child.name && child.name.trim().length > 0)
                  .map((child) => {
                    const childPayload: { _id?: string; name: string } = { name: child.name.trim() };
                    if (child.id) childPayload._id = child.id;
                    return childPayload;
                  })
              : [],
          };
          if (subcategory.id) payload._id = subcategory.id;
          return payload;
        });
    }
    await category.save();

    return NextResponse.json({ ok: true, message: "Category updated successfully." }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to update category.", error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, message: "Invalid category id." }, { status: 400 });
    }

    const body = (await request.json()) as CategoryBody;

    await connectToDatabase();

    const auth = await validateAdmin(body.userId, body.role);
    if (!auth.ok) return auth.response;

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ ok: false, message: "Category not found." }, { status: 404 });
    }

    await Category.findByIdAndDelete(id);
    await User.updateMany({}, { $pull: { assignedCategories: category._id } });
    return NextResponse.json({ ok: true, message: "Category deleted successfully." }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to delete category.", error: message }, { status: 500 });
  }
}
