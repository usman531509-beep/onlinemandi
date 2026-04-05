import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PaymentPlan from "@/models/PaymentPlan";
import Stripe from "stripe";

function getStripe() {
    return new Stripe(process.env.Stripe_Secret!, {
        apiVersion: "2024-12-18.acacia" as any,
    });
}

export async function GET(req: NextRequest) {
    try {
        await connectToDatabase();

        const searchParams = req.nextUrl.searchParams;
        const role = searchParams.get("role");

        if (role !== "admin") {
            return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 403 });
        }

        const plans = await PaymentPlan.find().sort({ createdAt: -1 }).lean();

        return NextResponse.json({ ok: true, plans }, { status: 200 });
    } catch (error) {
        console.error("Error fetching payment plans:", error);
        return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const stripe = getStripe();
        await connectToDatabase();

        const searchParams = req.nextUrl.searchParams;
        const role = searchParams.get("role");

        if (role !== "admin") {
            return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { name, description, price, interval, features, listingLimit, broadcastLimit } = body;

        if (!name || !price || !interval) {
            return NextResponse.json({ ok: false, message: "Missing required fields" }, { status: 400 });
        }

        // 1. Create product in Stripe
        const product = await stripe.products.create({
            name,
            description: description || undefined,
        });

        // 2. Create price in Stripe
        const priceData: Stripe.PriceCreateParams = {
            product: product.id,
            unit_amount: Math.round(price * 100), // Stripe expects amounts in cents/paisa
            currency: "pkr",
        };

        if (interval === "month" || interval === "year") {
            priceData.recurring = { interval };
        }

        const stripePrice = await stripe.prices.create(priceData);

        // 3. Save to MongoDB
        const plan = await PaymentPlan.create({
            name,
            description,
            price,
            currency: "PKR",
            interval,
            features: features || [],
            listingLimit: listingLimit ?? 10,
            broadcastLimit: broadcastLimit ?? 5,
            stripeProductId: product.id,
            stripePriceId: stripePrice.id,
            isActive: true,
        });

        return NextResponse.json({ ok: true, plan }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating payment plan:", error);
        return NextResponse.json({ ok: false, message: error.message || "Server error" }, { status: 500 });
    }
}
