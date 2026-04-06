import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentTransaction from "@/models/PaymentTransaction";
import PaymentPlan from "@/models/PaymentPlan";
import Subscription from "@/models/Subscription";
import User from "@/models/User";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

function computeEndDate(interval: string, startDate: Date): Date | null {
    const end = new Date(startDate);
    if (interval === "month") {
        end.setMonth(end.getMonth() + 1);
        return end;
    }
    if (interval === "year") {
        end.setFullYear(end.getFullYear() + 1);
        return end;
    }
    // one-time / lifetime → no expiry
    return null;
}

export async function POST(req: NextRequest) {
    try {
        // 1. Connect to database immediately to ensure models are ready
        await connectToDatabase();
        
        const stripe = getStripe();
        const body = await req.text();
        const signature = req.headers.get("stripe-signature");

        if (!signature) {
            console.error("❌ Missing stripe-signature header");
            return NextResponse.json({ ok: false, message: "Missing Stripe signature" }, { status: 400 });
        }

        let event: Stripe.Event;

        try {
            const secret = process.env.STRIPE_WEBHOOK_SECRET;
            if (!secret) {
                console.error("❌ CRITICAL: STRIPE_WEBHOOK_SECRET is not defined in environment variables");
                throw new Error("Missing STRIPE_WEBHOOK_SECRET");
            }
            event = stripe.webhooks.constructEvent(body, signature, secret);
        } catch (err: any) {
            console.error("⚠️ Webhook signature verification failed.", err.message);
            return NextResponse.json({ ok: false, message: "Webhook signature verification failed." }, { status: 400 });
        }

        console.log(`🔔 Received Stripe Event: ${event.type}`);

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                console.log(`📦 Processing Checkout Session: ${session.id}`);

                // Ensure we don't duplicate transactions for the same session
                const existingTx = await PaymentTransaction.findOne({ stripeSessionId: session.id });
                if (existingTx) {
                    console.log(`ℹ️ Transaction for session ${session.id} already exists. Skipping.`);
                    break;
                }

                const rawEmail = session.metadata?.userEmail || session.customer_details?.email || "unknown@email.com";
                const email = rawEmail.toLowerCase().trim();
                const userId = session.metadata?.userId;
                const planId = session.metadata?.planId;

                console.log(`👤 Customer Email: ${email}, Metadata UserID: ${userId || 'N/A'}`);

                // Defensive check: Find matching user
                let matchingUser = null;
                
                // Only attempt findById if it looks like a valid MongoDB ObjectId to avoid cast errors
                if (userId && mongoose.isValidObjectId(userId)) {
                    matchingUser = await User.findById(userId);
                }

                if (!matchingUser && email !== "unknown@email.com") {
                    console.log(`🔍 User not found by ID, searching by email: ${email}`);
                    matchingUser = await User.findOne({ email });
                }

                if (matchingUser) {
                    console.log(`✅ Found matching user: ${matchingUser.fullName} (${matchingUser._id})`);
                } else {
                    console.warn(`⚠️ No matching user found for email ${email}. Subscription will not be created.`);
                }

                // 1. Record the payment transaction
                try {
                    const txData: any = {
                        userEmail: matchingUser?.email || email,
                        userName: matchingUser?.fullName || undefined,
                        stripeSessionId: session.id,
                        stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
                        amount: session.amount_total ? session.amount_total / 100 : 0,
                        currency: session.currency?.toUpperCase() || "PKR",
                        status: session.payment_status === "paid" ? "completed" : "pending",
                        paymentDate: new Date(),
                    };

                    // Only add planId if it's a valid ObjectId
                    if (planId && mongoose.isValidObjectId(planId)) {
                        txData.planId = planId;
                    }
                    if (matchingUser) {
                        txData.userId = matchingUser._id;
                    }

                    await PaymentTransaction.create(txData);
                    console.log(`💰 PaymentTransaction created for session ${session.id}`);
                } catch (txError) {
                    console.error("❌ Failed to create PaymentTransaction:", txError);
                    // We don't throw here to allow subscription logic to attempt anyway if possible
                }

                // 2. Create an active subscription if we have a valid user + plan
                if (matchingUser && planId && mongoose.isValidObjectId(planId)) {
                    const plan = await PaymentPlan.findById(planId);
                    if (plan) {
                        // Deactivate any existing active subscription for this user
                        await Subscription.updateMany(
                            { userId: matchingUser._id, status: "active" },
                            { $set: { status: "expired" } }
                        );

                        const now = new Date();
                        await Subscription.create({
                            userId: matchingUser._id,
                            userEmail: matchingUser.email,
                            planId: plan._id,
                            stripeSessionId: session.id,
                            status: "active",
                            startDate: now,
                            endDate: computeEndDate(plan.interval, now),
                        });

                        console.log(`🎉 Subscription activated for ${matchingUser.email} → ${plan.name}`);
                    } else {
                        console.error(`❌ Plan not found for ID: ${planId}`);
                    }
                } else {
                    console.warn("⏭️ Skipping subscription creation (missing user or invalid plan ID)");
                }

                console.log(`✅ Successfully finished processing session ${session.id}`);
                break;
            }

            case "invoice.paid": {
                const invoice = event.data.object as Stripe.Invoice;
                console.log(`📄 Invoice paid: ${invoice.id}`);
                break;
            }

            default:
                console.log(`❓ Unhandled Stripe event type: ${event.type}`);
        }

        return NextResponse.json({ ok: true, received: true }, { status: 200 });
    } catch (error: any) {
        console.error("❗ Stripe webhook top-level error:", error);
        return NextResponse.json({ ok: false, message: error.message || "Webhook error" }, { status: 400 });
    }
}

