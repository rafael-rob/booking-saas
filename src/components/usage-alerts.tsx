// src/components/usage-alerts.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/use-subscription";

export default function UsageAlerts() {
  const router = useRouter();
  const subscription = useSubscription();

  if (subscription.isLoading || !subscription.plan) {
    return null;
  }

  const { plan, isTrialActive, user } = subscription;
  const alerts = [];

  // Calcul de l'usage actuel (simulé pour l'exemple)
  const currentBookings = 45; // À récupérer via API
  const currentServices = 2;

  // Alert si proche de la limite
  if (plan.limitations.maxBookingsPerMonth) {
    const usagePercent =
      (currentBookings / plan.limitations.maxBookingsPerMonth) * 100;
    const remaining = plan.limitations.maxBookingsPerMonth - currentBookings;

    if (usagePercent >= 90) {
      alerts.push({
        type: "critical",
        title: "🚨 Limite de réservations presque atteinte",
        message: `Plus que ${remaining} réservations ce mois sur votre plan ${plan.name}`,
        action: "Passer au plan supérieur",
        color: "red",
      });
    } else if (usagePercent >= 75) {
      alerts.push({
        type: "warning",
        title: "⚠️ Attention à votre limite",
        message: `${remaining} réservations restantes ce mois (${usagePercent.toFixed(
          0
        )}% utilisé)`,
        action: "Voir les plans",
        color: "yellow",
      });
    }
  }

  // Alert services
  if (
    plan.limitations.maxServices &&
    currentServices >= plan.limitations.maxServices
  ) {
    alerts.push({
      type: "info",
      title: "📊 Limite de services atteinte",
      message: `Vous avez ${currentServices} service(s) actif(s). Passez au plan Pro pour en créer plus.`,
      action: "Découvrir le plan Pro",
      color: "blue",
    });
  }

  // Alert fin d'essai
  if (isTrialActive && subscription.trialDaysRemaining <= 3) {
    alerts.push({
      type: "trial",
      title: "⏰ Essai gratuit bientôt terminé",
      message: `Plus que ${subscription.trialDaysRemaining} jour(s) d'essai gratuit`,
      action: "Choisir un plan",
      color: "purple",
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {alerts.map((alert, index) => (
        <Card
          key={index}
          className={`border-l-4 ${
            alert.color === "red"
              ? "border-l-red-500 bg-red-50"
              : alert.color === "yellow"
              ? "border-l-yellow-500 bg-yellow-50"
              : alert.color === "blue"
              ? "border-l-blue-500 bg-blue-50"
              : "border-l-purple-500 bg-purple-50"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>

                {/* Barre de progression pour les limites */}
                {plan.limitations.maxBookingsPerMonth &&
                  alert.type !== "trial" && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Réservations ce mois</span>
                        <span>
                          {currentBookings} /{" "}
                          {plan.limitations.maxBookingsPerMonth}
                        </span>
                      </div>
                      <Progress
                        value={
                          (currentBookings /
                            plan.limitations.maxBookingsPerMonth) *
                          100
                        }
                        className={`h-2 ${
                          alert.color === "red"
                            ? "[&>div]:bg-red-500"
                            : alert.color === "yellow"
                            ? "[&>div]:bg-yellow-500"
                            : "[&>div]:bg-blue-500"
                        }`}
                      />
                    </div>
                  )}
              </div>

              <div className="ml-4">
                <Button
                  size="sm"
                  onClick={() => router.push("/pricing")}
                  className={
                    alert.color === "red"
                      ? "bg-red-600 hover:bg-red-700"
                      : alert.color === "yellow"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : alert.color === "blue"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }
                >
                  {alert.action}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Composant de statistiques d'usage
export function UsageStats() {
  const subscription = useSubscription();

  if (subscription.isLoading || !subscription.plan) {
    return null;
  }

  const { plan } = subscription;
  const currentBookings = 45; // À récupérer via API
  const currentServices = 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Usage - Plan {plan.name}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/pricing", "_blank")}
          >
            Changer de plan
          </Button>
        </CardTitle>
        <CardDescription>Votre utilisation ce mois-ci</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Réservations */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Réservations</span>
            <span className="text-sm text-gray-600">
              {currentBookings} / {plan.limitations.maxBookingsPerMonth || "∞"}
            </span>
          </div>
          {plan.limitations.maxBookingsPerMonth ? (
            <Progress
              value={
                (currentBookings / plan.limitations.maxBookingsPerMonth) * 100
              }
              className="h-2"
            />
          ) : (
            <div className="text-sm text-green-600 font-medium">✓ Illimité</div>
          )}
        </div>

        {/* Services */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Services actifs</span>
            <span className="text-sm text-gray-600">
              {currentServices} / {plan.limitations.maxServices || "∞"}
            </span>
          </div>
          {plan.limitations.maxServices ? (
            <Progress
              value={(currentServices / plan.limitations.maxServices) * 100}
              className="h-2"
            />
          ) : (
            <div className="text-sm text-green-600 font-medium">✓ Illimité</div>
          )}
        </div>

        {/* Fonctionnalités */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Fonctionnalités incluses</h4>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span
                className={`mr-2 ${
                  plan.limitations.smsReminders
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {plan.limitations.smsReminders ? "✓" : "✗"}
              </span>
              <span
                className={plan.limitations.smsReminders ? "" : "text-gray-500"}
              >
                Rappels SMS
              </span>
            </div>

            <div className="flex items-center text-sm">
              <span
                className={`mr-2 ${
                  plan.limitations.analytics
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {plan.limitations.analytics ? "✓" : "✗"}
              </span>
              <span
                className={plan.limitations.analytics ? "" : "text-gray-500"}
              >
                Analytics avancées
              </span>
            </div>

            <div className="flex items-center text-sm">
              <span
                className={`mr-2 ${
                  plan.limitations.apiAccess
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {plan.limitations.apiAccess ? "✓" : "✗"}
              </span>
              <span
                className={plan.limitations.apiAccess ? "" : "text-gray-500"}
              >
                Accès API
              </span>
            </div>

            <div className="flex items-center text-sm">
              <span
                className={`mr-2 ${
                  plan.limitations.customBranding
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {plan.limitations.customBranding ? "✓" : "✗"}
              </span>
              <span
                className={
                  plan.limitations.customBranding ? "" : "text-gray-500"
                }
              >
                Personnalisation avancée
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
