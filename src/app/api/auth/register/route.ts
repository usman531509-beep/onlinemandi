import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import User, { UserRole } from "@/models/User";

const ALLOWED_ROLES: UserRole[] = ["admin", "buyer", "seller"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      password?: string;
      role?: UserRole;
    };

    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phoneNumber = body.phoneNumber?.trim();
    const password = body.password;
    const role = body.role;

    if (!fullName || !email || !phoneNumber || !password || !role) {
      return NextResponse.json({ ok: false, message: "All fields are required." }, { status: 400 });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ ok: false, message: "Invalid role selected." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ ok: false, message: "User already exists with this email." }, { status: 409 });
    }

    const user = await User.create({
      fullName,
      email,
      phoneNumber,
      role,
      passwordHash: hashPassword(password),
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Account created successfully.",
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to create account.",
        error: process.env.NODE_ENV !== "production" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
