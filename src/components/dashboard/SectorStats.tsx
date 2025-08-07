// src/components/dashboard/SectorStats.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Zap,
  AlertTriangle
} from "lucide-react";

interface SectorStatsProps {
  sectorConfig: any;
  sectorKpis: any;
  userStats?: any;
}

export default function SectorStats({ sectorConfig, sectorKpis, userStats }: SectorStatsProps) {
  
  // Fonction pour déterminer le niveau de performance
  const getPerformanceLevel = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio >= 0.9) return { level: "excellent", color: "green", label: "Excellent" };
    if (ratio >= 0.7) return { level: "good", color: "blue", label: "Bien" };
    if (ratio >= 0.5) return { level: "average", color: "yellow", label: "Moyen" };
    return { level: "poor", color: "red", label: "À améliorer" };
  };

  // Benchmarks par secteur
  const getSectorBenchmarks = () => {
    const benchmarks: any = {
      barbier: {
        clientRetention: 65,
        averageServiceTime: 35,
        monthlyBookings: 120,
        noShowRate: 15,
        pricePerService: 30
      },
      beaute: {
        clientRetention: 70,
        rebookingRate: 60,
        monthlyBookings: 80,
        noShowRate: 12,
        averageBasket: 55
      },
      massage: {
        clientSatisfaction: 4.5,
        sessionLength: 60,
        monthlyBookings: 90,
        retentionRate: 75,
        pricePerHour: 60
      },
      restaurant: {
        tableOccupancy: 75,
        averageTableTime: 90,
        noShowRate: 8,
        weekendBookings: 85,
        customerSatisfaction: 4.2
      },
      fitness: {
        clientProgression: 80,
        retentionRate: 85,
        monthlyBookings: 100,
        averageSessionTime: 60,
        satisfactionScore: 4.4
      },
      sante: {
        punctuality: 95,
        patientSatisfaction: 4.6,
        followUpRate: 60,
        monthlyConsultations: 150,
        emergencyRate: 10
      }
    };

    const sector = sectorConfig.name?.toLowerCase().includes('barbier') ? 'barbier' :
                  sectorConfig.name?.toLowerCase().includes('beauté') ? 'beaute' :
                  sectorConfig.name?.toLowerCase().includes('massage') ? 'massage' :
                  sectorConfig.name?.toLowerCase().includes('restaurant') ? 'restaurant' :
                  sectorConfig.name?.toLowerCase().includes('fitness') ? 'fitness' :
                  sectorConfig.name?.toLowerCase().includes('santé') ? 'sante' : null;

    return sector ? benchmarks[sector] : null;
  };

  const benchmarks = getSectorBenchmarks();

  // Calcul des statistiques avec comparaison aux benchmarks
  const getStatCards = () => {
    const stats = [];

    // Statistiques universelles
    stats.push({
      title: "Réservations mensuelles",
      current: sectorKpis.monthlyBookings || 0,
      target: benchmarks?.monthlyBookings || 100,
      icon: Calendar,
      format: "number",
      trend: sectorKpis.trends?.bookingsGrowth || "0%"
    });

    stats.push({
      title: "Taux de fidélisation",
      current: sectorKpis.repeatClientsRate || 0,
      target: benchmarks?.clientRetention || 70,
      icon: Users,
      format: "percent",
      trend: sectorKpis.trends?.clientsGrowth || "0%"
    });

    stats.push({
      title: "Prix moyen service",
      current: sectorKpis.averagePrice || 0,
      target: benchmarks?.pricePerService || sectorKpis.averagePrice || 50,
      icon: DollarSign,
      format: "currency",
      trend: sectorKpis.trends?.revenueGrowth || "0%"
    });

    stats.push({
      title: "Temps moyen service",
      current: sectorKpis.averageServiceTime || 0,
      target: benchmarks?.averageServiceTime || sectorKpis.averageServiceTime || 60,
      icon: Clock,
      format: "minutes",
      trend: "+2%"
    });

    return stats;
  };

  const statCards = getStatCards();

  // Alertes et recommandations
  const getAlerts = () => {
    const alerts = [];
    
    if (sectorKpis.noShowRate > 20) {
      alerts.push({
        type: "warning",
        icon: "⚠️",
        title: "Taux d'absence élevé",
        message: "Activez les rappels SMS pour réduire les no-shows",
        action: "Configurer les rappels"
      });
    }

    if (sectorKpis.repeatClientsRate < 40) {
      alerts.push({
        type: "info",
        icon: "💡",
        title: "Fidélisation à améliorer",
        message: "Proposez un programme de fidélité ou des forfaits",
        action: "Voir les options"
      });
    }

    if (sectorKpis.monthlyBookings < (benchmarks?.monthlyBookings || 0) * 0.5) {
      alerts.push({
        type: "error",
        icon: "🚨",
        title: "Volume de réservations faible",
        message: "Votre activité est en dessous des standards du secteur",
        action: "Plan d'action"
      });
    }

    return alerts;
  };

  const alerts = getAlerts();

  return (
    <div className="space-y-6">
      
      {/* Statistiques principales avec benchmarks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const performance = getPerformanceLevel(stat.current, stat.target);
          const progress = Math.min((stat.current / stat.target) * 100, 100);
          
          return (
            <Card key={index} className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-1 h-full bg-${performance.color}-500`}></div>
              
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.format === "percent" ? `${Math.round(stat.current)}%` :
                   stat.format === "currency" ? `${stat.current}€` :
                   stat.format === "minutes" ? `${stat.current}min` :
                   stat.current.toLocaleString()}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Objectif : {stat.format === "percent" ? `${stat.target}%` :
                                stat.format === "currency" ? `${stat.target}€` :
                                stat.format === "minutes" ? `${stat.target}min` :
                                stat.target.toLocaleString()}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={`bg-${performance.color}-100 text-${performance.color}-800`}
                    >
                      {performance.label}
                    </Badge>
                  </div>
                  
                  <Progress 
                    value={progress} 
                    className="h-2" 
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {Math.round(progress)}% de l'objectif
                    </span>
                    <div className={`flex items-center text-xs ${
                      stat.trend.startsWith('+') ? 'text-green-600' : 
                      stat.trend.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {stat.trend.startsWith('+') ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : stat.trend.startsWith('-') ? (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      ) : null}
                      {stat.trend}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alertes et recommandations */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Points d'attention
            </CardTitle>
            <CardDescription className="text-orange-700">
              Recommandations pour optimiser votre activité {sectorConfig.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                  <span className="text-lg">{alert.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{alert.title}</h4>
                    <p className="text-gray-600 text-xs mt-1">{alert.message}</p>
                  </div>
                  <button className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded hover:bg-orange-200 transition-colors">
                    {alert.action}
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparaison sectorielle */}
      {benchmarks && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Comparaison sectorielle
            </CardTitle>
            <CardDescription>
              Votre performance vs la moyenne du secteur {sectorConfig.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Performance globale */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Score global
                </h4>
                
                <div className="space-y-3">
                  {statCards.slice(0, 3).map((stat, index) => {
                    const performance = getPerformanceLevel(stat.current, stat.target);
                    const progress = Math.min((stat.current / stat.target) * 100, 100);
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{stat.title}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-${performance.color}-500 transition-all duration-500`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium text-${performance.color}-600`}>
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Position dans le secteur */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Position sectorielle
                </h4>
                
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    Top 25%
                  </div>
                  <p className="text-sm text-blue-800 mb-4">
                    Vous êtes dans le quart supérieur des {sectorConfig.name?.toLowerCase()}
                  </p>
                  <div className="flex justify-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      🏆 Performant
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}