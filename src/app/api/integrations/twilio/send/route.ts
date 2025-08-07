// src/app/api/integrations/twilio/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Pour l'instant, on va simuler Twilio. En production, vous installerez: npm install twilio
// const twilio = require('twilio');
// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { 
      bookingId, 
      messageType, 
      customMessage,
      sendWhatsApp = false 
    } = await request.json();

    // Récupérer la réservation avec les détails
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
        userId: session.user.id,
      },
      include: {
        service: true,
        client: true,
        user: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    // Vérifier que le client a un numéro de téléphone
    if (!booking.clientPhone) {
      return NextResponse.json({ 
        error: "Aucun numéro de téléphone pour ce client" 
      }, { status: 400 });
    }

    // Générer le message selon le type
    const message = customMessage || generateMessage(messageType, booking);

    // Envoyer via Twilio (simulé pour l'instant)
    const result = await sendTwilioMessage({
      to: booking.clientPhone,
      message: message,
      whatsapp: sendWhatsApp,
      bookingId: booking.id,
    });

    // Enregistrer l'envoi en base
    await logMessageSent({
      bookingId: booking.id,
      userId: session.user.id,
      phone: booking.clientPhone,
      message: message,
      type: messageType,
      whatsapp: sendWhatsApp,
      status: result.success ? "sent" : "failed",
      twilioId: result.messageId || null,
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: "Message envoyé avec succès",
    });

  } catch (error) {
    console.error("Erreur envoi SMS/WhatsApp:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi" },
      { status: 500 }
    );
  }
}

function generateMessage(type: string, booking: any): string {
  const clientName = booking.clientName;
  const serviceName = booking.service.name;
  const businessName = booking.user.businessName || booking.user.name;
  const date = new Date(booking.startTime).toLocaleDateString('fr-FR');
  const time = new Date(booking.startTime).toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const messages = {
    confirmation: `✅ Bonjour ${clientName} ! 

Votre RDV est confirmé :
📅 ${serviceName}
🗓️ ${date} à ${time}
📍 Chez ${businessName}

Merci de nous prévenir 24h à l'avance en cas d'empêchement.

À bientôt !`,

    reminder: `📅 Rappel RDV - ${clientName}

N'oubliez pas votre rendez-vous DEMAIN :
⏰ ${time} - ${serviceName}
📍 ${businessName}

En cas d'empêchement, merci de nous prévenir rapidement.

À demain ! 😊`,

    modification: `🔄 RDV modifié - ${clientName}

Votre rendez-vous a été modifié :
📅 Nouveau créneau : ${date} à ${time}
🏥 ${serviceName} chez ${businessName}

Merci de confirmer ce nouveau créneau.`,

    cancellation: `❌ RDV annulé - ${clientName}

Votre rendez-vous du ${date} à ${time} a été annulé.

Pour reprendre un nouveau RDV, contactez-nous ou utilisez notre système de réservation en ligne.

Merci de votre compréhension.`,

    custom: `Message personnalisé pour ${clientName}`
  };

  return messages[type as keyof typeof messages] || messages.custom;
}

async function sendTwilioMessage(params: {
  to: string;
  message: string;
  whatsapp: boolean;
  bookingId: string;
}) {
  const { to, message, whatsapp, bookingId } = params;

  try {
    // SIMULATION pour l'instant (remplacez par le vrai code Twilio en production)
    console.log("📱 SIMULATION - Message Twilio:", {
      to: whatsapp ? `whatsapp:${to}` : to,
      body: message,
      from: whatsapp 
        ? process.env.TWILIO_WHATSAPP_NUMBER 
        : process.env.TWILIO_PHONE_NUMBER,
      bookingId
    });

    /* CODE TWILIO RÉEL (à décommenter en production) :
    
    const client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID, 
      process.env.TWILIO_AUTH_TOKEN
    );

    const twilioMessage = await client.messages.create({
      body: message,
      from: whatsapp 
        ? process.env.TWILIO_WHATSAPP_NUMBER 
        : process.env.TWILIO_PHONE_NUMBER,
      to: whatsapp ? `whatsapp:${to}` : to,
    });

    return {
      success: true,
      messageId: twilioMessage.sid,
      status: twilioMessage.status
    };
    */

    // Simulation de succès
    return {
      success: true,
      messageId: `twilio_sim_${Date.now()}`,
      status: "sent"
    };

  } catch (error) {
    console.error("Erreur Twilio:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function logMessageSent(data: {
  bookingId: string;
  userId: string;
  phone: string;
  message: string;
  type: string;
  whatsapp: boolean;
  status: string;
  twilioId: string | null;
}) {
  try {
    // TODO: Créer une table pour logger les messages envoyés
    console.log("💾 Log message envoyé:", data);
    
    /* À implémenter en base :
    await prisma.messageSent.create({
      data: {
        bookingId: data.bookingId,
        userId: data.userId,
        phone: data.phone,
        message: data.message,
        type: data.type,
        whatsapp: data.whatsapp,
        status: data.status,
        twilioId: data.twilioId,
        sentAt: new Date(),
      }
    });
    */
  } catch (error) {
    console.error("Erreur sauvegarde log:", error);
  }
}