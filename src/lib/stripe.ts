import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/**
 * Lazily initializes and returns the Stripe client.
 * This avoids constructing Stripe at module-load time (build time)
 * when environment variables aren't available yet.
 */
export function getStripe(): Stripe {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET;
        if (!key) {
            throw new Error(
                "Missing STRIPE_SECRET environment variable. " +
                "Please set it in your Hostinger environment settings."
            );
        }
        stripeInstance = new Stripe(key, {
            apiVersion: "2024-12-18.acacia" as any,
        });
    }
    return stripeInstance;
}
