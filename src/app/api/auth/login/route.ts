import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ ok: false, message: "Email and password are required." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ ok: false, message: "Invalid email or password." }, { status: 401 });
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Login successful.",
        user: {
          id: String(user._id),
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        message: "Login failed.",
        error: process.env.NODE_ENV !== "production" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
