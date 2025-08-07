// src/app/api/search/services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Paramètres de recherche
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : undefined;
    const minDuration = searchParams.get("minDuration") ? parseInt(searchParams.get("minDuration")!) : undefined;
    const maxDuration = searchParams.get("maxDuration") ? parseInt(searchParams.get("maxDuration")!) : undefined;
    const city = searchParams.get("city");
    const availableToday = searchParams.get("availableToday") === "true";
    const sortBy = searchParams.get("sortBy") || "relevance"; // relevance, price, duration, rating
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;

    // Construction de la requête WHERE
    const whereConditions: any = {
      isActive: true,
    };

    // Recherche textuelle dans nom, description, tags
    if (query) {
      whereConditions.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
        { user: { businessName: { contains: query, mode: "insensitive" } } },
        { user: { name: { contains: query, mode: "insensitive" } } },
      ];
    }

    // Filtres
    if (category) {
      whereConditions.category = { contains: category, mode: "insensitive" };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereConditions.price = {};
      if (minPrice !== undefined) whereConditions.price.gte = minPrice;
      if (maxPrice !== undefined) whereConditions.price.lte = maxPrice;
    }

    if (minDuration !== undefined || maxDuration !== undefined) {
      whereConditions.duration = {};
      if (minDuration !== undefined) whereConditions.duration.gte = minDuration;
      if (maxDuration !== undefined) whereConditions.duration.lte = maxDuration;
    }

    if (city) {
      whereConditions.user = {
        ...whereConditions.user,
        city: { contains: city, mode: "insensitive" }
      };
    }

    // Construction du ORDER BY
    let orderBy: any = {};
    switch (sortBy) {
      case "price":
        orderBy = { price: "asc" };
        break;
      case "duration":
        orderBy = { duration: "asc" };
        break;
      case "rating":
        orderBy = { averageRating: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      default:
        // Relevance - on utilise updatedAt par défaut
        orderBy = { updatedAt: "desc" };
    }

    // Pagination
    const offset = (page - 1) * limit;

    // Exécution de la requête
    const [services, totalCount] = await Promise.all([
      prisma.service.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              businessName: true,
              city: true,
              address: true,
              phone: true,
              averageRating: true,
              totalReviews: true,
            }
          },
          _count: {
            select: {
              bookings: {
                where: {
                  status: "CONFIRMED"
                }
              }
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      
      prisma.service.count({
        where: whereConditions,
      })
    ]);

    // Enrichir les résultats avec des données calculées
    const enrichedServices = await Promise.all(
      services.map(async (service) => {
        // Calculer la disponibilité aujourd'hui si demandée
        let hasAvailabilityToday = false;
        if (availableToday) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const todayBookings = await prisma.booking.count({
            where: {
              userId: service.userId,
              startTime: {
                gte: today,
                lt: tomorrow,
              },
              status: { in: ["PENDING", "CONFIRMED"] }
            }
          });

          // Logique simplifiée : si moins de 8 RDV aujourd'hui, considérer comme disponible
          hasAvailabilityToday = todayBookings < 8;
        }

        return {
          ...service,
          hasAvailabilityToday,
          totalBookings: service._count.bookings,
          // Score de popularité basé sur les réservations et notes
          popularityScore: (service._count.bookings * 0.7) + ((service.user.averageRating || 0) * 0.3),
        };
      })
    );

    // Filtrer par disponibilité aujourd'hui si demandé
    let filteredServices = enrichedServices;
    if (availableToday) {
      filteredServices = enrichedServices.filter(s => s.hasAvailabilityToday);
    }

    // Calcul des métadonnées
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Suggestions de recherche pour améliorer les résultats
    const suggestions = await generateSearchSuggestions(query, category);

    return NextResponse.json({
      services: filteredServices,
      pagination: {
        total: totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage,
        hasPreviousPage,
      },
      filters: {
        query,
        category,
        priceRange: { min: minPrice, max: maxPrice },
        durationRange: { min: minDuration, max: maxDuration },
        city,
        availableToday,
        sortBy,
      },
      suggestions,
      facets: await generateFacets(whereConditions),
    });

  } catch (error) {
    console.error("Erreur recherche services:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}

async function generateSearchSuggestions(query: string, category?: string | null) {
  if (!query || query.length < 2) return [];

  try {
    // Rechercher des services similaires pour suggestions
    const suggestions = await prisma.service.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ]
      },
      select: {
        name: true,
        category: true,
      },
      take: 5,
    });

    // Créer des suggestions uniques
    const uniqueSuggestions = new Set<string>();
    suggestions.forEach(s => {
      if (s.name.toLowerCase().includes(query.toLowerCase())) {
        uniqueSuggestions.add(s.name);
      }
      if (s.category?.toLowerCase().includes(query.toLowerCase())) {
        uniqueSuggestions.add(s.category);
      }
    });

    return Array.from(uniqueSuggestions).slice(0, 5);

  } catch (error) {
    console.error("Erreur génération suggestions:", error);
    return [];
  }
}

async function generateFacets(baseWhereConditions: any) {
  try {
    // Compter les services par catégorie
    const categories = await prisma.service.groupBy({
      by: ['category'],
      where: {
        ...baseWhereConditions,
        category: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10,
    });

    // Compter les services par gamme de prix
    const priceRanges = [
      { label: "0-25€", min: 0, max: 25 },
      { label: "25-50€", min: 25, max: 50 },
      { label: "50-100€", min: 50, max: 100 },
      { label: "100€+", min: 100, max: 999999 },
    ];

    const priceRangeCounts = await Promise.all(
      priceRanges.map(async (range) => {
        const count = await prisma.service.count({
          where: {
            ...baseWhereConditions,
            price: {
              gte: range.min,
              lte: range.max,
            }
          }
        });
        return { ...range, count };
      })
    );

    // Compter les services par durée
    const durationRanges = [
      { label: "15-30 min", min: 15, max: 30 },
      { label: "30-60 min", min: 30, max: 60 },
      { label: "1-2h", min: 60, max: 120 },
      { label: "2h+", min: 120, max: 999999 },
    ];

    const durationRangeCounts = await Promise.all(
      durationRanges.map(async (range) => {
        const count = await prisma.service.count({
          where: {
            ...baseWhereConditions,
            duration: {
              gte: range.min,
              lte: range.max,
            }
          }
        });
        return { ...range, count };
      })
    );

    return {
      categories: categories.map(c => ({
        value: c.category,
        count: c._count.id,
      })),
      priceRanges: priceRangeCounts.filter(p => p.count > 0),
      durationRanges: durationRangeCounts.filter(d => d.count > 0),
    };

  } catch (error) {
    console.error("Erreur génération facets:", error);
    return {
      categories: [],
      priceRanges: [],
      durationRanges: [],
    };
  }
}