// src/app/landing/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEarlyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simuler l'inscription
    setTimeout(() => {
      if (email) {
        router.push(`/auth/signup?email=${email}&plan=pro`);
      }
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                BookingSaaS
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-white">
                Tarifs
              </a>
              <a
                href="#testimonials"
                className="text-gray-300 hover:text-white"
              >
                Témoignages
              </a>
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => router.push("/auth/signin")}
              >
                Connexion
              </Button>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                onClick={() => router.push("/auth/signup")}
              >
                Essai gratuit
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              {/* Badge */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium mb-6 border border-emerald-500/30">
                🚀 Nouveau : Templates par secteur d'activité
              </div>

              {/* Titre principal */}
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Fini les{" "}
                <span className="text-red-400 line-through">
                  agendas papier
                </span>
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Bonjour la simplicité
                </span>
              </h1>

              {/* Sous-titre */}
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                La première plateforme de réservation pensée pour les
                professionnels français.
                <strong className="text-white">
                  {" "}
                  Simple, abordable et efficace.
                </strong>
                Tous les secteurs, toutes les tailles d'entreprise.
              </p>

              {/* CTA Principal */}
              <form
                onSubmit={handleEarlyAccess}
                className="flex flex-col sm:flex-row gap-4 mb-8"
              >
                <Input
                  type="email"
                  placeholder="votre@email-pro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12 text-lg bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  required
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold"
                >
                  {isSubmitting ? "Chargement..." : "Essai gratuit 14j →"}
                </Button>
              </form>

              {/* Social proof */}
              <div className="flex items-center text-sm text-gray-400">
                <div className="flex -space-x-2 mr-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 border-2 border-gray-800"
                    ></div>
                  ))}
                </div>
                <span>
                  Déjà{" "}
                  <strong className="text-white">247+ professionnels</strong>{" "}
                  nous font confiance
                </span>
              </div>
            </div>

            {/* Demo visuelle */}
            <div className="relative">
              <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-white/30"></div>
                    <div className="w-3 h-3 rounded-full bg-white/30"></div>
                    <div className="w-3 h-3 rounded-full bg-white/30"></div>
                    <span className="text-white text-sm ml-4">
                      bookingsaas.com/sophie-therapie
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      Cabinet de Thérapie Sophie
                    </h3>
                    <p className="text-gray-400">
                      Psychologue - Thérapie de couple
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">
                          Consultation individuelle
                        </span>
                        <span className="text-emerald-400 font-bold">65€</span>
                      </div>
                      <p className="text-sm text-gray-400">60 minutes</p>
                    </div>
                    <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">
                          Thérapie de couple
                        </span>
                        <span className="text-cyan-400 font-bold">85€</span>
                      </div>
                      <p className="text-sm text-gray-400">90 minutes</p>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                    Réserver maintenant
                  </Button>
                </div>
              </div>

              {/* Badges flottants */}
              <div className="absolute -top-4 -right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                ✨ En 5 minutes
              </div>
              <div className="absolute -bottom-4 -left-4 bg-cyan-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                📱 Mobile-first
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section problème/solution */}
      <section className="py-20 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Pourquoi choisir BookingSaaS ?
            </h2>
            <p className="text-xl text-gray-300">
              Une solution moderne pensée pour les professionnels d'aujourd'hui
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Avant */}
            <Card className="bg-red-500/10 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center">
                  😫 <span className="ml-2">Avant</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-red-300">
                  <li>• Agendas papier perdus</li>
                  <li>• SMS sans fin avec clients</li>
                  <li>• Oublis de rendez-vous</li>
                  <li>• Pas de vue d'ensemble</li>
                  <li>• Stress permanent</li>
                </ul>
              </CardContent>
            </Card>

            {/* Problèmes actuels */}
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center">
                  😤 <span className="ml-2">Solutions actuelles</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-yellow-300">
                  <li>• Trop chers (80€/mois+)</li>
                  <li>• Complexes à utiliser</li>
                  <li>• Pas en français</li>
                  <li>• Secteurs limités</li>
                  <li>• Support inexistant</li>
                </ul>
              </CardContent>
            </Card>

            {/* Solution */}
            <Card className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 transform scale-105">
              <CardHeader>
                <CardTitle className="text-emerald-400 flex items-center">
                  🚀 <span className="ml-2">Avec BookingSaaS</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-emerald-300">
                  <li>• À partir de 19€/mois</li>
                  <li>• Interface intuitive</li>
                  <li>• 100% en français</li>
                  <li>• Tous secteurs couverts</li>
                  <li>• Support français 🇫🇷</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600">
              Fonctionnalités pensées pour les professionnels français
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🎨",
                title: "Templates par secteur",
                description:
                  "Santé, beauté, sport, conseil... Votre page prête en 5 minutes",
              },
              {
                icon: "📱",
                title: "100% mobile",
                description:
                  "Vos clients réservent depuis leur téléphone en 30 secondes",
              },
              {
                icon: "💰",
                title: "Prix français",
                description:
                  "19€/mois au lieu de 80€+ chez la concurrence américaine",
              },
              {
                icon: "🔗",
                title: "Votre propre lien",
                description:
                  "monnom.bookingsaas.com - Professionnel et mémorisable",
              },
              {
                icon: "📊",
                title: "Analytics intelligentes",
                description:
                  "Comprenez vos clients, optimisez vos créneaux, augmentez votre CA",
              },
              {
                icon: "🇫🇷",
                title: "Support français",
                description:
                  "Équipe française, réponse en 2h, formation incluse",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ils ont dit adieu aux agendas papier
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sophie Martin",
                business: "Psychologue, Paris",
                avatar: "👩‍⚕️",
                quote:
                  "Mes patients peuvent enfin réserver 24h/24. Je gagne 2h par jour !",
                metric: "+150% de réservations",
              },
              {
                name: "Marc Dubois",
                business: "Coach sportif, Lyon",
                avatar: "💪",
                quote:
                  "Fini les SMS à n'en plus finir. Mes clients adorent la simplicité.",
                metric: "+300% de nouveaux clients",
              },
              {
                name: "Julie Roux",
                business: "Coiffeuse, Marseille",
                avatar: "💇‍♀️",
                quote:
                  "J'ai testé Planity, c'était l'enfer. BookingSaaS c'est le paradis !",
                metric: "+80% de CA",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="bg-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">{testimonial.avatar}</div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">
                        {testimonial.business}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
                    {testimonial.metric}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à rejoindre la révolution ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            247+ professionnels ont déjà transformé leur activité.
            <br />À votre tour en moins de 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Input
              type="email"
              placeholder="votre@email-pro.com"
              className="bg-white h-12"
            />
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 h-12 px-8"
              onClick={() => router.push("/auth/signup")}
            >
              Commencer gratuitement
            </Button>
          </div>

          <p className="text-blue-200 text-sm mt-4">
            ✓ Essai 14 jours gratuit ✓ Aucune carte requise ✓ Support français
            inclus
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">BookingSaaS</h3>
              <p className="text-gray-400">
                La plateforme de réservation pensée pour les professionnels
                français.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Fonctionnalités
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Tarifs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Templates
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Centre d'aide
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Formation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Carrières
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BookingSaaS. Fait avec ❤️ en France.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
