import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { getHealthCheckService } from '@/lib/health-check';
import { withAuth } from '@/lib/auth-middleware';
import { applyRateLimit } from '@/lib/rate-limit';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Health check détaillé (authentifié)
 *     description: Retourne l'état de santé détaillé de tous les services du système
 *     tags: [Health]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: État de santé détaillé du système
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: database
 *                       status:
 *                         type: string
 *                         enum: [healthy, degraded, unhealthy]
 *                         example: healthy
 *                       responseTime:
 *                         type: number
 *                         description: Temps de réponse en millisecondes
 *                         example: 45
 *                       details:
 *                         type: object
 *                         description: Détails spécifiques au service
 *                       error:
 *                         type: string
 *                         description: Message d'erreur si le service est défaillant
 *                 system:
 *                   type: object
 *                   properties:
 *                     memory:
 *                       type: object
 *                       properties:
 *                         rss:
 *                           type: number
 *                         heapTotal:
 *                           type: number
 *                         heapUsed:
 *                           type: number
 *                         external:
 *                           type: number
 *                     cpu:
 *                       type: number
 *                       description: Utilisation CPU en pourcentage
 *                     platform:
 *                       type: string
 *                       example: linux
 *                     nodeVersion:
 *                       type: string
 *                       example: v18.17.0
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ApiError'
 */
export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Apply rate limiting (more restrictive for detailed endpoint)
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

    const healthService = getHealthCheckService(prisma);
    const detailedHealth = await healthService.getDetailedHealth();

    return NextResponse.json(detailedHealth, {
      status: detailedHealth.status === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Detailed health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: 0,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: [],
        system: {
          memory: process.memoryUsage(),
          cpu: 0,
          platform: process.platform,
          nodeVersion: process.version,
        },
        error: 'Detailed health check failed',
      },
      { status: 500 }
    );
  }
});