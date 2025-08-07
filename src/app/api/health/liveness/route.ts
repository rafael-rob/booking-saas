import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { getHealthCheckService } from '@/lib/health-check';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/health/liveness:
 *   get:
 *     summary: Liveness probe (Kubernetes)
 *     description: Endpoint de liveness pour Kubernetes - vérifie si l'application est en vie
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application en vie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alive:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *       503:
 *         description: Application non responsive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alive:
 *                   type: boolean
 *                   example: false
 */
export async function GET(request: NextRequest) {
  try {
    const healthService = getHealthCheckService(prisma);
    const liveness = await healthService.getLiveness();

    return NextResponse.json(
      {
        ...liveness,
        timestamp: new Date().toISOString(),
      },
      {
        status: liveness.alive ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Liveness check error:', error);
    
    return NextResponse.json(
      {
        alive: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}