import { NextRequest, NextResponse } from 'next/server';

import { swaggerSpec } from '@/lib/swagger';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: OpenAPI Specification
 *     description: Retourne la spécification OpenAPI 3.0 complète de l'API
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Spécification OpenAPI
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Spécification OpenAPI 3.0 complète
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(swaggerSpec, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating API documentation:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Impossible de générer la documentation API',
        code: 'DOCS_GENERATION_ERROR',
      },
      { status: 500 }
    );
  }
}