import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { withAuth } from '@/lib/auth-middleware';
import { applyRateLimit } from '@/lib/rate-limit';
import { getMetricsCollector } from '@/lib/metrics';
import { RequestLogger } from '@/lib/logger';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/analytics/system:
 *   get:
 *     summary: Métriques système
 *     description: Retourne les métriques système (performance, erreurs, cache, mémoire)
 *     tags: [Analytics]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Métriques système récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     requestsPerMinute:
 *                       type: number
 *                       description: Requêtes par minute
 *                       example: 45.2
 *                     responseTimeAvg:
 *                       type: number
 *                       description: Temps de réponse moyen (ms)
 *                       example: 156.7
 *                     errorRate:
 *                       type: number
 *                       description: Taux d'erreur (0-1)
 *                       example: 0.023
 *                     cacheHitRate:
 *                       type: number
 *                       description: Taux de succès du cache (0-1)
 *                       example: 0.87
 *                     databaseConnectionCount:
 *                       type: integer
 *                       description: Nombre de connexions DB
 *                       example: 8
 *                     memoryUsage:
 *                       type: object
 *                       properties:
 *                         rss:
 *                           type: integer
 *                           description: Resident Set Size
 *                         heapTotal:
 *                           type: integer
 *                           description: Heap total
 *                         heapUsed:
 *                           type: integer
 *                           description: Heap utilisé
 *                         external:
 *                           type: integer
 *                           description: Mémoire externe
 *                     cpuUsage:
 *                       type: number
 *                       description: Utilisation CPU (pourcentage)
 *                       example: 12.5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ApiError'
 */
export const GET = withAuth(async (request: NextRequest, { params }, user) => {
  const requestId = RequestLogger.generateRequestId();
  const startTime = Date.now();

  try {
    // Apply rate limiting (more restrictive for system metrics)
    const rateLimitResult = await applyRateLimit('api', request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trop de requêtes',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
          },
        }
      );
    }

    // Get system metrics
    const metricsCollector = getMetricsCollector(prisma);
    const systemMetrics = await metricsCollector.getSystemMetrics();

    // Log request
    RequestLogger.logResponse(
      'GET',
      '/api/analytics/system',
      200,
      Date.now() - startTime,
      requestId,
      user.id
    );

    return NextResponse.json({
      success: true,
      data: systemMetrics,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('System analytics error:', error);
    
    RequestLogger.logError(
      error instanceof Error ? error : new Error('Unknown error'),
      'GET',
      '/api/analytics/system',
      requestId,
      user?.id
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des métriques système',
        code: 'ANALYTICS_ERROR',
      },
      { status: 500 }
    );
  }
});