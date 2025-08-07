# 🔗 Guide des Intégrations BookingSaaS

## 📅 **Google Calendar - Configuration Complète**

### Étape 1: Créer le projet Google Cloud

1. **Aller sur** : [Google Cloud Console](https://console.cloud.google.com)
2. **Créer un nouveau projet** ou sélectionner un projet existant
3. **Nom du projet** : "BookingSaaS Calendar Integration"

### Étape 2: Activer l'API Google Calendar

1. **Aller dans "APIs & Services > Library"**
2. **Rechercher "Google Calendar API"**
3. **Cliquer "Enable"**

### Étape 3: Configurer OAuth 2.0

1. **Aller dans "APIs & Services > Credentials"**
2. **Cliquer "Create Credentials > OAuth 2.0 Client ID"**
3. **Application type** : Web application
4. **Name** : BookingSaaS Calendar
5. **Authorized redirect URIs** : 
   - `http://localhost:3000/api/integrations/google/callback` (dev)
   - `https://yourdomain.com/api/integrations/google/callback` (prod)

### Étape 4: Récupérer les identifiants

Après création, vous recevrez :
- **Client ID** : `123456789-abc123.apps.googleusercontent.com`
- **Client Secret** : `ABC123-DEF456-GHI789`

### Étape 5: Configurer .env.local

```bash
# Google Calendar
GOOGLE_CLIENT_ID="votre-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="votre-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/integrations/google/callback"
```

---

## 📱 **Twilio SMS/WhatsApp - Configuration**

### Étape 1: Créer le compte Twilio

1. **Inscription** : [twilio.com](https://twilio.com)
2. **Vérifier** votre numéro de téléphone
3. **Récupérer** les identifiants du dashboard

### Étape 2: Acheter un numéro

1. **Aller dans "Phone Numbers > Manage > Buy a number"**
2. **Choisir un numéro** français (+33) ou international
3. **Activer** SMS et Voice capabilities

### Étape 3: Configurer WhatsApp (optionnel)

1. **Aller dans "Messaging > Try it out > Send a WhatsApp message"**
2. **Suivre** les instructions pour activer WhatsApp
3. **Test** avec le sandbox number

### Étape 4: Variables d'environnement

```bash
# Twilio
TWILIO_ACCOUNT_SID="AC123abc456def789"
TWILIO_AUTH_TOKEN="abc123def456ghi789"
TWILIO_PHONE_NUMBER="+33123456789"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"  # Sandbox pour test
```

---

## 🔧 **APIs Créées - Documentation**

### Google Calendar

#### `GET /api/integrations/google/auth`
Initialise l'OAuth Google et retourne l'URL d'autorisation.

#### `POST /api/integrations/google/auth`  
Échange le code d'autorisation contre un access token.

```json
{
  "code": "4/0Adeu5BW..."
}
```

#### `POST /api/integrations/google/sync`
Synchronise une réservation avec Google Calendar.

```json
{
  "bookingId": "booking-id",
  "action": "create" | "update" | "delete"
}
```

### Outlook Export

#### `GET /api/integrations/outlook/export`
Exporte tous les RDV confirmés au format .ics.

**Response** : Fichier `.ics` téléchargeable

---

## 📊 **Fonctionnalités Implémentées**

### ✅ **Google Calendar**
- [ ] OAuth 2.0 complet (structure créée)
- [ ] Synchronisation bidirectionnelle 
- [ ] Détection de conflits
- [x] Interface utilisateur complète
- [x] Configuration des paramètres

### ✅ **Outlook Export**
- [x] Export .ics fonctionnel
- [x] Tous les RDV confirmés
- [x] Informations client incluses
- [x] Compatible avec tous les calendriers

### 🔄 **Auto-sync Hooks**
- [x] Sync après création de RDV
- [ ] Sync après modification
- [ ] Sync après suppression

---

## 🚀 **Prochaines Étapes**

### Phase 2A - Google Calendar Complet
1. **Implémenter** l'échange de tokens OAuth
2. **Créer** les événements dans Google Calendar
3. **Gérer** la synchronisation bidirectionnelle
4. **Détecter** les conflits d'horaires

### Phase 2B - SMS/WhatsApp avec Twilio  
1. **Rappels automatiques** 24h avant
2. **Confirmations** de réservation
3. **Modifications** et annulations
4. **Templates** de messages personnalisables

### Phase 2C - Widget Embeddable
1. **Générateur** de code iframe
2. **Customisation** des couleurs/styles
3. **Intégration** dans sites web
4. **Analytics** des réservations par widget

---

## ⚠️ **Important - Sécurité**

### Google Calendar
- **Stocker** les tokens de façon sécurisée (chiffrés)
- **Refresh tokens** avant expiration
- **Permissions minimales** (calendar.events seulement)

### Twilio
- **Rate limiting** pour éviter le spam
- **Validation** des numéros avant envoi
- **Logs** des messages envoyés

### Général  
- **HTTPS obligatoire** en production
- **Webhooks** avec signature verification
- **Logs** détaillés pour debugging

---

**Status** : Structure créée ✅ | Tests locaux ✅ | Production ⏳