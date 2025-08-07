// src/lib/branding.ts

export interface BrandingSettings {
  // Couleurs
  primaryColor: string; // Couleur principale
  secondaryColor: string; // Couleur secondaire
  backgroundColor: string; // Fond
  textColor: string; // Texte

  // Logo et images
  logo?: string; // URL du logo
  backgroundImage?: string; // Image de fond
  favicon?: string; // Favicon personnalisé

  // Textes personnalisés
  welcomeTitle?: string; // "Bienvenue chez [Business]"
  welcomeMessage?: string; // Message d'accueil personnalisé
  thankYouMessage?: string; // Message après réservation

  // Informations de contact
  address?: string;
  phone?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };

  // Options d'affichage
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showSocialMedia: boolean;
  compactMode: boolean; // Mode compact pour mobile

  // Secteur d'activité (pour templates)
  industry:
    | "healthcare"
    | "beauty"
    | "fitness"
    | "consulting"
    | "education"
    | "other";
}

export const INDUSTRY_TEMPLATES: Record<string, Partial<BrandingSettings>> = {
  healthcare: {
    primaryColor: "#3B82F6", // Bleu médical
    secondaryColor: "#EFF6FF",
    welcomeTitle: "Prenez rendez-vous",
    welcomeMessage: "Choisissez votre créneau pour une consultation",
    industry: "healthcare",
  },
  beauty: {
    primaryColor: "#EC4899", // Rose beauté
    secondaryColor: "#FDF2F8",
    welcomeTitle: "Réservez votre moment beauté",
    welcomeMessage: "Détendez-vous, nous nous occupons de vous",
    industry: "beauty",
  },
  fitness: {
    primaryColor: "#10B981", // Vert sport
    secondaryColor: "#ECFDF5",
    welcomeTitle: "Réservez votre séance",
    welcomeMessage: "Atteignez vos objectifs avec nous",
    industry: "fitness",
  },
  consulting: {
    primaryColor: "#6366F1", // Indigo pro
    secondaryColor: "#EEF2FF",
    welcomeTitle: "Planifiez votre consultation",
    welcomeMessage: "Discutons de vos projets",
    industry: "consulting",
  },
  education: {
    primaryColor: "#F59E0B", // Orange éducation
    secondaryColor: "#FFFBEB",
    welcomeTitle: "Réservez votre cours",
    welcomeMessage: "Apprenez à votre rythme",
    industry: "education",
  },
};

export const DEFAULT_BRANDING: BrandingSettings = {
  primaryColor: "#3B82F6",
  secondaryColor: "#EFF6FF",
  backgroundColor: "#FFFFFF",
  textColor: "#1F2937",
  welcomeTitle: "Réservez votre rendez-vous",
  welcomeMessage: "Choisissez le créneau qui vous convient",
  thankYouMessage: "Merci pour votre réservation !",
  showLogo: true,
  showAddress: true,
  showPhone: true,
  showSocialMedia: false,
  compactMode: false,
  industry: "other",
};

// Générateur de CSS personnalisé
export function generateCustomCSS(branding: BrandingSettings): string {
  return `
    :root {
      --primary-color: ${branding.primaryColor};
      --secondary-color: ${branding.secondaryColor};
      --background-color: ${branding.backgroundColor};
      --text-color: ${branding.textColor};
    }
    
    .booking-page {
      background-color: var(--background-color);
      color: var(--text-color);
      ${
        branding.backgroundImage
          ? `background-image: url(${branding.backgroundImage});`
          : ""
      }
      ${
        branding.backgroundImage
          ? "background-size: cover; background-position: center;"
          : ""
      }
    }
    
    .primary-button {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
    }
    
    .primary-button:hover {
      background-color: color-mix(in srgb, var(--primary-color) 90%, black);
    }
    
    .secondary-bg {
      background-color: var(--secondary-color);
    }
    
    .accent-border {
      border-color: var(--primary-color);
    }
    
    ${
      branding.compactMode
        ? `
      .booking-container {
        padding: 1rem;
      }
      
      .service-card {
        padding: 1rem;
      }
    `
        : ""
    }
  `;
}
