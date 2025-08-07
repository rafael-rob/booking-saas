// src/app/dashboard/calendar/page.tsx
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
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { BookingWithRelations } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
} from "lucide-react";

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithRelations | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchBookings();
    }
  }, [session, currentDate, viewMode]);

  const fetchBookings = async () => {
    try {
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();

      const response = await fetch(
        `/api/calendar?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du calendrier:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getViewStartDate = () => {
    const date = new Date(currentDate);
    if (viewMode === "day") {
      date.setHours(0, 0, 0, 0);
      return date;
    } else if (viewMode === "week") {
      const dayOfWeek = date.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      date.setDate(date.getDate() + mondayOffset);
      date.setHours(0, 0, 0, 0);
      return date;
    } else {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      return date;
    }
  };

  const getViewEndDate = () => {
    const date = getViewStartDate();
    if (viewMode === "day") {
      date.setHours(23, 59, 59, 999);
      return date;
    } else if (viewMode === "week") {
      date.setDate(date.getDate() + 6);
      date.setHours(23, 59, 59, 999);
      return date;
    } else {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      date.setHours(23, 59, 59, 999);
      return date;
    }
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-500";
      case "PENDING":
        return "bg-yellow-500";
      case "CANCELLED":
        return "bg-red-500";
      case "COMPLETED":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
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

  const getViewTitle = () => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } else if (viewMode === "week") {
      const startDate = getViewStartDate();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      return `${startDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      })} - ${endDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    } else {
      return currentDate.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
    }
  };

  const renderWeekView = () => {
    const startDate = getViewStartDate();
    const days = [];
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h à 19h

    // Générer les 7 jours de la semaine
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }

    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* En-tête des jours */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-4 bg-gray-50 font-medium">Heure</div>
          {days.map((day) => (
            <div key={day.toISOString()} className="p-4 bg-gray-50 text-center">
              <div className="font-medium">
                {day.toLocaleDateString("fr-FR", { weekday: "short" })}
              </div>
              <div
                className={`text-2xl ${
                  day.toDateString() === new Date().toDateString()
                    ? "text-blue-600 font-bold"
                    : "text-gray-700"
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Grille horaire */}
        <div className="max-h-96 overflow-y-auto">
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-8 border-b border-gray-100"
            >
              <div className="p-2 bg-gray-50 text-sm text-gray-600 text-center">
                {hour.toString().padStart(2, "0")}:00
              </div>
              {days.map((day) => {
                const dayBookings = bookings.filter((booking) => {
                  const bookingDate = new Date(booking.startTime);
                  return (
                    bookingDate.toDateString() === day.toDateString() &&
                    bookingDate.getHours() === hour
                  );
                });

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="p-1 min-h-[60px] relative"
                  >
                    {dayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`text-xs p-2 rounded cursor-pointer ${getStatusColor(
                          booking.status
                        )} text-white mb-1`}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <div className="font-medium truncate">
                          {booking.clientName}
                        </div>
                        <div className="opacity-90">
                          {formatTime(new Date(booking.startTime))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate.toDateString() === currentDate.toDateString();
    });

    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h à 19h

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Planning horaire */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Planning du jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hours.map((hour) => {
                  const hourBookings = dayBookings.filter((booking) => {
                    const bookingHour = new Date(booking.startTime).getHours();
                    return bookingHour === hour;
                  });

                  return (
                    <div
                      key={hour}
                      className="flex items-center space-x-4 py-2 border-b border-gray-100"
                    >
                      <div className="w-16 text-sm text-gray-600 font-mono">
                        {hour.toString().padStart(2, "0")}:00
                      </div>
                      <div className="flex-1">
                        {hourBookings.length === 0 ? (
                          <div className="text-gray-400 text-sm">Libre</div>
                        ) : (
                          <div className="space-y-1">
                            {hourBookings.map((booking) => (
                              <div
                                key={booking.id}
                                className="bg-blue-50 border border-blue-200 rounded-lg p-3 cursor-pointer hover:bg-blue-100"
                                onClick={() => setSelectedBooking(booking)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">
                                      {booking.clientName}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {booking.service.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {formatTime(new Date(booking.startTime))}{" "}
                                      - {formatTime(new Date(booking.endTime))}
                                    </div>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`${getStatusColor(
                                      booking.status
                                    )} text-white border-none`}
                                  >
                                    {getStatusText(booking.status)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques du jour */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Résumé du jour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dayBookings.length}
                  </div>
                  <div className="text-sm text-gray-600">Rendez-vous</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Confirmés:</span>
                    <span className="font-medium text-green-600">
                      {
                        dayBookings.filter((b) => b.status === "CONFIRMED")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>En attente:</span>
                    <span className="font-medium text-yellow-600">
                      {dayBookings.filter((b) => b.status === "PENDING").length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Revenus du jour:</span>
                    <span className="font-medium text-blue-600">
                      {formatPrice(
                        dayBookings
                          .filter((b) => b.status !== "CANCELLED")
                          .reduce((sum, b) => sum + b.service.price, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    const startOfCalendar = new Date(startOfMonth);
    startOfCalendar.setDate(
      startOfCalendar.getDate() - startOfMonth.getDay() + 1
    );

    const days = [];
    const current = new Date(startOfCalendar);

    // Générer 42 jours (6 semaines)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* En-tête des jours de la semaine */}
        <div className="grid grid-cols-7 bg-gray-50">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div
              key={day}
              className="p-4 text-center font-medium text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayBookings = bookings.filter((booking) => {
              const bookingDate = new Date(booking.startTime);
              return bookingDate.toDateString() === day.toDateString();
            });

            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 border-r border-b border-gray-100 ${
                  !isCurrentMonth ? "bg-gray-50 text-gray-400" : ""
                } ${isToday ? "bg-blue-50" : ""}`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isToday ? "text-blue-600" : ""
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayBookings.slice(0, 2).map((booking) => (
                    <div
                      key={booking.id}
                      className={`text-xs p-1 rounded cursor-pointer ${getStatusColor(
                        booking.status
                      )} text-white truncate`}
                      onClick={() => setSelectedBooking(booking)}
                      title={`${booking.clientName} - ${booking.service.name}`}
                    >
                      {formatTime(new Date(booking.startTime))}{" "}
                      {booking.clientName}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayBookings.length - 2} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement du calendrier...</div>
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
                Mon calendrier
              </h1>
              <p className="text-gray-600">Vue d'ensemble de vos rendez-vous</p>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/bookings/new")}
              >
                Nouveau RDV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contrôles du calendrier */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h2 className="text-xl font-semibold capitalize">
              {getViewTitle()}
            </h2>

            <Button variant="outline" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="outline" onClick={goToToday}>
              Aujourd'hui
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              onClick={() => setViewMode("day")}
              size="sm"
            >
              Jour
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              onClick={() => setViewMode("week")}
              size="sm"
            >
              Semaine
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              onClick={() => setViewMode("month")}
              size="sm"
            >
              Mois
            </Button>
          </div>
        </div>

        {/* Vue calendrier */}
        <div className="mb-6">
          {viewMode === "day" && renderDayView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "month" && renderMonthView()}
        </div>
      </main>

      {/* Modal détail du RDV */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Détails du rendez-vous
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBooking(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">
                    {selectedBooking.clientName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedBooking.service.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">
                    {formatDate(new Date(selectedBooking.startTime))}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatTime(new Date(selectedBooking.startTime))} -{" "}
                    {formatTime(new Date(selectedBooking.endTime))}
                    <span className="ml-2">
                      ({selectedBooking.service.duration} min)
                    </span>
                  </div>
                </div>
              </div>

              {selectedBooking.clientEmail && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div className="text-sm">{selectedBooking.clientEmail}</div>
                </div>
              )}

              {selectedBooking.clientPhone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div className="text-sm">{selectedBooking.clientPhone}</div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <Badge
                  className={`${getStatusColor(
                    selectedBooking.status
                  )} text-white border-none`}
                >
                  {getStatusText(selectedBooking.status)}
                </Badge>
                <div className="font-bold text-lg">
                  {formatPrice(selectedBooking.service.price)}
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm font-medium mb-1">Notes :</div>
                  <div className="text-sm text-gray-600">
                    {selectedBooking.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
