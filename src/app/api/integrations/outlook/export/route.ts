// src/app/api/integrations/outlook/export/route.ts
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

    // Récupérer tous les RDV confirmés de l'utilisateur
    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: "CONFIRMED",
      },
      include: {
        service: true,
        client: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Générer le contenu .ics
    const icsContent = generateICSContent(bookings, session.user);

    // Retourner le fichier .ics
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mes-rdv-booking.ics"',
      },
    });
  } catch (error) {
    console.error("Erreur export Outlook:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export" },
      { status: 500 }
    );
  }
}

function generateICSContent(bookings: any[], user: any): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:.]/g, "").split("T");
  const dateStamp = timestamp[0];
  const timeStamp = timestamp[0] + "T" + timestamp[1].split("Z")[0] + "Z";

  let icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookingSaaS//BookingSaaS Calendar//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Mes RDV BookingSaaS`,
    `X-WR-CALDESC:Rendez-vous exportés depuis BookingSaaS`,
    "",
  ].join("\r\n");

  bookings.forEach((booking) => {
    const startDate = new Date(booking.startTime);
    const endDate = new Date(booking.endTime);
    
    // Format de date pour .ics (YYYYMMDDTHHMMSSZ)
    const formatICSDate = (date: Date): string => {
      return date.toISOString().replace(/[-:.]/g, "").split(".")[0] + "Z";
    };

    const eventId = `booking-${booking.id}@bookingsaas.com`;
    const summary = `${booking.service.name} - ${booking.clientName}`;
    const description = [
      `Service: ${booking.service.name}`,
      `Client: ${booking.clientName}`,
      `Email: ${booking.clientEmail}`,
      booking.clientPhone ? `Téléphone: ${booking.clientPhone}` : "",
      booking.notes ? `Notes: ${booking.notes}` : "",
      "",
      "Créé avec BookingSaaS",
    ].filter(Boolean).join("\\n");

    icsContent += [
      "BEGIN:VEVENT",
      `UID:${eventId}`,
      `DTSTAMP:${timeStamp}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `ORGANIZER;CN=${user.name || user.email}:mailto:${user.email}`,
      `ATTENDEE;CN=${booking.clientName}:mailto:${booking.clientEmail}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      `CREATED:${formatICSDate(new Date(booking.createdAt))}`,
      `LAST-MODIFIED:${formatICSDate(new Date(booking.updatedAt))}`,
      "END:VEVENT",
      "",
    ].join("\r\n");
  });

  icsContent += "END:VCALENDAR\r\n";

  return icsContent;
}

// Fonction utilitaire pour échapper les caractères spéciaux dans .ics
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}