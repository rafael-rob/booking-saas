// src/components/dashboard/SectorDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign,
  Clock,
  Target,
  Award,
  BarChart3,
  Settings
} from "lucide-react";

import { SectorData, TimeFrame } from '@/types/dashboard';

interface SectorDashboardProps {
  sectorData: SectorData;
  onSectorChange?: (sector: string) => void;
}

export default function SectorDashboard({ sectorData, onSectorChange }: SectorDashboardProps) {
  const { data: session } = useSession();
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");

  if (!sectorData) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const { sectorConfig, sectorKpis, detectedSector } = sectorData;

  // Fonction pour formater les nombres
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  // Fonction pour formater les pourcentages
  const formatPercent = (num: number) => `${Math.round(num)}%`;

  // Fonction pour déterminer la couleur des tendances
  const getTrendColor = (trend: string) => {
    if (trend.startsWith('+')) return 'text-green-600';
    if (trend.startsWith('-')) return 'text-red-600';
    return 'text-gray-600';
  };

  // KPIs principaux selon le secteur
  const renderMainKpis = () => {
    const kpis = [];

    // KPIs universels
    kpis.push(
      {
        title: "Réservations",
        value: sectorKpis.totalBookings,
        subtitle: `${sectorKpis.monthlyBookings} ce mois`,
        icon: Calendar,
        trend: sectorKpis.trends.bookingsGrowth,
        color: "blue"
      },
      {
        title: "Clients",
        value: sectorKpis.totalClients,
        subtitle: `${formatPercent(sectorKpis.repeatClientsRate)} fidèles`,
        icon: Users,
        trend: sectorKpis.trends.clientsGrowth,
        color: "purple"
      },
      {
        title: "Chiffre d'affaires",
        value: `${sectorKpis.weeklyRevenue}€`,
        subtitle: "Cette semaine",
        icon: DollarSign,
        trend: sectorKpis.trends.revenueGrowth,
        color: "green"
      }
    );

    // KPIs spécifiques selon le secteur
    switch (detectedSector) {
      case 'barbier':
        kpis.push({
          title: "Temps moyen coupe",
          value: `${sectorKpis.averageServiceTime}min`,
          subtitle: "Efficacité optimale",
          icon: Clock,
          trend: "+5%",
          color: "gray"
        });
        break;

      case 'beaute':
        kpis.push({
          title: "Taux rebooking",
          value: formatPercent(sectorKpis.rebookingRate || 0),
          subtitle: "Fidélisation client",
          icon: Award,
          trend: "+8%",
          color: "pink"
        });
        break;

      case 'massage':
        kpis.push({
          title: "Satisfaction",
          value: `${sectorKpis.clientSatisfaction || 4.8}/5`,
          subtitle: "Niveau détente",
          icon: Target,
          trend: "+2%",
          color: "green"
        });
        break;

      case 'restaurant':
        kpis.push({
          title: "Occupation",
          value: formatPercent(sectorKpis.occupancyRate || 75),
          subtitle: "Taux de remplissage",
          icon: BarChart3,
          trend: "+12%",
          color: "red"
        });
        break;

      case 'fitness':
        kpis.push({
          title: "Rétention",
          value: formatPercent(sectorKpis.retentionRate || 0),
          subtitle: "Clients actifs",
          icon: TrendingUp,
          trend: "+15%",
          color: "purple"
        });
        break;

      case 'sante':
        kpis.push({
          title: "Ponctualité",
          value: formatPercent(sectorKpis.punctualityRate || 95),
          subtitle: "Respect horaires",
          icon: Clock,
          trend: "+1%",
          color: "blue"
        });
        break;

      default:
        kpis.push({
          title: "Prix moyen",
          value: `${sectorKpis.averagePrice}€`,
          subtitle: "Par service",
          icon: DollarSign,
          trend: "+3%",
          color: "gray"
        });
    }

    return kpis;
  };

  const mainKpis = renderMainKpis();

  return (
    <div className="space-y-6">
      {/* En-tête du secteur */}
      <div className={`bg-gradient-to-r ${sectorConfig.gradient} rounded-xl p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{sectorConfig.icon}</div>
            <div>
              <h2 className="text-2xl font-bold">{sectorConfig.name}</h2>
              <p className="text-white/80">
                Dashboard spécialisé pour votre activité
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
              Secteur détecté automatiquement
            </Badge>
            <Button
              variant="outline" 
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => onSectorChange?.(detectedSector)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      {/* Sélecteur de période */}
      <div className="flex gap-2">
        {["week", "month", "quarter"].map((period) => (
          <Button
            key={period}
            variant={selectedTimeframe === period ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTimeframe(period)}
          >
            {period === "week" ? "7 jours" : period === "month" ? "30 jours" : "3 mois"}
          </Button>
        ))}
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainKpis.map((kpi, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {kpi.title}
              </CardTitle>
              <kpi.icon className={`h-5 w-5 text-${kpi.color}-600`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {kpi.value}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {kpi.subtitle}
                </p>
                <div className={`flex items-center text-xs ${getTrendColor(kpi.trend)}`}>
                  {kpi.trend.startsWith('+') ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : kpi.trend.startsWith('-') ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : null}
                  {kpi.trend}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertes et recommandations du secteur */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Objectifs du secteur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objectifs {sectorConfig.name}
            </CardTitle>
            <CardDescription>
              Benchmarks de votre secteur d'activité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {getSectorGoals(detectedSector, sectorKpis).map((goal, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{goal.label}</span>
                  <span>{goal.current}/{goal.target}</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{goal.tip}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommandations secteur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recommandations
            </CardTitle>
            <CardDescription>
              Conseils personnalisés pour votre secteur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getSectorRecommendations(detectedSector, sectorKpis).map((rec, index) => (
                <div key={index} className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-blue-600 text-lg flex-shrink-0">
                    {rec.icon}
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 text-sm">
                      {rec.title}
                    </p>
                    <p className="text-blue-700 text-xs mt-1">
                      {rec.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fonctionnalités spécifiques au secteur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Fonctionnalités {sectorConfig.name}
          </CardTitle>
          <CardDescription>
            Outils spécialement conçus pour votre activité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getSectorFeatures(sectorConfig).map((feature, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border-2 transition-all ${
                  feature.enabled 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{feature.icon}</span>
                  <div>
                    <h4 className="font-medium text-sm">{feature.name}</h4>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </div>
                </div>
                
                {feature.enabled ? (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    ✅ Disponible
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    🔒 Bientôt disponible
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Fonctions utilitaires pour générer le contenu spécifique au secteur
function getSectorGoals(sector: string, kpis: any) {
  const goals: any = {
    barbier: [
      {
        label: "Clients fidèles (>3 visites)",
        current: Math.round(kpis.repeatClientsRate || 0),
        target: 65,
        progress: Math.min(((kpis.repeatClientsRate || 0) / 65) * 100, 100),
        tip: "Un bon barbier a 65% de clients réguliers"
      },
      {
        label: "Temps moyen par coupe",
        current: kpis.averageServiceTime || 0,
        target: 35,
        progress: kpis.averageServiceTime ? Math.min((35 / kpis.averageServiceTime) * 100, 100) : 0,
        tip: "35min est optimal pour rentabilité/qualité"
      }
    ],
    beaute: [
      {
        label: "Taux de rebooking",
        current: Math.round(kpis.rebookingRate || 0),
        target: 70,
        progress: Math.min(((kpis.rebookingRate || 0) / 70) * 100, 100),
        tip: "70% des clientes doivent reprendre RDV"
      }
    ],
    // Ajouter d'autres secteurs...
  };

  return goals[sector] || [
    {
      label: "Satisfaction client",
      current: 85,
      target: 90,
      progress: 94,
      tip: "Visez 90% de satisfaction minimum"
    }
  ];
}

function getSectorRecommendations(sector: string, kpis: any) {
  const recommendations: any = {
    barbier: [
      {
        icon: "💈",
        title: "Proposez un abonnement coupe",
        description: "Les coupes mensuelles fidélisent et garantissent le CA"
      },
      {
        icon: "📱",
        title: "Activez les rappels SMS",
        description: "Réduisez les no-shows de 70% avec des rappels automatiques"
      }
    ],
    beaute: [
      {
        icon: "✨",
        title: "Créez des forfaits soins",
        description: "Packages de 3-5 soins augmentent le panier moyen"
      },
      {
        icon: "💎",
        title: "Programme de fidélité",
        description: "Récompensez vos meilleures clientes"
      }
    ]
    // Autres secteurs...
  };

  return recommendations[sector] || [
    {
      icon: "📈",
      title: "Analysez vos performances",
      description: "Utilisez les statistiques pour optimiser votre activité"
    }
  ];
}

function getSectorFeatures(sectorConfig: any) {
  const features = [];
  
  if (sectorConfig.features.hasTeam) {
    features.push({
      name: "Gestion d'équipe",
      description: "Plannings multi-collaborateurs",
      icon: "👥",
      enabled: true
    });
  }
  
  if (sectorConfig.features.hasProducts) {
    features.push({
      name: "Vente de produits",
      description: "Boutique intégrée",
      icon: "🛍️",
      enabled: false
    });
  }
  
  if (sectorConfig.features.hasPackages) {
    features.push({
      name: "Forfaits & Packages",
      description: "Offres groupées",
      icon: "📦",
      enabled: false
    });
  }

  if (sectorConfig.features.hasLoyalty) {
    features.push({
      name: "Programme fidélité",
      description: "Points et récompenses",
      icon: "⭐",
      enabled: false
    });
  }

  if (sectorConfig.features.hasWaitlist) {
    features.push({
      name: "Liste d'attente",
      description: "Gestion automatique",
      icon: "⏳",
      enabled: false
    });
  }

  return features;
}