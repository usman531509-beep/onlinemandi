import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentPlan from "@/models/PaymentPlan";
import Stripe from "stripe";

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET!, {
        apiVersion: "2024-12-18.acacia" as any,
    });
}

export async function POST(req: NextRequest) {
    try {
        const stripe = getStripe();
        await connectToDatabase();

        const body = await req.json();
        const { planId, successUrl, cancelUrl, userId, userEmail } = body;

        if (!planId) {
            return NextResponse.json({ ok: false, message: "Plan ID is required" }, { status: 400 });
        }

        const plan = await PaymentPlan.findById(planId);

        if (!plan || !plan.isActive) {
            return NextResponse.json({ ok: false, message: "Invalid or inactive plan" }, { status: 404 });
        }

        if (!plan.stripePriceId) {
            return NextResponse.json({ ok: false, message: "Plan is missing Stripe Price Configuration" }, { status: 500 });
        }

        // Default return URLs if not provided
        const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const checkoutMode = plan.interval === "month" || plan.interval === "year" ? "subscription" : "payment";

        // Create Stripe Checkout Session
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            payment_method_types: ["card"],
            line_items: [
                {
                    price: plan.stripePriceId,
                    quantity: 1,
                },
            ],
            mode: checkoutMode,
            success_url: successUrl || `${origin}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${origin}?canceled=true`,
            metadata: {
                planId: plan._id.toString(),
                userId: userId || "",
                userEmail: userEmail || "",
            },
        };

        // Pre-fill the email so the user doesn't type a different one
        if (userEmail) {
            sessionParams.customer_email = userEmail;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return NextResponse.json({ ok: true, url: session.url }, { status: 200 });
    } catch (error: any) {
        console.error("Error creating checkout session:", error);
        return NextResponse.json({ ok: false, message: error.message || "Server error" }, { status: 500 });
    }
}
