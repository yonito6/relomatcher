// app/api/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_PRICE_ID;
const successUrl = process.env.STRIPE_SUCCESS_URL;
const cancelUrl = process.env.STRIPE_CANCEL_URL;

let stripe: Stripe | null = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey);
}

export async function POST() {
  try {
    // Helpful sanity checks
    if (!stripeSecretKey || !stripe) {
      console.error("Missing STRIPE_SECRET_KEY");
      return NextResponse.json(
        { error: "Server missing STRIPE_SECRET_KEY env var." },
        { status: 500 }
      );
    }
    if (!priceId) {
      console.error("Missing STRIPE_PRICE_ID");
      return NextResponse.json(
        { error: "Server missing STRIPE_PRICE_ID env var." },
        { status: 500 }
      );
    }
    if (!successUrl || !cancelUrl) {
      console.error("Missing STRIPE_SUCCESS_URL or STRIPE_CANCEL_URL");
      return NextResponse.json(
        { error: "Server missing success/cancel URL env vars." },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[Stripe] create-checkout-session error:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Stripe threw an error while creating the checkout session.",
      },
      { status: 500 }
    );
  }
}
