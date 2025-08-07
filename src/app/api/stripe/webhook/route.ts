// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler failed:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Subscription created:", subscription.id);

  const customerId = subscription.customer as string;
  const userId = subscription.metadata.userId;
  const planId = subscription.metadata.planId;

  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  // Mettre à jour l'utilisateur
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId,
      subscriptionStatus: planId, // 'starter', 'pro', 'premium'
    },
  });

  // Log pour suivi
  console.log(`User ${userId} subscribed to plan ${planId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Subscription updated:", subscription.id);

  const userId = subscription.metadata.userId;
  const planId = subscription.metadata.planId;

  if (!userId) return;

  let status = planId;

  // Gérer les statuts Stripe
  if (subscription.status === "canceled") {
    status = "cancelled";
  } else if (subscription.status === "past_due") {
    status = "past_due";
  } else if (subscription.status === "unpaid") {
    status = "unpaid";
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: status,
    },
  });

  console.log(`User ${userId} subscription updated to ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Subscription deleted:", subscription.id);

  const userId = subscription.metadata.userId;

  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: "cancelled",
    },
  });

  console.log(`User ${userId} subscription cancelled`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Payment succeeded for invoice:", invoice.id);

  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    );
    const userId = subscription.metadata.userId;

    if (userId) {
      // Réactiver le compte si c'était suspendu
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (
        user?.subscriptionStatus === "past_due" ||
        user?.subscriptionStatus === "unpaid"
      ) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: subscription.metadata.planId || "pro",
          },
        });

        console.log(`User ${userId} reactivated after payment`);
      }
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Payment failed for invoice:", invoice.id);

  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    );
    const userId = subscription.metadata.userId;

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "past_due",
        },
      });

      // TODO: Envoyer email de relance
      console.log(`User ${userId} marked as past_due`);
    }
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  console.log("Trial will end for subscription:", subscription.id);

  const userId = subscription.metadata.userId;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user) {
      // TODO: Envoyer email de fin d'essai
      console.log(`Trial ending soon for user ${userId} (${user.email})`);
    }
  }
}

// Fonction utilitaire pour obtenir le plan depuis les price IDs Stripe
function getPlanFromPriceId(priceId: string): string {
  const priceMapping: Record<string, string> = {
    price_starter_monthly: "starter",
    price_pro_monthly: "pro",
    price_premium_monthly: "premium",
  };

  return priceMapping[priceId] || "pro";
}
