// src/app/api/clients/[id]/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH - Mettre à jour les notes d'un client
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { notes } = await request.json();

    // Vérifier que le client appartient à l'utilisateur
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    // Mettre à jour les notes
    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        notes: notes || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Erreur lors de la mise à jour des notes:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
