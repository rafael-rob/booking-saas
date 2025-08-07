// src/components/search/SearchFilters.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SearchFilters } from "./SearchBar";

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  facets?: {
    categories: Array<{ value: string; count: number }>;
    priceRanges: Array<{ label: string; min: number; max: number; count: number }>;
    durationRanges: Array<{ label: string; min: number; max: number; count: number }>;
  };
}

export default function AdvancedSearchFilters({ 
  filters, 
  onFiltersChange,
  facets 
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const resetFilters = () => {
    const resetFilters = { query: filters.query };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const hasActiveFilters = Object.keys(localFilters).some(key => 
    key !== "query" && localFilters[key as keyof SearchFilters] !== undefined
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between bg-white shadow-sm"
        >
          <span className="flex items-center gap-2">
            🔍 Filtres avancés
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                Actifs
              </span>
            )}
          </span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Catégorie */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">📂 Catégorie</Label>
              <Select 
                value={localFilters.category || ""} 
                onValueChange={(value) => handleFilterChange("category", value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes catégories</SelectItem>
                  {facets?.categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.value} ({cat.count})
                    </SelectItem>
                  ))}
                  {/* Catégories fixes si pas de facets */}
                  {!facets?.categories?.length && (
                    <>
                      <SelectItem value="beauté">💅 Beauté</SelectItem>
                      <SelectItem value="coiffure">✂️ Coiffure</SelectItem>
                      <SelectItem value="massage">💆 Massage & Bien-être</SelectItem>
                      <SelectItem value="fitness">💪 Fitness & Sport</SelectItem>
                      <SelectItem value="santé">🏥 Santé</SelectItem>
                      <SelectItem value="restauration">🍽️ Restauration</SelectItem>
                      <SelectItem value="services">🔧 Services</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Ville */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">📍 Ville</Label>
              <Input
                placeholder="Ex: Paris, Lyon..."
                value={localFilters.city || ""}
                onChange={(e) => handleFilterChange("city", e.target.value || undefined)}
              />
            </div>

            {/* Prix */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">💰 Prix</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min €"
                  value={localFilters.minPrice || ""}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value ? parseInt(e.target.value) : undefined)}
                />
                <Input
                  type="number"
                  placeholder="Max €"
                  value={localFilters.maxPrice || ""}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              
              {/* Prix rapides */}
              <div className="flex flex-wrap gap-1 mt-2">
                {facets?.priceRanges?.map(range => (
                  <Button
                    key={range.label}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      handleFilterChange("minPrice", range.min);
                      handleFilterChange("maxPrice", range.max === 999999 ? undefined : range.max);
                    }}
                  >
                    {range.label} ({range.count})
                  </Button>
                )) || [
                  { label: "0-25€", min: 0, max: 25 },
                  { label: "25-50€", min: 25, max: 50 },
                  { label: "50-100€", min: 50, max: 100 },
                  { label: "100€+", min: 100, max: undefined },
                ].map(range => (
                  <Button
                    key={range.label}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      handleFilterChange("minPrice", range.min);
                      handleFilterChange("maxPrice", range.max);
                    }}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Durée */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">⏱️ Durée</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min (min)"
                  value={localFilters.minDuration || ""}
                  onChange={(e) => handleFilterChange("minDuration", e.target.value ? parseInt(e.target.value) : undefined)}
                />
                <Input
                  type="number"
                  placeholder="Max (min)"
                  value={localFilters.maxDuration || ""}
                  onChange={(e) => handleFilterChange("maxDuration", e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>

              {/* Durées rapides */}
              <div className="flex flex-wrap gap-1 mt-2">
                {[
                  { label: "15-30min", min: 15, max: 30 },
                  { label: "30-60min", min: 30, max: 60 },
                  { label: "1-2h", min: 60, max: 120 },
                  { label: "2h+", min: 120, max: undefined },
                ].map(range => (
                  <Button
                    key={range.label}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      handleFilterChange("minDuration", range.min);
                      handleFilterChange("maxDuration", range.max);
                    }}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tri */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">📊 Trier par</Label>
              <Select 
                value={localFilters.sortBy || "relevance"} 
                onValueChange={(value) => handleFilterChange("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">🎯 Pertinence</SelectItem>
                  <SelectItem value="price">💰 Prix croissant</SelectItem>
                  <SelectItem value="duration">⏱️ Durée</SelectItem>
                  <SelectItem value="rating">⭐ Mieux notés</SelectItem>
                  <SelectItem value="newest">🆕 Plus récents</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Options spéciales */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">⚡ Options</Label>
              
              <div className="flex items-center justify-between">
                <label className="text-sm cursor-pointer">
                  ⏰ Disponible aujourd'hui
                </label>
                <Switch
                  checked={localFilters.availableToday || false}
                  onCheckedChange={(checked) => handleFilterChange("availableToday", checked || undefined)}
                />
              </div>
              
              {/* Futurs filtres */}
              <div className="space-y-2 opacity-60">
                <div className="flex items-center justify-between">
                  <label className="text-sm">🏆 Pros certifiés</label>
                  <Switch disabled />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm">🚗 Déplacement à domicile</label>
                  <Switch disabled />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm">💳 Paiement en ligne</label>
                  <Switch disabled />
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={resetFilters}
              disabled={!hasActiveFilters}
            >
              🗑️ Réinitialiser
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={() => {
                  applyFilters();
                  setIsOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Appliquer les filtres
              </Button>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}