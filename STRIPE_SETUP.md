# 🔧 Configuration Stripe - Guide Complet

## 1. Création du compte Stripe

1. **Créer un compte** : [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. **Activer les paiements** et compléter les informations business
3. **Passer en mode Live** une fois les tests terminés

## 2. Configuration des Produits et Prix

### Étape 1: Créer les Produits

Dans votre dashboard Stripe > **Products**, créez 3 produits :

#### Produit 1: Starter
- **Nom** : BookingSaaS Starter
- **Description** : Plan de base pour les professionnels débutants
- **Unité de facturation** : Par licence

#### Produit 2: Pro  
- **Nom** : BookingSaaS Pro  
- **Description** : Plan professionnel avec toutes les fonctionnalités
- **Unité de facturation** : Par licence

#### Produit 3: Premium
- **Nom** : BookingSaaS Premium
- **Description** : Plan entreprise avec support prioritaire
- **Unité de facturation** : Par licence

### Étape 2: Créer les Prix (Subscriptions)

Pour chaque produit, créez un prix mensuel :

#### Prix Starter
- **Type** : Récurrent
- **Prix** : 19,00 € / mois
- **Fréquence** : Mensuel
- **ID** : `price_starter_monthly` (sera généré automatiquement)

#### Prix Pro
- **Type** : Récurrent  
- **Prix** : 29,00 € / mois
- **Fréquence** : Mensuel
- **ID** : `price_pro_monthly`

#### Prix Premium
- **Type** : Récurrent
- **Prix** : 49,00 € / mois  
- **Fréquence** : Mensuel
- **ID** : `price_premium_monthly`

## 3. Configuration des Variables d'Environnement

Copiez `.env.example` vers `.env.local` et remplissez :

```bash
# Récupérez depuis Dashboard > Developers > API Keys
STRIPE_PUBLIC_KEY="pk_test_51..."
STRIPE_SECRET_KEY="sk_test_51..."

# Après création des prix, remplacez par les vrais IDs
STRIPE_STARTER_PRICE_ID="price_1234567890"
STRIPE_PRO_PRICE_ID="price_1234567891"  
STRIPE_PREMIUM_PRICE_ID="price_1234567892"
```

## 4. Configuration du Webhook

### Étape 1: Créer l'Endpoint
- **URL** : `https://yourdomain.com/api/stripe/webhook`
- **Version** : 2024-06-20 (ou plus récente)

### Étape 2: Événements à Écouter
Sélectionnez ces événements :
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated` 
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.trial_will_end`

### Étape 3: Secret du Webhook
```bash
# Ajoutez dans .env.local
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## 5. Test de l'Intégration

### Cartes de Test Stripe
- **Visa réussie** : `4242424242424242`
- **Visa échouée** : `4000000000000002`
- **Visa authentification 3D** : `4000002500003155`

### Dates d'expiration test
- **MM/YY** : N'importe quelle date future (ex: 12/28)
- **CVC** : N'importe quel 3 chiffres (ex: 123)

## 6. Workflow de Test

1. **Créer un compte** sur votre app
2. **Aller sur /pricing** et sélectionner un plan  
3. **Utiliser une carte de test** dans Stripe Checkout
4. **Vérifier** que l'abonnement apparaît dans Stripe Dashboard
5. **Tester le webhook** en annulant/modifiant l'abonnement

## 7. Passage en Production

### Variables d'environnement LIVE
```bash
# Remplacez par les clés de production
STRIPE_PUBLIC_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."

# URL de production pour le webhook  
NEXTAUTH_URL="https://yourproductiondomain.com"
```

### Points de Vérification
- [ ] Webhook configuré sur l'URL de production
- [ ] Compte Stripe activé pour recevoir les paiements
- [ ] Tests réalisés avec vraies cartes bancaires
- [ ] Emails de confirmation fonctionnels
- [ ] Gestion des erreurs testée

## 8. Monitoring et Maintenance

### Dashboard Stripe à surveiller
- **Paiements** : Volume et taux de succès
- **Abonnements** : Nouveaux, annulations, renewals  
- **Webhooks** : Taux de réussite des événements
- **Disputes** : Chargebacks et contestations

### Logs applicatifs
- Vérifiez les logs de `src/app/api/stripe/webhook/route.ts`
- Surveillez les erreurs de création d'abonnement
- Monitorer les échecs de paiement

---

## ⚠️ Important

- **Gardez vos clés secrètes sécurisées** - ne les commitez jamais
- **Testez en mode test** avant de passer en production
- **Configurez les emails** Stripe pour les confirmations
- **Respectez le RGPD** pour les données clients européens

---

**Support** : En cas de problème, consultez la [documentation Stripe](https://stripe.com/docs) ou contactez leur support.