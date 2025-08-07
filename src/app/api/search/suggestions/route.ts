// src/app/api/search/suggestions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Rechercher dans les services, catégories et noms de business
    const [serviceResults, categoryResults, businessResults] = await Promise.all([
      // Services
      prisma.service.findMany({
        where: {
          isActive: true,
          name: { contains: query, mode: "insensitive" }
        },
        select: {
          name: true,
          category: true,
          user: {
            select: {
              businessName: true,
              city: true,
            }
          }
        },
        take: 5,
      }),

      // Catégories distinctes
      prisma.service.findMany({
        where: {
          isActive: true,
          category: { contains: query, mode: "insensitive" }
        },
        select: {
          category: true,
        },
        distinct: ['category'],
        take: 3,
      }),

      // Business/Professionnels
      prisma.user.findMany({
        where: {
          OR: [
            { businessName: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
          services: {
            some: {
              isActive: true
            }
          }
        },
        select: {
          name: true,
          businessName: true,
          city: true,
          _count: {
            select: {
              services: {
                where: { isActive: true }
              }
            }
          }
        },
        take: 3,
      }),
    ]);

    // Construire les suggestions avec types
    const suggestions = [];

    // Ajouter les services
    serviceResults.forEach(service => {
      suggestions.push({
        type: "service",
        text: service.name,
        subtitle: `${service.category} - ${service.user.businessName}`,
        category: service.category,
        icon: "🛠️"
      });
    });

    // Ajouter les catégories
    categoryResults.forEach(cat => {
      if (cat.category) {
        suggestions.push({
          type: "category",
          text: cat.category,
          subtitle: `Catégorie de services`,
          category: cat.category,
          icon: getCategoryIcon(cat.category)
        });
      }
    });

    // Ajouter les professionnels
    businessResults.forEach(business => {
      suggestions.push({
        type: "business",
        text: business.businessName || business.name,
        subtitle: `${business.city} - ${business._count.services} service(s)`,
        icon: "🏢"
      });
    });

    // Supprimer les doublons et limiter à 8 suggestions
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      )
      .slice(0, 8);

    return NextResponse.json({
      suggestions: uniqueSuggestions,
      hasMore: suggestions.length > 8,
    });

  } catch (error) {
    console.error("Erreur suggestions:", error);
    return NextResponse.json({ suggestions: [] });
  }
}

function getCategoryIcon(category: string): string {
  const categoryIcons: { [key: string]: string } = {
    // Beauté
    "coiffure": "✂️",
    "barbier": "💈", 
    "barber": "💈",
    "esthétique": "💄",
    "beauté": "💅",
    "massage": "💆",
    "spa": "🧘",
    "manucure": "💅",
    "pédicure": "🦶",
    
    // Santé
    "médecin": "👨‍⚕️",
    "dentiste": "🦷",
    "kiné": "🤲",
    "kinésithérapeute": "🤲",
    "ostéopathe": "🦴",
    "psychologue": "🧠",
    "consultation": "🩺",
    
    // Sport & Fitness
    "fitness": "💪",
    "coach": "🏃",
    "sport": "⚽",
    "yoga": "🧘‍♀️",
    "pilates": "🤸",
    
    // Restauration
    "restaurant": "🍽️",
    "cuisine": "👨‍🍳",
    "traiteur": "🥘",
    "pâtisserie": "🧁",
    
    // Services
    "conseil": "💼",
    "formation": "📚",
    "coaching": "🎯",
    "photographie": "📸",
    "réparation": "🔧",
    "nettoyage": "🧹",
    "jardinage": "🌱",
    
    // Divertissement
    "musique": "🎵",
    "danse": "💃",
    "théâtre": "🎭",
    "art": "🎨",
  };

  const lowerCategory = category.toLowerCase();
  
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerCategory.includes(key)) {
      return icon;
    }
  }
  
  return "🔍"; // Icône par défaut
}