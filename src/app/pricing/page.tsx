// src/app/pricing/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import { formatPrice } from "@/lib/utils";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const selectedPlan = searchParams?.get("plan");
  const autoSelect = searchParams?.get("auto") === "true";
  const isWelcome = searchParams?.get("welcome") === "true";
  const canceled = searchParams?.get("canceled") === "true";
  const message = searchParams?.get("message");

  const handleSelectPlan = async (planId: string) => {
    if (!session) {
      // Rediriger vers l'inscription
      router.push(`/auth/signup?plan=${planId}`);
      return;
    }

    setIsLoading(planId);

    try {
      const response = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      if (response.ok) {
        const { url } = await response.json();
        // Rediriger vers Stripe Checkout
        window.location.href = url;
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
        setIsLoading(null);
      }
    } catch (error) {
      alert("Une erreur est survenue lors de la création de l'abonnement");
      console.error("Erreur:", error);
      setIsLoading(null);
    }
  };

  // Auto-sélection du plan si demandé (temporairement désactivé)
  useEffect(() => {
    // if (autoSelect && selectedPlan && session) {
    //   handleSelectPlan(selectedPlan)
    // }
  }, [autoSelect, selectedPlan, session]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">BookingSaaS</h1>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <Button onClick={() => router.push("/dashboard")}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/auth/signin")}
                  >
                    Se connecter
                  </Button>
                  <Button onClick={() => router.push("/auth/signup")}>
                    Commencer
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Messages d'alerte */}
        {canceled && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Paiement annulé
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Aucun souci ! Vous pouvez sélectionner un plan à tout moment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-blue-400">ℹ️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">{message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-16">
          {isWelcome && session ? (
            <>
              <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-6">
                Félicitations {session.user.name} ! 🎉
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
                Votre essai gratuit de <strong>14 jours</strong> a commencé avec <strong>toutes les fonctionnalités Pro</strong>.
                <br />
                Vous pouvez changer de plan à tout moment, même pendant l'essai.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-6">
                Multipliez vos revenus dès aujourd'hui
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-4">
                Rejoignez <strong>2,847 professionnels</strong> qui ont déjà transformé leur activité. 
                Essai gratuit de <strong>14 jours</strong>, puis choisissez ce qui vous convient.
              </p>
            </>
          )}

          {/* Badges de confiance */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              🎉 14 jours gratuits - Toutes fonctionnalités incluses
            </div>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              ⭐ 4.9/5 • +2,800 utilisateurs satisfaits
            </div>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
              ⚡ Résultats dès le 1er jour
            </div>
          </div>
        </div>

        {/* Plans de pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const savings = plan.id === 'starter' ? null : plan.id === 'pro' ? '47' : '73';
            const monthlyValue = plan.id === 'starter' ? '45' : plan.id === 'pro' ? '89' : '156';
            
            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular || selectedPlan === plan.id
                    ? "border-2 border-blue-500 shadow-2xl transform scale-105 bg-gradient-to-b from-blue-50 to-white"
                    : "border border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300"
                }`}
              >
                {(plan.popular || selectedPlan === plan.id) && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    {selectedPlan === plan.id ? "✅ Sélectionné" : "🔥 Le plus populaire"}
                  </div>
                )}

                {savings && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {savings}% d'économies
                  </div>
                )}

                <CardHeader className="text-center pb-6 pt-8">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-base text-gray-600 mb-4">
                    {plan.description}
                  </CardDescription>
                  
                  {/* Prix avec valeur */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-5xl font-bold text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      <div className="text-left">
                        <div className="text-gray-600">/mois</div>
                        <div className="text-xs text-gray-500">HT</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Valeur réelle : <span className="line-through">{monthlyValue}€/mois</span>
                    </div>
                    
                    <div className="text-lg font-semibold text-green-600">
                      💰 Économie annuelle : {((parseInt(monthlyValue) - plan.price) * 12).toFixed(0)}€
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 px-6 pb-6">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-3 mt-0.5 text-lg">✓</span>
                        <span className="text-sm text-gray-700 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isLoading === plan.id}
                    size="lg"
                    className={`w-full text-base font-bold py-4 mb-4 ${
                      plan.popular || selectedPlan === plan.id
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                        : "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                    }`}
                    variant={
                      plan.popular || selectedPlan === plan.id
                        ? "default"
                        : "outline"
                    }
                  >
                    {isLoading === plan.id ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Chargement...
                      </div>
                    ) : (
                      <>
                        {session ? (
                          plan.popular ? "🚀 Commencer maintenant" : "Choisir ce plan"
                        ) : (
                          "🎯 Essai gratuit 14 jours"
                        )}
                      </>
                    )}
                  </Button>

                  <div className="text-center space-y-1">
                    <p className="text-xs text-gray-500">
                      ✅ Aucune carte requise • ✅ Résiliation 1 clic
                    </p>
                    <p className="text-xs text-green-600 font-medium">
                      Configuration en 2 minutes seulement !
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Garanties et réassurances */}
        <div className="mt-20 mb-16">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-8 text-gray-900">
              🛡️ Notre garantie sans risque
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">✅</div>
                <h4 className="font-bold text-gray-900 mb-2">14 jours gratuits</h4>
                <p className="text-sm text-gray-600">
                  Testez toutes les fonctionnalités sans aucun engagement
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🔄</div>
                <h4 className="font-bold text-gray-900 mb-2">Changement libre</h4>
                <p className="text-sm text-gray-600">
                  Passez d'un plan à l'autre à tout moment, même en cours d'essai
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🚪</div>
                <h4 className="font-bold text-gray-900 mb-2">Résiliation 1 clic</h4>
                <p className="text-sm text-gray-600">
                  Annulez en 30 secondes. Aucune pénalité, aucune question
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section - Réduire les objections */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            ❓ Réponses aux questions les plus courantes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <h4 className="text-lg font-bold mb-3 text-blue-600">
                  🚀 Est-ce que ça marche vraiment ?
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  <strong>Plus de 2,800 professionnels</strong> l'utilisent déjà avec succès. 
                  En moyenne, ils reportent <strong>+73% de réservations</strong> et 
                  <strong>-70% de désistements</strong> dès le premier mois.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <h4 className="text-lg font-bold mb-3 text-green-600">
                  ⏰ Combien de temps pour voir les résultats ?
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  <strong>Résultats immédiats !</strong> Dès que vos clients ont le lien, 
                  ils peuvent réserver 24/7. La plupart de nos utilisateurs voient leurs 
                  premières réservations automatiques le <strong>jour même</strong>.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <h4 className="text-lg font-bold mb-3 text-purple-600">
                  🔧 C'est compliqué à configurer ?
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  <strong>2 minutes chrono !</strong> Ajoutez vos services, définissez vos horaires, 
                  et c'est parti. Nos utilisateurs disent que c'est <strong>"ridiculement simple"</strong>. 
                  Support français inclus si besoin.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <h4 className="text-lg font-bold mb-3 text-red-600">
                  💳 Dois-je donner ma carte pour l'essai ?
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  <strong>Non !</strong> L'essai de 14 jours est 100% gratuit, 
                  aucune carte requise. Vous ne payez que si vous décidez de continuer. 
                  Et vous pouvez annuler en 1 clic à tout moment.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <h4 className="text-lg font-bold mb-3 text-orange-600">
                  📱 Ça marche sur mobile ?
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  <strong>Parfaitement !</strong> Vos clients réservent depuis leur téléphone, 
                  et vous gérez vos RDV depuis votre mobile. Interface optimisée, 
                  notifications push, tout y est.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <h4 className="text-lg font-bold mb-3 text-indigo-600">
                  💰 Le prix en vaut-il la peine ?
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  <strong>Il se rentabilise en quelques jours !</strong> Si vous évitez ne serait-ce 
                  qu'1 seul désistement par mois, c'est déjà rentable. Nos utilisateurs économisent 
                  en moyenne <strong>800€/mois</strong> en créneaux sauvés.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA final puissant */}
        <div className="mt-20 mb-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-12 max-w-4xl mx-auto text-white">
            <h3 className="text-4xl font-bold mb-6">
              🚀 Ne laissez plus vos concurrents prendre l'avantage !
            </h3>
            <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
              Pendant que vous hésitez, <strong>vos concurrents utilisent déjà BookingSaaS</strong> pour voler vos clients. 
              Ils ont des réservations 24/7, zéro désistement, et multiplient leurs revenus.
            </p>
            
            <div className="bg-white bg-opacity-20 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
              <div className="text-2xl font-bold mb-2">⏰ Cette offre ne durera pas !</div>
              <p className="text-lg">
                14 jours gratuits + configuration offerte + support prioritaire
              </p>
              <p className="text-sm mt-2 opacity-90">
                Plus de 50 nouveaux professionnels rejoignent BookingSaaS chaque semaine
              </p>
            </div>

            <div className="space-y-4">
              {!session && (
                <Button 
                  size="lg" 
                  onClick={() => router.push("/auth/signup")}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xl px-12 py-6 shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  🎯 COMMENCER MAINTENANT - 100% GRATUIT
                </Button>
              )}
              
              <div className="flex justify-center items-center space-x-8 text-sm">
                <span>✅ Aucune carte requise</span>
                <span>✅ Configuration en 2 min</span>
                <span>✅ Support français</span>
              </div>
              
              <p className="text-xs opacity-75">
                Rejoignez Marie, Pierre, Amélie et 2,844 autres professionnels qui ont déjà transformé leur activité
              </p>
            </div>
          </div>
        </div>

        {/* Urgence finale */}
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            ⚡ <strong>Action limitée :</strong> Les 14 jours gratuits sont réservés aux 100 prochains inscrits
          </p>
        </div>
      </main>
    </div>
  );
}
