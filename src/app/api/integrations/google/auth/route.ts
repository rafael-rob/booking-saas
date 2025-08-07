// src/app/api/integrations/google/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // TODO: Implémenter OAuth Google Calendar
    
    // URL de redirection Google OAuth (à configurer)
    const googleAuthUrl = `https://accounts.google.com/oauth2/authorize?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&` +
      `scope=https://www.googleapis.com/auth/calendar&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${session.user.id}`;

    return NextResponse.json({ 
      authUrl: googleAuthUrl,
      message: "Redirection vers Google OAuth" 
    });

  } catch (error) {
    console.error("Erreur auth Google:", error);
    return NextResponse.json(
      { error: "Erreur d'authentification Google" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { code } = await request.json();

    // TODO: Échanger le code contre un access token
    console.log("Code reçu:", code);

    // TODO: Sauvegarder le token dans la base de données
    // TODO: Créer les événements existants dans Google Calendar

    return NextResponse.json({
      success: true,
      message: "Intégration Google Calendar activée"
    });

  } catch (error) {
    console.error("Erreur activation Google:", error);
    return NextResponse.json(
      { error: "Erreur activation Google Calendar" },
      { status: 500 }
    );
  }
}