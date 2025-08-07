import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { getHealthCheckService } from '@/lib/health-check';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/health/readiness:
 *   get:
 *     summary: Readiness probe (Kubernetes)
 *     description: Endpoint de readiness pour Kubernetes - vérifie si l'application est prête à recevoir du trafic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application prête à recevoir du trafic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ready:
 *                   type: boolean
 *                   example: true
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Détails sur l'état de préparation
 *                   example: []
 *       503:
 *         description: Application non prête
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ready:
 *                   type: boolean
 *                   example: false
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Database not ready"]
 */
export async function GET(request: NextRequest) {
  try {
    const healthService = getHealthCheckService(prisma);
    const readiness = await healthService.getReadiness();

    const statusCode = readiness.ready ? 200 : 503;

    return NextResponse.json(readiness, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Readiness check error:', error);
    
    return NextResponse.json(
      {
        ready: false,
        details: ['Readiness check failed'],
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}