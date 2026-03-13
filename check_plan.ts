import { connectToDatabase } from "./src/lib/mongodb";
import PaymentPlan from "./src/models/PaymentPlan";
import Stripe from "stripe";

const stripe = new Stripe(process.env.Stripe_Secret!, { apiVersion: "2024-12-18.acacia" as any });

async function check() {
  await connectToDatabase();
  const plan = await PaymentPlan.findOne({ name: "Pro Trader(one time)", isActive: true });
  if (!plan) {
    console.log("Plan not found");
    process.exit(0);
  }
  console.log("Plan ID:", plan._id);
  console.log("Stripe Price ID:", plan.stripePriceId);
  const price = await stripe.prices.retrieve(plan.stripePriceId);
  console.log("Stripe Price Active:", price.active);
  process.exit(0);
}

check();
