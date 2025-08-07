// src/lib/subscription-plans.ts

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  stripePriceId: string; // À créer dans Stripe
  features: string[];
  limitations: {
    maxBookingsPerMonth: number | null; // null = illimité
    maxServices: number | null;
    smsReminders: boolean;
    analytics: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
  };
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Parfait pour commencer",
    price: 19,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || "price_starter_monthly",
    features: [
      "100 réservations par mois",
      "1 service disponible",
      "Page de réservation personnalisée",
      "Synchronisation Google Calendar",
      "Support par email",
    ],
    limitations: {
      maxBookingsPerMonth: 100,
      maxServices: 1,
      smsReminders: false,
      analytics: false,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  {
    id: "pro",
    name: "Pro",
    description: "Pour les professionnels actifs",
    price: 29,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro_monthly",
    features: [
      "Réservations illimitées",
      "Services illimités",
      "Rappels SMS automatiques",
      "Analytics avancées",
      "Personnalisation de la page",
      "Support prioritaire",
    ],
    limitations: {
      maxBookingsPerMonth: null,
      maxServices: null,
      smsReminders: true,
      analytics: true,
      customBranding: true,
      apiAccess: false,
      prioritySupport: true,
    },
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    description: "Pour les entreprises",
    price: 49,
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || "price_premium_monthly",
    features: [
      "Tout du plan Pro",
      "API développeur",
      "Intégrations avancées",
      "Support téléphonique",
      "Formation personnalisée",
      "Statistiques détaillées",
    ],
    limitations: {
      maxBookingsPerMonth: null,
      maxServices: null,
      smsReminders: true,
      analytics: true,
      customBranding: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
];

export const TRIAL_DAYS = 14;

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
}

export function getTrialEndDate(): Date {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
  trialEnd.setHours(23, 59, 59, 999);
  return trialEnd;
}

export function isTrialActive(user: {
  createdAt: Date;
  subscriptionStatus?: string | null;
}): boolean {
  if (user.subscriptionStatus && user.subscriptionStatus !== "trial") {
    return false;
  }

  const trialEnd = new Date(user.createdAt);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

  return new Date() < trialEnd;
}

export function getTrialDaysRemaining(user: { createdAt: Date }): number {
  const trialEnd = new Date(user.createdAt);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

  const now = new Date();
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}
