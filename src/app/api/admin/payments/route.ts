import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentTransaction from "@/models/PaymentTransaction";
import User from "@/models/User";

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const searchParams = req.nextUrl.searchParams;
        const role = searchParams.get("role");

        if (role !== "admin") {
            return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 403 });
        }

        const paymentsData = await PaymentTransaction.find()
            .populate("planId", "name") // populate the linked PaymentPlan to fetch its name
            .sort({ paymentDate: -1 })
            .lean();

        // Ensure backward compatibility: For payments missing a userName (e.g. from demo data or old webhooks),
        // try to find the full name based on the email dynamically.
        const payments = await Promise.all(
            paymentsData.map(async (payment) => {
                if (!payment.userName) {
                    const doc = await User.findOne({ email: payment.userEmail }).select("fullName").lean();
                    if (doc) {
                        return { ...payment, userName: doc.fullName };
                    }
                }
                return payment;
            })
        );

        return NextResponse.json({ ok: true, payments }, { status: 200 });
    } catch (error) {
        console.error("Error fetching payment transactions:", error);
        return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
    }
}
