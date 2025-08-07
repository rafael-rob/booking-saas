// src/app/api/reports/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PDFReportGenerator } from "@/lib/pdf-generator";
import { detectSector } from "@/lib/sector-config";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { 
      reportType, 
      period, 
      startDate, 
      endDate,
      includeCharts = true,
      format = 'pdf'
    } = await request.json();

    // Validation des paramètres
    if (!reportType || !period) {
      return NextResponse.json(
        { error: "Type de rapport et période requis" }, 
        { status: 400 }
      );
    }

    // Calculer les dates selon la période
    const dates = calculatePeriodDates(period, startDate, endDate);
    
    // Récupérer les données utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        services: { where: { isActive: true } }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Détecter le secteur
    const detectedSector = detectSector(user.services, user.businessName, user.bio);

    // Récupérer les données selon le type de rapport
    const reportData = await generateReportData(
      session.user.id, 
      reportType, 
      dates, 
      user,
      detectedSector
    );

    // Générer le PDF
    const generator = new PDFReportGenerator();
    const pdfBuffer = generator.generateReport(reportData);

    // Préparer la réponse
    const filename = `rapport-${reportType}-${period}-${Date.now()}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error("Erreur génération rapport:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du rapport" },
      { status: 500 }
    );
  }
}

function calculatePeriodDates(period: string, startDate?: string, endDate?: string) {
  const now = new Date();
  let start: Date;
  let end: Date;
  let label: string;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      label = "Aujourd'hui";
      break;
      
    case 'week':
      start = new Date(now.setDate(now.getDate() - now.getDay()));
      start.setHours(0, 0, 0, 0);
      end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      label = "Cette semaine";
      break;
      
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      label = `${start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
      break;
      
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), quarter * 3 + 3, 1);
      label = `T${quarter + 1} ${now.getFullYear()}`;
      break;
      
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      label = now.getFullYear().toString();
      break;
      
    case 'custom':
      start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = endDate ? new Date(endDate) : now;
      label = `Du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
      break;
      
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = now;
      label = "30 derniers jours";
  }

  return { start, end, label };
}

async function generateReportData(
  userId: string, 
  reportType: string, 
  dates: any, 
  user: any,
  sector: string
) {
  const { start, end, label } = dates;

  // Récupérer les réservations de la période
  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      startTime: {
        gte: start,
        lt: end,
      },
    },
    include: {
      service: true,
      client: true,
    },
    orderBy: { startTime: 'asc' },
  });

  // Récupérer tous les clients
  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { totalBookings: 'desc' },
  });

  // Calculer les statistiques
  const stats = calculateStats(bookings, clients, user.services);

  // Retourner les données formatées
  return {
    period: { start: start.toISOString(), end: end.toISOString(), label },
    business: {
      name: user.businessName || user.name,
      address: user.address,
      phone: user.phone,
      email: user.email,
    },
    bookings,
    clients,
    services: user.services,
    stats,
    sector,
  };
}

function calculateStats(bookings: any[], clients: any[], services: any[]) {
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => ['CONFIRMED', 'COMPLETED'].includes(b.status));
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
  
  const totalRevenue = confirmedBookings.reduce((sum, booking) => {
    return sum + (booking.service?.price || 0);
  }, 0);

  const averagePrice = totalRevenue > 0 ? Math.round(totalRevenue / confirmedBookings.length) : 0;
  const noShowRate = totalBookings > 0 ? (cancelledBookings.length / totalBookings) * 100 : 0;

  // Top services (par nombre de réservations)
  const serviceStats: { [key: string]: any } = {};
  confirmedBookings.forEach(booking => {
    if (booking.service) {
      const serviceId = booking.service.id;
      if (!serviceStats[serviceId]) {
        serviceStats[serviceId] = {
          id: serviceId,
          name: booking.service.name,
          bookings: 0,
          revenue: 0,
          averagePrice: booking.service.price || 0,
        };
      }
      serviceStats[serviceId].bookings++;
      serviceStats[serviceId].revenue += booking.service.price || 0;
    }
  });

  const topServices = Object.values(serviceStats)
    .sort((a: any, b: any) => b.bookings - a.bookings)
    .slice(0, 5);

  // Top clients (par nombre de réservations dans la période)
  const clientStats: { [key: string]: any } = {};
  confirmedBookings.forEach(booking => {
    if (booking.client) {
      const clientId = booking.client.id;
      if (!clientStats[clientId]) {
        clientStats[clientId] = {
          id: clientId,
          name: booking.client.name,
          totalBookings: 0,
          totalSpent: 0,
          lastVisit: booking.startTime,
        };
      }
      clientStats[clientId].totalBookings++;
      clientStats[clientId].totalSpent += booking.service?.price || 0;
      
      // Mettre à jour la dernière visite si plus récente
      if (new Date(booking.startTime) > new Date(clientStats[clientId].lastVisit)) {
        clientStats[clientId].lastVisit = booking.startTime;
      }
    }
  });

  const topClients = Object.values(clientStats)
    .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  return {
    totalBookings,
    totalRevenue,
    totalClients: clients.length,
    averagePrice,
    noShowRate,
    topServices,
    topClients,
    confirmedBookings: confirmedBookings.length,
    cancelledBookings: cancelledBookings.length,
    conversionRate: totalBookings > 0 ? (confirmedBookings.length / totalBookings) * 100 : 0,
  };
}