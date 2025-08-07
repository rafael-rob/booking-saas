# 🔒 Guide de Sécurité - Booking SaaS

## Variables d'Environnement Critiques

### Configuration Requise

#### Base de données
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/booking_saas"
```

#### NextAuth (Obligatoire)
```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[GÉNÉRER AVEC: openssl rand -base64 64]"
```
⚠️ **NEXTAUTH_SECRET doit faire au moins 64 caractères en production**

#### Stripe (Obligatoire)
```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Configuration Optionnelle

#### Rate Limiting (Recommandé en production)
```bash
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

#### Email SMTP
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"
```

#### Monitoring
```bash
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
```

## 🛡️ Mesures de Sécurité Implémentées

### 1. Validation des Données
- ✅ Schémas Zod pour toutes les entrées API
- ✅ Sanitisation automatique des chaînes
- ✅ Détection de contenu malveillant
- ✅ Validation des fichiers uploadés

### 2. Authentification & Autorisation
- ✅ Middleware d'authentification centralisé
- ✅ Vérification d'accès aux ressources
- ✅ Sessions sécurisées avec NextAuth
- ✅ Protection CSRF automatique

### 3. Rate Limiting
- ✅ Limite par utilisateur et par IP
- ✅ Configurations spécialisées par endpoint
- ✅ Headers de rate limit dans les réponses
- ✅ Fallback mémoire pour développement

### 4. Protection des Données
- ✅ Variables d'environnement validées
- ✅ Secrets masqués dans les logs
- ✅ Sanitisation des entrées utilisateur
- ✅ Protection XSS avec DOMPurify

## 🚨 Checklist Sécurité Production

### Configuration Serveur
- [ ] HTTPS activé avec certificats SSL valides
- [ ] Headers de sécurité configurés
- [ ] CORS configuré avec origines spécifiques
- [ ] Rate limiting Redis configuré
- [ ] Monitoring Sentry activé

### Base de Données
- [ ] Base de données accessible uniquement depuis l'application
- [ ] Utilisateur DB avec permissions minimales
- [ ] Chiffrement en transit activé
- [ ] Sauvegardes automatiques configurées

### Variables d'Environnement
- [ ] Tous les secrets ont au moins 32 caractères
- [ ] NEXTAUTH_SECRET fait 64+ caractères
- [ ] Variables sensibles non commitées
- [ ] ALLOWED_ORIGINS configuré

### Code
- [ ] Tests de sécurité passent
- [ ] Audit npm sans vulnérabilités critiques
- [ ] Logs d'erreur ne contiennent pas de secrets
- [ ] Validation côté serveur sur tous les endpoints

## 🔧 Outils de Sécurité

### Commandes utiles
```bash
# Générer un secret sécurisé
openssl rand -base64 64

# Audit des dépendances
npm audit --audit-level critical

# Vérifier les variables d'env
npm run validate:env
```

### Configuration recommandée pour .env
```bash
# Générer des secrets forts
NEXTAUTH_SECRET=$(openssl rand -base64 64)
API_SECRET_KEY=$(openssl rand -base64 32)
```

## 🚨 Que faire en cas de compromission ?

### Étapes immédiates
1. **Changer tous les secrets** (NEXTAUTH_SECRET, API keys, etc.)
2. **Révoquer les sessions** utilisateurs
3. **Vérifier les logs** d'accès
4. **Notifier les utilisateurs** si nécessaire

### Investigation
1. Examiner les logs d'erreur et d'accès
2. Vérifier l'intégrité des données
3. Identifier le vecteur d'attaque
4. Corriger la vulnérabilité

## 📞 Contact Sécurité

Pour signaler une vulnérabilité de sécurité, contactez l'équipe de développement avec :
- Description détaillée
- Steps de reproduction
- Impact potentiel
- Preuves de concept (si applicable)

## 📋 Changelog Sécurité

### Version 1.0 - Phase 1 Sécurité
- ✅ Validation Zod implémentée
- ✅ Middleware d'authentification
- ✅ Rate limiting
- ✅ Sanitisation des entrées
- ✅ Variables d'environnement sécurisées