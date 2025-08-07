// src/lib/industry-templates.ts

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;

  // Services pré-configurés
  defaultServices: DefaultService[];

  // Disponibilités recommandées
  recommendedSchedule: ScheduleTemplate;

  // Champs personnalisés pour ce secteur
  customFields: CustomField[];

  // Questions spécifiques lors de la réservation
  bookingQuestions: BookingQuestion[];

  // Modèles de messages
  messageTemplates: MessageTemplate[];

  // Intégrations recommandées
  recommendedIntegrations: string[];

  // Métriques importantes pour ce secteur
  keyMetrics: string[];
}

export interface DefaultService {
  name: string;
  description: string;
  duration: number; // minutes
  suggestedPrice: number;
  category?: string;
  requiresPreparation?: boolean;
  maxAdvanceBooking?: number; // jours
}

export interface ScheduleTemplate {
  workingDays: number[]; // 1-7 (Lundi-Dimanche)
  workingHours: {
    start: string; // "09:00"
    end: string; // "18:00"
  };
  lunchBreak?: {
    start: string;
    end: string;
  };
  slotDuration: number; // minutes
  bufferTime?: number; // minutes entre RDV
}

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "multiselect" | "boolean";
  required: boolean;
  options?: string[]; // pour select/multiselect
  placeholder?: string;
}

export interface BookingQuestion {
  id: string;
  question: string;
  type: "text" | "select" | "boolean";
  required: boolean;
  options?: string[];
  helpText?: string;
}

export interface MessageTemplate {
  type: "confirmation" | "reminder" | "followup" | "cancellation";
  subject: string;
  content: string;
  timing?: string; // "24h avant", "1h après", etc.
}

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  healthcare: {
    id: "healthcare",
    name: "Santé & Thérapie",
    description: "Thérapeutes, psychologues, kinés, ostéopathes",
    icon: "🏥",

    defaultServices: [
      {
        name: "Consultation initiale",
        description: "Premier rendez-vous et bilan",
        duration: 60,
        suggestedPrice: 70,
        requiresPreparation: true,
        maxAdvanceBooking: 30,
      },
      {
        name: "Séance de suivi",
        description: "Séance de thérapie classique",
        duration: 45,
        suggestedPrice: 55,
      },
      {
        name: "Séance urgente",
        description: "Rendez-vous prioritaire",
        duration: 30,
        suggestedPrice: 80,
      },
    ],

    recommendedSchedule: {
      workingDays: [1, 2, 3, 4, 5], // Lun-Ven
      workingHours: { start: "08:00", end: "19:00" },
      lunchBreak: { start: "12:00", end: "14:00" },
      slotDuration: 45,
      bufferTime: 15,
    },

    customFields: [
      {
        id: "license_number",
        label: "Numéro ADELI/SIRET",
        type: "text",
        required: true,
      },
      {
        id: "specialties",
        label: "Spécialités",
        type: "multiselect",
        required: false,
        options: [
          "Anxiété",
          "Dépression",
          "Thérapie de couple",
          "Addiction",
          "Trauma",
        ],
      },
    ],

    bookingQuestions: [
      {
        id: "first_visit",
        question: "Est-ce votre première visite ?",
        type: "boolean",
        required: true,
      },
      {
        id: "reason",
        question: "Motif de consultation (optionnel)",
        type: "text",
        required: false,
        helpText: "Ces informations resteront confidentielles",
      },
      {
        id: "urgency",
        question: "Degré d'urgence",
        type: "select",
        required: true,
        options: ["Normal", "Assez urgent", "Très urgent"],
      },
    ],

    messageTemplates: [
      {
        type: "confirmation",
        subject: "Confirmation de votre rendez-vous",
        content:
          "Bonjour {clientName}, votre rendez-vous est confirmé le {date} à {time}. Merci d'arriver 10 minutes en avance.",
      },
      {
        type: "reminder",
        subject: "Rappel - RDV demain",
        content:
          "Bonjour {clientName}, nous vous rappelons votre rendez-vous demain {date} à {time}. En cas d'empêchement, merci de prévenir 24h à l'avance.",
      },
    ],

    recommendedIntegrations: [
      "doctolib",
      "google_calendar",
      "teleconsultation",
    ],
    keyMetrics: [
      "taux_noshow",
      "duree_moyenne_traitement",
      "satisfaction_patient",
      "taux_recommandation",
    ],
  },

  beauty: {
    id: "beauty",
    name: "Beauté & Bien-être",
    description: "Coiffeurs, esthéticiennes, manucures, masseurs",
    icon: "💄",

    defaultServices: [
      {
        name: "Coupe femme",
        description: "Coupe et brushing",
        duration: 45,
        suggestedPrice: 35,
        category: "Coiffure",
      },
      {
        name: "Couleur complète",
        description: "Coloration + coupe + brushing",
        duration: 120,
        suggestedPrice: 85,
        category: "Coiffure",
        requiresPreparation: true,
      },
      {
        name: "Soin visage",
        description: "Nettoyage et hydratation",
        duration: 60,
        suggestedPrice: 55,
        category: "Esthétique",
      },
      {
        name: "Manucure",
        description: "Soin des ongles",
        duration: 30,
        suggestedPrice: 25,
        category: "Ongles",
      },
    ],

    recommendedSchedule: {
      workingDays: [1, 2, 3, 4, 5, 6], // Lun-Sam
      workingHours: { start: "09:00", end: "19:00" },
      lunchBreak: { start: "12:30", end: "14:00" },
      slotDuration: 30,
      bufferTime: 10,
    },

    customFields: [
      {
        id: "salon_name",
        label: "Nom du salon",
        type: "text",
        required: true,
      },
      {
        id: "services_offered",
        label: "Services proposés",
        type: "multiselect",
        required: true,
        options: [
          "Coiffure",
          "Coloration",
          "Esthétique",
          "Manucure",
          "Pédicure",
          "Massage",
          "Épilation",
        ],
      },
    ],

    bookingQuestions: [
      {
        id: "hair_type",
        question: "Type de cheveux",
        type: "select",
        required: false,
        options: ["Fins", "Épais", "Bouclés", "Raides", "Colorés", "Abîmés"],
      },
      {
        id: "allergies",
        question: "Allergies ou sensibilités connues ?",
        type: "text",
        required: false,
        helpText: "Important pour éviter les réactions",
      },
      {
        id: "desired_look",
        question: "Résultat souhaité (optionnel)",
        type: "text",
        required: false,
      },
    ],

    messageTemplates: [
      {
        type: "confirmation",
        subject: "✨ RDV confirmé chez {businessName}",
        content:
          "Bonjour {clientName} ! Votre RDV {serviceName} est confirmé le {date} à {time}. Hâte de vous voir ! 💄",
      },
      {
        type: "followup",
        subject: "Comment trouvez-vous votre nouvelle coupe ? 😍",
        content:
          "Bonjour {clientName}, j'espère que vous êtes ravie de votre passage ! N'hésitez pas à partager une photo et à laisser un avis ⭐",
      },
    ],

    recommendedIntegrations: [
      "instagram",
      "google_my_business",
      "loyalty_program",
    ],
    keyMetrics: [
      "revenue_per_client",
      "retention_rate",
      "service_popularity",
      "booking_frequency",
    ],
  },

  fitness: {
    id: "fitness",
    name: "Sport & Fitness",
    description: "Coachs sportifs, personal trainers, studios de yoga",
    icon: "💪",

    defaultServices: [
      {
        name: "Séance personal training",
        description: "Coaching individuel personnalisé",
        duration: 60,
        suggestedPrice: 50,
        category: "Coaching",
      },
      {
        name: "Cours collectif",
        description: "Séance en groupe (max 8 personnes)",
        duration: 45,
        suggestedPrice: 20,
        category: "Collectif",
      },
      {
        name: "Bilan forme",
        description: "Évaluation et programme personnalisé",
        duration: 90,
        suggestedPrice: 80,
        category: "Évaluation",
        requiresPreparation: true,
      },
    ],

    recommendedSchedule: {
      workingDays: [1, 2, 3, 4, 5, 6], // Lun-Sam
      workingHours: { start: "06:00", end: "21:00" },
      slotDuration: 60,
      bufferTime: 15,
    },

    customFields: [
      {
        id: "certifications",
        label: "Certifications",
        type: "multiselect",
        required: false,
        options: [
          "BPJEPS",
          "CQP",
          "STAPS",
          "CrossFit Level 1",
          "Yoga Alliance",
        ],
      },
      {
        id: "specialties",
        label: "Spécialités",
        type: "multiselect",
        required: false,
        options: [
          "Perte de poids",
          "Prise de masse",
          "Préparation physique",
          "Réhabilitation",
          "Yoga",
          "Pilates",
        ],
      },
    ],

    bookingQuestions: [
      {
        id: "fitness_level",
        question: "Niveau de forme physique",
        type: "select",
        required: true,
        options: ["Débutant", "Intermédiaire", "Avancé", "Athlète"],
      },
      {
        id: "goals",
        question: "Objectifs principaux",
        type: "multiselect",
        required: true,
        options: [
          "Perte de poids",
          "Prise de muscle",
          "Endurance",
          "Souplesse",
          "Bien-être général",
        ],
      },
      {
        id: "injuries",
        question: "Blessures ou limitations physiques ?",
        type: "text",
        required: false,
        helpText: "Important pour adapter les exercices",
      },
    ],

    messageTemplates: [
      {
        type: "confirmation",
        subject: "🔥 Séance confirmée - On va tout déchirer !",
        content:
          "Salut {clientName} ! Ta séance {serviceName} est confirmée le {date} à {time}. Prépare-toi à transpirer ! 💪",
      },
      {
        type: "reminder",
        subject: "⏰ Séance dans 2h - Tu es prêt(e) ?",
        content:
          "Hey {clientName} ! RDV dans 2h pour ta séance. N'oublie pas ta bouteille d'eau et ta motivation ! 🚀",
      },
    ],

    recommendedIntegrations: [
      "myfitnesspal",
      "strava",
      "whatsapp",
      "video_calls",
    ],
    keyMetrics: [
      "attendance_rate",
      "client_progress",
      "session_intensity",
      "referral_rate",
    ],
  },

  consulting: {
    id: "consulting",
    name: "Conseil & Formation",
    description: "Consultants, formateurs, coaches business",
    icon: "💼",

    defaultServices: [
      {
        name: "Consultation découverte",
        description: "Premier échange gratuit (30min)",
        duration: 30,
        suggestedPrice: 0,
        category: "Découverte",
      },
      {
        name: "Consultation stratégique",
        description: "Séance de conseil approfondie",
        duration: 90,
        suggestedPrice: 150,
        category: "Conseil",
        maxAdvanceBooking: 60,
      },
      {
        name: "Formation sur mesure",
        description: "Session de formation personnalisée",
        duration: 120,
        suggestedPrice: 300,
        category: "Formation",
        requiresPreparation: true,
      },
    ],

    recommendedSchedule: {
      workingDays: [1, 2, 3, 4, 5], // Lun-Ven
      workingHours: { start: "09:00", end: "18:00" },
      lunchBreak: { start: "12:00", end: "13:00" },
      slotDuration: 90,
      bufferTime: 30,
    },

    customFields: [
      {
        id: "expertise_areas",
        label: "Domaines d'expertise",
        type: "multiselect",
        required: true,
        options: [
          "Stratégie",
          "Marketing",
          "Finance",
          "RH",
          "Digital",
          "Management",
          "Innovation",
        ],
      },
      {
        id: "target_clients",
        label: "Types de clients",
        type: "multiselect",
        required: false,
        options: [
          "Start-ups",
          "PME",
          "Grandes entreprises",
          "Associations",
          "Particuliers",
        ],
      },
    ],

    bookingQuestions: [
      {
        id: "company_size",
        question: "Taille de votre entreprise",
        type: "select",
        required: true,
        options: [
          "Entrepreneur solo",
          "2-10 employés",
          "11-50 employés",
          "50+ employés",
        ],
      },
      {
        id: "project_description",
        question: "Décrivez brièvement votre projet/besoin",
        type: "text",
        required: true,
        helpText: "Cela m'aidera à mieux préparer notre échange",
      },
      {
        id: "budget_range",
        question: "Budget approximatif",
        type: "select",
        required: false,
        options: [
          "< 1K€",
          "1-5K€",
          "5-10K€",
          "10-25K€",
          "25K€+",
          "À déterminer",
        ],
      },
    ],

    messageTemplates: [
      {
        type: "confirmation",
        subject: "RDV confirmé - Préparons votre réussite 🚀",
        content:
          "Bonjour {clientName}, notre RDV {serviceName} est confirmé le {date} à {time}. J'ai hâte de discuter de votre projet !",
      },
      {
        type: "followup",
        subject: "Suite à notre échange - Plan d'action",
        content:
          "Bonjour {clientName}, merci pour cet échange enrichissant ! Vous trouverez en pièce jointe le plan d'action que nous avons défini.",
      },
    ],

    recommendedIntegrations: [
      "zoom",
      "calendly_integration",
      "linkedin",
      "document_sharing",
    ],
    keyMetrics: [
      "conversion_rate",
      "project_success_rate",
      "client_satisfaction",
      "referral_value",
    ],
  },

  education: {
    id: "education",
    name: "Éducation & Formation",
    description: "Professeurs particuliers, formateurs, écoles",
    icon: "📚",

    defaultServices: [
      {
        name: "Cours particulier",
        description: "Séance individuelle personnalisée",
        duration: 60,
        suggestedPrice: 25,
        category: "Cours",
      },
      {
        name: "Cours collectif",
        description: "Séance en petit groupe (max 6)",
        duration: 90,
        suggestedPrice: 15,
        category: "Groupe",
      },
      {
        name: "Stage intensif",
        description: "Formation accélérée sur plusieurs jours",
        duration: 180,
        suggestedPrice: 80,
        category: "Stage",
        requiresPreparation: true,
      },
    ],

    recommendedSchedule: {
      workingDays: [1, 2, 3, 4, 5, 6], // Lun-Sam
      workingHours: { start: "08:00", end: "20:00" },
      slotDuration: 60,
      bufferTime: 15,
    },

    customFields: [
      {
        id: "subjects",
        label: "Matières enseignées",
        type: "multiselect",
        required: true,
        options: [
          "Mathématiques",
          "Français",
          "Anglais",
          "Sciences",
          "Histoire",
          "Philosophie",
          "Informatique",
        ],
      },
      {
        id: "levels",
        label: "Niveaux enseignés",
        type: "multiselect",
        required: true,
        options: [
          "Primaire",
          "Collège",
          "6ème",
          "5ème",
          "4ème",
          "3ème",
          "Lycée",
          "2nde",
          "1ère",
          "Terminale",
          "Supérieur",
        ],
      },
    ],

    bookingQuestions: [
      {
        id: "student_level",
        question: "Niveau de l'élève",
        type: "select",
        required: true,
        options: [
          "CP",
          "CE1",
          "CE2",
          "CM1",
          "CM2",
          "6ème",
          "5ème",
          "4ème",
          "3ème",
          "2nde",
          "1ère",
          "Terminale",
          "Supérieur",
        ],
      },
      {
        id: "subject_needed",
        question: "Matière(s) concernée(s)",
        type: "multiselect",
        required: true,
        options: [
          "Mathématiques",
          "Français",
          "Anglais",
          "Espagnol",
          "Allemand",
          "Sciences",
          "Histoire-Géo",
          "Philosophie",
        ],
      },
      {
        id: "difficulties",
        question: "Difficultés rencontrées (optionnel)",
        type: "text",
        required: false,
        helpText: "Cela m'aidera à adapter le cours",
      },
    ],

    messageTemplates: [
      {
        type: "confirmation",
        subject: "📖 Cours confirmé - Prêt(e) à progresser ?",
        content:
          "Bonjour {clientName}, votre cours de {serviceName} est confirmé le {date} à {time}. N'oubliez pas vos affaires ! 📚",
      },
      {
        type: "reminder",
        subject: "⏰ Cours dans 1h - On révise ?",
        content:
          "Bonjour {clientName}, votre cours commence dans 1h. Avez-vous préparé vos exercices ? À tout à l'heure ! 🎓",
      },
    ],

    recommendedIntegrations: [
      "google_classroom",
      "zoom",
      "homework_tracking",
      "parent_notifications",
    ],
    keyMetrics: [
      "student_progress",
      "lesson_completion_rate",
      "parent_satisfaction",
      "exam_success_rate",
    ],
  },

  automotive: {
    id: "automotive",
    name: "Automobile",
    description: "Garages, mécaniciens, auto-écoles",
    icon: "🚗",

    defaultServices: [
      {
        name: "Révision complète",
        description: "Contrôle technique et entretien",
        duration: 120,
        suggestedPrice: 150,
        category: "Entretien",
      },
      {
        name: "Vidange",
        description: "Changement huile moteur",
        duration: 45,
        suggestedPrice: 60,
        category: "Entretien",
      },
      {
        name: "Diagnostic panne",
        description: "Identification du problème",
        duration: 60,
        suggestedPrice: 80,
        category: "Diagnostic",
      },
    ],

    recommendedSchedule: {
      workingDays: [1, 2, 3, 4, 5, 6], // Lun-Sam
      workingHours: { start: "08:00", end: "18:00" },
      lunchBreak: { start: "12:00", end: "13:00" },
      slotDuration: 60,
      bufferTime: 30,
    },

    customFields: [
      {
        id: "garage_name",
        label: "Nom du garage",
        type: "text",
        required: true,
      },
      {
        id: "specialties",
        label: "Spécialités",
        type: "multiselect",
        required: false,
        options: [
          "Mécanique générale",
          "Carrosserie",
          "Peinture",
          "Électronique",
          "Climatisation",
        ],
      },
    ],

    bookingQuestions: [
      {
        id: "vehicle_brand",
        question: "Marque du véhicule",
        type: "text",
        required: true,
      },
      {
        id: "vehicle_model",
        question: "Modèle",
        type: "text",
        required: true,
      },
      {
        id: "issue_description",
        question: "Description du problème",
        type: "text",
        required: false,
        helpText: "Décrivez les symptômes observés",
      },
    ],

    messageTemplates: [
      {
        type: "confirmation",
        subject: "🔧 RDV garage confirmé",
        content:
          "Bonjour {clientName}, votre RDV pour {serviceName} est confirmé le {date} à {time}. Merci d'amener les papiers du véhicule.",
      },
    ],

    recommendedIntegrations: [
      "vehicle_database",
      "parts_inventory",
      "invoice_system",
    ],
    keyMetrics: [
      "repair_time",
      "customer_satisfaction",
      "return_rate",
      "parts_margin",
    ],
  },
};

// Fonction pour obtenir les recommandations par secteur
export function getIndustryRecommendations(industryId: string): {
  services: string[];
  schedule: string[];
  marketing: string[];
  integrations: string[];
} {
  const recommendations = {
    healthcare: {
      services: [
        "Proposez des créneaux d'urgence à tarif majoré",
        "Créez des packages de suivi (5 séances = -10%)",
        "Ajoutez des consultations vidéo",
      ],
      schedule: [
        "Réservez 2-3 créneaux d'urgence par jour",
        "Programmez des rappels 48h avant (important en santé)",
        "Laissez 15min entre chaque patient",
      ],
      marketing: [
        "Mettez en avant vos spécialisations",
        "Partagez des articles de prévention",
        "Demandez des avis après 3-4 séances",
      ],
      integrations: [
        "Connectez votre agenda Doctolib",
        "Intégrez un système de téléconsultation",
        "Automatisez les rappels SMS",
      ],
    },
    beauty: {
      services: [
        "Créez des forfaits beauté (soin+manucure)",
        'Proposez des créneaux "dernière minute" à -20%',
        "Ajoutez des services express (30min)",
      ],
      schedule: [
        "Ouvrez le samedi (jour clé en beauté)",
        "Proposez des créneaux tardifs (19h-21h)",
        "Bloquez moins de temps entre rendez-vous",
      ],
      marketing: [
        "Partagez vos réalisations sur Instagram",
        "Créez un programme de parrainage",
        "Offrez le 6ème RDV après 5 payés",
      ],
      integrations: [
        "Connectez Instagram pour les avant/après",
        "Intégrez un système de fidélité",
        "Automatisez les relances Instagram",
      ],
    },
    fitness: {
      services: [
        "Vendez des packages de 10 séances",
        "Créez des challenges mensuels",
        "Proposez du coaching nutrition",
      ],
      schedule: [
        "Ouvrez tôt (6h-9h) et tard (18h-21h)",
        "Proposez des créneaux weekend",
        'Créez des créneaux "lunch break" (12h-14h)',
      ],
      marketing: [
        "Partagez les transformations clients",
        "Organisez des défis gratuits",
        "Créez une communauté WhatsApp",
      ],
      integrations: [
        "Connectez MyFitnessPal pour le suivi",
        "Intégrez Strava pour la motivation",
        "Automatisez les programmes d'entraînement",
      ],
    },
  };

  return (
    recommendations[industryId as keyof typeof recommendations] || {
      services: [],
      schedule: [],
      marketing: [],
      integrations: [],
    }
  );
}
