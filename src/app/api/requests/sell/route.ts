import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import SellRequest from "@/models/SellRequest";
import User, { UserRole } from "@/models/User";
import mongoose from "mongoose";

// POST handler for form submission on the public /sell-crop page
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation for required fields
        const required = ["group", "cropType", "totalQuantityTons", "pricePerMaund", "district", "mobileNumber", "email"];
        for (const field of required) {
            if (!body[field]) {
                return NextResponse.json({ ok: false, message: `Missing required field: ${field}` }, { status: 400 });
            }
        }

        await connectToDatabase();

        const newRequest = await SellRequest.create({
            group: body.group,
            cropType: body.cropType,
            subcategory: body.subcategory,
            childCategory: body.childCategory,
            variety: body.variety,
            moistureLevel: Number(body.moistureLevel) || undefined,
            qualityGrade: body.qualityGrade,
            totalQuantityTons: Number(body.totalQuantityTons),
            pricePerMaund: Number(body.pricePerMaund),
            district: body.district,
            mobileNumber: body.mobileNumber,
            email: body.email,
            farmPhotos: body.farmPhotos || [],
            status: "pending"
        });

        return NextResponse.json({ ok: true, message: "Sell request submitted successfully.", request: newRequest }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, message: "Failed to submit sell request.", error: message }, { status: 500 });
    }
}

// GET handler for Admins to view all requests
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get("role") as UserRole | null;
        const userId = searchParams.get("userId");

        if (!role || !userId) {
            return NextResponse.json({ ok: false, message: "role and userId are required." }, { status: 400 });
        }

        if (role !== "admin") {
            return NextResponse.json({ ok: false, message: "Unauthorized. Admin access required." }, { status: 403 });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json({ ok: false, message: "Invalid userId." }, { status: 400 });
        }

        await connectToDatabase();

        const currentUser = await User.findById(userId);
        if (!currentUser || currentUser.role !== "admin") {
            return NextResponse.json({ ok: false, message: "Unauthorized user context." }, { status: 403 });
        }

        const requests = await SellRequest.find()
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(
            { ok: true, requests },
            { status: 200 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ ok: false, message: "Failed to fetch sell requests.", error: message }, { status: 500 });
    }
}
