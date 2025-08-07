// src/components/search/SearchBar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Suggestion {
  type: "service" | "category" | "business";
  text: string;
  subtitle: string;
  category?: string;
  icon: string;
}

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  initialQuery?: string;
  placeholder?: string;
  showLocation?: boolean;
  showFilters?: boolean;
}

export interface SearchFilters {
  query: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  availableToday?: boolean;
  sortBy?: string;
}

export default function SearchBar({
  onSearch,
  onFiltersChange,
  initialQuery = "",
  placeholder = "Rechercher un service, professionnel...",
  showLocation = true,
  showFilters = true,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
  });
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Gérer les clics en dehors pour fermer les suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Rechercher les suggestions
  const fetchSuggestions = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Erreur suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce pour les suggestions
  const handleInputChange = (value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Gérer la recherche
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    const updatedFilters = { ...filters, query: finalQuery };
    setFilters(updatedFilters);
    onSearch(finalQuery, updatedFilters);
    setShowSuggestions(false);
  };

  // Gérer la sélection d'une suggestion
  const handleSuggestionClick = (suggestion: Suggestion) => {
    setQuery(suggestion.text);
    
    const updatedFilters: SearchFilters = {
      ...filters,
      query: suggestion.text,
    };

    // Si c'est une catégorie, l'ajouter aux filtres
    if (suggestion.type === "category" && suggestion.category) {
      updatedFilters.category = suggestion.category;
    }

    setFilters(updatedFilters);
    handleSearch(suggestion.text);
  };

  // Gérer la touche Entrée
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // Obtenir la géolocalisation
  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // TODO: Convertir les coordonnées en ville
          // Pour l'instant on simule
          const updatedFilters = { ...filters, city: "Paris" };
          setFilters(updatedFilters);
          onFiltersChange(updatedFilters);
        },
        (error) => {
          console.error("Erreur géolocalisation:", error);
        }
      );
    }
  };

  // Supprimer un filtre
  const removeFilter = (filterKey: keyof SearchFilters) => {
    const updatedFilters = { ...filters };
    delete updatedFilters[filterKey];
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  // Compter les filtres actifs
  const activeFiltersCount = Object.keys(filters).filter(key => 
    key !== "query" && filters[key as keyof SearchFilters] !== undefined
  ).length;

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      {/* Barre de recherche principale */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-xl shadow-lg border border-gray-200 p-2 gap-2">
          {/* Icône de recherche */}
          <Search className="h-5 w-5 text-gray-400 ml-2" />
          
          {/* Input principal */}
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="flex-1 border-0 outline-none ring-0 focus-visible:ring-0 text-lg"
          />

          {/* Bouton géolocalisation */}
          {showLocation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLocationClick}
              className="text-gray-500 hover:text-blue-600"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}

          {/* Bouton filtres */}
          {showFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-blue-600 relative"
            >
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Bouton rechercher */}
          <Button 
            onClick={() => handleSearch()}
            className="bg-blue-600 hover:bg-blue-700 px-6"
          >
            Rechercher
          </Button>
        </div>

        {/* Filtres actifs */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.category && (
              <Badge variant="secondary" className="gap-1">
                📂 {filters.category}
                <button
                  onClick={() => removeFilter("category")}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {filters.city && (
              <Badge variant="secondary" className="gap-1">
                📍 {filters.city}
                <button
                  onClick={() => removeFilter("city")}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.availableToday && (
              <Badge variant="secondary" className="gap-1">
                ⏰ Disponible aujourd'hui
                <button
                  onClick={() => removeFilter("availableToday")}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
              <Badge variant="secondary" className="gap-1">
                💰 {filters.minPrice || 0}€ - {filters.maxPrice || "∞"}€
                <button
                  onClick={() => {
                    removeFilter("minPrice");
                    removeFilter("maxPrice");
                  }}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-pulse">Recherche en cours...</div>
            </div>
          ) : (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <span className="text-xl">{suggestion.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.text}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {suggestion.subtitle}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.type === "service" ? "Service" :
                     suggestion.type === "category" ? "Catégorie" : "Pro"}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions rapides en bas */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => {
            const updatedFilters = { ...filters, availableToday: true };
            setFilters(updatedFilters);
            onFiltersChange(updatedFilters);
          }}
          className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
        >
          ⏰ Disponible aujourd'hui
        </button>
        
        <button
          onClick={() => {
            const updatedFilters = { ...filters, category: "beauté" };
            setFilters(updatedFilters);
            onFiltersChange(updatedFilters);
          }}
          className="px-3 py-1 text-sm bg-pink-50 text-pink-700 rounded-full hover:bg-pink-100 transition-colors"
        >
          💅 Beauté
        </button>
        
        <button
          onClick={() => {
            const updatedFilters = { ...filters, category: "massage" };
            setFilters(updatedFilters);
            onFiltersChange(updatedFilters);
          }}
          className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors"
        >
          💆 Massage
        </button>
        
        <button
          onClick={() => {
            const updatedFilters = { ...filters, category: "coiffure" };
            setFilters(updatedFilters);
            onFiltersChange(updatedFilters);
          }}
          className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
        >
          ✂️ Coiffure
        </button>
      </div>
    </div>
  );
}