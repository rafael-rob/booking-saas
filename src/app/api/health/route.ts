import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { getHealthCheckService } from '@/lib/health-check';
import { applyRateLimit } from '@/lib/rate-limit';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint (basic)
 *     description: Retourne l'état de santé basique du système
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: État de santé du système
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
 *                   example: "2024-01-15T10:30:00.000Z"
 *                 uptime:
 *                   type: number
 *                   description: Uptime en millisecondes
 *                   example: 1234567
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   enum: [development, production, test]
 *                   example: production
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/ApiError'
 */
export async function GET(request: NextRequest) {
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

    const healthService = getHealthCheckService(prisma);
    const healthStatus = await healthService.getBasicHealth();

    return NextResponse.json(healthStatus, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: 0,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
}