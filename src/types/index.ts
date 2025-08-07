// src/types/index.ts
import { User, Service, Booking, Client } from "@prisma/client";

export type UserWithRelations = User & {
  services: Service[];
  bookings: Booking[];
  clients: Client[];
};

export type BookingWithRelations = Booking & {
  service: Service;
  client?: Client;
  user: User;
};

export type ServiceWithBookings = Service & {
  bookings: Booking[];
};

// Types pour les formulaires
export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  businessName: string;
  phone?: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface ServiceFormData {
  name: string;
  description?: string;
  duration: number;
  price: number;
}

export interface BookingFormData {
  serviceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  date: string;
  time: string;
  notes?: string;
}

// Types pour NextAuth
declare module "next-auth" {
  interface User {
    businessName?: string;
    subscriptionStatus?: string;
    stripeCustomerId?: string;
    createdAt?: string;
  }

  interface Session {
    user: User & {
      id: string;
      businessName?: string;
      subscriptionStatus?: string;
      stripeCustomerId?: string;
      createdAt?: string;
    };
  }
}
