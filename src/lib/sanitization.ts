import DOMPurify from "isomorphic-dompurify";

// Configuration de sécurité pour DOMPurify
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  SANITIZE_DOM: true,
};

// Sanitisation des chaînes HTML
export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(input, SANITIZE_CONFIG);
}

// Sanitisation stricte pour les champs texte (supprime tout HTML)
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
}

// Sanitisation pour les emails
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w@.-]/g, ''); // Garde seulement les caractères valides pour un email
}

// Sanitisation pour les numéros de téléphone
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[^\d+\-\s()]/g, '') // Garde seulement les chiffres et caractères de formatage
    .replace(/\s+/g, ' '); // Normalise les espaces
}

// Sanitisation pour les URLs
export function sanitizeURL(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  try {
    const url = new URL(input);
    // Autorise seulement HTTP et HTTPS
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '';
    }
    return url.toString();
  } catch {
    return '';
  }
}

// Sanitisation pour les noms de fichier
export function sanitizeFilename(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Supprime les caractères interdits
    .replace(/^\.+/, '') // Supprime les points en début
    .substring(0, 255); // Limite la longueur
}

// Sanitisation pour les requêtes SQL (échappement basique)
export function sanitizeSQL(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/'/g, "''") // Échappement des apostrophes
    .replace(/\\/g, '\\\\') // Échappement des backslashes
    .replace(/\x00/g, '\\0') // Échappement des null bytes
    .replace(/\n/g, '\\n') // Échappement des retours ligne
    .replace(/\r/g, '\\r') // Échappement des retours chariot
    .replace(/\x1a/g, '\\Z'); // Échappement du caractère EOF
}

// Détection de contenu potentiellement malveillant
export function detectMaliciousContent(input: string): {
  isMalicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  
  if (!input || typeof input !== 'string') {
    return { isMalicious: false, reasons };
  }
  
  const maliciousPatterns = [
    // Scripts
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    
    // Événements JavaScript
    /on\w+\s*=/gi,
    
    // Injections SQL
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    
    // Commandes système
    /(\b(rm|del|format|shutdown|reboot)\b)/gi,
    
    // Protocoles dangereux
    /^(ftp|file|javascript|data):/gi,
  ];
  
  maliciousPatterns.forEach((pattern, index) => {
    if (pattern.test(input)) {
      switch (index) {
        case 0: reasons.push('Script tag détecté'); break;
        case 1: reasons.push('Protocole JavaScript détecté'); break;
        case 2: reasons.push('VBScript détecté'); break;
        case 3: reasons.push('Data URL HTML détecté'); break;
        case 4: reasons.push('Gestionnaire d\'événement JavaScript détecté'); break;
        case 5: reasons.push('Commande SQL suspecte détectée'); break;
        case 6: reasons.push('Injection SQL potentielle détectée'); break;
        case 7: reasons.push('Commande système détectée'); break;
        case 8: reasons.push('Protocole dangereux détecté'); break;
      }
    }
  });
  
  return {
    isMalicious: reasons.length > 0,
    reasons,
  };
}

// Fonction de sanitisation générale pour les objets
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  schema: Record<keyof T, 'text' | 'html' | 'email' | 'phone' | 'url' | 'filename'>
): T {
  const sanitized = { ...obj };
  
  Object.keys(schema).forEach((key) => {
    const value = obj[key];
    if (value !== undefined && value !== null) {
      const sanitizer = schema[key];
      
      switch (sanitizer) {
        case 'text':
          sanitized[key] = sanitizeText(String(value));
          break;
        case 'html':
          sanitized[key] = sanitizeHTML(String(value));
          break;
        case 'email':
          sanitized[key] = sanitizeEmail(String(value));
          break;
        case 'phone':
          sanitized[key] = sanitizePhone(String(value));
          break;
        case 'url':
          sanitized[key] = sanitizeURL(String(value));
          break;
        case 'filename':
          sanitized[key] = sanitizeFilename(String(value));
          break;
      }
    }
  });
  
  return sanitized;
}

// Middleware de sanitisation pour les requêtes
export function sanitizeRequestBody<T extends Record<string, any>>(
  body: T,
  fieldTypes: Partial<Record<keyof T, 'text' | 'html' | 'email' | 'phone' | 'url' | 'filename'>>
): T {
  const sanitized = { ...body };
  
  Object.keys(fieldTypes).forEach((key) => {
    const value = body[key];
    const type = fieldTypes[key];
    
    if (value !== undefined && value !== null && type) {
      switch (type) {
        case 'text':
          sanitized[key] = sanitizeText(String(value));
          break;
        case 'html':
          sanitized[key] = sanitizeHTML(String(value));
          break;
        case 'email':
          sanitized[key] = sanitizeEmail(String(value));
          break;
        case 'phone':
          sanitized[key] = sanitizePhone(String(value));
          break;
        case 'url':
          sanitized[key] = sanitizeURL(String(value));
          break;
        case 'filename':
          sanitized[key] = sanitizeFilename(String(value));
          break;
      }
    }
  });
  
  return sanitized;
}

// Validation de sécurité pour les uploads
export function validateFileUpload(file: File, options: {
  maxSize?: number; // en bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
} = {}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const {
    maxSize = 5 * 1024 * 1024, // 5MB par défaut
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
  } = options;
  
  // Vérification de la taille
  if (file.size > maxSize) {
    errors.push(`Fichier trop volumineux (max: ${Math.round(maxSize / 1024 / 1024)}MB)`);
  }
  
  // Vérification du type MIME
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Type de fichier non autorisé: ${file.type}`);
  }
  
  // Vérification de l'extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    errors.push(`Extension non autorisée: ${extension}`);
  }
  
  // Vérification du nom de fichier
  const maliciousCheck = detectMaliciousContent(file.name);
  if (maliciousCheck.isMalicious) {
    errors.push('Nom de fichier contient du contenu malveillant');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}