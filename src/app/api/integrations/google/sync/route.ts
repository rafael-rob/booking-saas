// src/app/api/integrations/google/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { bookingId, action } = await request.json();

    // Récupérer la réservation
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
        userId: session.user.id,
      },
      include: {
        service: true,
        client: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    // TODO: Récupérer les tokens Google de l'utilisateur
    // TODO: Effectuer l'action sur Google Calendar

    switch (action) {
      case "create":
        await createGoogleCalendarEvent(booking);
        break;
      case "update":
        await updateGoogleCalendarEvent(booking);
        break;
      case "delete":
        await deleteGoogleCalendarEvent(booking);
        break;
      default:
        return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Événement ${action} dans Google Calendar`
    });

  } catch (error) {
    console.error("Erreur sync Google Calendar:", error);
    return NextResponse.json(
      { error: "Erreur de synchronisation" },
      { status: 500 }
    );
  }
}

async function createGoogleCalendarEvent(booking: any) {
  // TODO: Utiliser l'API Google Calendar pour créer l'événement
  console.log("Création événement Google Calendar:", {
    id: booking.id,
    title: `${booking.service.name} - ${booking.clientName}`,
    start: booking.startTime,
    end: booking.endTime,
    description: `
Service: ${booking.service.name}
Client: ${booking.clientName}
Email: ${booking.clientEmail}
${booking.clientPhone ? `Téléphone: ${booking.clientPhone}` : ''}
${booking.notes ? `Notes: ${booking.notes}` : ''}

Géré avec BookingSaaS
    `.trim(),
  });

  // Simuler la création pour l'instant
  return { eventId: `google-${booking.id}` };
}

async function updateGoogleCalendarEvent(booking: any) {
  // TODO: Mettre à jour l'événement dans Google Calendar
  console.log("Mise à jour événement Google Calendar:", booking.id);
  return { updated: true };
}

async function deleteGoogleCalendarEvent(booking: any) {
  // TODO: Supprimer l'événement de Google Calendar
  console.log("Suppression événement Google Calendar:", booking.id);
  return { deleted: true };
}