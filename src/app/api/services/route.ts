// src/app/api/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Récupérer tous les services de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const services = await prisma.service.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Erreur lors de la récupération des services:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { name, description, duration, price } = await request.json();

    // Validation
    if (!name || !duration || !price) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    if (duration < 15) {
      return NextResponse.json(
        { error: "La durée minimum est de 15 minutes" },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { error: "Le prix ne peut pas être négatif" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        isActive: true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du service:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
