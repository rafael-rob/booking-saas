// src/app/booking/[userId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Service, User } from "@prisma/client";
import { formatPrice } from "@/lib/utils";

interface BookingFormData {
  serviceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  time: string;
  notes: string;
}

interface AvailableSlot {
  date: string;
  time: string;
  available: boolean;
}

export default function BookingPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [professional, setProfessional] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [formData, setFormData] = useState<BookingFormData>({
    serviceId: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    date: "",
    time: "",
    notes: "",
  });

  useEffect(() => {
    if (userId) {
      fetchProfessionalData();
    }
  }, [userId]);

  const fetchProfessionalData = async () => {
    try {
      const response = await fetch(`/api/booking/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfessional(data.professional);
        setServices(data.services);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSlots = async (serviceId: string) => {
    try {
      const service = services.find((s) => s.id === serviceId);
      if (!service) return;

      const response = await fetch(
        `/api/booking/${userId}/availability?serviceId=${serviceId}`
      );
      if (response.ok) {
        const slots = await response.json();
        setAvailableSlots(slots);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des créneaux:", error);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setFormData({ ...formData, serviceId: service.id });
    fetchAvailableSlots(service.id);
    setStep(2);
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setFormData({
      ...formData,
      date: slot.date,
      time: slot.time,
    });
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/booking/${userId}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setBookingSuccess(true);
        setStep(4);
      }
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNextWeekDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }

    return days;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);
  };

  const getAvailableSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return availableSlots.filter(
      (slot) => slot.date === dateStr && slot.available
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Professionnel non trouvé
            </h3>
            <p className="text-gray-600">
              Cette page de réservation n'existe pas ou n'est plus disponible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {professional.businessName}
            </h1>
            <p className="text-gray-600 mt-2">
              Réservez votre rendez-vous avec {professional.name}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step > stepNumber ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Choisir un service */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Choisissez un service</CardTitle>
              <CardDescription>
                Sélectionnez le service que vous souhaitez réserver
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-200"
                    onClick={() => handleServiceSelect(service)}
                  >
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {service.description}
                        </p>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          ⏱️ {service.duration} min
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatPrice(service.price)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choisir un créneau */}
        {step === 2 && selectedService && (
          <Card>
            <CardHeader>
              <CardTitle>Choisissez un créneau</CardTitle>
              <CardDescription>
                Service sélectionné: {selectedService.name} -{" "}
                {formatPrice(selectedService.price)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {getNextWeekDays().map((date) => {
                  const daySlots = getAvailableSlotsForDate(date);

                  if (daySlots.length === 0) return null;

                  return (
                    <div key={date.toISOString()}>
                      <h3 className="font-medium text-gray-900 mb-3 capitalize">
                        {formatDate(date)}
                      </h3>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {daySlots.map((slot) => (
                          <Button
                            key={`${slot.date}-${slot.time}`}
                            variant="outline"
                            className="h-12"
                            onClick={() => handleSlotSelect(slot)}
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {availableSlots.filter((slot) => slot.available).length ===
                  0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📅</div>
                    <p>Aucun créneau disponible pour les prochains jours.</p>
                    <p className="text-sm">Veuillez réessayer plus tard.</p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  ← Choisir un autre service
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Informations client */}
        {step === 3 && selectedService && selectedSlot && (
          <Card>
            <CardHeader>
              <CardTitle>Vos informations</CardTitle>
              <CardDescription>
                {selectedService.name} • {selectedSlot.date} à{" "}
                {selectedSlot.time}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Nom complet *</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) =>
                        setFormData({ ...formData, clientName: e.target.value })
                      }
                      placeholder="Votre nom et prénom"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Email *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          clientEmail: e.target.value,
                        })
                      }
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Téléphone</Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, clientPhone: e.target.value })
                    }
                    placeholder="06 12 34 56 78"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Informations complémentaires..."
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    ← Changer de créneau
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting
                      ? "Réservation..."
                      : "Confirmer la réservation"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && bookingSuccess && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Réservation confirmée !
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <p className="text-lg font-medium">{selectedService?.name}</p>
                <p className="text-gray-600">
                  {selectedSlot?.date} à {selectedSlot?.time}
                </p>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  {selectedService && formatPrice(selectedService.price)}
                </p>
              </div>
              <p className="text-gray-600 mb-6">
                Un email de confirmation vous a été envoyé à{" "}
                {formData.clientEmail}
              </p>
              <Button onClick={() => window.location.reload()}>
                Faire une nouvelle réservation
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
