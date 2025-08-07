// src/app/dashboard/clients/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  MessageSquare,
  UserPlus,
  Search,
  Filter,
  Star,
} from "lucide-react";

interface ClientWithStats {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingAt?: Date;
  createdAt: Date;
  notes?: string;
  bookings: Array<{
    id: string;
    startTime: Date;
    status: string;
    service: {
      name: string;
      price: number;
    };
  }>;
  isVip: boolean;
  riskLevel: "low" | "medium" | "high";
  averageTimeBetweenVisits: number;
}

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "vip" | "recent" | "inactive">(
    "all"
  );
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(
    null
  );
  const [showClientModal, setShowClientModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [clientNotes, setClientNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchClients();
    }
  }, [session]);

  useEffect(() => {
    applyFilters();
  }, [clients, searchTerm, filter]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.phone && client.phone.includes(searchTerm))
      );
    }

    // Filtre par type
    switch (filter) {
      case "vip":
        filtered = filtered.filter((client) => client.isVip);
        break;
      case "recent":
        filtered = filtered.filter((client) => {
          if (!client.lastBookingAt) return false;
          const daysSince =
            (Date.now() - new Date(client.lastBookingAt).getTime()) /
            (1000 * 60 * 60 * 24);
          return daysSince <= 30;
        });
        break;
      case "inactive":
        filtered = filtered.filter((client) => {
          if (!client.lastBookingAt) return true;
          const daysSince =
            (Date.now() - new Date(client.lastBookingAt).getTime()) /
            (1000 * 60 * 60 * 24);
          return daysSince > 90;
        });
        break;
    }

    // Tri par valeur client décroissante
    filtered.sort((a, b) => b.totalSpent - a.totalSpent);

    setFilteredClients(filtered);
  };

  const openClientDetails = (client: ClientWithStats) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const openNotesModal = (client: ClientWithStats) => {
    setSelectedClient(client);
    setClientNotes(client.notes || "");
    setShowNotesModal(true);
  };

  const saveClientNotes = async () => {
    if (!selectedClient) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/clients/${selectedClient.id}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: clientNotes }),
      });

      if (response.ok) {
        fetchClients();
        setShowNotesModal(false);
        alert("Notes sauvegardées !");
      } else {
        alert("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const getClientInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getClientBadge = (client: ClientWithStats) => {
    if (client.isVip) {
      return (
        <Badge className="bg-yellow-500 text-white">
          <Star className="h-3 w-3 mr-1" />
          VIP
        </Badge>
      );
    }

    if (client.totalBookings >= 10) {
      return <Badge className="bg-blue-500 text-white">Fidèle</Badge>;
    }

    if (client.totalBookings === 1) {
      return <Badge variant="outline">Nouveau</Badge>;
    }

    return <Badge variant="secondary">Client</Badge>;
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return (
          <Badge className="bg-red-500 text-white">Risque de départ</Badge>
        );
      case "medium":
        return <Badge className="bg-orange-500 text-white">À surveiller</Badge>;
      default:
        return null;
    }
  };

  const getDaysSinceLastVisit = (lastBookingAt?: Date) => {
    if (!lastBookingAt) return null;
    const days = Math.floor(
      (Date.now() - new Date(lastBookingAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const getFilterCount = (filterType: string) => {
    switch (filterType) {
      case "all":
        return clients.length;
      case "vip":
        return clients.filter((c) => c.isVip).length;
      case "recent":
        return clients.filter((c) => {
          if (!c.lastBookingAt) return false;
          const days = getDaysSinceLastVisit(c.lastBookingAt);
          return days !== null && days <= 30;
        }).length;
      case "inactive":
        return clients.filter((c) => {
          const days = getDaysSinceLastVisit(c.lastBookingAt);
          return days === null || days > 90;
        }).length;
      default:
        return 0;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement des clients...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="mb-2"
              >
                ← Retour au dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Mes clients</h1>
              <p className="text-gray-600">
                Gérez votre base client et leur historique
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/bookings/new")}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Nouveau RDV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {clients.length}
              </div>
              <div className="text-sm text-gray-600">Clients total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {getFilterCount("vip")}
              </div>
              <div className="text-sm text-gray-600">Clients VIP</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(clients.reduce((sum, c) => sum + c.totalSpent, 0))}
              </div>
              <div className="text-sm text-gray-600">CA total client</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {getFilterCount("inactive")}
              </div>
              <div className="text-sm text-gray-600">Inactifs (90j+)</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: "all", label: `Tous (${getFilterCount("all")})` },
                { key: "vip", label: `VIP (${getFilterCount("vip")})` },
                {
                  key: "recent",
                  label: `Récents (${getFilterCount("recent")})`,
                },
                {
                  key: "inactive",
                  label: `Inactifs (${getFilterCount("inactive")})`,
                },
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  variant={filter === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(key as any)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Liste des clients */}
        <div className="space-y-4">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun client trouvé
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filter !== "all"
                    ? "Essayez de modifier vos critères de recherche"
                    : "Vos premiers clients apparaîtront ici après leurs réservations"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredClients.map((client) => (
              <Card
                key={client.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openClientDetails(client)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                          {getClientInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {client.name}
                          </h3>
                          {getClientBadge(client)}
                          {getRiskBadge(client.riskLevel)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{client.email}</span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {client.lastBookingAt
                                ? `Dernier RDV: ${formatDate(
                                    new Date(client.lastBookingAt)
                                  )}`
                                : "Aucun RDV"}
                            </span>
                          </div>
                        </div>

                        {client.lastBookingAt &&
                          getDaysSinceLastVisit(client.lastBookingAt) !==
                            null && (
                            <div className="mt-2 text-sm">
                              {getDaysSinceLastVisit(client.lastBookingAt)! >
                              90 ? (
                                <span className="text-red-600 font-medium">
                                  ⚠️ Inactif depuis{" "}
                                  {getDaysSinceLastVisit(client.lastBookingAt)}{" "}
                                  jours
                                </span>
                              ) : getDaysSinceLastVisit(client.lastBookingAt)! >
                                30 ? (
                                <span className="text-orange-600">
                                  À relancer -{" "}
                                  {getDaysSinceLastVisit(client.lastBookingAt)}{" "}
                                  jours
                                </span>
                              ) : (
                                <span className="text-green-600">
                                  Client actif (
                                  {getDaysSinceLastVisit(client.lastBookingAt)}{" "}
                                  jours)
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPrice(client.totalSpent)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {client.totalBookings} RDV
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openNotesModal(client);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/dashboard/bookings/new?clientEmail=${client.email}`
                            );
                          }}
                        >
                          Nouveau RDV
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Modal détails client */}
      {showClientModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {getClientInitials(selectedClient.name)}
                    </AvatarFallback>
                  </Avatar>
                  {selectedClient.name}
                  {getClientBadge(selectedClient)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClientModal(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Statistiques client */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedClient.totalBookings}
                  </div>
                  <div className="text-sm text-gray-600">Rendez-vous</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPrice(selectedClient.totalSpent)}
                  </div>
                  <div className="text-sm text-gray-600">Dépensé</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPrice(
                      selectedClient.totalBookings > 0
                        ? selectedClient.totalSpent /
                            selectedClient.totalBookings
                        : 0
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Panier moyen</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(selectedClient.averageTimeBetweenVisits)}j
                  </div>
                  <div className="text-sm text-gray-600">Entre visites</div>
                </div>
              </div>

              {/* Informations de contact */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{selectedClient.email}</span>
                  </div>
                  {selectedClient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedClient.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>
                      Client depuis{" "}
                      {formatDate(new Date(selectedClient.createdAt))}
                    </span>
                  </div>
                  {selectedClient.lastBookingAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        Dernier RDV:{" "}
                        {formatDate(new Date(selectedClient.lastBookingAt))}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes privées */}
              {selectedClient.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Notes privées</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedClient.notes}</p>
                  </div>
                </div>
              )}

              {/* Historique des RDV */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Historique des rendez-vous
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedClient.bookings.length === 0 ? (
                    <p className="text-gray-500">
                      Aucun rendez-vous enregistré
                    </p>
                  ) : (
                    selectedClient.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {booking.service.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(new Date(booking.startTime))} à{" "}
                            {formatTime(new Date(booking.startTime))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatPrice(booking.service.price)}
                          </div>
                          <Badge
                            className="text-xs"
                            variant={
                              booking.status === "COMPLETED"
                                ? "default"
                                : booking.status === "CONFIRMED"
                                ? "secondary"
                                : booking.status === "CANCELLED"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {booking.status === "COMPLETED"
                              ? "Terminé"
                              : booking.status === "CONFIRMED"
                              ? "Confirmé"
                              : booking.status === "CANCELLED"
                              ? "Annulé"
                              : "En attente"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t">
                <Button
                  onClick={() => openNotesModal(selectedClient)}
                  variant="outline"
                  className="flex-1"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Modifier les notes
                </Button>
                <Button
                  onClick={() => {
                    setShowClientModal(false);
                    router.push(
                      `/dashboard/bookings/new?clientEmail=${selectedClient.email}`
                    );
                  }}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Nouveau rendez-vous
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal notes */}
      {showNotesModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Notes privées - {selectedClient.name}</CardTitle>
              <CardDescription>
                Ces notes ne sont visibles que par vous
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="Allergies, préférences, remarques particulières..."
                    rows={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: Allergie aux parfums, préfère les RDV le matin, cliente
                    très ponctuelle
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNotesModal(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={saveClientNotes}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
