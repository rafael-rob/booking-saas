// src/components/search/SearchResults.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  Euro, 
  Star, 
  Calendar,
  Phone,
  Heart,
  Share,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  total: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onBookService: (serviceId: string, userId: string) => void;
}

export default function SearchResults({
  results,
  isLoading,
  total,
  currentPage,
  totalPages,
  onPageChange,
  onBookService,
}: SearchResultsProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const toggleFavorite = (serviceId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(serviceId)) {
      newFavorites.delete(serviceId);
    } else {
      newFavorites.add(serviceId);
    }
    setFavorites(newFavorites);
  };

  const shareService = (service: SearchResult) => {
    if (navigator.share) {
      navigator.share({
        title: service.name,
        text: `Découvrez ${service.name} chez ${service.user.businessName}`,
        url: `${window.location.origin}/booking/${service.user.id}?service=${service.id}`,
      });
    } else {
      // Fallback: copier l'URL
      navigator.clipboard.writeText(
        `${window.location.origin}/booking/${service.user.id}?service=${service.id}`
      );
      // TODO: Afficher un toast de confirmation
    }
  };

  const formatPrice = (price: number) => `${price}€`;
  const formatDuration = (duration: number) => {
    if (duration < 60) return `${duration}min`;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}h${minutes}` : `${hours}h`;
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                ? "fill-yellow-200 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Aucun résultat trouvé
        </h3>
        <p className="text-gray-600 mb-6">
          Essayez de modifier vos critères de recherche ou explorez nos catégories populaires.
        </p>
        
        {/* Suggestions de catégories */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { name: "Beauté", icon: "💅" },
            { name: "Coiffure", icon: "✂️" },
            { name: "Massage", icon: "💆" },
            { name: "Fitness", icon: "💪" },
          ].map(cat => (
            <Button
              key={cat.name}
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Déclencher une recherche par catégorie
              }}
            >
              {cat.icon} {cat.name}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête des résultats */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {total} service{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
          </h2>
          <p className="text-gray-600">
            Page {currentPage} sur {totalPages}
          </p>
        </div>
        
        {/* Mode d'affichage */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            📱 Grille
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            📋 Liste
          </Button>
        </div>
      </div>

      {/* Résultats */}
      <div className={viewMode === "grid" 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
        : "space-y-4"
      }>
        {results.map((service) => (
          <Card 
            key={service.id} 
            className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <CardContent className="p-0">
              {viewMode === "grid" ? (
                // Vue grille (cards)
                <div className="p-6">
                  {/* Header avec favoris */}
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="secondary" className="text-xs">
                      {service.category}
                    </Badge>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleFavorite(service.id)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favorites.has(service.id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => shareService(service)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <Share className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Nom du service */}
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {service.name}
                  </h3>

                  {/* Professionnel */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {service.user.businessName?.[0] || service.user.name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {service.user.businessName || service.user.name}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {service.user.city}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  {/* Infos service */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(service.duration)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4" />
                      {formatPrice(service.price)}
                    </div>
                  </div>

                  {/* Rating et badges */}
                  <div className="flex items-center justify-between mb-4">
                    {renderStars(service.user.averageRating)}
                    <div className="flex gap-2">
                      {service.hasAvailabilityToday && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          ⏰ Dispo aujourd'hui
                        </Badge>
                      )}
                      {service.totalBookings > 50 && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          🏆 Populaire
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Bouton réservation */}
                  <Button
                    className="w-full"
                    onClick={() => onBookService(service.id, service.user.id)}
                  >
                    📅 Réserver maintenant
                  </Button>
                </div>
              ) : (
                // Vue liste (horizontale)
                <div className="p-6 flex gap-6">
                  {/* Avatar professionnel */}
                  <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-xl">
                      {service.user.businessName?.[0] || service.user.name[0]}
                    </span>
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-xl text-gray-900 mb-1">
                          {service.name}
                        </h3>
                        <p className="text-gray-600 font-medium">
                          {service.user.businessName || service.user.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleFavorite(service.id)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <Heart
                            className={`h-5 w-5 ${
                              favorites.has(service.id)
                                ? "fill-red-500 text-red-500"
                                : "text-gray-400"
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => shareService(service)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <Share className="h-5 w-5 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      <Badge variant="secondary">{service.category}</Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        {service.user.city}
                      </div>
                      {renderStars(service.user.averageRating)}
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {service.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1 text-lg font-semibold text-blue-600">
                          <Euro className="h-5 w-5" />
                          {formatPrice(service.price)}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-4 w-4" />
                          {formatDuration(service.duration)}
                        </div>
                        {service.hasAvailabilityToday && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ⏰ Disponible aujourd'hui
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => onBookService(service.id, service.user.id)}
                      >
                        📅 Réserver
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Numéros de page */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 5) {
              pageNumber = i + 1;
            } else if (currentPage <= 3) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i;
            } else {
              pageNumber = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNumber}
                variant={pageNumber === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}