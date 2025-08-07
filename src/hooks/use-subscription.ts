// src/hooks/use-subscription.ts
import { useSession } from "next-auth/react";
import {
  getPlanById,
  isTrialActive,
  getTrialDaysRemaining,
  SUBSCRIPTION_PLANS,
} from "@/lib/subscription-plans";

export function useSubscription() {
  const { data: session } = useSession();

  if (!session?.user) {
    return {
      isLoading: true,
      user: null,
      plan: null,
      isTrialActive: false,
      trialDaysRemaining: 0,
      canCreateBooking: false,
      canCreateService: false,
      hasAnalytics: false,
      hasSmsReminders: false,
    };
  }

  const user = session.user;
  const subscriptionStatus = user.subscriptionStatus || "trial";

  // Pendant l'essai, on donne accès au plan Pro
  const currentPlanId =
    subscriptionStatus === "trial" ? "pro" : subscriptionStatus;
  const currentPlan = getPlanById(currentPlanId) || SUBSCRIPTION_PLANS[0];

  const trialActive = isTrialActive({
    createdAt: new Date(user.createdAt || new Date()),
    subscriptionStatus,
  });

  const trialDays = trialActive
    ? getTrialDaysRemaining({
        createdAt: new Date(user.createdAt || new Date()),
      })
    : 0;

  return {
    isLoading: false,
    user,
    plan: currentPlan,
    isTrialActive: trialActive,
    trialDaysRemaining: trialDays,
    canCreateBooking: trialActive || subscriptionStatus !== "trial",
    canCreateService: trialActive || subscriptionStatus !== "trial",
    hasAnalytics: currentPlan.limitations.analytics,
    hasSmsReminders: currentPlan.limitations.smsReminders,
    needsUpgrade: !trialActive && subscriptionStatus === "trial",
  };
}
