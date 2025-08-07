// src/app/api/integrations/twilio/reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Cette API sera appelée par un CRON job quotidien
    
    // Récupérer tous les RDV confirmés pour demain
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const bookingsToRemind = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        startTime: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        // TODO: Ajouter condition pour vérifier que le rappel n'a pas déjà été envoyé
      },
      include: {
        service: true,
        client: true,
        user: true,
      },
    });

    const results = [];

    for (const booking of bookingsToRemind) {
      try {
        // Vérifier que le professionnel a activé les rappels SMS
        const userSettings = await getUserNotificationSettings(booking.userId);
        
        if (!userSettings.smsReminders || !booking.clientPhone) {
          continue;
        }

        // Envoyer le rappel
        const reminderResult = await sendReminder(booking, userSettings.whatsappEnabled);
        
        results.push({
          bookingId: booking.id,
          clientName: booking.clientName,
          success: reminderResult.success,
          messageId: reminderResult.messageId,
        });

      } catch (error) {
        console.error(`Erreur rappel pour booking ${booking.id}:`, error);
        results.push({
          bookingId: booking.id,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: bookingsToRemind.length,
      results: results,
      summary: {
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }
    });

  } catch (error) {
    console.error("Erreur traitement rappels:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement des rappels" },
      { status: 500 }
    );
  }
}

async function getUserNotificationSettings(userId: string) {
  // TODO: Récupérer les paramètres de notification de l'utilisateur
  // Pour l'instant, on simule des paramètres par défaut
  return {
    smsReminders: true,
    whatsappEnabled: false,
    customTemplate: null,
  };
}

async function sendReminder(booking: any, useWhatsApp: boolean = false) {
  try {
    // Appeler notre API d'envoi de messages
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/integrations/twilio/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId: booking.id,
        messageType: "reminder",
        sendWhatsApp: useWhatsApp,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        messageId: result.messageId,
      };
    } else {
      const error = await response.json();
      return {
        success: false,
        error: error.error,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}