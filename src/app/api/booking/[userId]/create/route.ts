// src/app/api/booking/[userId]/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const {
      serviceId,
      clientName,
      clientEmail,
      clientPhone,
      date,
      time,
      notes,
    } = await request.json();

    // Validation
    if (!serviceId || !clientName || !clientEmail || !date || !time) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    // Vérifier que le service existe et est actif
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        userId: userId,
        isActive: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service non trouvé ou inactif" },
        { status: 404 }
      );
    }

    // Construire la date/heure de début
    const [hours, minutes] = time.split(":");
    const startTime = new Date(date);
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Calculer la date/heure de fin
    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    // Vérifier que le créneau n'est pas dans le passé
    if (startTime <= new Date()) {
      return NextResponse.json(
        { error: "Impossible de réserver dans le passé" },
        { status: 400 }
      );
    }

    // Vérifier que le créneau est libre
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        userId: userId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: "Ce créneau n'est plus disponible" },
        { status: 409 }
      );
    }

    // Créer ou récupérer le client
    let client = await prisma.client.findFirst({
      where: {
        userId: userId,
        email: clientEmail,
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          userId: userId,
          name: clientName,
          email: clientEmail,
          phone: clientPhone || null,
          totalBookings: 0,
        },
      });
    }

    // Créer la réservation
    const booking = await prisma.booking.create({
      data: {
        userId: userId,
        serviceId: serviceId,
        clientId: client.id,
        clientName: clientName,
        clientEmail: clientEmail,
        clientPhone: clientPhone || null,
        startTime: startTime,
        endTime: endTime,
        status: "PENDING",
        paymentStatus: "PENDING",
        notes: notes || null,
      },
      include: {
        service: true,
        client: true,
      },
    });

    // Mettre à jour le compteur de réservations du client
    await prisma.client.update({
      where: { id: client.id },
      data: {
        totalBookings: { increment: 1 },
        lastBookingAt: new Date(),
      },
    });

    // TODO: Envoyer email de confirmation
    // TODO: Envoyer notification au professionnel

    // Synchroniser avec Google Calendar si activé (non-bloquant)
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/integrations/google/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          action: "create",
        }),
      });
    } catch (error) {
      console.log("Sync Google Calendar échoué (non-critique):", error);
    }

    // Envoyer SMS de confirmation si activé (non-bloquant)
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/integrations/twilio/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          messageType: "confirmation",
          sendWhatsApp: false, // TODO: Récupérer le setting de l'utilisateur
        }),
      });
    } catch (error) {
      console.log("SMS de confirmation échoué (non-critique):", error);
    }

    return NextResponse.json(
      {
        message: "Réservation créée avec succès",
        booking: {
          id: booking.id,
          service: booking.service.name,
          startTime: booking.startTime,
          endTime: booking.endTime,
          price: booking.service.price,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de la réservation:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
