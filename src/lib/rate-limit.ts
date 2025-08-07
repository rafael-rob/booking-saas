import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Configuration Redis (utilise une Map en fallback pour le développement local)
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : undefined;

// Fallback en mémoire pour le développement local
const memoryStore = new Map();

class MemoryRatelimit {
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  async limit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: Date;
    pending?: Promise<unknown>;
  }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Nettoie les anciennes entrées
    const key = `ratelimit:${identifier}`;
    const requests = memoryStore.get(key) || [];
    const validRequests = requests.filter((timestamp: number) => timestamp > windowStart);
    
    const remaining = Math.max(0, this.limit - validRequests.length);
    const success = validRequests.length < this.limit;
    
    if (success) {
      validRequests.push(now);
      memoryStore.set(key, validRequests);
    }
    
    return {
      success,
      limit: this.limit,
      remaining: remaining - (success ? 1 : 0),
      reset: new Date(now + this.windowMs),
    };
  }
}

// Configurations de rate limiting pour différentes routes
const rateLimitConfigs = {
  // Authentification - strict
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 tentatives par 15 minutes
        analytics: true,
      })
    : new MemoryRatelimit(5, 15 * 60 * 1000),

  // Création de compte - très strict
  register: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 créations par heure
        analytics: true,
      })
    : new MemoryRatelimit(3, 60 * 60 * 1000),

  // API générales - modéré
  api: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requêtes par minute
        analytics: true,
      })
    : new MemoryRatelimit(100, 60 * 1000),

  // Réservations - modéré mais protégé
  booking: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 réservations par minute
        analytics: true,
      })
    : new MemoryRatelimit(10, 60 * 1000),

  // Recherche - permissif
  search: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(200, "1 m"), // 200 recherches par minute
        analytics: true,
      })
    : new MemoryRatelimit(200, 60 * 1000),

  // Upload de fichiers - strict
  upload: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 h"), // 20 uploads par heure
        analytics: true,
      })
    : new MemoryRatelimit(20, 60 * 60 * 1000),

  // Emails/SMS - très strict
  notification: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 notifications par heure
        analytics: true,
      })
    : new MemoryRatelimit(5, 60 * 60 * 1000),
};

export type RateLimitType = keyof typeof rateLimitConfigs;

// Fonction pour obtenir l'identifiant de l'utilisateur/IP
function getIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Essaie de récupérer la vraie IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";
  
  return `ip:${ip}`;
}

// Middleware de rate limiting
export async function rateLimit(
  request: NextRequest,
  type: RateLimitType,
  userId?: string
): Promise<{
  success: boolean;
  response?: NextResponse;
  headers?: Record<string, string>;
}> {
  try {
    const identifier = getIdentifier(request, userId);
    const limiter = rateLimitConfigs[type];
    
    const result = await limiter.limit(identifier);
    
    const headers = {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.reset.toISOString(),
    };
    
    if (!result.success) {
      const response = NextResponse.json(
        {
          error: "Trop de requêtes",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: Math.ceil((result.reset.getTime() - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString(),
          },
        }
      );
      
      return { success: false, response };
    }
    
    return { success: true, headers };
  } catch (error) {
    console.error("Erreur rate limiting:", error);
    // En cas d'erreur, on autorise la requête (fail open)
    return { success: true };
  }
}

// Wrapper pour les routes avec rate limiting
export function withRateLimit<T = any>(
  type: RateLimitType,
  handler: (request: NextRequest, context: { params: T }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: T }) => {
    const rateLimitResult = await rateLimit(request, type);
    
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }
    
    const response = await handler(request, context);
    
    // Ajoute les headers de rate limit à la réponse
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    
    return response;
  };
}

// Wrapper combiné avec authentification et rate limiting
export function withAuthAndRateLimit<T = any>(
  type: RateLimitType,
  handler: (request: NextRequest, context: { params: T }, userId: string) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: T }) => {
    // D'abord vérifier l'authentification pour obtenir l'userId
    try {
      const { requireAuth } = await import("./auth-middleware");
      const user = await requireAuth(request);
      
      // Puis appliquer le rate limiting avec l'userId
      const rateLimitResult = await rateLimit(request, type, user.id);
      
      if (!rateLimitResult.success) {
        return rateLimitResult.response!;
      }
      
      const response = await handler(request, context, user.id);
      
      // Ajoute les headers de rate limit à la réponse
      if (rateLimitResult.headers) {
        Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      
      return response;
    } catch (error: any) {
      // Si l'auth échoue, on fait le rate limiting par IP
      const rateLimitResult = await rateLimit(request, type);
      
      if (!rateLimitResult.success) {
        return rateLimitResult.response!;
      }
      
      // Retourne l'erreur d'authentification originale
      return NextResponse.json(
        {
          error: error.message || "Non autorisé",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }
  };
}

// Rate limiting spécialisé pour les formulaires publics
export function withPublicFormRateLimit<T = any>(
  handler: (request: NextRequest, context: { params: T }) => Promise<NextResponse>
) {
  return withRateLimit("booking", handler);
}

// Rate limiting pour les APIs de recherche
export function withSearchRateLimit<T = any>(
  handler: (request: NextRequest, context: { params: T }) => Promise<NextResponse>
) {
  return withRateLimit("search", handler);
}

// Nettoyage automatique de la mémoire (pour le fallback local)
if (!redis) {
  setInterval(() => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    for (const [key, requests] of memoryStore.entries()) {
      if (Array.isArray(requests)) {
        const validRequests = requests.filter((timestamp: number) => timestamp > oneDayAgo);
        if (validRequests.length === 0) {
          memoryStore.delete(key);
        } else {
          memoryStore.set(key, validRequests);
        }
      }
    }
  }, 60 * 60 * 1000); // Nettoyage toutes les heures
}

// Métriques et monitoring (optionnel)
export async function getRateLimitMetrics(userId?: string) {
  if (!redis || !userId) return null;
  
  try {
    const keys = await redis.keys(`ratelimit:user:${userId}:*`);
    const metrics = await Promise.all(
      keys.map(async (key) => {
        const data = await redis.get(key);
        return { key, data };
      })
    );
    
    return metrics;
  } catch (error) {
    console.error("Erreur récupération métriques rate limit:", error);
    return null;
  }
}