// app/api/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_PRICE_ID;
const successUrlEnv = process.env.STRIPE_SUCCESS_URL;
const cancelUrlEnv = process.env.STRIPE_CANCEL_URL;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://relomatcher.com";

let stripe: Stripe | null = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey);
}

export async function POST(req: Request) {
  try {
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

    const successUrl =
      successUrlEnv && successUrlEnv.trim().length > 0
        ? successUrlEnv
        : `${appUrl}/checkout/success`;

    // If STRIPE_CANCEL_URL is set, use it; otherwise default to /?restore=1
    const cancelUrl =
      cancelUrlEnv && cancelUrlEnv.trim().length > 0
        ? cancelUrlEnv
        : `${appUrl}/?restore=1`;

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
