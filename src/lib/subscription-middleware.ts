// src/lib/subscription-middleware.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlanById, isTrialActive } from "@/lib/subscription-plans";
import { NextResponse } from "next/server";

export interface SubscriptionCheck {
  isAllowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  planName?: string;
}

export async function checkSubscriptionLimits(
  action:
    | "create_booking"
    | "create_service"
    | "access_analytics"
    | "use_sms"
    | "access_api"
): Promise<SubscriptionCheck> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { isAllowed: false, reason: "Utilisateur non connecté" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      services: true,
      bookings: {
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Ce mois
          },
        },
      },
    },
  });

  if (!user) {
    return { isAllowed: false, reason: "Utilisateur non trouvé" };
  }

  // Vérifier si l'essai est actif
  const trialActive = isTrialActive({
    createdAt: user.createdAt,
    subscriptionStatus: user.subscriptionStatus,
  });

  // Si essai actif, on donne accès à tout (plan Pro)
  if (trialActive) {
    return { isAllowed: true, planName: "Essai gratuit (Pro)" };
  }

  // Si pas d'abonnement actif après l'essai
  if (
    !user.subscriptionStatus ||
    user.subscriptionStatus === "trial" ||
    user.subscriptionStatus === "cancelled" ||
    user.subscriptionStatus === "past_due"
  ) {
    return {
      isAllowed: false,
      reason: "Abonnement expiré ou suspendu",
      planName: "Aucun plan actif",
    };
  }

  const currentPlan = getPlanById(user.subscriptionStatus);
  if (!currentPlan) {
    return { isAllowed: false, reason: "Plan non reconnu" };
  }

  // Vérifier les limitations selon l'action
  switch (action) {
    case "create_booking":
      if (currentPlan.limitations.maxBookingsPerMonth) {
        const currentMonthBookings = user.bookings.length;
        if (
          currentMonthBookings >= currentPlan.limitations.maxBookingsPerMonth
        ) {
          return {
            isAllowed: false,
            reason: "Limite de réservations atteinte",
            currentUsage: currentMonthBookings,
            limit: currentPlan.limitations.maxBookingsPerMonth,
            planName: currentPlan.name,
          };
        }
      }
      break;

    case "create_service":
      if (currentPlan.limitations.maxServices) {
        const currentServices = user.services.filter((s) => s.isActive).length;
        if (currentServices >= currentPlan.limitations.maxServices) {
          return {
            isAllowed: false,
            reason: "Limite de services atteinte",
            currentUsage: currentServices,
            limit: currentPlan.limitations.maxServices,
            planName: currentPlan.name,
          };
        }
      }
      break;

    case "access_analytics":
      if (!currentPlan.limitations.analytics) {
        return {
          isAllowed: false,
          reason: "Analytics non incluses dans votre plan",
          planName: currentPlan.name,
        };
      }
      break;

    case "use_sms":
      if (!currentPlan.limitations.smsReminders) {
        return {
          isAllowed: false,
          reason: "SMS non inclus dans votre plan",
          planName: currentPlan.name,
        };
      }
      break;

    case "access_api":
      if (!currentPlan.limitations.apiAccess) {
        return {
          isAllowed: false,
          reason: "API non incluse dans votre plan",
          planName: currentPlan.name,
        };
      }
      break;
  }

  return {
    isAllowed: true,
    planName: currentPlan.name,
    currentUsage:
      action === "create_booking"
        ? user.bookings.length
        : action === "create_service"
        ? user.services.filter((s) => s.isActive).length
        : undefined,
  };
}

// Middleware pour les API routes
export function withSubscriptionCheck(
  action: Parameters<typeof checkSubscriptionLimits>[0]
) {
  return async function middleware() {
    const check = await checkSubscriptionLimits(action);

    if (!check.isAllowed) {
      return NextResponse.json(
        {
          error: check.reason,
          currentUsage: check.currentUsage,
          limit: check.limit,
          planName: check.planName,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    return null; // Continue
  };
}

// Hook pour les composants React
export async function useSubscriptionLimits() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      services: { where: { isActive: true } },
      bookings: {
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
    },
  });

  if (!user) return null;

  const trialActive = isTrialActive({
    createdAt: user.createdAt,
    subscriptionStatus: user.subscriptionStatus,
  });

  const currentPlan = trialActive
    ? getPlanById("pro")
    : getPlanById(user.subscriptionStatus || "starter");

  if (!currentPlan) return null;

  return {
    plan: currentPlan,
    isTrialActive: trialActive,
    usage: {
      bookingsThisMonth: user.bookings.length,
      activeServices: user.services.length,
    },
    limits: {
      bookingsRemaining: currentPlan.limitations.maxBookingsPerMonth
        ? Math.max(
            0,
            currentPlan.limitations.maxBookingsPerMonth - user.bookings.length
          )
        : null,
      servicesRemaining: currentPlan.limitations.maxServices
        ? Math.max(
            0,
            currentPlan.limitations.maxServices - user.services.length
          )
        : null,
    },
  };
}
