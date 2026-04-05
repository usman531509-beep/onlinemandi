import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentTransaction from "@/models/PaymentTransaction";
import PaymentPlan from "@/models/PaymentPlan";
import Subscription from "@/models/Subscription";
import User from "@/models/User";
import Stripe from "stripe";

const stripe = new Stripe(process.env.Stripe_Secret!, {
    apiVersion: "2024-12-18.acacia" as any,
});

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
        const stripe = getStripe();
        const body = await req.text();
        const signature = req.headers.get("stripe-signature");

        if (!signature) {
            return NextResponse.json({ ok: false, message: "Missing Stripe signature" }, { status: 400 });
        }

        let event: Stripe.Event;

        try {
            const secret = process.env.STRIPE_WEBHOOK_SECRET;
            if (!secret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
            event = stripe.webhooks.constructEvent(body, signature, secret);
        } catch (err: any) {
            console.error("⚠️  Webhook signature verification failed.", err.message);
            return NextResponse.json({ ok: false, message: "Webhook signature verification failed." }, { status: 400 });
        }

        await connectToDatabase();

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;

                // Ensure we don't duplicate transactions for the same session
                const existingTx = await PaymentTransaction.findOne({ stripeSessionId: session.id });
                if (existingTx) break;

                const email = session.metadata?.userEmail || session.customer_details?.email || "unknown@email.com";

                // Prefer the userId from metadata (always reliable), fall back to email lookup
                let matchingUser = null;
                if (session.metadata?.userId) {
                    matchingUser = await User.findById(session.metadata.userId);
                }
                if (!matchingUser && email !== "unknown@email.com") {
                    matchingUser = await User.findOne({ email });
                }

                // Use the account email for storage (not the Stripe-typed email)
                const accountEmail = matchingUser?.email || email;

                // 1. Record the payment transaction (existing behavior)
                await PaymentTransaction.create({
                    userEmail: accountEmail,
                    userName: matchingUser ? matchingUser.fullName : undefined,
                    planId: session.metadata?.planId || null,
                    stripeSessionId: session.id,
                    stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
                    amount: session.amount_total ? session.amount_total / 100 : 0,
                    currency: session.currency?.toUpperCase() || "PKR",
                    status: session.payment_status === "paid" ? "completed" : "pending",
                    paymentDate: new Date(),
                });

                // 2. Create an active subscription if we have a valid user + plan
                if (matchingUser && session.metadata?.planId) {
                    const plan = await PaymentPlan.findById(session.metadata.planId);
                    if (plan) {
                        // Deactivate any existing active subscription for this user
                        await Subscription.updateMany(
                            { userId: matchingUser._id, status: "active" },
                            { $set: { status: "expired" } }
                        );

                        const now = new Date();
                        await Subscription.create({
                            userId: matchingUser._id,
                            userEmail: email,
                            planId: plan._id,
                            stripeSessionId: session.id,
                            status: "active",
                            startDate: now,
                            endDate: computeEndDate(plan.interval, now),
                        });

                        console.log(`🎉 Subscription activated for ${email} → ${plan.name}`);
                    }
                }

                console.log(`✅ Successfully logged checkout session ${session.id}`);
                break;
            }

            // Handle recurring subscription invoice payments
            case "invoice.paid": {
                const invoice = event.data.object as Stripe.Invoice;
                // Handle recurring transaction logs here if needed...
                break;
            }

            default:
                console.log(`Unhandled Stripe event type: ${event.type}`);
        }

        return NextResponse.json({ ok: true, received: true }, { status: 200 });
    } catch (error: any) {
        console.error("Stripe webhook error:", error);
        return NextResponse.json({ ok: false, message: error.message || "Webhook error" }, { status: 400 });
    }
}
