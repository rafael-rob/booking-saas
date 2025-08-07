// src/app/search/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar, { SearchFilters } from "@/components/search/SearchBar";
import AdvancedSearchFilters from "@/components/search/SearchFilters";
import SearchResults from "@/components/search/SearchResults";

interface SearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  averageRating?: number;
  totalBookings: number;
  hasAvailabilityToday: boolean;
  user: {
    id: string;
    name: string;
    businessName: string;
    city: string;
    address?: string;
    phone?: string;
    averageRating?: number;
    totalReviews?: number;
  };
}

interface SearchResponse {
  services: SearchResult[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: SearchFilters;
  suggestions: string[];
  facets: {
    categories: Array<{ value: string; count: number }>;
    priceRanges: Array<{ label: string; min: number; max: number; count: number }>;
    durationRanges: Array<{ label: string; min: number; max: number; count: number }>;
  };
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
    query: searchParams?.get("q") || "",
  });

  // Construire l'URL de recherche
  const buildSearchUrl = useCallback((filters: SearchFilters, page: number = 1) => {
    const params = new URLSearchParams();
    
    if (filters.query) params.set("q", filters.query);
    if (filters.category) params.set("category", filters.category);
    if (filters.city) params.set("city", filters.city);
    if (filters.minPrice) params.set("minPrice", filters.minPrice.toString());
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice.toString());
    if (filters.minDuration) params.set("minDuration", filters.minDuration.toString());
    if (filters.maxDuration) params.set("maxDuration", filters.maxDuration.toString());
    if (filters.availableToday) params.set("availableToday", "true");
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    
    params.set("page", page.toString());
    params.set("limit", "12");
    
    return `/api/search/services?${params.toString()}`;
  }, []);

  // Effectuer la recherche
  const performSearch = useCallback(async (filters: SearchFilters, page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = buildSearchUrl(filters, page);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la recherche");
      }
      
      const data: SearchResponse = await response.json();
      setSearchResponse(data);
      setResults(data.services);
      
      // Mettre à jour l'URL du navigateur
      const urlParams = new URLSearchParams();
      if (filters.query) urlParams.set("q", filters.query);
      if (filters.category) urlParams.set("category", filters.category);
      if (filters.city) urlParams.set("city", filters.city);
      if (page > 1) urlParams.set("page", page.toString());
      
      const newUrl = `/search${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;
      window.history.pushState({}, "", newUrl);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildSearchUrl]);

  // Recherche initiale basée sur les paramètres URL
  useEffect(() => {
    const initialFilters: SearchFilters = {
      query: searchParams?.get("q") || "",
      category: searchParams?.get("category") || undefined,
      city: searchParams?.get("city") || undefined,
      availableToday: searchParams?.get("availableToday") === "true" || undefined,
      sortBy: searchParams?.get("sortBy") || "relevance",
    };
    
    setCurrentFilters(initialFilters);
    
    // Effectuer la recherche si on a des paramètres
    if (initialFilters.query || initialFilters.category || initialFilters.city) {
      const page = parseInt(searchParams?.get("page") || "1");
      performSearch(initialFilters, page);
    }
  }, [searchParams, performSearch]);

  // Gérer la recherche depuis la barre de recherche
  const handleSearch = (query: string, filters: SearchFilters) => {
    setCurrentFilters(filters);
    performSearch(filters, 1);
  };

  // Gérer le changement de filtres
  const handleFiltersChange = (filters: SearchFilters) => {
    setCurrentFilters(filters);
    performSearch(filters, 1);
  };

  // Gérer le changement de page
  const handlePageChange = (page: number) => {
    if (searchResponse) {
      performSearch(currentFilters, page);
    }
  };

  // Gérer la réservation d'un service
  const handleBookService = (serviceId: string, userId: string) => {
    router.push(`/booking/${userId}?service=${serviceId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section avec recherche */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Trouvez le service parfait
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Des milliers de professionnels vous attendent. 
              Recherche intelligente, réservation instantanée.
            </p>
          </div>

          {/* Barre de recherche */}
          <SearchBar
            onSearch={handleSearch}
            onFiltersChange={handleFiltersChange}
            initialQuery={currentFilters.query}
            placeholder="Massage, coiffure, restaurant..."
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar avec filtres avancés */}
          <div className="lg:w-80 flex-shrink-0">
            <AdvancedSearchFilters
              filters={currentFilters}
              onFiltersChange={handleFiltersChange}
              facets={searchResponse?.facets}
            />

            {/* Suggestions de recherches populaires */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                🔥 Recherches populaires
              </h3>
              <div className="space-y-2">
                {[
                  { text: "Massage relaxant", icon: "💆", count: "234 pros" },
                  { text: "Coupe homme", icon: "✂️", count: "156 barbiers" },
                  { text: "Soin visage", icon: "✨", count: "189 esthéticiennes" },
                  { text: "Coaching sport", icon: "💪", count: "97 coachs" },
                  { text: "Réparation auto", icon: "🔧", count: "78 garages" },
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const newFilters = { ...currentFilters, query: item.text };
                      handleFiltersChange(newFilters);
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium text-gray-900">{item.text}</span>
                      </div>
                      <span className="text-sm text-gray-500">{item.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Avantages de la recherche */}
            <div className="mt-8 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-4">
                ✨ Pourquoi choisir BookingSaaS ?
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-green-800">
                  <span className="text-green-600">✓</span>
                  <span>Réservation instantanée 24h/24</span>
                </div>
                <div className="flex items-center gap-2 text-green-800">
                  <span className="text-green-600">✓</span>
                  <span>Professionnels vérifiés et notés</span>
                </div>
                <div className="flex items-center gap-2 text-green-800">
                  <span className="text-green-600">✓</span>
                  <span>Annulation gratuite jusqu'à 2h avant</span>
                </div>
                <div className="flex items-center gap-2 text-green-800">
                  <span className="text-green-600">✓</span>
                  <span>Rappels SMS automatiques</span>
                </div>
                <div className="flex items-center gap-2 text-green-800">
                  <span className="text-green-600">✓</span>
                  <span>Support client 7j/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu principal avec résultats */}
          <div className="flex-1 min-w-0">
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-red-600 text-4xl mb-2">❌</div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Erreur de recherche
                </h3>
                <p className="text-red-700">{error}</p>
              </div>
            ) : (
              <SearchResults
                results={results}
                isLoading={isLoading}
                total={searchResponse?.pagination.total || 0}
                currentPage={searchResponse?.pagination.currentPage || 1}
                totalPages={searchResponse?.pagination.totalPages || 1}
                onPageChange={handlePageChange}
                onBookService={handleBookService}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}