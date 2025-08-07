// src/lib/sector-config.ts

export interface SectorConfig {
  name: string;
  icon: string;
  color: string;
  gradient: string;
  keywords: string[];
  features: {
    hasProducts: boolean;
    hasInventory: boolean;
    hasTeam: boolean;
    hasRooms: boolean;
    hasEquipment: boolean;
    hasPackages: boolean;
    hasLoyalty: boolean;
    hasWaitlist: boolean;
    hasPrePayment: boolean;
    hasRecurring: boolean;
  };
  customFields: {
    client: string[];
    service: string[];
    booking: string[];
  };
  defaultServices: {
    name: string;
    duration: number;
    price: number;
    description: string;
  }[];
  kpis: {
    primary: string[];
    secondary: string[];
  };
  automations: {
    reminderTemplate: string;
    confirmationTemplate: string;
    noShowTemplate: string;
  };
}

export const SECTOR_CONFIGS: { [key: string]: SectorConfig } = {
  barbier: {
    name: "Barbier / Coiffure Homme",
    icon: "💈",
    color: "#1f2937",
    gradient: "from-gray-800 to-gray-900",
    keywords: ["barbier", "coiffure", "coupe", "barbe", "homme", "salon"],
    features: {
      hasProducts: true,
      hasInventory: true,
      hasTeam: true,
      hasRooms: false,
      hasEquipment: true,
      hasPackages: true,
      hasLoyalty: true,
      hasWaitlist: true,
      hasPrePayment: false,
      hasRecurring: true,
    },
    customFields: {
      client: ["Type de cheveux", "Longueur préférée", "Produits utilisés", "Allergies"],
      service: ["Technique", "Produits inclus", "Difficulté"],
      booking: ["Coiffeur préféré", "Dernière coupe", "Instructions spéciales"]
    },
    defaultServices: [
      { name: "Coupe + Barbe", duration: 45, price: 35, description: "Coupe moderne avec taille de barbe" },
      { name: "Coupe Classique", duration: 30, price: 25, description: "Coupe traditionnelle aux ciseaux" },
      { name: "Barbe + Moustache", duration: 20, price: 15, description: "Taille et entretien de la barbe" },
      { name: "Coupe Dégradé", duration: 40, price: 30, description: "Dégradé moderne à la tondeuse" },
      { name: "Shampooing + Coupe", duration: 50, price: 40, description: "Service complet avec shampooing" },
    ],
    kpis: ["Clients réguliers", "Produits vendus", "Temps moyen par coupe", "CA par coiffeur"],
    automations: {
      reminderTemplate: "Salut {clientName} ! Ton RDV coupe/barbe est prévu demain à {time} chez {businessName}. À demain ! 💈",
      confirmationTemplate: "RDV confirmé ! {clientName}, rendez-vous {date} à {time} pour {serviceName} chez {businessName} 💈",
      noShowTemplate: "Dommage qu'on se soit loupés ! {clientName}, ton créneau {serviceName} nous a manqué. Reprends vite RDV ! 💈"
    }
  },

  beaute: {
    name: "Institut de Beauté",
    icon: "💅",
    color: "#ec4899",
    gradient: "from-pink-500 to-rose-600",
    keywords: ["beauté", "esthétique", "soin", "manucure", "pédicure", "épilation"],
    features: {
      hasProducts: true,
      hasInventory: true,
      hasTeam: true,
      hasRooms: true,
      hasEquipment: true,
      hasPackages: true,
      hasLoyalty: true,
      hasWaitlist: true,
      hasPrePayment: true,
      hasRecurring: true,
    },
    customFields: {
      client: ["Type de peau", "Allergies", "Traitements en cours", "Préférences couleur"],
      service: ["Zone traitée", "Produits utilisés", "Contre-indications"],
      booking: ["Esthéticienne préférée", "Historique soins", "Sensibilités"]
    },
    defaultServices: [
      { name: "Soin visage complet", duration: 75, price: 65, description: "Nettoyage, gommage, masque et hydratation" },
      { name: "Manucure gel", duration: 45, price: 35, description: "Pose vernis gel longue durée" },
      { name: "Épilation jambes", duration: 30, price: 25, description: "Épilation à la cire traditionnelle" },
      { name: "Pédicure + vernis", duration: 60, price: 40, description: "Soin des pieds complet avec vernis" },
      { name: "Extension cils", duration: 120, price: 85, description: "Pose d'extensions de cils individuelles" },
    ],
    kpis: ["Fidélité client", "Vente produits", "Taux rebooking", "Satisfaction soins"],
    automations: {
      reminderTemplate: "Bonjour {clientName} ! Votre soin {serviceName} est prévu demain à {time}. Préparez-vous à rayonner ! ✨",
      confirmationTemplate: "C'est confirmé ! {clientName}, rendez-vous {date} à {time} pour votre {serviceName} 💅",
      noShowTemplate: "Nous aurions aimé vous chouchouter ! {clientName}, votre soin nous a manqué. Reprenez vite RDV 💅"
    }
  },

  massage: {
    name: "Masseur / Bien-être",
    icon: "💆",
    color: "#059669",
    gradient: "from-emerald-500 to-teal-600",
    keywords: ["massage", "bien-être", "détente", "thérapie", "relaxation"],
    features: {
      hasProducts: false,
      hasInventory: false,
      hasTeam: true,
      hasRooms: true,
      hasEquipment: true,
      hasPackages: true,
      hasLoyalty: true,
      hasWaitlist: false,
      hasPrePayment: true,
      hasRecurring: true,
    },
    customFields: {
      client: ["Zones sensibles", "Problèmes de santé", "Pression préférée", "Huiles favorites"],
      service: ["Type de massage", "Huiles utilisées", "Bienfaits"],
      booking: ["Masseur préféré", "Dernière séance", "Objectifs thérapeutiques"]
    },
    defaultServices: [
      { name: "Massage relaxant", duration: 60, price: 55, description: "Massage détente corps entier" },
      { name: "Massage sportif", duration: 45, price: 50, description: "Massage récupération pour sportifs" },
      { name: "Massage dos/nuque", duration: 30, price: 35, description: "Ciblé tensions du haut du corps" },
      { name: "Massage pierres chaudes", duration: 75, price: 70, description: "Relaxation profonde aux pierres" },
      { name: "Réflexologie plantaire", duration: 45, price: 45, description: "Massage thérapeutique des pieds" },
    ],
    kpis: ["Taux de détente", "Séances régulières", "Satisfaction client", "Durée moyenne"],
    automations: {
      reminderTemplate: "Bonjour {clientName}, votre moment détente {serviceName} est demain à {time}. Préparez-vous à décompresser ! 🧘",
      confirmationTemplate: "Votre pause bien-être est confirmée ! {clientName}, RDV {date} à {time} pour {serviceName} 💆",
      noShowTemplate: "Votre moment détente nous a échappé ! {clientName}, nous aurions aimé vous relaxer. À bientôt ! 💆"
    }
  },

  restaurant: {
    name: "Restaurant / Traiteur",
    icon: "🍽️",
    color: "#dc2626",
    gradient: "from-red-500 to-orange-600",
    keywords: ["restaurant", "traiteur", "réservation", "table", "cuisine", "chef"],
    features: {
      hasProducts: false,
      hasInventory: false,
      hasTeam: true,
      hasRooms: false,
      hasEquipment: false,
      hasPackages: true,
      hasLoyalty: true,
      hasWaitlist: true,
      hasPrePayment: true,
      hasRecurring: false,
    },
    customFields: {
      client: ["Allergies alimentaires", "Régime spécial", "Préférences", "Occasion"],
      service: ["Nombre de personnes", "Menu", "Allergènes"],
      booking: ["Nombre de couverts", "Demandes spéciales", "Placement"]
    },
    defaultServices: [
      { name: "Table 2 personnes", duration: 90, price: 0, description: "Réservation table pour 2" },
      { name: "Table 4 personnes", duration: 120, price: 0, description: "Réservation table pour 4" },
      { name: "Menu dégustation", duration: 150, price: 85, description: "Menu 7 services du chef" },
      { name: "Brunch weekend", duration: 120, price: 35, description: "Formule brunch buffet" },
      { name: "Privatisation salle", duration: 240, price: 500, description: "Location salle privée" },
    ],
    kpis: ["Taux d'occupation", "Panier moyen", "No-show rate", "Satisfaction client"],
    automations: {
      reminderTemplate: "Bonjour {clientName}, votre table est réservée demain à {time}. Nous avons hâte de vous accueillir ! 🍽️",
      confirmationTemplate: "Table confirmée ! {clientName}, nous vous attendons {date} à {time} 🍽️",
      noShowTemplate: "Votre table nous a attendu ! {clientName}, nous espérons vous voir bientôt 🍽️"
    }
  },

  fitness: {
    name: "Coach Sportif / Fitness",
    icon: "💪",
    color: "#7c3aed",
    gradient: "from-purple-500 to-indigo-600",
    keywords: ["fitness", "sport", "coach", "musculation", "cardio", "entraînement"],
    features: {
      hasProducts: true,
      hasInventory: false,
      hasTeam: true,
      hasRooms: false,
      hasEquipment: true,
      hasPackages: true,
      hasLoyalty: true,
      hasWaitlist: false,
      hasPrePayment: true,
      hasRecurring: true,
    },
    customFields: {
      client: ["Objectifs", "Niveau", "Blessures", "Disponibilités"],
      service: ["Intensité", "Matériel requis", "Prérequis"],
      booking: ["Coach préféré", "Programme en cours", "Objectif séance"]
    },
    defaultServices: [
      { name: "Séance coaching 1h", duration: 60, price: 50, description: "Entraînement personnalisé individuel" },
      { name: "Cours collectif", duration: 45, price: 15, description: "Séance en groupe (max 8 pers)" },
      { name: "Évaluation physique", duration: 90, price: 70, description: "Bilan complet + programme" },
      { name: "Coaching nutrition", duration: 30, price: 40, description: "Consultation diététique" },
      { name: "Préparation physique", duration: 75, price: 65, description: "Entraînement spécifique sport" },
    ],
    kpis: ["Progression clients", "Assiduité", "Objectifs atteints", "Rétention"],
    automations: {
      reminderTemplate: "Salut {clientName} ! Ta séance {serviceName} est prévue demain à {time}. Prêt(e) à tout donner ? 💪",
      confirmationTemplate: "C'est parti ! {clientName}, RDV {date} à {time} pour {serviceName}. Let's go ! 💪",
      noShowTemplate: "On t'a attendu pour transpirer ! {clientName}, ta motivation nous a manqué. Reviens vite ! 💪"
    }
  },

  sante: {
    name: "Professionnel de Santé",
    icon: "🏥",
    color: "#0ea5e9",
    gradient: "from-blue-500 to-cyan-600",
    keywords: ["médecin", "dentiste", "kiné", "ostéopathe", "santé", "consultation"],
    features: {
      hasProducts: false,
      hasInventory: false,
      hasTeam: true,
      hasRooms: true,
      hasEquipment: true,
      hasPackages: false,
      hasLoyalty: false,
      hasWaitlist: true,
      hasPrePayment: false,
      hasRecurring: true,
    },
    customFields: {
      client: ["Mutuelle", "Médecin traitant", "Antécédents", "Traitements"],
      service: ["Spécialité", "Remboursement", "Durée consultation"],
      booking: ["Motif consultation", "Urgence", "Praticien souhaité"]
    },
    defaultServices: [
      { name: "Consultation générale", duration: 30, price: 25, description: "Consultation médecine générale" },
      { name: "Séance kinésithérapie", duration: 30, price: 35, description: "Séance de rééducation" },
      { name: "Consultation spécialisée", duration: 45, price: 50, description: "Consultation spécialiste" },
      { name: "Bilan de santé", duration: 60, price: 80, description: "Check-up médical complet" },
      { name: "Urgence", duration: 15, price: 30, description: "Consultation urgente" },
    ],
    kpis: ["Taux de guérison", "Ponctualité", "Satisfaction patient", "Efficacité"],
    automations: {
      reminderTemplate: "Bonjour {clientName}, votre RDV {serviceName} est prévu demain à {time} avec {businessName}",
      confirmationTemplate: "RDV confirmé ! {clientName}, consultation {date} à {time} pour {serviceName}",
      noShowTemplate: "Votre RDV nous a manqué. {clientName}, merci de reprogrammer votre consultation"
    }
  }
};

export function detectSector(services: any[], businessName?: string, description?: string): string {
  const allText = [
    ...(services?.map(s => `${s.name} ${s.description} ${s.category}`) || []),
    businessName || "",
    description || ""
  ].join(" ").toLowerCase();

  let maxScore = 0;
  let detectedSector = "general";

  Object.entries(SECTOR_CONFIGS).forEach(([sectorKey, config]) => {
    const score = config.keywords.reduce((acc, keyword) => {
      const count = (allText.match(new RegExp(keyword, "gi")) || []).length;
      return acc + count;
    }, 0);

    if (score > maxScore) {
      maxScore = score;
      detectedSector = sectorKey;
    }
  });

  return detectedSector;
}

export function getSectorConfig(sector: string): SectorConfig {
  return SECTOR_CONFIGS[sector] || SECTOR_CONFIGS.general || {
    name: "Activité Générale",
    icon: "🏢",
    color: "#6b7280",
    gradient: "from-gray-500 to-gray-600",
    keywords: [],
    features: {
      hasProducts: false,
      hasInventory: false,
      hasTeam: false,
      hasRooms: false,
      hasEquipment: false,
      hasPackages: false,
      hasLoyalty: false,
      hasWaitlist: false,
      hasPrePayment: false,
      hasRecurring: false,
    },
    customFields: {
      client: [],
      service: [],
      booking: []
    },
    defaultServices: [],
    kpis: ["Réservations", "Clients", "CA", "Satisfaction"],
    automations: {
      reminderTemplate: "Bonjour {clientName}, votre RDV {serviceName} est demain à {time}",
      confirmationTemplate: "RDV confirmé ! {clientName}, à {date} à {time} pour {serviceName}",
      noShowTemplate: "Votre RDV nous a manqué {clientName}. Reprogrammons vite !"
    }
  };
}