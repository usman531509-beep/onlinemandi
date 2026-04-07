import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string; // This can now be email or phone
      password?: string;
    };

    const identifier = body.email?.trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json({ ok: false, message: "Email/Phone and password are required." }, { status: 400 });
    }

    await connectToDatabase();

    const digitsOnly = identifier.replace(/\D/g, "");
    let dashedPhone = identifier;
    if (digitsOnly.length === 11 && digitsOnly.startsWith("03")) {
      dashedPhone = digitsOnly.slice(0, 4) + "-" + digitsOnly.slice(4);
    }

    // Check for user by email OR phone number (multiple formats to be safe)
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phoneNumber: identifier },
        { phoneNumber: dashedPhone },
        { phoneNumber: digitsOnly }
      ]
    }).select("+passwordHash +isActive");

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ ok: false, message: "Invalid credentials." }, { status: 401 });
    }

    // Robust check for account status
    if (user.isActive === false || String(user.isActive) === "false") {
      return NextResponse.json(
        { ok: false, message: "your account is disabled by admin" },
        { status: 403 }
      );
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
