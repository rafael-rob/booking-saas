import swaggerJSDoc from 'swagger-jsdoc';

// OpenAPI 3.0 specification
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Booking SaaS API',
    version: '1.0.0',
    description: 'API complète pour le système de réservation SaaS',
    contact: {
      name: 'Support API',
      email: 'support@booking-saas.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      description: 'Serveur de développement',
    },
    {
      url: 'https://booking-saas.vercel.app',
      description: 'Serveur de production',
    },
  ],
  components: {
    securitySchemes: {
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'Authentification par session NextAuth',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Authentification par token JWT',
      },
    },
    schemas: {
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID unique de l\'utilisateur',
            example: 'clxxxxxxxxxxxxxxxxxxxxxxxx',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Adresse email',
            example: 'user@example.com',
          },
          name: {
            type: 'string',
            description: 'Nom de l\'utilisateur',
            example: 'Jean Dupont',
          },
          businessName: {
            type: 'string',
            nullable: true,
            description: 'Nom de l\'entreprise',
            example: 'Mon Entreprise',
          },
          phone: {
            type: 'string',
            nullable: true,
            pattern: '^(\\+33|0)[1-9](\\d{8})$',
            description: 'Numéro de téléphone français',
            example: '+33123456789',
          },
          subscriptionStatus: {
            type: 'string',
            enum: ['trial', 'active', 'cancelled', 'expired'],
            description: 'Statut d\'abonnement',
            example: 'active',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date de création',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date de dernière modification',
          },
        },
      },

      // Service schemas
      Service: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID unique du service',
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 200,
            description: 'Nom du service',
            example: 'Consultation médicale',
          },
          description: {
            type: 'string',
            nullable: true,
            maxLength: 1000,
            description: 'Description du service',
            example: 'Consultation générale de 30 minutes',
          },
          duration: {
            type: 'integer',
            minimum: 15,
            maximum: 480,
            description: 'Durée en minutes',
            example: 60,
          },
          price: {
            type: 'number',
            minimum: 0,
            maximum: 10000,
            description: 'Prix en euros',
            example: 50.0,
          },
          isActive: {
            type: 'boolean',
            description: 'Service actif',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },

      CreateService: {
        type: 'object',
        required: ['name', 'duration', 'price'],
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 200,
            description: 'Nom du service',
            example: 'Consultation médicale',
          },
          description: {
            type: 'string',
            maxLength: 1000,
            description: 'Description du service',
            example: 'Consultation générale de 30 minutes',
          },
          duration: {
            type: 'integer',
            minimum: 15,
            maximum: 480,
            description: 'Durée en minutes',
            example: 60,
          },
          price: {
            type: 'number',
            minimum: 0,
            maximum: 10000,
            description: 'Prix en euros',
            example: 50.0,
          },
          isActive: {
            type: 'boolean',
            default: true,
            description: 'Service actif',
          },
        },
      },

      // Booking schemas
      Booking: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID unique de la réservation',
          },
          serviceId: {
            type: 'string',
            description: 'ID du service réservé',
          },
          clientName: {
            type: 'string',
            description: 'Nom du client',
            example: 'Marie Martin',
          },
          clientEmail: {
            type: 'string',
            format: 'email',
            description: 'Email du client',
            example: 'marie@example.com',
          },
          clientPhone: {
            type: 'string',
            nullable: true,
            description: 'Téléphone du client',
            example: '+33987654321',
          },
          startTime: {
            type: 'string',
            format: 'date-time',
            description: 'Heure de début',
          },
          endTime: {
            type: 'string',
            format: 'date-time',
            description: 'Heure de fin',
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
            description: 'Statut de la réservation',
            example: 'CONFIRMED',
          },
          paymentStatus: {
            type: 'string',
            enum: ['PENDING', 'PAID', 'REFUNDED', 'FAILED'],
            description: 'Statut du paiement',
            example: 'PAID',
          },
          notes: {
            type: 'string',
            nullable: true,
            maxLength: 500,
            description: 'Notes additionnelles',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
          service: {
            $ref: '#/components/schemas/Service',
          },
          client: {
            $ref: '#/components/schemas/Client',
          },
        },
      },

      CreateBooking: {
        type: 'object',
        required: ['serviceId', 'clientName', 'clientEmail', 'date', 'time'],
        properties: {
          serviceId: {
            type: 'string',
            description: 'ID du service à réserver',
          },
          clientName: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Nom du client',
            example: 'Marie Martin',
          },
          clientEmail: {
            type: 'string',
            format: 'email',
            description: 'Email du client',
            example: 'marie@example.com',
          },
          clientPhone: {
            type: 'string',
            pattern: '^(\\+33|0)[1-9](\\d{8})$',
            description: 'Téléphone du client (optionnel)',
            example: '+33987654321',
          },
          date: {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
            description: 'Date de la réservation (YYYY-MM-DD)',
            example: '2024-01-15',
          },
          time: {
            type: 'string',
            pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
            description: 'Heure de la réservation (HH:MM)',
            example: '14:30',
          },
          notes: {
            type: 'string',
            maxLength: 500,
            description: 'Notes additionnelles',
          },
        },
      },

      // Client schema
      Client: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID unique du client',
          },
          name: {
            type: 'string',
            description: 'Nom du client',
            example: 'Marie Martin',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email du client',
            example: 'marie@example.com',
          },
          phone: {
            type: 'string',
            nullable: true,
            description: 'Téléphone du client',
            example: '+33987654321',
          },
          totalBookings: {
            type: 'integer',
            description: 'Nombre total de réservations',
            example: 5,
          },
          lastBookingAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Date de dernière réservation',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },

      // Pagination schemas
      PaginationInfo: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            description: 'Page actuelle',
            example: 1,
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            description: 'Nombre d\'éléments par page',
            example: 10,
          },
          total: {
            type: 'integer',
            minimum: 0,
            description: 'Nombre total d\'éléments',
            example: 150,
          },
          pages: {
            type: 'integer',
            minimum: 0,
            description: 'Nombre total de pages',
            example: 15,
          },
          hasNext: {
            type: 'boolean',
            description: 'Page suivante disponible',
            example: true,
          },
          hasPrev: {
            type: 'boolean',
            description: 'Page précédente disponible',
            example: false,
          },
        },
      },

      PaginatedResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {},
              },
              pagination: {
                $ref: '#/components/schemas/PaginationInfo',
              },
            },
          },
        },
      },

      // Error schemas
      ApiError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            description: 'Message d\'erreur',
            example: 'Ressource non trouvée',
          },
          code: {
            type: 'string',
            description: 'Code d\'erreur',
            example: 'NOT_FOUND',
          },
          details: {
            type: 'object',
            description: 'Détails additionnels sur l\'erreur',
          },
        },
      },

      ValidationError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'Données invalides',
          },
          code: {
            type: 'string',
            example: 'VALIDATION_ERROR',
          },
          issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Chemin du champ en erreur',
                  example: 'email',
                },
                message: {
                  type: 'string',
                  description: 'Message d\'erreur',
                  example: 'Email invalide',
                },
              },
            },
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentification requise',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError',
            },
            example: {
              success: false,
              error: 'Authentification requise',
              code: 'AUTHENTICATION_ERROR',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Accès non autorisé',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError',
            },
            example: {
              success: false,
              error: 'Accès non autorisé',
              code: 'AUTHORIZATION_ERROR',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Ressource non trouvée',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError',
            },
            example: {
              success: false,
              error: 'Ressource non trouvée',
              code: 'NOT_FOUND',
            },
          },
        },
      },
      ValidationError: {
        description: 'Erreur de validation',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ValidationError',
            },
          },
        },
      },
      RateLimitError: {
        description: 'Limite de taux dépassée',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiError',
            },
            example: {
              success: false,
              error: 'Trop de requêtes',
              code: 'RATE_LIMIT_EXCEEDED',
            },
          },
        },
        headers: {
          'Retry-After': {
            description: 'Nombre de secondes avant de pouvoir réessayer',
            schema: {
              type: 'integer',
            },
          },
        },
      },
    },
    parameters: {
      PaginationPage: {
        name: 'page',
        in: 'query',
        description: 'Numéro de page (commence à 1)',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
      },
      PaginationLimit: {
        name: 'limit',
        in: 'query',
        description: 'Nombre d\'éléments par page',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
        },
      },
      SortBy: {
        name: 'sortBy',
        in: 'query',
        description: 'Champ de tri',
        schema: {
          type: 'string',
        },
      },
      SortOrder: {
        name: 'sortOrder',
        in: 'query',
        description: 'Ordre de tri',
        schema: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
      },
    },
  },
  security: [
    {
      sessionAuth: [],
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Gestion de l\'authentification',
    },
    {
      name: 'Services',
      description: 'Gestion des services',
    },
    {
      name: 'Bookings',
      description: 'Gestion des réservations',
    },
    {
      name: 'Clients',
      description: 'Gestion des clients',
    },
    {
      name: 'Dashboard',
      description: 'Tableaux de bord et statistiques',
    },
    {
      name: 'Health',
      description: 'État de santé du système',
    },
  ],
};

// Options for swagger-jsdoc
const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './src/app/api/**/*.ts', // Chemins vers les fichiers API
    './src/lib/swagger-docs/*.ts', // Documentation additionnelle
  ],
};

// Generate swagger specification
export const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Helper function to validate API documentation
export function validateSwaggerSpec(): boolean {
  try {
    const spec = swaggerJSDoc(swaggerOptions);
    return !!(spec.info && spec.paths && spec.components);
  } catch (error) {
    console.error('Swagger specification validation failed:', error);
    return false;
  }
}

// Export the specification
export default swaggerSpec;