// src/app/api/dashboard/route.ts
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

    const userId = session.user.id;

    // Récupérer les réservations récentes avec relations
    const bookings = await prisma.booking.findMany({
      where: {
        userId: userId,
        startTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)), // Depuis aujourd'hui
        },
      },
      include: {
        service: true,
        client: true,
      },
      orderBy: {
        startTime: "asc",
      },
      take: 10,
    });

    // Calculer les statistiques
    const today = new Date();
    const startOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay())
    );
    const endOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay() + 6)
    );

    // RDV aujourd'hui
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayBookings = await prisma.booking.count({
      where: {
        userId: userId,
        startTime: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          not: "CANCELLED",
        },
      },
    });

    // CA cette semaine
    const weekBookings = await prisma.booking.findMany({
      where: {
        userId: userId,
        startTime: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
        status: "COMPLETED",
        paymentStatus: "PAID",
      },
      include: {
        service: true,
      },
    });

    const weekRevenue = weekBookings.reduce((total, booking) => {
      return total + booking.service.price;
    }, 0);

    // Total clients uniques
    const totalClients = await prisma.client.count({
      where: {
        userId: userId,
      },
    });

    // RDV à venir (7 prochains jours)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingBookings = await prisma.booking.count({
      where: {
        userId: userId,
        startTime: {
          gte: new Date(),
          lte: nextWeek,
        },
        status: {
          not: "CANCELLED",
        },
      },
    });

    const stats = {
      todayBookings,
      weekRevenue,
      totalClients,
      upcomingBookings,
    };

    return NextResponse.json({
      bookings,
      stats,
    });
  } catch (error) {
    console.error("Erreur dashboard:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
