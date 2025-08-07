import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

import { withAuth } from '@/lib/auth-middleware';
import { applyRateLimit } from '@/lib/rate-limit';
import { getMetricsCollector } from '@/lib/metrics';
import { RequestLogger } from '@/lib/logger';

const prisma = new PrismaClient();

const querySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('month'),
});

/**
 * @swagger
 * /api/analytics/complete:
 *   get:
 *     summary: Analytics complet
 *     description: Retourne toutes les données analytics (business + système + tendances)
 *     tags: [Analytics]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         description: Période d'analyse
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Analytics complet récupéré avec succès
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
 *                     period:
 *                       type: string
 *                       enum: [day, week, month, year]
 *                       example: month
 *                     businessMetrics:
 *                       $ref: '#/components/schemas/BusinessMetrics'
 *                     systemMetrics:
 *                       $ref: '#/components/schemas/SystemMetrics'
 *                     trends:
 *                       type: object
 *                       properties:
 *                         bookingsTrend:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                               count:
 *                                 type: integer
 *                               revenue:
 *                                 type: number
 *                         clientsTrend:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                               newClients:
 *                                 type: integer
 *                               returningClients:
 *                                 type: integer
 *                         serviceTrend:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                               serviceId:
 *                                 type: string
 *                               bookings:
 *                                 type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
    // Apply rate limiting (most restrictive for complete analytics)
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      period: searchParams.get('period'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Paramètres invalides',
          code: 'VALIDATION_ERROR',
          issues: queryResult.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { period } = queryResult.data;

    // Get complete analytics data
    const metricsCollector = getMetricsCollector(prisma);
    const analyticsData = await metricsCollector.getAnalyticsData(user.id, period);

    // Log request
    RequestLogger.logResponse(
      'GET',
      '/api/analytics/complete',
      200,
      Date.now() - startTime,
      requestId,
      user.id
    );

    return NextResponse.json({
      success: true,
      data: analyticsData,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Complete analytics error:', error);
    
    RequestLogger.logError(
      error instanceof Error ? error : new Error('Unknown error'),
      'GET',
      '/api/analytics/complete',
      requestId,
      user?.id
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des analytics complètes',
        code: 'ANALYTICS_ERROR',
      },
      { status: 500 }
    );
  }
});