import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Contact from "@/models/Contact";

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        // In a real app, we should verify the user is an admin via session/token here
        // For now, based on the implementation plan, we assume the frontend admin shell handles authorization
        const searchParams = req.nextUrl.searchParams;
        const role = searchParams.get("role");

        if (role !== "admin") {
            return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 403 });
        }

        const contacts = await Contact.find().sort({ createdAt: -1 }).lean();

        return NextResponse.json({ ok: true, contacts }, { status: 200 });
    } catch (error) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
    }
}
