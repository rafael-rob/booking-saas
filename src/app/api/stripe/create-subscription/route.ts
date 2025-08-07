// src/app/api/stripe/create-subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Stripe from "stripe";
import { SUBSCRIPTION_PLANS, getPlanById } from "@/lib/subscription-plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { planId } = await request.json();

    // Vérifier que le plan existe
    const selectedPlan = getPlanById(planId);
    if (!selectedPlan) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    // Créer un client Stripe s'il n'existe pas
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || user.email,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;

      // Sauvegarder le Customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Créer la session de checkout Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      billing_address_collection: "required",
      line_items: [
        {
          price: selectedPlan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true&plan=${planId}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: planId,
        },
        trial_period_days: 14, // 14 jours d'essai gratuit
      },
      metadata: {
        userId: user.id,
        planId: planId,
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error("Erreur création abonnement:", error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Erreur Stripe: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
