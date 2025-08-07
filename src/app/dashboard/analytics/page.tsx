'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Euro, 
  Calendar, 
  Activity, 
  Server, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

interface BusinessMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  monthlyBookings: number;
  averageBookingValue: number;
  conversionRate: number;
  popularServices: Array<{
    id: string;
    name: string;
    bookingCount: number;
    revenue: number;
  }>;
  clientMetrics: {
    totalClients: number;
    newClientsThisMonth: number;
    returningClientsRate: number;
    averageClientValue: number;
  };
}

interface SystemMetrics {
  requestsPerMinute: number;
  responseTimeAvg: number;
  errorRate: number;
  cacheHitRate: number;
  databaseConnectionCount: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage: number;
}

interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  businessMetrics: BusinessMetrics;
  systemMetrics: SystemMetrics;
  trends: {
    bookingsTrend: Array<{ date: string; count: number; revenue: number }>;
    clientsTrend: Array<{ date: string; newClients: number; returningClients: number }>;
    serviceTrend: Array<{ date: string; serviceId: string; bookings: number }>;
  };
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchAnalytics = async (selectedPeriod: 'day' | 'week' | 'month' | 'year') => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/analytics/complete?period=${selectedPeriod}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du chargement des analytics');
      }

      setAnalyticsData(result.data);
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const formatCurrency = (amount: number) => `${amount.toFixed(2)} €`;
  const formatPercentage = (rate: number) => `${Math.round(rate * 100)}%`;
  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center text-red-600 mb-4">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span className="font-medium">Erreur de chargement</span>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchAnalytics(period)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  const { businessMetrics, systemMetrics, trends } = analyticsData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Tableau de bord des performances et métriques
          </p>
        </div>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value as any)}
          className="border rounded px-3 py-2"
        >
          <option value="day">Jour</option>
          <option value="week">Semaine</option>
          <option value="month">Mois</option>
          <option value="year">Année</option>
        </select>
      </div>

      {/* Business Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">
              Revenus {period === 'month' ? 'du mois' : 'de la période'}
            </h3>
            <Euro className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(businessMetrics.monthlyRevenue)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Total: {formatCurrency(businessMetrics.totalRevenue)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">
              Réservations {period === 'month' ? 'du mois' : 'de la période'}
            </h3>
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{businessMetrics.monthlyBookings}</div>
          <p className="text-xs text-gray-500 mt-1">
            Total: {businessMetrics.totalBookings}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Valeur Moyenne</h3>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(businessMetrics.averageBookingValue)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Par réservation</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Taux de Conversion</h3>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatPercentage(businessMetrics.conversionRate)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Visiteurs → Clients</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Services */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Services Populaires</h3>
            <p className="text-sm text-gray-600">Services les plus réservés cette période</p>
          </div>
          <div className="space-y-4">
            {businessMetrics.popularServices.slice(0, 5).map((service, index) => (
              <div key={service.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-gray-500">
                      {service.bookingCount} réservations
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(service.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Metrics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Métriques Clients</h3>
            <p className="text-sm text-gray-600">Analyse de la base de clients</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Total Clients</span>
              </div>
              <span className="font-medium">{businessMetrics.clientMetrics.totalClients}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm">Nouveaux Clients</span>
              </div>
              <span className="font-medium">{businessMetrics.clientMetrics.newClientsThisMonth}</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Clients Fidèles</span>
                <span className="text-sm font-medium">
                  {formatPercentage(businessMetrics.clientMetrics.returningClientsRate)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${businessMetrics.clientMetrics.returningClientsRate * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Valeur Moyenne Client</span>
              <span className="font-medium">
                {formatCurrency(businessMetrics.clientMetrics.averageClientValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Métriques Système</h3>
          <p className="text-sm text-gray-600">Performance et santé du système</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Requêtes/Min</span>
            </div>
            <p className="text-2xl font-bold">{systemMetrics.requestsPerMinute.toFixed(1)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Temps Réponse</span>
            </div>
            <p className="text-2xl font-bold">{systemMetrics.responseTimeAvg.toFixed(0)}ms</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className={`h-4 w-4 ${systemMetrics.errorRate > 0.05 ? 'text-red-500' : 'text-green-500'}`} />
              <span className="text-sm">Taux d'Erreur</span>
            </div>
            <p className="text-2xl font-bold">{formatPercentage(systemMetrics.errorRate)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Cache Hit Rate</span>
            </div>
            <p className="text-2xl font-bold">{formatPercentage(systemMetrics.cacheHitRate)}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Utilisation Mémoire</p>
            <p className="text-lg font-medium">
              {formatBytes(systemMetrics.memoryUsage.heapUsed)} / {formatBytes(systemMetrics.memoryUsage.heapTotal)}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${(systemMetrics.memoryUsage.heapUsed / systemMetrics.memoryUsage.heapTotal) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Utilisation CPU</p>
            <p className="text-lg font-medium">{systemMetrics.cpuUsage}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${systemMetrics.cpuUsage}%` }}
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Connexions DB</p>
            <p className="text-lg font-medium">{systemMetrics.databaseConnectionCount}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(systemMetrics.databaseConnectionCount / 20) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trends Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Résumé des Tendances</h3>
          <p className="text-sm text-gray-600">Évolution récente des métriques clés</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Points de Données</p>
            <p className="text-3xl font-bold text-blue-600">
              {trends.bookingsTrend.length}
            </p>
            <p className="text-xs text-gray-500">Réservations</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Revenus de la Période</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(
                trends.bookingsTrend.reduce((sum, item) => sum + item.revenue, 0)
              )}
            </p>
            <p className="text-xs text-gray-500">Total période</p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Services Actifs</p>
            <p className="text-3xl font-bold text-purple-600">
              {new Set(trends.serviceTrend.map(item => item.serviceId)).size}
            </p>
            <p className="text-xs text-gray-500">Services différents</p>
          </div>
        </div>
      </div>
    </div>
  );
}