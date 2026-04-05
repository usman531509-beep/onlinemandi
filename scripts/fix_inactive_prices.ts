import { connectToDatabase } from "./src/lib/mongodb";
import PaymentPlan from "./src/models/PaymentPlan";
import Stripe from "stripe";
import * as dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET!, { apiVersion: "2024-12-18.acacia" as any });

async function fix() {
  await connectToDatabase();
  console.log("Checking all active payment plans...");
  const plans = await PaymentPlan.find({ isActive: true });
  
  for (const plan of plans) {
    if (!plan.stripePriceId) continue;
    
    try {
      const price = await stripe.prices.retrieve(plan.stripePriceId);
      if (!price.active) {
        console.log(`Plan "${plan.name}" has an inactive price (${plan.stripePriceId}). Regenerating...`);
        
        // Regenerate the price
        let recurringProp: Stripe.PriceCreateParams.Recurring | undefined = undefined;
        if (plan.interval === "month") recurringProp = { interval: "month" };
        else if (plan.interval === "year") recurringProp = { interval: "year" };
        
        const newPrice = await stripe.prices.create({
          product: plan.stripeProductId,
          unit_amount: plan.price * 100, // PKR to paisa
          currency: "pkr",
          recurring: recurringProp,
        });

        plan.stripePriceId = newPrice.id;
        await plan.save();
        console.log(`Successfully regenerated price for "${plan.name}". New Price ID: ${newPrice.id}`);
      } else {
        console.log(`Plan "${plan.name}" price is active. O.K.`);
      }
    } catch (error) {
       console.error(`Error checking plan "${plan.name}":`, error);
    }
  }
  process.exit(0);
}

fix();
