// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, businessName, phone } = await request.json();

    // Validation
    if (!email || !password || !name || !businessName) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        businessName,
        phone: phone || null,
        subscriptionStatus: "trial",
      },
    });

    // Créer un service par défaut
    await prisma.service.create({
      data: {
        userId: user.id,
        name: "Consultation",
        description: "Service de consultation standard",
        duration: 60,
        price: 50,
        isActive: true,
      },
    });

    // Créer des disponibilités par défaut (Lun-Ven 9h-17h)
    const defaultAvailabilities = [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }, // Lundi
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" }, // Mardi
      { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" }, // Mercredi
      { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" }, // Jeudi
      { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" }, // Vendredi
    ];

    await prisma.availability.createMany({
      data: defaultAvailabilities.map((availability) => ({
        userId: user.id,
        ...availability,
      })),
    });

    return NextResponse.json(
      { message: "Compte créé avec succès" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création du compte:", error);
    return NextResponse.json(
      { error: "Une erreur interne est survenue" },
      { status: 500 }
    );
  }
}
