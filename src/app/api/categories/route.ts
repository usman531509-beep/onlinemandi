import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import Category from "@/models/Category";
import User, { UserRole } from "@/models/User";

export const dynamic = "force-dynamic";

type CategoryResponse = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  subcategories: {
    id: string;
    name: string;
    children: {
      id: string;
      name: string;
    }[];
  }[];
  customFields: {
    id: string;
    label: string;
    fieldType: string;
    required: boolean;
    options: string[];
    placeholder: string;
  }[];
};

function mapCategory(category: {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  subcategories?: {
    _id?: mongoose.Types.ObjectId;
    name: string;
    children?: { _id?: mongoose.Types.ObjectId; name: string }[];
  }[];
  customFields?: {
    _id?: mongoose.Types.ObjectId;
    label: string;
    fieldType?: string;
    required?: boolean;
    options?: string[];
    placeholder?: string;
  }[];
}): CategoryResponse {
  return {
    id: String(category._id),
    name: category.name,
    description: category.description || "",
    createdAt: category.createdAt,
    subcategories: (category.subcategories || []).map((subcategory) => ({
      id: String(subcategory._id),
      name: subcategory.name,
      children: (subcategory.children || []).map((child) => ({
        id: String(child._id),
        name: child.name,
      })),
    })),
    customFields: (category.customFields || []).map((field) => ({
      id: String(field._id),
      label: field.label,
      fieldType: field.fieldType || "text",
      required: field.required || false,
      options: field.options || [],
      placeholder: field.placeholder || "",
    })),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as UserRole | null;
    const userId = searchParams.get("userId");

    if ((role && !userId) || (!role && userId)) {
      return NextResponse.json({ ok: false, message: "role and userId must be provided together." }, { status: 400 });
    }

    await connectToDatabase();

    let categories;

    if (role && userId) {
      if (!["admin", "buyer", "seller"].includes(role)) {
        return NextResponse.json({ ok: false, message: "Invalid role." }, { status: 400 });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
      }

      const user = await User.findById(userId).select("role assignedCategories");
      if (!user || user.role !== role) {
        return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
      }

      if (role === "seller") {
        const rawUser = await User.collection.findOne(
          { _id: new mongoose.Types.ObjectId(userId) },
          { projection: { assignedCategories: 1 } }
        );
        const assignedCategoryIds = Array.isArray(rawUser?.assignedCategories) ? rawUser.assignedCategories : [];

        categories = await Category.find({ _id: { $in: assignedCategoryIds } })
          .sort({ createdAt: -1 })
          .lean();
      } else {
        categories = await Category.find({}).sort({ createdAt: -1 }).lean();
      }
    } else {
      categories = await Category.find({}).sort({ createdAt: -1 }).lean();
    }

    return NextResponse.json(
      {
        ok: true,
        categories: categories.map((category) => mapCategory(category)),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to fetch categories.", error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      role?: string;
      name?: string;
      description?: string;
      subcategories?: {
        name: string;
        children?: { name: string }[];
      }[];
      customFields?: {
        label: string;
        fieldType?: string;
        required?: boolean;
        options?: string[];
        placeholder?: string;
      }[];
    };

    const userId = body.userId;
    const role = body.role;
    const name = body.name?.trim();
    const description = body.description?.trim();
    const subcategories = body.subcategories;
    const customFields = body.customFields;

    if (!userId || !role || !name) {
      return NextResponse.json({ ok: false, message: "userId, role and name are required." }, { status: 400 });
    }

    if (role !== "admin") {
      return NextResponse.json({ ok: false, message: "Only admin can create categories." }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
    }

    const exists = await Category.findOne({ name: new RegExp(`^${name}$`, "i") });
    if (exists) {
      return NextResponse.json({ ok: false, message: "Category already exists." }, { status: 409 });
    }

    const safeSubcategories = Array.isArray(subcategories)
      ? subcategories
        .filter((subcategory) => subcategory.name && subcategory.name.trim().length > 0)
        .map((subcategory) => ({
          name: subcategory.name.trim(),
          children: Array.isArray(subcategory.children)
            ? subcategory.children
              .filter((child) => child.name && child.name.trim().length > 0)
              .map((child) => ({ name: child.name.trim() }))
            : [],
        }))
      : [];

    const safeCustomFields = Array.isArray(customFields)
      ? customFields
          .filter((f) => f.label && f.label.trim().length > 0)
          .map((f) => ({
            label: f.label.trim(),
            fieldType: f.fieldType || "text",
            required: f.required || false,
            options: Array.isArray(f.options) ? f.options.filter((o) => o.trim().length > 0) : [],
            placeholder: f.placeholder?.trim() || "",
          }))
      : [];

    const created = await Category.create({
      name,
      description,
      createdBy: user._id,
      subcategories: safeSubcategories,
      customFields: safeCustomFields,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Category created successfully.",
        category: mapCategory(created),
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message: "Failed to create category.", error: message }, { status: 500 });
  }
}
