// src/app/dashboard/availability/page.tsx
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Availability } from "@prisma/client";

interface WorkingDay {
  dayOfWeek: number;
  dayName: string;
  isActive: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

export default function AvailabilityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([
    {
      dayOfWeek: 1,
      dayName: "Lundi",
      isActive: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      dayOfWeek: 2,
      dayName: "Mardi",
      isActive: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      dayOfWeek: 3,
      dayName: "Mercredi",
      isActive: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      dayOfWeek: 4,
      dayName: "Jeudi",
      isActive: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      dayOfWeek: 5,
      dayName: "Vendredi",
      isActive: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      dayOfWeek: 6,
      dayName: "Samedi",
      isActive: false,
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      dayOfWeek: 0,
      dayName: "Dimanche",
      isActive: false,
      startTime: "09:00",
      endTime: "17:00",
    },
  ]);

  const [slotDuration, setSlotDuration] = useState(30); // Durée des créneaux en minutes
  const [bufferTime, setBufferTime] = useState(0); // Temps de battement entre RDV

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchAvailabilities();
    }
  }, [session]);

  const fetchAvailabilities = async () => {
    try {
      const response = await fetch("/api/availability");
      if (response.ok) {
        const availabilities: Availability[] = await response.json();

        // Mettre à jour workingDays avec les données de la BDD
        setWorkingDays((prevDays) =>
          prevDays.map((day) => {
            const dbAvailability = availabilities.find(
              (av) => av.dayOfWeek === day.dayOfWeek
            );
            if (dbAvailability) {
              return {
                ...day,
                isActive: true,
                startTime: dbAvailability.startTime,
                endTime: dbAvailability.endTime,
              };
            }
            return { ...day, isActive: false };
          })
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement des disponibilités:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateWorkingDay = (
    dayOfWeek: number,
    updates: Partial<WorkingDay>
  ) => {
    setWorkingDays((prevDays) =>
      prevDays.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...updates } : day
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workingDays: workingDays.filter((day) => day.isActive),
          slotDuration,
          bufferTime,
        }),
      });

      if (response.ok) {
        alert("Disponibilités sauvegardées avec succès !");
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

  const copyDayToAll = (sourceDay: WorkingDay) => {
    const confirmation = confirm(
      `Copier les horaires du ${sourceDay.dayName} (${sourceDay.startTime} - ${sourceDay.endTime}) sur tous les jours actifs ?`
    );

    if (confirmation) {
      setWorkingDays((prevDays) =>
        prevDays.map((day) =>
          day.isActive
            ? {
                ...day,
                startTime: sourceDay.startTime,
                endTime: sourceDay.endTime,
                breakStart: sourceDay.breakStart,
                breakEnd: sourceDay.breakEnd,
              }
            : day
        )
      );
    }
  };

  const getTimeSlots = (day: WorkingDay) => {
    if (!day.isActive) return [];

    const slots = [];
    const start = new Date(`2000-01-01T${day.startTime}:00`);
    const end = new Date(`2000-01-01T${day.endTime}:00`);

    let current = new Date(start);

    while (current < end) {
      const timeString = current.toTimeString().slice(0, 5);

      // Vérifier si on n'est pas dans la pause
      const isBreakTime =
        day.breakStart &&
        day.breakEnd &&
        timeString >= day.breakStart &&
        timeString < day.breakEnd;

      if (!isBreakTime) {
        slots.push(timeString);
      }

      current.setMinutes(current.getMinutes() + slotDuration);
    }

    return slots;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
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
                Mes disponibilités
              </h1>
              <p className="text-gray-600">
                Configurez vos horaires de travail et la durée de vos créneaux
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration des jours */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Horaires de travail</CardTitle>
                <CardDescription>
                  Définissez vos jours et heures d'ouverture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {workingDays.map((day) => (
                  <div key={day.dayOfWeek} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={day.isActive}
                          onCheckedChange={(checked) =>
                            updateWorkingDay(day.dayOfWeek, {
                              isActive: checked,
                            })
                          }
                        />
                        <Label className="text-base font-medium w-20">
                          {day.dayName}
                        </Label>
                      </div>

                      {day.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyDayToAll(day)}
                          className="text-xs"
                        >
                          Copier sur tous
                        </Button>
                      )}
                    </div>

                    {day.isActive && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-8">
                        <div>
                          <Label className="text-sm">Ouverture</Label>
                          <Input
                            type="time"
                            value={day.startTime}
                            onChange={(e) =>
                              updateWorkingDay(day.dayOfWeek, {
                                startTime: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Fermeture</Label>
                          <Input
                            type="time"
                            value={day.endTime}
                            onChange={(e) =>
                              updateWorkingDay(day.dayOfWeek, {
                                endTime: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Pause début</Label>
                          <Input
                            type="time"
                            value={day.breakStart || ""}
                            onChange={(e) =>
                              updateWorkingDay(day.dayOfWeek, {
                                breakStart: e.target.value || undefined,
                              })
                            }
                            placeholder="Optionnel"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Pause fin</Label>
                          <Input
                            type="time"
                            value={day.breakEnd || ""}
                            onChange={(e) =>
                              updateWorkingDay(day.dayOfWeek, {
                                breakEnd: e.target.value || undefined,
                              })
                            }
                            placeholder="Optionnel"
                          />
                        </div>
                      </div>
                    )}

                    {day.isActive && (
                      <div className="ml-8 text-sm text-gray-600">
                        📅 {getTimeSlots(day).length} créneaux disponibles
                        {getTimeSlots(day).length > 0 && (
                          <span className="ml-2">
                            ({getTimeSlots(day)[0]} -{" "}
                            {getTimeSlots(day)[getTimeSlots(day).length - 1]})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Configuration des créneaux */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration des créneaux</CardTitle>
                  <CardDescription>
                    Durée et espacement de vos rendez-vous
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="slotDuration">
                      Durée des créneaux (minutes)
                    </Label>
                    <Input
                      id="slotDuration"
                      type="number"
                      min="15"
                      step="15"
                      value={slotDuration}
                      onChange={(e) =>
                        setSlotDuration(parseInt(e.target.value))
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Durée standard de vos rendez-vous
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="bufferTime">
                      Temps de battement (minutes)
                    </Label>
                    <Input
                      id="bufferTime"
                      type="number"
                      min="0"
                      step="5"
                      value={bufferTime}
                      onChange={(e) => setBufferTime(parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Temps libre entre chaque RDV
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aperçu de la semaine</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workingDays
                      .filter((day) => day.isActive)
                      .map((day) => (
                        <div
                          key={day.dayOfWeek}
                          className="flex justify-between text-sm"
                        >
                          <span className="font-medium">{day.dayName}</span>
                          <span className="text-gray-600">
                            {day.startTime} - {day.endTime}
                          </span>
                        </div>
                      ))}

                    {workingDays.filter((day) => day.isActive).length === 0 && (
                      <p className="text-gray-500 text-sm">
                        Aucun jour de travail configuré
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Créneaux :</strong> {slotDuration} min
                      </p>
                      {bufferTime > 0 && (
                        <p>
                          <strong>Battement :</strong> {bufferTime} min
                        </p>
                      )}
                      <p className="mt-2">
                        <strong>Total créneaux/semaine :</strong>{" "}
                        {workingDays
                          .filter((day) => day.isActive)
                          .reduce(
                            (total, day) => total + getTimeSlots(day).length,
                            0
                          )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
