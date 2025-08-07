// src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET - Récupérer une réservation spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        service: true,
        client: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      )
    }

    return NextResponse.json(booking)

  } catch (error) {
    console.error("Erreur lors de la récupération de la réservation:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PATCH - Modifier une réservation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const { startTime, endTime, notes, status } = await request.json()

    // Vérifier que la réservation appartient à l'utilisateur
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      )
    }

    // Supprimer la réservation
    await prisma.booking.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Réservation supprimée avec succès" })

  } catch (error) {
    console.error("Erreur lors de la suppression de la réservation:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}json(
        { error: "Réservation non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier les conflits si on change l'horaire
    if (startTime && endTime) {
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          userId: session.user.id,
          id: { not: params.id }, // Exclure la réservation actuelle
          status: { in: ['PENDING', 'CONFIRMED'] },
          OR: [
            {
              AND: [
                { startTime: { lte: new Date(startTime) } },
                { endTime: { gt: new Date(startTime) } }
              ]
            },
            {
              AND: [
                { startTime: { lt: new Date(endTime) } },
                { endTime: { gte: new Date(endTime) } }
              ]
            },
            {
              AND: [
                { startTime: { gte: new Date(startTime) } },
                { endTime: { lte: new Date(endTime) } }
              ]
            }
          ]
        }
      })

      if (conflictingBooking) {
        return NextResponse.json(
          { error: "Conflit d'horaire avec une autre réservation" },
          { status: 400 }
        )
      }
    }

    // Mettre à jour la réservation
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      include: {
        service: true,
        client: true
      }
    })

    return NextResponse.json(updatedBooking)

  } catch (error) {
    console.error("Erreur lors de la modification de la réservation:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une réservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    // Vérifier que la réservation appartient à l'utilisateur
    const existingBooking = await prisma.booking.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingBooking) {
      return NextResponse.