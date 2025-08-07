// src/app/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">📅 BookingSaaS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/search">
                <Button variant="ghost" className="text-sm">🔍 Rechercher</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" className="text-sm">Tarifs</Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-sm">Se connecter</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="text-sm px-6">Essai gratuit</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Alert Banner */}
        <div className="mt-8 mx-auto max-w-2xl">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <span className="text-green-800 font-medium">
              🎉 Offre de lancement : 14 jours gratuits sur tous les plans !
            </span>
          </div>
        </div>

        <div className="text-center py-20">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Multipliez vos revenus avec{" "}
            <span className="text-blue-600">l'agenda qui vend</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-4">
            <strong>+73% de réservations</strong> en moyenne avec notre système de prise de RDV automatisé.
            Rejoignez les <strong>2,847 professionnels</strong> qui nous font déjà confiance.
          </p>
          
          {/* Social Proof */}
          <div className="flex justify-center items-center space-x-4 mb-8 text-sm text-gray-500">
            <div className="flex items-center">
              <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
              <span className="ml-2">4.9/5 (247 avis)</span>
            </div>
            <span>•</span>
            <span>🔒 Sécurisé & Conforme RGPD</span>
          </div>

          {/* CTAs */}
          {/* Barre de recherche intégrée */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un service : massage, coiffure, restaurant..."
                className="w-full px-6 py-4 pr-32 text-lg border-2 border-gray-200 rounded-full focus:border-blue-500 focus:outline-none shadow-lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value;
                    if (query) {
                      window.location.href = `/search?q=${encodeURIComponent(query)}`;
                    }
                  }
                }}
              />
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-medium"
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="Rechercher"]') as HTMLInputElement;
                  if (input?.value) {
                    window.location.href = `/search?q=${encodeURIComponent(input.value)}`;
                  }
                }}
              >
                🔍 Rechercher
              </button>
            </div>
            
            {/* Suggestions rapides */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <button 
                onClick={() => window.location.href = '/search?category=beauté'}
                className="px-4 py-2 bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition-colors text-sm"
              >
                💅 Beauté
              </button>
              <button 
                onClick={() => window.location.href = '/search?category=coiffure'}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors text-sm"
              >
                ✂️ Coiffure
              </button>
              <button 
                onClick={() => window.location.href = '/search?category=massage'}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors text-sm"
              >
                💆 Massage
              </button>
              <button 
                onClick={() => window.location.href = '/search?availableToday=true'}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors text-sm"
              >
                ⏰ Aujourd'hui
              </button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 mb-4">
                Ou créez votre propre agenda de réservation :
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                🚀 Démarrer gratuitement maintenant
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-2">
                💰 Voir les tarifs
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <p className="text-sm text-gray-500">
            ✅ Aucune carte requise • ✅ Configuration en 2 minutes • ✅ Support français
          </p>
        </div>

        {/* Problem Statement */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-20">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🚨 Arrêtez de perdre de l'argent avec vos RDV !
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl text-red-500 mb-4">😤</div>
              <h4 className="font-semibold text-gray-900 mb-2">Clients qui oublient</h4>
              <p className="text-gray-600 text-sm">
                30% d'absence sans prévenir = des créneaux perdus à vie
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl text-red-500 mb-4">📞</div>
              <h4 className="font-semibold text-gray-900 mb-2">Téléphone H24</h4>
              <p className="text-gray-600 text-sm">
                Répondre aux appels même le soir et weekend pour prendre RDV
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl text-red-500 mb-4">💸</div>
              <h4 className="font-semibold text-gray-900 mb-2">Désistements de dernière minute</h4>
              <p className="text-gray-600 text-sm">
                "Désolé je ne peux plus venir" 2h avant le RDV = créneaux perdus
              </p>
            </div>
          </div>
        </div>

        {/* Features = Solutions */}
        <div className="mb-20">
          <h3 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            ✅ La solution tout-en-un qui change tout
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="text-6xl mb-4">📅</div>
                <CardTitle className="text-xl">Réservation 24/7 automatique</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  <strong>Vos clients réservent seuls</strong>, même à 23h le dimanche. 
                  Plus jamais de téléphone qui sonne pendant vos soins !
                </CardDescription>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-semibold">💰 +40% de RDV</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 scale-105">
              <CardHeader className="text-center pb-4">
                <div className="text-6xl mb-4">💳</div>
                <CardTitle className="text-xl">Paiement en ligne (optionnel)</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  <strong>Proposez le paiement direct</strong> pour ceux qui veulent sécuriser leur RDV. 
                  Réduisez les désistements et les oublis de paiement !
                </CardDescription>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-semibold">💰 -60% de désistements</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="text-6xl mb-4">📱</div>
                <CardTitle className="text-xl">Rappels automatiques</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  <strong>SMS + Email automatiques</strong> 24h avant le RDV.
                  Divisez par 3 vos désistements et maximisez votre planning !
                </CardDescription>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-semibold">📈 -70% de désistements</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <h3 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            💬 Ce qu'en disent nos utilisateurs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
              <CardHeader>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Marie L.</p>
                    <p className="text-sm text-gray-600">Esthéticienne</p>
                  </div>
                </div>
                <div className="text-yellow-400 text-xl">⭐⭐⭐⭐⭐</div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 italic">
                  "J'ai doublé mon CA en 3 mois ! Plus de téléphone qui sonne, mes clientes réservent H24. 
                  Et celles qui payent en ligne ne se désistent jamais. Révolutionnaire !"
                </p>
                <p className="text-sm text-gray-500 mt-2">Il y a 2 jours</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0">
              <CardHeader>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    P
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Pierre M.</p>
                    <p className="text-sm text-gray-600">Kinésithérapeute</p>
                  </div>
                </div>
                <div className="text-yellow-400 text-xl">⭐⭐⭐⭐⭐</div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 italic">
                  "Configuration en 5 minutes, résultat immédiat. Les rappels SMS ont divisé mes absences par 3. 
                  Je recommande à 200% !"
                </p>
                <p className="text-sm text-gray-500 mt-2">Il y a 1 semaine</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0">
              <CardHeader>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Amélie D.</p>
                    <p className="text-sm text-gray-600">Coach sportif</p>
                  </div>
                </div>
                <div className="text-yellow-400 text-xl">⭐⭐⭐⭐⭐</div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 italic">
                  "Avant j'avais 20% de désistements. Maintenant plus que 5% grâce aux rappels automatiques. 
                  Ça a changé ma vie de freelance !"
                </p>
                <p className="text-sm text-gray-500 mt-2">Il y a 3 jours</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Urgency + ROI */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-8 md:p-12 text-white text-center mb-20">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            ⚡ Combien perdez-vous chaque mois ?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white bg-opacity-20 rounded-xl p-6">
              <div className="text-4xl mb-2">😰</div>
              <div className="text-xl font-bold mb-2">Sans système</div>
              <div className="text-sm opacity-90">
                • 30% de désistements<br/>
                • Créneaux perdus à vie<br/>
                • Téléphone qui sonne H24<br/>
                • Stress permanent
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-6">
              <div className="text-4xl mb-2">😎</div>
              <div className="text-xl font-bold mb-2">Avec BookingSaaS</div>
              <div className="text-sm opacity-90">
                • 5% de désistements seulement<br/>
                • Rappels automatiques<br/>
                • Réservation 24/7<br/>
                • Sérénité totale
              </div>
            </div>
          </div>
          <p className="text-xl mb-6">
            <strong>En moyenne :</strong> Nos utilisateurs <span className="text-yellow-300 font-bold">récupèrent 800€/mois</span> en créneaux sauvés !
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-red-500 hover:bg-gray-100 text-xl px-8 py-4 font-bold">
              🚀 Je veux récupérer cet argent !
            </Button>
          </Link>
        </div>

        {/* Final CTA */}
        <div className="text-center py-16">
          <h3 className="text-4xl font-bold text-gray-900 mb-6">
            Prêt à multiplier vos revenus ?
          </h3>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Rejoignez les <strong>2,847 professionnels</strong> qui ont déjà transformé leur activité. 
            Configuration en 2 minutes, résultats immédiats.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link href="/auth/signup">
              <Button size="lg" className="text-xl px-10 py-5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl">
                🚀 Démarrer mon essai gratuit
              </Button>
            </Link>
          </div>

          <div className="flex justify-center items-center space-x-6 text-sm text-gray-500 mb-4">
            <span>✅ 14 jours gratuits</span>
            <span>✅ Aucune carte requise</span>
            <span>✅ Résiliation en 1 clic</span>
          </div>

          <p className="text-xs text-gray-400">
            Plus de 2,800 professionnels nous font confiance • Note moyenne : 4.9/5 ⭐
          </p>
        </div>
      </main>
    </div>
  );
}
