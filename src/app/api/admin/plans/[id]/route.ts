import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentPlan from "@/models/PaymentPlan";
import Stripe from "stripe";

function getStripe() {
    return new Stripe(process.env.Stripe_Secret!, {
        apiVersion: "2024-12-18.acacia" as any,
    });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const stripe = getStripe();
        await connectToDatabase();

        // In Next.js 15, dynamic route params must be awaited
        const resolvedParams = await params;
        const { id } = resolvedParams;

        const searchParams = req.nextUrl.searchParams;
        const role = searchParams.get("role");

        if (role !== "admin") {
            return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { name, description, price, interval, features, isActive, listingLimit, broadcastLimit } = body;

        const plan = await PaymentPlan.findById(id);
        if (!plan) {
            return NextResponse.json({ ok: false, message: "Plan not found" }, { status: 404 });
        }

        if (plan.stripeProductId) {
            // Update the Stripe Product (Name, Description, Active status)
            await stripe.products.update(plan.stripeProductId, {
                name: name || plan.name,
                description: description || plan.description,
                active: isActive !== undefined ? isActive : plan.isActive
            });

            // If price or interval changed, we must create a new Stripe Price since they are immutable
            if ((price !== undefined && price !== plan.price) || (interval !== undefined && interval !== plan.interval)) {
                let recurringProp: Stripe.PriceCreateParams.Recurring | undefined = undefined;
                const newInterval = interval || plan.interval;

                if (newInterval === "month") {
                    recurringProp = { interval: "month" };
                } else if (newInterval === "year") {
                    recurringProp = { interval: "year" };
                }

                const newPrice = await stripe.prices.create({
                    product: plan.stripeProductId,
                    unit_amount: (price !== undefined ? price : plan.price) * 100, // PKR to paisa
                    currency: "pkr",
                    recurring: recurringProp,
                });

                const oldPriceId = plan.stripePriceId;

                plan.stripePriceId = newPrice.id;
                plan.price = price !== undefined ? price : plan.price;
                plan.interval = newInterval as "month" | "year" | "one-time";

                // Optionally archive the old price
                if (oldPriceId) {
                    try {
                        await stripe.prices.update(oldPriceId, { active: false });
                    } catch (e) {
                        // Ignore if old price can't be archived
                    }
                }
            }
        }

        plan.name = name || plan.name;
        plan.description = description !== undefined ? description : plan.description;
        plan.features = features || plan.features;

        if (listingLimit !== undefined) plan.listingLimit = listingLimit;
        if (broadcastLimit !== undefined) plan.broadcastLimit = broadcastLimit;

        if (isActive !== undefined) {
            plan.isActive = isActive;
        }

        await plan.save();

        return NextResponse.json({ ok: true, plan }, { status: 200 });
    } catch (error: any) {
        console.error("Error updating payment plan:", error);
        return NextResponse.json({ ok: false, message: error.message || "Server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const stripe = getStripe();
        await connectToDatabase();

        // In Next.js 15, dynamic route params must be awaited
        const resolvedParams = await params;
        const { id } = resolvedParams;

        const searchParams = req.nextUrl.searchParams;
        const role = searchParams.get("role");

        if (role !== "admin") {
            return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 403 });
        }

        const plan = await PaymentPlan.findById(id);
        if (!plan) {
            return NextResponse.json({ ok: false, message: "Plan not found" }, { status: 404 });
        }

        // Archive product in Stripe to stop accepting new subscriptions
        if (plan.stripeProductId) {
            try {
                await stripe.products.update(plan.stripeProductId, { active: false });
            } catch (stripeError) {
                console.error("Failed to archive Stripe product:", stripeError);
                // Continue anyway to mark inactive in our DB
            }
        }

        // Mark inactive instead of deleting to preserve history for existing subscribers
        plan.isActive = false;
        await plan.save();

        return NextResponse.json({ ok: true, message: "Plan archived successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Error deleting payment plan:", error);
        return NextResponse.json({ ok: false, message: error.message || "Server error" }, { status: 500 });
    }
}
