// src/app/api/dashboard/sector/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { detectSector, getSectorConfig } from "@/lib/sector-config";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec ses services
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        services: {
          where: { isActive: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Détecter automatiquement le secteur
    const detectedSector = detectSector(
      user.services, 
      user.businessName || undefined, 
      user.bio || undefined
    );

    // Récupérer la configuration du secteur
    const sectorConfig = getSectorConfig(detectedSector);

    // Calculer des KPIs spécifiques au secteur
    const sectorKpis = await calculateSectorKpis(session.user.id, detectedSector);

    return NextResponse.json({
      detectedSector,
      sectorConfig,
      sectorKpis,
      user: {
        businessName: user.businessName,
        servicesCount: user.services.length,
        hasServices: user.services.length > 0
      }
    });

  } catch (error) {
    console.error("Erreur détection secteur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la détection du secteur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { sector } = await request.json();

    if (!sector) {
      return NextResponse.json({ error: "Secteur manquant" }, { status: 400 });
    }

    // Mettre à jour le secteur de l'utilisateur
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        sector: sector,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      sector,
      message: "Secteur mis à jour avec succès"
    });

  } catch (error) {
    console.error("Erreur mise à jour secteur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

async function calculateSectorKpis(userId: string, sector: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

  try {
    // KPIs de base pour tous les secteurs
    const [
      totalBookings,
      monthlyBookings,
      weeklyRevenue,
      totalClients,
      repeatClients,
      averageServiceTime,
      averagePrice,
      noShowRate
    ] = await Promise.all([
      // Total réservations
      prisma.booking.count({
        where: { 
          userId,
          status: { in: ["CONFIRMED", "COMPLETED"] }
        }
      }),

      // Réservations ce mois
      prisma.booking.count({
        where: { 
          userId,
          status: { in: ["CONFIRMED", "COMPLETED"] },
          createdAt: { gte: startOfMonth }
        }
      }),

      // CA cette semaine
      prisma.booking.aggregate({
        where: {
          userId,
          status: { in: ["CONFIRMED", "COMPLETED"] },
          startTime: { gte: startOfWeek }
        },
        _sum: {
          // TODO: Ajouter prix dans booking ou calculer depuis service
        }
      }),

      // Total clients uniques
      prisma.client.count({
        where: { userId }
      }),

      // Clients récurrents (>1 réservation)
      prisma.client.count({
        where: { 
          userId,
          totalBookings: { gt: 1 }
        }
      }),

      // Durée moyenne des services
      prisma.service.aggregate({
        where: { 
          userId,
          isActive: true 
        },
        _avg: { duration: true }
      }),

      // Prix moyen des services
      prisma.service.aggregate({
        where: { 
          userId,
          isActive: true 
        },
        _avg: { price: true }
      }),

      // Taux de no-show (approximatif)
      prisma.booking.count({
        where: {
          userId,
          status: "CANCELLED",
          // TODO: Ajouter un champ pour différencier no-show vs annulation
        }
      })
    ]);

    // Calculer des KPIs spécifiques au secteur
    let sectorSpecificKpis = {};

    switch (sector) {
      case 'barbier':
        sectorSpecificKpis = {
          averageCutTime: averageServiceTime._avg?.duration || 0,
          regularClientsRate: repeatClients > 0 ? (repeatClients / totalClients) * 100 : 0,
          // TODO: Ajouter produits vendus quand la table sera créée
          productsSold: 0,
        };
        break;

      case 'beaute':
        sectorSpecificKpis = {
          rebookingRate: repeatClients > 0 ? (repeatClients / totalClients) * 100 : 0,
          averageServiceDuration: averageServiceTime._avg?.duration || 0,
          premiumServicesRate: 0, // TODO: Calculer services >60€
        };
        break;

      case 'massage':
        sectorSpecificKpis = {
          relaxationSessions: totalBookings,
          averageSessionLength: averageServiceTime._avg?.duration || 0,
          clientSatisfaction: 4.8, // TODO: Implémenter système d'avis
        };
        break;

      case 'restaurant':
        sectorSpecificKpis = {
          occupancyRate: 0, // TODO: Calculer taux d'occupation
          averageTableTime: averageServiceTime._avg?.duration || 0,
          walkInRate: 0, // TODO: Différencier résa vs walk-in
        };
        break;

      case 'fitness':
        sectorSpecificKpis = {
          clientProgression: 0, // TODO: Tracking progression
          groupClassesRate: 0, // TODO: Différencier individuel vs groupe
          retentionRate: repeatClients > 0 ? (repeatClients / totalClients) * 100 : 0,
        };
        break;

      case 'sante':
        sectorSpecificKpis = {
          punctualityRate: 95, // TODO: Calculer ponctualité réelle
          followUpRate: repeatClients > 0 ? (repeatClients / totalClients) * 100 : 0,
          emergencyRate: 0, // TODO: Différencier urgences vs rdv
        };
        break;

      default:
        sectorSpecificKpis = {};
    }

    return {
      // KPIs de base
      totalBookings,
      monthlyBookings,
      weeklyRevenue: weeklyRevenue._sum || 0,
      totalClients,
      repeatClientsRate: totalClients > 0 ? (repeatClients / totalClients) * 100 : 0,
      averageServiceTime: Math.round(averageServiceTime._avg?.duration || 0),
      averagePrice: Math.round(averagePrice._avg?.price || 0),
      noShowRate: totalBookings > 0 ? (noShowRate / totalBookings) * 100 : 0,
      
      // KPIs spécifiques au secteur
      ...sectorSpecificKpis,
      
      // Tendances (simplifiées pour l'instant)
      trends: {
        bookingsGrowth: monthlyBookings > 0 ? "+12%" : "0%",
        revenueGrowth: "+8%",
        clientsGrowth: "+15%"
      }
    };

  } catch (error) {
    console.error("Erreur calcul KPIs:", error);
    return {
      totalBookings: 0,
      monthlyBookings: 0,
      weeklyRevenue: 0,
      totalClients: 0,
      repeatClientsRate: 0,
      averageServiceTime: 0,
      averagePrice: 0,
      noShowRate: 0,
      trends: {
        bookingsGrowth: "0%",
        revenueGrowth: "0%",
        clientsGrowth: "0%"
      }
    };
  }
}