// src/app/dashboard/bookings/page.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { BookingWithRelations } from "@/types";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Filter,
} from "lucide-react";

type BookingFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<
    BookingWithRelations[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<BookingFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithRelations | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [editForm, setEditForm] = useState({
    startTime: "",
    endTime: "",
    notes: "",
    status: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchBookings();
    }
  }, [session]);

  useEffect(() => {
    applyFilters();
  }, [bookings, filter, searchTerm]);

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings");
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des réservations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Filtre par statut
    if (filter !== "all") {
      filtered = filtered.filter(
        (booking) => booking.status.toLowerCase() === filter.toUpperCase()
      );
    }

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.clientEmail
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.service.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tri par date (plus récents en premier)
    filtered.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchBookings(); // Recharger les données
        alert(
          `Réservation ${
            newStatus === "CONFIRMED"
              ? "confirmée"
              : newStatus === "CANCELLED"
              ? "annulée"
              : "mise à jour"
          } !`
        );
      } else {
        alert("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchBookings();
        alert("Réservation supprimée !");
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (booking: BookingWithRelations) => {
    setSelectedBooking(booking);
    setEditForm({
      startTime: new Date(booking.startTime).toISOString().slice(0, 16),
      endTime: new Date(booking.endTime).toISOString().slice(0, 16),
      notes: booking.notes || "",
      status: booking.status,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: new Date(editForm.startTime).toISOString(),
          endTime: new Date(editForm.endTime).toISOString(),
          notes: editForm.notes,
          status: editForm.status,
        }),
      });

      if (response.ok) {
        fetchBookings();
        setShowEditModal(false);
        alert("Réservation modifiée avec succès !");
      } else {
        alert("Erreur lors de la modification");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la modification");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Confirmé";
      case "PENDING":
        return "En attente";
      case "CANCELLED":
        return "Annulé";
      case "COMPLETED":
        return "Terminé";
      default:
        return status;
    }
  };

  const getFilterCount = (filterType: BookingFilter) => {
    if (filterType === "all") return bookings.length;
    return bookings.filter(
      (b) => b.status.toLowerCase() === filterType.toUpperCase()
    ).length;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement des réservations...</div>
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
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion des réservations
              </h1>
              <p className="text-gray-600">Gérez vos rendez-vous clients</p>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/calendar")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Voir le calendrier
              </Button>
              <Button onClick={() => router.push("/dashboard/bookings/new")}>
                Nouveau RDV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres et recherche */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom, email ou service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={filter}
                onValueChange={(value: BookingFilter) => setFilter(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Tous ({getFilterCount("all")})
                  </SelectItem>
                  <SelectItem value="pending">
                    En attente ({getFilterCount("pending")})
                  </SelectItem>
                  <SelectItem value="confirmed">
                    Confirmés ({getFilterCount("confirmed")})
                  </SelectItem>
                  <SelectItem value="completed">
                    Terminés ({getFilterCount("completed")})
                  </SelectItem>
                  <SelectItem value="cancelled">
                    Annulés ({getFilterCount("cancelled")})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {getFilterCount("pending")}
              </div>
              <div className="text-sm text-gray-600">En attente</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {getFilterCount("confirmed")}
              </div>
              <div className="text-sm text-gray-600">Confirmés</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getFilterCount("completed")}
              </div>
              <div className="text-sm text-gray-600">Terminés</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {formatPrice(
                  bookings
                    .filter((b) => b.status === "COMPLETED")
                    .reduce((sum, b) => sum + b.service.price, 0)
                )}
              </div>
              <div className="text-sm text-gray-600">CA réalisé</div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des réservations */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune réservation trouvée
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filter !== "all"
                    ? "Essayez de modifier vos filtres de recherche"
                    : "Vos clients peuvent réserver via votre page de réservation"}
                </p>
                <Button onClick={() => router.push("/dashboard/bookings/new")}>
                  Créer un rendez-vous
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card
                key={booking.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {booking.clientName}
                            </h3>
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusText(booking.status)}
                            </Badge>
                          </div>
                          <div className="text-gray-600">
                            {booking.service.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {formatPrice(booking.service.price)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.service.duration} min
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(new Date(booking.startTime))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>
                            {formatTime(new Date(booking.startTime))} -{" "}
                            {formatTime(new Date(booking.endTime))}
                          </span>
                        </div>
                        {booking.clientEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{booking.clientEmail}</span>
                          </div>
                        )}
                        {booking.clientPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{booking.clientPhone}</span>
                          </div>
                        )}
                      </div>

                      {booking.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            Notes :
                          </div>
                          <div className="text-sm text-gray-600">
                            {booking.notes}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 min-w-[200px]">
                      {booking.status === "PENDING" && (
                        <>
                          <Button
                            onClick={() =>
                              updateBookingStatus(booking.id, "CONFIRMED")
                            }
                            disabled={isUpdating}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirmer
                          </Button>
                          <Button
                            onClick={() =>
                              updateBookingStatus(booking.id, "CANCELLED")
                            }
                            disabled={isUpdating}
                            variant="destructive"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Refuser
                          </Button>
                        </>
                      )}

                      {booking.status === "CONFIRMED" && (
                        <>
                          <Button
                            onClick={() =>
                              updateBookingStatus(booking.id, "COMPLETED")
                            }
                            disabled={isUpdating}
                            className="bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            Marquer terminé
                          </Button>
                          <Button
                            onClick={() =>
                              updateBookingStatus(booking.id, "CANCELLED")
                            }
                            disabled={isUpdating}
                            variant="destructive"
                            size="sm"
                          >
                            Annuler
                          </Button>
                        </>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => openEditModal(booking)}
                          disabled={isUpdating}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        <Button
                          onClick={() => deleteBooking(booking.id)}
                          disabled={isUpdating}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Modal d'édition */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Modifier le rendez-vous</CardTitle>
              <CardDescription>
                {selectedBooking.clientName} - {selectedBooking.service.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="startTime">Date et heure de début</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={editForm.startTime}
                    onChange={(e) =>
                      setEditForm({ ...editForm, startTime: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endTime">Date et heure de fin</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={editForm.endTime}
                    onChange={(e) =>
                      setEditForm({ ...editForm, endTime: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">En attente</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmé</SelectItem>
                      <SelectItem value="COMPLETED">Terminé</SelectItem>
                      <SelectItem value="CANCELLED">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    placeholder="Notes sur ce rendez-vous..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    {isUpdating ? "Mise à jour..." : "Sauvegarder"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
