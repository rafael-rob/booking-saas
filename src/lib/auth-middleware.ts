import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { z } from "zod";

// Types pour les erreurs d'authentification
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code: string = "UNAUTHORIZED"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// Interface pour la session étendue
export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
}

// Helper pour vérifier l'authentification
export async function requireAuth(request?: NextRequest): Promise<AuthenticatedUser> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.email) {
      throw new AuthError("Session non valide ou expirée", 401, "INVALID_SESSION");
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError("Erreur d'authentification", 500, "AUTH_ERROR");
  }
}

// Middleware pour vérifier les permissions sur les ressources
export async function requireResourceAccess(
  resourceUserId: string,
  currentUser?: AuthenticatedUser
): Promise<void> {
  if (!currentUser) {
    currentUser = await requireAuth();
  }
  
  if (currentUser.id !== resourceUserId) {
    throw new AuthError("Accès non autorisé à cette ressource", 403, "FORBIDDEN_RESOURCE");
  }
}

// Wrapper pour les routes API protégées
export function withAuth<T = any>(
  handler: (request: NextRequest, context: { params: T }, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: T }) => {
    try {
      const user = await requireAuth(request);
      return await handler(request, context, user);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
          },
          { status: error.statusCode }
        );
      }
      
      console.error("Erreur inattendue dans withAuth:", error);
      return NextResponse.json(
        {
          error: "Erreur interne du serveur",
          code: "INTERNAL_ERROR",
        },
        { status: 500 }
      );
    }
  };
}

// Wrapper pour vérifier l'accès aux ressources utilisateur
export function withUserResourceAuth<T extends { userId: string }>(
  handler: (request: NextRequest, context: { params: T }, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return withAuth<T>(async (request, context, user) => {
    try {
      await requireResourceAccess(context.params.userId, user);
      return await handler(request, context, user);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
          },
          { status: error.statusCode }
        );
      }
      throw error;
    }
  });
}

// Validation des paramètres avec authentification
export function withValidatedAuth<TBody, TParams extends Record<string, any>>(
  bodySchema: z.ZodSchema<TBody>,
  paramsSchema?: z.ZodSchema<TParams>,
  handler?: (
    request: NextRequest,
    body: TBody,
    params: TParams,
    user: AuthenticatedUser
  ) => Promise<NextResponse>
) {
  if (!handler && paramsSchema) {
    // Si pas de handler fourni, paramsSchema est en fait le handler
    const actualHandler = paramsSchema as any;
    paramsSchema = undefined;
    
    return withAuth(async (request, context, user) => {
      try {
        const rawBody = await request.json();
        const bodyResult = bodySchema.safeParse(rawBody);
        
        if (!bodyResult.success) {
          return NextResponse.json(
            {
              error: "Données invalides",
              code: "VALIDATION_ERROR",
              issues: bodyResult.error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message,
              })),
            },
            { status: 400 }
          );
        }
        
        return await actualHandler(request, bodyResult.data, context.params, user);
      } catch (error) {
        if (error instanceof SyntaxError) {
          return NextResponse.json(
            {
              error: "JSON invalide",
              code: "INVALID_JSON",
            },
            { status: 400 }
          );
        }
        throw error;
      }
    });
  }
  
  return withAuth(async (request, context, user) => {
    try {
      // Validation du body
      const rawBody = await request.json();
      const bodyResult = bodySchema.safeParse(rawBody);
      
      if (!bodyResult.success) {
        return NextResponse.json(
          {
            error: "Données invalides",
            code: "VALIDATION_ERROR",
            issues: bodyResult.error.issues.map(issue => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }
      
      // Validation des paramètres si schéma fourni
      let validatedParams = context.params;
      if (paramsSchema) {
        const paramsResult = paramsSchema.safeParse(context.params);
        if (!paramsResult.success) {
          return NextResponse.json(
            {
              error: "Paramètres invalides",
              code: "INVALID_PARAMS",
              issues: paramsResult.error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message,
              })),
            },
            { status: 400 }
          );
        }
        validatedParams = paramsResult.data;
      }
      
      return await handler!(request, bodyResult.data, validatedParams, user);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          {
            error: "JSON invalide",
            code: "INVALID_JSON",
          },
          { status: 400 }
        );
      }
      throw error;
    }
  });
}

// Middleware pour les routes GET avec pagination
export function withPaginatedAuth<TQuery, TParams = any>(
  querySchema: z.ZodSchema<TQuery>,
  handler: (
    request: NextRequest,
    query: TQuery,
    params: TParams,
    user: AuthenticatedUser
  ) => Promise<NextResponse>
) {
  return withAuth<TParams>(async (request, context, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const queryObject = Object.fromEntries(searchParams.entries());
      
      const queryResult = querySchema.safeParse(queryObject);
      
      if (!queryResult.success) {
        return NextResponse.json(
          {
            error: "Paramètres de requête invalides",
            code: "INVALID_QUERY",
            issues: queryResult.error.issues.map(issue => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }
      
      return await handler(request, queryResult.data, context.params, user);
    } catch (error) {
      throw error;
    }
  });
}

// Helper pour créer des réponses d'erreur standardisées
export function createErrorResponse(
  message: string,
  statusCode: number = 400,
  code: string = "BAD_REQUEST",
  details?: any
) {
  return NextResponse.json(
    {
      error: message,
      code,
      ...(details && { details }),
    },
    { status: statusCode }
  );
}

// Helper pour créer des réponses de succès standardisées
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status: statusCode }
  );
}