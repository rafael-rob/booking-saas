// src/components/welcome-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "next-auth/react";

export default function WelcomeModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (searchParams.get("welcome") === "true" && session?.user) {
      setShowWelcome(true);
    }
  }, [searchParams, session]);

  const welcomeSteps = [
    {
      title: "🚀 Félicitations !",
      description: "Votre SaaS de réservation est prêt à générer des revenus",
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-lg text-gray-800">
            Bonjour <strong>{session?.user?.name}</strong> !
          </p>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-4">
            <div className="text-green-800 font-semibold mb-2">
              ✅ Votre système est DÉJÀ opérationnel !
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white rounded-lg p-2">
                <div className="font-medium">📅 Page de réservation</div>
                <div className="text-green-600">Active 24/7</div>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="font-medium">💰 Essai Pro</div>
                <div className="text-blue-600">14 jours gratuits</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            <strong>Temps pour votre 1ère réservation :</strong> 2 minutes ⏰
          </p>
        </div>
      ),
    },
    {
      title: "⚡ 3 actions = Premiers clients",
      description: "Configuration express pour des résultats immédiats",
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center mb-4">
            <div className="text-red-700 font-bold text-sm">
              🔥 URGENT : 3 étapes pour multiplier vos réservations
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
              <div className="flex-1">
                <div className="font-medium">Personnalisez vos services</div>
                <div className="text-xs text-gray-600">Prix, durée, description attractive</div>
              </div>
              <Button size="sm" onClick={() => { setShowWelcome(false); router.push('/dashboard/services'); }}>
                Go
              </Button>
            </div>
            
            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
              <div className="flex-1">
                <div className="font-medium">Ajustez vos horaires</div>
                <div className="text-xs text-gray-600">Créneaux qui vous conviennent</div>
              </div>
              <Button size="sm" onClick={() => { setShowWelcome(false); router.push('/dashboard/availability'); }}>
                Go
              </Button>
            </div>
            
            <div className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</div>
              <div className="flex-1">
                <div className="font-medium">Partagez votre lien</div>
                <div className="text-xs text-gray-600">Sur vos réseaux sociaux</div>
              </div>
              <Button size="sm" onClick={() => setCurrentStep(2)}>
                Voir
              </Button>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-xs font-medium">
              💡 <strong>Astuce :</strong> 87% de nos utilisateurs qui font ces 3 étapes ont leur 1ère réservation dans les 24h !
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "🎯 Votre lien magique",
      description: "Partagez ce lien = Réservations automatiques",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🔗</div>
            <h4 className="font-bold mb-3 text-lg">Votre page de réservation</h4>
            <div className="bg-white bg-opacity-20 rounded-lg p-3 font-mono text-sm mb-4">
              localhost:3000/booking/{session?.user?.id}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(`localhost:3000/booking/${session?.user?.id}`);
                  alert("Lien copié !");
                }}
              >
                📋 Copier le lien
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => window.open(`/booking/${session?.user?.id}`, "_blank")}
              >
                👀 Voir ma page
              </Button>
            </div>
          </div>
          
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <div className="font-bold text-green-800 mb-2">🚀 Partagez maintenant sur :</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white rounded p-2 text-center">📱 WhatsApp Business</div>
              <div className="bg-white rounded p-2 text-center">📘 Facebook</div>
              <div className="bg-white rounded p-2 text-center">📸 Instagram Bio</div>
              <div className="bg-white rounded p-2 text-center">💼 LinkedIn</div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-2">
              Vos clients pourront réserver <strong>24h/24, 7j/7</strong> même quand vous dormez !
            </p>
            <div className="flex justify-center items-center space-x-4 text-xs">
              <span>📱 Mobile</span>
              <span>⚡ Instant</span>
              <span>💳 Paiement</span>
              <span>📧 Rappels</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "💰 Votre première réservation",
      description: "Comment obtenir votre 1er client en 24h",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="font-bold text-lg">Challenge 24h !</div>
            <div className="text-sm opacity-90">Obtenez votre première réservation avant demain</div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="font-bold text-yellow-800 mb-1">✅ Action immédiate :</div>
              <div className="text-sm text-gray-700">
                Envoyez votre lien à 5 contacts qui pourraient avoir besoin de vos services
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="font-bold text-blue-800 mb-1">📱 Astuce Social Media :</div>
              <div className="text-sm text-gray-700">
                Postez une story "Réservez directement en ligne" avec votre lien
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="font-bold text-green-800 mb-1">🎁 Offre de lancement :</div>
              <div className="text-sm text-gray-700">
                Proposez 10% de réduction pour les 5 premiers clients qui réservent en ligne
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
            <div className="font-bold text-red-700 text-sm mb-1">
              ⚡ Stat choc : 73% de nos utilisateurs
            </div>
            <div className="text-xs text-red-600">
              qui suivent ce plan ont leur 1ère réservation en moins de 24h !
            </div>
          </div>
        </div>
      ),
    },
  ];

  if (!showWelcome) return null;

  const currentStepData = welcomeSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle>{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStepData.content}

          <div className="flex items-center justify-between mt-6">
            {/* Indicateur de progression */}
            <div className="flex space-x-1">
              {welcomeSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Boutons navigation */}
            <div className="space-x-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Précédent
                </Button>
              )}

              {currentStep < welcomeSteps.length - 1 ? (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  {currentStep === 0 ? "🚀 Let's go !" : 
                   currentStep === 1 ? "👀 Voir mon lien" :
                   currentStep === 2 ? "💰 Challenge 24h" : "Suivant"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-bold px-8"
                  onClick={() => {
                    setShowWelcome(false);
                    router.replace("/dashboard");
                  }}
                >
                  🎯 Commencer le challenge !
                </Button>
              )}
            </div>
          </div>

          {/* Lien pour passer */}
          <div className="text-center mt-4">
            <button
              onClick={() => {
                setShowWelcome(false);
                router.replace("/dashboard");
              }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Passer l'introduction
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
