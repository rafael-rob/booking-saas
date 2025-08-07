import { z } from "zod";

// Schémas de base
export const emailSchema = z.string().email("Email invalide");
export const phoneSchema = z.string().regex(/^(\+33|0)[1-9](\d{8})$/, "Numéro de téléphone invalide");
export const passwordSchema = z.string().min(8, "Mot de passe minimum 8 caractères").regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  "Mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
);

// Schémas d'authentification
export const registerSchema = z.object({
  email: emailSchema,
  name: z.string().min(2, "Nom minimum 2 caractères").max(100),
  businessName: z.string().optional(),
  phone: phoneSchema.optional(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis"),
});

// Schémas de service
export const createServiceSchema = z.object({
  name: z.string().min(2, "Nom du service minimum 2 caractères").max(200),
  description: z.string().max(1000).optional(),
  duration: z.number().int().min(15, "Durée minimum 15 minutes").max(480, "Durée maximum 8 heures"),
  price: z.number().min(0, "Prix doit être positif").max(10000, "Prix maximum 10000€"),
  isActive: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

// Schémas de disponibilité
export const createAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0, "Jour invalide").max(6, "Jour invalide"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format horaire invalide (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format horaire invalide (HH:MM)"),
  isRecurring: z.boolean().default(true),
  date: z.string().datetime().optional(),
}).refine(
  (data) => {
    const start = new Date(`2000-01-01T${data.startTime}:00`);
    const end = new Date(`2000-01-01T${data.endTime}:00`);
    return start < end;
  },
  {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["endTime"],
  }
);

// Schémas de réservation
export const createBookingSchema = z.object({
  serviceId: z.string().cuid("ID service invalide"),
  clientName: z.string().min(2, "Nom client minimum 2 caractères").max(100),
  clientEmail: emailSchema,
  clientPhone: phoneSchema.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format date invalide (YYYY-MM-DD)"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format horaire invalide (HH:MM)"),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => {
    const bookingDate = new Date(`${data.date}T${data.time}:00`);
    const now = new Date();
    return bookingDate > now;
  },
  {
    message: "La réservation doit être dans le futur",
    path: ["date"],
  }
);

export const updateBookingStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"], {
    required_error: "Statut requis",
    invalid_type_error: "Statut invalide",
  }),
  notes: z.string().max(500).optional(),
});

// Schémas de client
export const createClientSchema = z.object({
  name: z.string().min(2, "Nom minimum 2 caractères").max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
});

export const updateClientSchema = createClientSchema.partial();

// Schémas de recherche et pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const searchSchema = z.object({
  q: z.string().min(1, "Terme de recherche requis").max(100),
  category: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
}).merge(paginationSchema);

// Schémas spécifiques aux routes
export const bookingRouteParamsSchema = z.object({
  userId: z.string().cuid("ID utilisateur invalide"),
});

export const serviceRouteParamsSchema = z.object({
  id: z.string().cuid("ID service invalide"),
});

export const bookingIdParamsSchema = z.object({
  id: z.string().cuid("ID réservation invalide"),
});

// Types TypeScript dérivés
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;

// Helper pour validation avec gestion d'erreur
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  issues: z.ZodIssue[];
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    error: result.error.issues.map(issue => issue.message).join(", "),
    issues: result.error.issues,
  };
}

// Sanitisation des chaînes de caractères
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

// Validation des IDs CUID
export const cuidSchema = z.string().cuid();
export function isValidCuid(id: string): boolean {
  return cuidSchema.safeParse(id).success;
}