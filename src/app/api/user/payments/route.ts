import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentTransaction from "@/models/PaymentTransaction";
import PaymentPlan from "@/models/PaymentPlan";
import User from "@/models/User";

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const searchParams = req.nextUrl.searchParams;
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({ ok: false, message: "Unauthorized. Email is required" }, { status: 403 });
        }

        const paymentsData = await PaymentTransaction.find({ userEmail: email })
            .populate("planId", "name") // populate the linked PaymentPlan to fetch its name
            .sort({ paymentDate: -1 })
            .lean();

        // Ensure backward compatibility: For payments missing a userName
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
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        console.error("Error fetching user payment transactions:", error);
        return NextResponse.json({ ok: false, message: `Server error: ${errMsg}` }, { status: 500 });
    }
}
