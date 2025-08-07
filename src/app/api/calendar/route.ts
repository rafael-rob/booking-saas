// src/app/api/calendar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    // Dates par défaut si non spécifiées
    const startDate = startParam ? new Date(startParam) : new Date();
    const endDate = endParam
      ? new Date(endParam)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    // Récupérer les réservations dans la période demandée
    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Erreur lors de la récupération du calendrier:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
