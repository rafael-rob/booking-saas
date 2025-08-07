// src/app/api/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Récupérer les disponibilités de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const availabilities = await prisma.availability.findMany({
      where: {
        userId: session.user.id,
        isRecurring: true,
      },
      orderBy: {
        dayOfWeek: "asc",
      },
    });

    return NextResponse.json(availabilities);
  } catch (error) {
    console.error("Erreur lors de la récupération des disponibilités:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Sauvegarder les disponibilités
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { workingDays, slotDuration, bufferTime } = await request.json();

    // Validation
    if (!workingDays || !Array.isArray(workingDays)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    // Supprimer les anciennes disponibilités récurrentes
    await prisma.availability.deleteMany({
      where: {
        userId: session.user.id,
        isRecurring: true,
      },
    });

    // Créer les nouvelles disponibilités
    const availabilitiesToCreate = workingDays.map((day: any) => ({
      userId: session.user.id,
      dayOfWeek: day.dayOfWeek,
      startTime: day.startTime,
      endTime: day.endTime,
      isRecurring: true,
    }));

    if (availabilitiesToCreate.length > 0) {
      await prisma.availability.createMany({
        data: availabilitiesToCreate,
      });
    }

    // TODO: Sauvegarder slotDuration et bufferTime dans le profil utilisateur
    // Pour l'instant on les ignore, mais on pourrait les ajouter à la table User

    return NextResponse.json({
      message: "Disponibilités sauvegardées avec succès",
      count: availabilitiesToCreate.length,
    });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des disponibilités:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
