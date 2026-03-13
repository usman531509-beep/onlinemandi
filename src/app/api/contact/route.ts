import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Contact from "@/models/Contact";

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();

        const { name, email, phone, subject, message } = body;

        if (!name || !email || !subject || !message) {
            return NextResponse.json({ ok: false, message: "Missing required fields" }, { status: 400 });
        }

        const newContact = await Contact.create({
            name,
            email,
            phone,
            subject,
            message,
            status: 'unread'
        });

        return NextResponse.json({ ok: true, contactId: newContact._id }, { status: 201 });
    } catch (error) {
        console.error("Error submitting contact form:", error);
        return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
    }
}
