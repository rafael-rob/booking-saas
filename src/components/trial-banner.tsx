// src/components/trial-banner.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";

export default function TrialBanner() {
  const router = useRouter();
  const { isTrialActive, trialDaysRemaining, needsUpgrade, plan } =
    useSubscription();

  if (!isTrialActive && !needsUpgrade) {
    return null;
  }

  return (
    <div
      className={`border-b ${
        needsUpgrade
          ? "bg-red-50 border-red-200"
          : trialDaysRemaining <= 3
          ? "bg-yellow-50 border-yellow-200"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">
              {needsUpgrade ? "⚠️" : trialDaysRemaining <= 3 ? "⏰" : "🎉"}
            </span>
            <div>
              {needsUpgrade ? (
                <div>
                  <p className="font-medium text-red-800">
                    Votre essai gratuit est terminé
                  </p>
                  <p className="text-sm text-red-600">
                    Choisissez un plan pour continuer à utiliser BookingSaaS
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-900">
                    Essai gratuit - Plan {plan?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {trialDaysRemaining} jour{trialDaysRemaining > 1 ? "s" : ""}{" "}
                    restant{trialDaysRemaining > 1 ? "s" : ""}
                    {trialDaysRemaining <= 3 &&
                      " - N'oubliez pas de choisir votre plan !"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!needsUpgrade && (
              <span className="text-sm text-gray-500">
                Toutes les fonctionnalités incluses
              </span>
            )}
            <Button
              size="sm"
              onClick={() => router.push("/pricing")}
              className={
                needsUpgrade
                  ? "bg-red-600 hover:bg-red-700"
                  : trialDaysRemaining <= 3
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {needsUpgrade ? "Choisir un plan" : "Voir les plans"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
