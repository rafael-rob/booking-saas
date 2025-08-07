// src/app/api/services/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PUT - Mettre à jour un service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { name, description, duration, price, isActive } =
      await request.json();

    // Vérifier que le service appartient à l'utilisateur
    const existingService = await prisma.service.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service non trouvé" },
        { status: 404 }
      );
    }

    // Validation
    if (duration && duration < 15) {
      return NextResponse.json(
        { error: "La durée minimum est de 15 minutes" },
        { status: 400 }
      );
    }

    if (price && price < 0) {
      return NextResponse.json(
        { error: "Le prix ne peut pas être négatif" },
        { status: 400 }
      );
    }

    const updatedService = await prisma.service.update({
      where: {
        id: params.id,
      },
      data: {
        name: name || existingService.name,
        description:
          description !== undefined ? description : existingService.description,
        duration: duration ? parseInt(duration) : existingService.duration,
        price: price ? parseFloat(price) : existingService.price,
        isActive: isActive !== undefined ? isActive : existingService.isActive,
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du service:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que le service appartient à l'utilisateur
    const existingService = await prisma.service.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: "Service non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas de réservations actives pour ce service
    const activeBookings = await prisma.booking.count({
      where: {
        serviceId: params.id,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        startTime: {
          gte: new Date(),
        },
      },
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer un service avec des réservations actives",
        },
        { status: 400 }
      );
    }

    await prisma.service.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Service supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du service:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
