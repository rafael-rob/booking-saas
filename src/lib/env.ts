import { z } from "zod";

// Schéma de validation pour les variables d'environnement
const envSchema = z.object({
  // Base de données
  DATABASE_URL: z.string().url("DATABASE_URL doit être une URL valide"),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL doit être une URL valide"),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET doit faire au moins 32 caractères"),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY requis"),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1, "STRIPE_PUBLISHABLE_KEY requis"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET requis"),
  
  // Rate limiting (optionnel pour le développement)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Email (optionnel)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  
  // Twilio (optionnel)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // Google Calendar (optionnel)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Monitoring (optionnel)
  SENTRY_DSN: z.string().url().optional(),
  
  // Environnement
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Sécurité
  ALLOWED_ORIGINS: z.string().optional(),
  API_SECRET_KEY: z.string().min(32, "API_SECRET_KEY doit faire au moins 32 caractères").optional(),
  
  // Features flags
  FEATURE_ANALYTICS: z.string().transform(val => val === "true").optional(),
  FEATURE_NOTIFICATIONS: z.string().transform(val => val === "true").optional(),
  FEATURE_INTEGRATIONS: z.string().transform(val => val === "true").optional(),
});

// Type TypeScript pour les variables d'environnement
export type Env = z.infer<typeof envSchema>;

// Fonction pour valider et obtenir les variables d'environnement
function getValidatedEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
      throw new Error(`Variables d'environnement invalides ou manquantes:\n${missingVars}`);
    }
    throw error;
  }
}

// Variables d'environnement validées et typées
export const env = getValidatedEnv();

// Helpers pour vérifier les fonctionnalités activées
export const features = {
  analytics: env.FEATURE_ANALYTICS ?? false,
  notifications: env.FEATURE_NOTIFICATIONS ?? false,
  integrations: env.FEATURE_INTEGRATIONS ?? false,
  rateLimit: !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
  email: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD),
  sms: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
  googleCalendar: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  monitoring: !!env.SENTRY_DSN,
};

// Configuration pour les CORS
export const corsConfig = {
  origin: env.ALLOWED_ORIGINS 
    ? env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : env.NODE_ENV === 'production' 
      ? []  // En production, spécifier explicitement les origines
      : ['http://localhost:3000', 'http://127.0.0.1:3000'], // En dev, autoriser localhost
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Fonction pour masquer les secrets dans les logs
export function sanitizeEnvForLogging(): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  Object.entries(process.env).forEach(([key, value]) => {
    if (!value) return;
    
    // Liste des clés qui contiennent des secrets
    const secretKeys = [
      'SECRET', 'PASSWORD', 'TOKEN', 'KEY', 'PRIVATE',
      'DATABASE_URL', 'STRIPE_', 'TWILIO_', 'SMTP_PASSWORD',
      'GOOGLE_CLIENT_SECRET', 'SENTRY_DSN'
    ];
    
    const isSecret = secretKeys.some(secretKey => key.toUpperCase().includes(secretKey));
    
    if (isSecret) {
      sanitized[key] = `***${value.slice(-4)}`; // Montre seulement les 4 derniers caractères
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
}

// Validation au démarrage de l'application
export function validateEnvironment(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map(err => `${err.path.join('.')}: ${err.message}`));
    }
  }
  
  // Vérifications spécifiques à l'environnement
  if (env.NODE_ENV === 'production') {
    // En production, certaines variables sont obligatoires
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      warnings.push('Rate limiting Redis non configuré - utilisation de la mémoire locale');
    }
    
    if (!env.SENTRY_DSN) {
      warnings.push('Monitoring Sentry non configuré');
    }
    
    if (!env.ALLOWED_ORIGINS) {
      warnings.push('ALLOWED_ORIGINS non défini - CORS restrictif activé');
    }
    
    // Vérification de la force des secrets
    if (env.NEXTAUTH_SECRET.length < 64) {
      warnings.push('NEXTAUTH_SECRET devrait faire au moins 64 caractères en production');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Fonction utilitaire pour vérifier si on est en développement
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Configuration de base de données avec pool de connexions
export const databaseConfig = {
  url: env.DATABASE_URL,
  // Configuration du pool pour production
  ...(isProduction && {
    pool: {
      min: 2,
      max: 10,
      createTimeoutMillis: 8000,
      acquireTimeoutMillis: 8000,
      idleTimeoutMillis: 8000,
      reapIntervalMillis: 1000,
    },
  }),
};

// Validation au chargement du module
const validation = validateEnvironment();

if (!validation.isValid) {
  console.error('❌ Erreurs de configuration environnement:');
  validation.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

if (validation.warnings.length > 0) {
  console.warn('⚠️ Avertissements de configuration environnement:');
  validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
}

if (isDevelopment) {
  console.log('🚀 Configuration environnement chargée avec succès');
  console.log('📊 Fonctionnalités activées:', 
    Object.entries(features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature)
      .join(', ') || 'aucune'
  );
}