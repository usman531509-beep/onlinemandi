const { MongoClient, ObjectId } = require('mongodb');
const Stripe = require('stripe');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const stripe = new Stripe(process.env.Stripe_Secret || process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });

async function fix() {
    const uri = process.env.MongoDB_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error("No MongoDB_URI");

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const plansCollection = db.collection('paymentplans');

        console.log("Checking all active payment plans...");
        const plans = await plansCollection.find({ isActive: true }).toArray();

        for (const plan of plans) {
            if (!plan.stripePriceId) continue;

            try {
                const price = await stripe.prices.retrieve(plan.stripePriceId);
                if (!price.active) {
                    console.log(`Plan "${plan.name}" has an inactive price (${plan.stripePriceId}). Regenerating...`);

                    let recurringProp = undefined;
                    if (plan.interval === "month") recurringProp = { interval: "month" };
                    else if (plan.interval === "year") recurringProp = { interval: "year" };

                    const newPrice = await stripe.prices.create({
                        product: plan.stripeProductId,
                        unit_amount: plan.price * 100, // PKR to paisa
                        currency: "pkr",
                        recurring: recurringProp,
                    });

                    await plansCollection.updateOne(
                        { _id: plan._id },
                        { $set: { stripePriceId: newPrice.id } }
                    );

                    console.log(`Successfully regenerated price for "${plan.name}". New Price ID: ${newPrice.id}`);
                } else {
                    console.log(`Plan "${plan.name}" price is active. O.K.`);
                }
            } catch (error) {
                console.error(`Error checking plan "${plan.name}":`, error.message);
            }
        }
    } finally {
        await client.close();
    }
}

fix();
