// src/app/api/widget/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { userId, event, service, price, source, metadata } = await request.json();

    // Validation
    if (!userId || !event) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Pour l'instant on log en console, à terme on créerait une table analytics
    const analyticsData = {
      userId,
      event,
      service: service || null,
      price: price || null,
      source: source || 'unknown',
      metadata: metadata || {},
      timestamp: new Date(),
      ip: request.ip,
      userAgent: request.headers.get('user-agent'),
    };

    console.log("📊 Widget Analytics:", analyticsData);

    // TODO: Enregistrer en base de données
    /*
    await prisma.widgetAnalytics.create({
      data: analyticsData
    });
    */

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erreur analytics widget:", error);
    return NextResponse.json(
      { error: "Erreur analytics" },
      { status: 500 }
    );
  }
}