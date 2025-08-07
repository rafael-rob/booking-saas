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
 * /api/analytics/business:
 *   get:
 *     summary: Métriques business
 *     description: Retourne les métriques business détaillées (revenus, réservations, clients)
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
 *         description: Métriques business récupérées avec succès
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
 *                     totalRevenue:
 *                       type: number
 *                       description: Revenus total
 *                       example: 15750.50
 *                     monthlyRevenue:
 *                       type: number
 *                       description: Revenus de la période
 *                       example: 2340.00
 *                     totalBookings:
 *                       type: integer
 *                       description: Nombre total de réservations
 *                       example: 245
 *                     monthlyBookings:
 *                       type: integer
 *                       description: Réservations de la période
 *                       example: 32
 *                     averageBookingValue:
 *                       type: number
 *                       description: Valeur moyenne par réservation
 *                       example: 73.13
 *                     conversionRate:
 *                       type: number
 *                       description: Taux de conversion
 *                       example: 0.15
 *                     popularServices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           bookingCount:
 *                             type: integer
 *                           revenue:
 *                             type: number
 *                     clientMetrics:
 *                       type: object
 *                       properties:
 *                         totalClients:
 *                           type: integer
 *                         newClientsThisMonth:
 *                           type: integer
 *                         returningClientsRate:
 *                           type: number
 *                         averageClientValue:
 *                           type: number
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
    // Apply rate limiting
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

    // Get business metrics
    const metricsCollector = getMetricsCollector(prisma);
    const businessMetrics = await metricsCollector.getBusinessMetrics(user.id, period);

    // Log request
    RequestLogger.logResponse(
      'GET',
      '/api/analytics/business',
      200,
      Date.now() - startTime,
      requestId,
      user.id
    );

    return NextResponse.json({
      success: true,
      data: businessMetrics,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Business analytics error:', error);
    
    RequestLogger.logError(
      error instanceof Error ? error : new Error('Unknown error'),
      'GET',
      '/api/analytics/business',
      requestId,
      user?.id
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des métriques business',
        code: 'ANALYTICS_ERROR',
      },
      { status: 500 }
    );
  }
});