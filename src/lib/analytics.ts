// src/lib/analytics.ts

export interface AnalyticsData {
  // Métriques de base
  totalBookings: number;
  totalRevenue: number;
  totalClients: number;
  averageBookingValue: number;

  // Métriques temporelles
  bookingsThisMonth: number;
  bookingsLastMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;

  // Taux et conversions
  conversionRate: number; // Visiteurs → Réservations
  noShowRate: number; // Taux d'absence
  repeatClientRate: number; // Taux de fidélisation
  cancellationRate: number; // Taux d'annulation

  // Analyses par service
  serviceStats: ServiceAnalytics[];

  // Analyses temporelles
  hourlyDistribution: HourlyStats[];
  dailyDistribution: DailyStats[];
  monthlyTrends: MonthlyStats[];

  // Analyses clients
  topClients: ClientStats[];
  clientSegments: ClientSegment[];

  // Métriques avancées
  peakHours: string[];
  bestDays: string[];
  seasonalTrends: SeasonalTrend[];
  revenueForecasting: ForecastData[];
}

export interface ServiceAnalytics {
  serviceId: string;
  serviceName: string;
  totalBookings: number;
  totalRevenue: number;
  averagePrice: number;
  conversionRate: number;
  popularTimeSlots: string[];
  clientSatisfaction?: number;
}

export interface HourlyStats {
  hour: string; // "09:00"
  bookings: number;
  revenue: number;
  conversionRate: number;
}

export interface DailyStats {
  day: string; // "Lundi"
  bookings: number;
  revenue: number;
  averageBookingValue: number;
}

export interface MonthlyStats {
  month: string; // "2024-01"
  bookings: number;
  revenue: number;
  newClients: number;
  returningClients: number;
}

export interface ClientStats {
  clientId: string;
  clientName: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking: Date;
  averageTimeBetweenBookings: number; // en jours
  preferredServices: string[];
  riskOfChurn: "low" | "medium" | "high";
}

export interface ClientSegment {
  segment: "new" | "regular" | "vip" | "at_risk";
  count: number;
  totalRevenue: number;
  averageBookingValue: number;
  description: string;
}

export interface SeasonalTrend {
  season: "spring" | "summer" | "autumn" | "winter";
  averageBookings: number;
  growth: number; // % vs saison précédente
  recommendations: string[];
}

export interface ForecastData {
  month: string;
  predictedBookings: number;
  predictedRevenue: number;
  confidence: number; // 0-100%
}

// Générateur de recommandations intelligentes
export function generateRecommendations(
  analytics: AnalyticsData
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Recommandation sur les créneaux
  if (analytics.peakHours.length > 0) {
    recommendations.push({
      type: "scheduling",
      priority: "medium",
      title: "Optimisez vos créneaux populaires",
      description: `Vos heures de pointe sont ${analytics.peakHours.join(
        ", "
      )}. Considérez augmenter vos tarifs ou ajouter des créneaux.`,
      action: "Modifier les disponibilités",
    });
  }

  // Recommandation sur le no-show
  if (analytics.noShowRate > 15) {
    recommendations.push({
      type: "retention",
      priority: "high",
      title: "Réduisez vos absences",
      description: `${analytics.noShowRate.toFixed(
        1
      )}% de vos clients ne viennent pas. Activez les rappels SMS.`,
      action: "Configurer les rappels",
    });
  }

  // Recommandation sur les prix
  if (analytics.averageBookingValue < 50) {
    recommendations.push({
      type: "pricing",
      priority: "medium",
      title: "Revoyez vos tarifs",
      description: `Votre panier moyen (${analytics.averageBookingValue.toFixed(
        0
      )}€) est peut-être trop bas.`,
      action: "Analyser la concurrence",
    });
  }

  // Recommandation sur la fidélisation
  if (analytics.repeatClientRate < 30) {
    recommendations.push({
      type: "retention",
      priority: "high",
      title: "Fidélisez vos clients",
      description: `Seulement ${analytics.repeatClientRate.toFixed(
        1
      )}% de vos clients reviennent. Créez un programme de fidélité.`,
      action: "Mettre en place des offres fidélité",
    });
  }

  return recommendations;
}

export interface Recommendation {
  type: "scheduling" | "pricing" | "retention" | "marketing";
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
  action: string;
}

// Calculs avancés
export function calculateClientLifetimeValue(
  clientStats: ClientStats[]
): number {
  const avgBookingsPerClient =
    clientStats.reduce((sum, client) => sum + client.totalBookings, 0) /
    clientStats.length;
  const avgSpendPerClient =
    clientStats.reduce((sum, client) => sum + client.totalSpent, 0) /
    clientStats.length;
  const avgLifespan =
    clientStats.reduce((sum, client) => {
      const daysSinceFirst =
        (new Date().getTime() - client.lastBooking.getTime()) /
        (1000 * 60 * 60 * 24);
      return sum + daysSinceFirst;
    }, 0) / clientStats.length;

  return avgSpendPerClient * (avgLifespan / 365); // LTV annuelle
}

export function predictChurnRisk(
  client: ClientStats
): "low" | "medium" | "high" {
  const daysSinceLastBooking =
    (new Date().getTime() - client.lastBooking.getTime()) /
    (1000 * 60 * 60 * 24);
  const expectedReturn = client.averageTimeBetweenBookings * 1.5;

  if (daysSinceLastBooking > expectedReturn * 2) return "high";
  if (daysSinceLastBooking > expectedReturn) return "medium";
  return "low";
}
