// src/app/api/booking/[userId]/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json({ error: "Service ID requis" }, { status: 400 });
    }

    // Récupérer le service pour connaître sa durée
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        userId: userId,
        isActive: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les disponibilités du professionnel
    const availabilities = await prisma.availability.findMany({
      where: {
        userId: userId,
        isRecurring: true,
      },
    });

    // Récupérer les réservations existantes pour les 14 prochains jours
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 14);

    const existingBookings = await prisma.booking.findMany({
      where: {
        userId: userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
    });

    // Générer les créneaux disponibles
    const availableSlots = [];

    for (let d = 1; d <= 14; d++) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + d);

      // Vérifier si ce jour a des disponibilités
      const dayOfWeek = currentDate.getDay();
      const dayAvailability = availabilities.find(
        (av) => av.dayOfWeek === dayOfWeek
      );

      if (!dayAvailability) continue;

      // Générer les créneaux pour cette journée
      const startTime = dayAvailability.startTime.split(":");
      const endTime = dayAvailability.endTime.split(":");

      const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
      const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);

      // Créneaux de 30 minutes
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const slotHour = Math.floor(minutes / 60);
        const slotMinute = minutes % 60;

        const slotTime = `${slotHour.toString().padStart(2, "0")}:${slotMinute
          .toString()
          .padStart(2, "0")}`;

        // Créer la date/heure du créneau
        const slotDateTime = new Date(currentDate);
        slotDateTime.setHours(slotHour, slotMinute, 0, 0);

        // Vérifier si le créneau n'est pas dans le passé
        if (slotDateTime <= new Date()) continue;

        // Vérifier s'il y a assez de temps pour le service
        const slotEndTime = new Date(
          slotDateTime.getTime() + service.duration * 60000
        );
        const maxSlotTime = new Date(currentDate);
        maxSlotTime.setHours(parseInt(endTime[0]), parseInt(endTime[1]), 0, 0);

        if (slotEndTime > maxSlotTime) continue;

        // Vérifier si le créneau est libre
        const isBooked = existingBookings.some((booking) => {
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);

          return (
            (slotDateTime >= bookingStart && slotDateTime < bookingEnd) ||
            (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
            (slotDateTime <= bookingStart && slotEndTime >= bookingEnd)
          );
        });

        availableSlots.push({
          date: currentDate.toISOString().split("T")[0],
          time: slotTime,
          available: !isBooked,
        });
      }
    }

    return NextResponse.json(availableSlots);
  } catch (error) {
    console.error("Erreur lors de la récupération des créneaux:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
