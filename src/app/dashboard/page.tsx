// src/app/dashboard/page.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { BookingWithRelations } from "@/types";
import { useSubscription } from "@/hooks/use-subscription";
import TrialBanner from "@/components/trial-banner";
import WelcomeModal from "@/components/welcome-modal";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canCreateService, needsUpgrade, plan } = useSubscription();
  const success = searchParams?.get("success") === "true";
  const selectedPlan = searchParams?.get("plan");
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [stats, setStats] = useState({
    todayBookings: 0,
    weekRevenue: 0,
    totalClients: 0,
    upcomingBookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement de votre tableau de bord...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const todayBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.startTime);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de bienvenue */}
      <WelcomeModal />

      {/* Message de succès abonnement */}
      {success && selectedPlan && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center">
              <span className="text-green-400 mr-3">✅</span>
              <p className="text-green-800 font-medium">
                Félicitations ! Votre abonnement au plan{" "}
                <span className="capitalize font-bold">{selectedPlan}</span> a été
                créé avec succès. Votre essai gratuit de 14 jours a commencé !
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bannière d'essai */}
      <TrialBanner />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tableau de bord
              </h1>
              <p className="text-gray-600">
                Bonjour {session.user.name} 👋 - {session.user.businessName}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push("/dashboard/services")}
                variant="outline"
                disabled={needsUpgrade}
              >
                Mes services
              </Button>
              <Button
                onClick={() => router.push("/dashboard/analytics")}
                variant="outline"
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                📊 Analytics
              </Button>
              <Button
                onClick={() => router.push("/dashboard/integrations")}
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                📅 Intégrations
              </Button>
              <Button
                onClick={() => router.push("/dashboard/widget")}
                variant="outline"
                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              >
                🌐 Widget
              </Button>
              <Button
                onClick={() => router.push("/dashboard/bookings/new")}
                disabled={needsUpgrade}
              >
                Nouveau RDV
              </Button>
              {needsUpgrade && (
                <Button
                  onClick={() => router.push("/pricing")}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Choisir un plan
                </Button>
              )}

              {/* Menu utilisateur */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Se déconnecter
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                RDV aujourd'hui
              </CardTitle>
              <div className="text-2xl">📅</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayBookings}</div>
              <p className="text-xs text-muted-foreground">
                {todayBookings.length > 0
                  ? "Prochain à " +
                    formatTime(new Date(todayBookings[0]?.startTime))
                  : "Aucun RDV"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                CA cette semaine
              </CardTitle>
              <div className="text-2xl">💰</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(stats.weekRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% vs semaine dernière
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total clients
              </CardTitle>
              <div className="text-2xl">👥</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">Clients uniques</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RDV à venir</CardTitle>
              <div className="text-2xl">⏰</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
              <p className="text-xs text-muted-foreground">7 prochains jours</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rendez-vous du jour */}
          <Card>
            <CardHeader>
              <CardTitle>Rendez-vous d'aujourd'hui</CardTitle>
              <CardDescription>
                {todayBookings.length} rendez-vous prévus
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🌅</div>
                  <p>Aucun rendez-vous aujourd'hui</p>
                  <p className="text-sm">Profitez de cette journée libre !</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayBookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{booking.clientName}</p>
                        <p className="text-sm text-gray-600">
                          {booking.service.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatTime(new Date(booking.startTime))} -{" "}
                          {formatTime(new Date(booking.endTime))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatPrice(booking.service.price)}
                        </p>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === "CONFIRMED"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {booking.status === "CONFIRMED"
                            ? "Confirmé"
                            : booking.status === "PENDING"
                            ? "En attente"
                            : booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Gérez votre activité en quelques clics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push("/dashboard/bookings/new")}
              >
                📅 Ajouter un rendez-vous
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push("/dashboard/services")}
              >
                ⚙️ Gérer mes services
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push("/dashboard/availability")}
              >
                🕐 Modifier mes disponibilités
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push("/dashboard/clients")}
              >
                👥 Voir mes clients
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() =>
                  window.open("/booking/" + session.user.id, "_blank")
                }
              >
                🔗 Voir ma page de réservation
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push("/dashboard/analytics")}
              >
                📊 Voir mes analytics détaillées
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push("/dashboard/widget")}
              >
                🌐 Créer un widget embeddable
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
