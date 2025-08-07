// src/app/api/booking/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Récupérer les informations du professionnel
    const professional = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        businessName: true,
        email: false, // On ne donne pas l'email
        phone: false, // On ne donne pas le téléphone
      },
    });

    if (!professional) {
      return NextResponse.json(
        { error: "Professionnel non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les services actifs
    const services = await prisma.service.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
      orderBy: {
        price: "asc",
      },
    });

    return NextResponse.json({
      professional,
      services,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
