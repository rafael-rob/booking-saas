// src/app/api/clients/route.ts
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

    // Récupérer tous les clients avec leurs statistiques
    const clients = await prisma.client.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        bookings: {
          include: {
            service: {
              select: {
                name: true,
                price: true,
              },
            },
          },
          orderBy: {
            startTime: "desc",
          },
        },
      },
      orderBy: {
        totalSpent: "desc",
      },
    });

    // Enrichir les données avec des calculs
    const enrichedClients = clients.map((client) => {
      const completedBookings = client.bookings.filter(
        (b) => b.status === "COMPLETED"
      );
      const totalSpent = completedBookings.reduce(
        (sum, booking) => sum + booking.service.price,
        0
      );

      // Calculer le temps moyen entre les visites
      let averageTimeBetweenVisits = 0;
      if (completedBookings.length > 1) {
        const sortedBookings = completedBookings.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );

        const intervals = [];
        for (let i = 1; i < sortedBookings.length; i++) {
          const diff =
            new Date(sortedBookings[i].startTime).getTime() -
            new Date(sortedBookings[i - 1].startTime).getTime();
          intervals.push(diff / (1000 * 60 * 60 * 24)); // En jours
        }

        averageTimeBetweenVisits =
          intervals.reduce((sum, interval) => sum + interval, 0) /
          intervals.length;
      }

      // Déterminer si c'est un client VIP (plus de 500€ dépensés OU plus de 10 RDV)
      const isVip = totalSpent >= 500 || client.totalBookings >= 10;

      // Calculer le risque de départ
      let riskLevel: "low" | "medium" | "high" = "low";
      if (client.lastBookingAt) {
        const daysSinceLastBooking =
          (Date.now() - new Date(client.lastBookingAt).getTime()) /
          (1000 * 60 * 60 * 24);

        if (daysSinceLastBooking > 120) {
          riskLevel = "high";
        } else if (daysSinceLastBooking > 60) {
          riskLevel = "medium";
        }
      } else if (client.totalBookings === 0) {
        riskLevel = "medium";
      }

      return {
        ...client,
        totalSpent,
        isVip,
        riskLevel,
        averageTimeBetweenVisits: Math.round(averageTimeBetweenVisits),
      };
    });

    return NextResponse.json(enrichedClients);
  } catch (error) {
    console.error("Erreur lors de la récupération des clients:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
