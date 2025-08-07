// src/app/api/bookings/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH - Changer le statut d'une réservation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { status } = await request.json();

    // Validation du statut
    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    // Vérifier que la réservation appartient à l'utilisateur
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      );
    }

    // Mettre à jour le statut
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        service: true,
        client: true,
      },
    });

    // TODO: Envoyer notification au client selon le nouveau statut
    // - CONFIRMED: Email/SMS de confirmation
    // - CANCELLED: Email/SMS d'annulation avec excuses
    // - COMPLETED: Email de remerciement + demande d'avis

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Erreur lors du changement de statut:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
