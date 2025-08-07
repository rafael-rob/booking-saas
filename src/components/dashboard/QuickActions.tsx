// src/components/dashboard/QuickActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  Settings, 
  MessageSquare,
  FileText,
  Zap,
  TrendingUp,
  Gift,
  Clock,
  Phone
} from "lucide-react";

interface QuickActionsProps {
  sectorConfig?: any;
  userStats?: any;
}

export default function QuickActions({ sectorConfig, userStats }: QuickActionsProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleQuickAction = async (actionId: string, path: string) => {
    setIsProcessing(actionId);
    
    // Simulation d'une action
    setTimeout(() => {
      router.push(path);
      setIsProcessing(null);
    }, 500);
  };

  // Actions rapides de base
  const baseActions = [
    {
      id: "new-booking",
      title: "Nouveau RDV",
      description: "Créer une réservation manuellement",
      icon: Calendar,
      color: "blue",
      path: "/dashboard/bookings/new",
      priority: "high"
    },
    {
      id: "view-today",
      title: "Agenda du jour",
      description: "Voir les RDV d'aujourd'hui",
      icon: Clock,
      color: "green",
      path: "/dashboard/bookings?filter=today",
      priority: "high"
    },
    {
      id: "manage-clients",
      title: "Gestion clients",
      description: "Voir et contacter vos clients",
      icon: Users,
      color: "purple",
      path: "/dashboard/clients",
      priority: "medium"
    },
    {
      id: "settings",
      title: "Paramètres",
      description: "Configurer votre activité",
      icon: Settings,
      color: "gray",
      path: "/dashboard/settings",
      priority: "medium"
    }
  ];

  // Actions spécifiques au secteur
  const getSectorActions = () => {
    if (!sectorConfig) return [];

    const sectorActions: any = {
      barbier: [
        {
          id: "loyalty-program",
          title: "Programme fidélité",
          description: "Cartes de fidélité pour clients réguliers",
          icon: Gift,
          color: "yellow",
          path: "/dashboard/loyalty",
          priority: "high",
          badge: "Nouveau"
        },
        {
          id: "call-client",
          title: "Appeler un client",
          description: "Contact rapide pour confirmation",
          icon: Phone,
          color: "green",
          path: "/dashboard/clients?action=call",
          priority: "medium"
        }
      ],
      beaute: [
        {
          id: "product-sales",
          title: "Vente de produits",
          description: "Ajouter des ventes de cosmétiques",
          icon: FileText,
          color: "pink",
          path: "/dashboard/products",
          priority: "high",
          badge: "Pro"
        },
        {
          id: "beauty-packages",
          title: "Forfaits beauté",
          description: "Créer des packages de soins",
          icon: Gift,
          color: "purple",
          path: "/dashboard/packages",
          priority: "medium"
        }
      ],
      massage: [
        {
          id: "wellness-tracking",
          title: "Suivi bien-être",
          description: "Historique des séances client",
          icon: TrendingUp,
          color: "green",
          path: "/dashboard/wellness",
          priority: "high"
        },
        {
          id: "relaxation-tips",
          title: "Conseils détente",
          description: "Envoyer des tips bien-être",
          icon: MessageSquare,
          color: "blue",
          path: "/dashboard/tips",
          priority: "low"
        }
      ],
      restaurant: [
        {
          id: "table-management",
          title: "Gestion des tables",
          description: "Plan de salle et occupation",
          icon: Settings,
          color: "red",
          path: "/dashboard/tables",
          priority: "high"
        },
        {
          id: "menu-updates",
          title: "Mise à jour menu",
          description: "Modifier la carte du jour",
          icon: FileText,
          color: "orange",
          path: "/dashboard/menu",
          priority: "medium"
        }
      ],
      fitness: [
        {
          id: "workout-plans",
          title: "Programmes d'entraînement",
          description: "Créer des plans personnalisés",
          icon: Zap,
          color: "purple",
          path: "/dashboard/workouts",
          priority: "high"
        },
        {
          id: "progress-tracking",
          title: "Suivi progression",
          description: "Évolution de vos clients",
          icon: TrendingUp,
          color: "green",
          path: "/dashboard/progress",
          priority: "medium"
        }
      ],
      sante: [
        {
          id: "medical-records",
          title: "Dossiers médicaux",
          description: "Consultation des antécédents",
          icon: FileText,
          color: "blue",
          path: "/dashboard/records",
          priority: "high",
          badge: "Confidentiel"
        },
        {
          id: "prescriptions",
          title: "Prescriptions",
          description: "Gérer les ordonnances",
          icon: FileText,
          color: "green",
          path: "/dashboard/prescriptions",
          priority: "medium"
        }
      ]
    };

    return sectorActions[sectorConfig.name?.toLowerCase().includes('barbier') ? 'barbier' :
                        sectorConfig.name?.toLowerCase().includes('beauté') ? 'beaute' :
                        sectorConfig.name?.toLowerCase().includes('massage') ? 'massage' :
                        sectorConfig.name?.toLowerCase().includes('restaurant') ? 'restaurant' :
                        sectorConfig.name?.toLowerCase().includes('fitness') ? 'fitness' :
                        sectorConfig.name?.toLowerCase().includes('santé') ? 'sante' : 'general'] || [];
  };

  const sectorActions = getSectorActions();
  const allActions = [...baseActions, ...sectorActions];

  // Trier par priorité
  const sortedActions = allActions.sort((a, b) => {
    const priorities = { high: 3, medium: 2, low: 1 };
    return priorities[b.priority as keyof typeof priorities] - priorities[a.priority as keyof typeof priorities];
  });

  const getColorClasses = (color: string) => {
    const colors: any = {
      blue: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700",
      green: "bg-green-50 border-green-200 hover:bg-green-100 text-green-700",
      purple: "bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700",
      gray: "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700",
      yellow: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100 text-yellow-700",
      pink: "bg-pink-50 border-pink-200 hover:bg-pink-100 text-pink-700",
      red: "bg-red-50 border-red-200 hover:bg-red-100 text-red-700",
      orange: "bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700"
    };
    return colors[color] || colors.gray;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500" />
          Actions rapides
          {sectorConfig && (
            <Badge variant="secondary" className="ml-2">
              {sectorConfig.icon} {sectorConfig.name}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Accès rapide aux fonctionnalités les plus utilisées de votre activité
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className={`h-auto p-4 justify-start border-2 transition-all duration-200 ${getColorClasses(action.color)}`}
              onClick={() => handleQuickAction(action.id, action.path)}
              disabled={isProcessing === action.id}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="flex-shrink-0 mt-1">
                  {isProcessing === action.id ? (
                    <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <action.icon className="h-5 w-5" />
                  )}
                </div>
                
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{action.title}</h3>
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs opacity-80 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Footer avec tips */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-lg flex-shrink-0">💡</div>
            <div>
              <h4 className="font-medium text-blue-900 text-sm mb-1">
                Astuce {sectorConfig?.name || "générale"}
              </h4>
              <p className="text-blue-800 text-xs">
                {getSectorTip(sectorConfig?.name)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getSectorTip(sectorName?: string): string {
  const tips: any = {
    "Barbier / Coiffure Homme": "Proposez des créneaux courts (15min) pour les retouches entre les coupes complètes",
    "Institut de Beauté": "Groupez les soins similaires pour optimiser la préparation du matériel",
    "Masseur / Bien-être": "Laissez 10min entre chaque séance pour aérer et préparer l'espace",
    "Restaurant / Traiteur": "Réservez des créneaux plus longs le weekend pour les groupes familiaux",
    "Coach Sportif / Fitness": "Planifiez les séances d'évaluation en début de mois pour le suivi",
    "Professionnel de Santé": "Bloquez des créneaux urgence chaque jour pour les patients prioritaires"
  };

  return tips[sectorName] || "Utilisez les rappels automatiques pour réduire les absences de 70%";
}