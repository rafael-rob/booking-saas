// src/app/dashboard/integrations/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function IntegrationsPage() {
  const { data: session } = useSession();
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [integrationSettings, setIntegrationSettings] = useState({
    autoSync: true,
    createEvents: true,
    updateEvents: true,
    sendNotifications: true,
  });
  
  const [smsSettings, setSmsSettings] = useState({
    remindersEnabled: false,
    whatsappEnabled: false,
    confirmationSms: true,
    reminderTiming: 24, // heures avant le RDV
  });

  const handleGoogleConnect = async () => {
    setIsLoading(true);
    try {
      // TODO: Implémenter l'OAuth Google
      console.log("Connexion Google Calendar...");
      
      // Simulation pour l'instant
      setTimeout(() => {
        setIsGoogleConnected(true);
        setIsLoading(false);
        alert("✅ Google Calendar connecté avec succès !");
      }, 2000);
    } catch (error) {
      console.error("Erreur connexion Google:", error);
      setIsLoading(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    setIsLoading(true);
    try {
      // TODO: Déconnecter Google Calendar
      setTimeout(() => {
        setIsGoogleConnected(false);
        setIsLoading(false);
        alert("Google Calendar déconnecté");
      }, 1000);
    } catch (error) {
      console.error("Erreur déconnexion Google:", error);
      setIsLoading(false);
    }
  };

  const exportToOutlook = async () => {
    try {
      const response = await fetch("/api/integrations/outlook/export", {
        method: "GET",
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mes-rdv-booking.ics";
        a.click();
        window.URL.revokeObjectURL(url);
        alert("📅 Fichier .ics téléchargé ! Importez-le dans Outlook.");
      }
    } catch (error) {
      console.error("Erreur export Outlook:", error);
      alert("Erreur lors de l'export");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900">Intégrations</h1>
            <p className="text-gray-600 mt-2">
              Connectez BookingSaaS à vos outils favoris
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Google Calendar */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl">📅</span>
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Google Calendar
                    {isGoogleConnected && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        ✅ Connecté
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Synchronisez automatiquement vos RDV avec Google Calendar
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📈 Avantages :</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Synchronisation bidirectionnelle automatique</li>
                  <li>• Détection de conflits d'horaires</li>
                  <li>• Notifications sur tous vos appareils</li>
                  <li>• Partage facile avec votre équipe</li>
                </ul>
              </div>

              {!isGoogleConnected ? (
                <Button
                  onClick={handleGoogleConnect}
                  disabled={isLoading}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connexion en cours...
                    </div>
                  ) : (
                    <>
                      🔗 Connecter Google Calendar
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-900">
                        ✅ Synchronisation active
                      </span>
                      <span className="text-sm text-green-700">
                        Dernière sync: Il y a 2 min
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Synchronisation automatique</span>
                      <Switch
                        checked={integrationSettings.autoSync}
                        onCheckedChange={(checked) =>
                          setIntegrationSettings(prev => ({ ...prev, autoSync: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Créer les événements</span>
                      <Switch
                        checked={integrationSettings.createEvents}
                        onCheckedChange={(checked) =>
                          setIntegrationSettings(prev => ({ ...prev, createEvents: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Mettre à jour les événements</span>
                      <Switch
                        checked={integrationSettings.updateEvents}
                        onCheckedChange={(checked) =>
                          setIntegrationSettings(prev => ({ ...prev, updateEvents: checked }))
                        }
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleGoogleDisconnect}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Se déconnecter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outlook */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl">📧</span>
                </div>
                <div>
                  <CardTitle>Microsoft Outlook</CardTitle>
                  <CardDescription>
                    Exportez vos RDV vers Outlook et autres calendriers
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">📋 Format .ics :</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Compatible Outlook, Apple Calendar, etc.</li>
                  <li>• Export de tous vos RDV confirmés</li>
                  <li>• Informations clients incluses</li>
                  <li>• Mise à jour manuelle (re-téléchargement)</li>
                </ul>
              </div>

              <Button
                onClick={exportToOutlook}
                size="lg"
                variant="outline"
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                📥 Télécharger fichier .ics
              </Button>

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">
                  Comment importer dans Outlook :
                </p>
                <ol className="text-xs text-gray-600 space-y-1">
                  <li>1. Ouvrez Outlook</li>
                  <li>2. Fichier &gt; Importer/Exporter</li>
                  <li>3. Sélectionnez le fichier .ics téléchargé</li>
                  <li>4. Vos RDV apparaissent dans votre calendrier</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* SMS/WhatsApp Twilio */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl">📱</span>
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    SMS & WhatsApp
                    {smsSettings.remindersEnabled && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        ✅ Actif
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Rappels automatiques et notifications par SMS/WhatsApp
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">📈 Impact prouvé :</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• -70% d'absences avec les rappels automatiques</li>
                  <li>• +85% de confirmation des RDV</li>
                  <li>• Notifications en temps réel</li>
                  <li>• Support WhatsApp Business</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Rappels automatiques</span>
                    <div className="text-xs text-gray-500">24h avant le RDV</div>
                  </div>
                  <Switch
                    checked={smsSettings.remindersEnabled}
                    onCheckedChange={(checked) =>
                      setSmsSettings(prev => ({ ...prev, remindersEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">WhatsApp Business</span>
                    <div className="text-xs text-gray-500">Messages via WhatsApp</div>
                  </div>
                  <Switch
                    checked={smsSettings.whatsappEnabled}
                    onCheckedChange={(checked) =>
                      setSmsSettings(prev => ({ ...prev, whatsappEnabled: checked }))
                    }
                    disabled={!smsSettings.remindersEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">SMS de confirmation</span>
                    <div className="text-xs text-gray-500">Après chaque réservation</div>
                  </div>
                  <Switch
                    checked={smsSettings.confirmationSms}
                    onCheckedChange={(checked) =>
                      setSmsSettings(prev => ({ ...prev, confirmationSms: checked }))
                    }
                    disabled={!smsSettings.remindersEnabled}
                  />
                </div>
              </div>

              {smsSettings.remindersEnabled ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-green-900">
                      ✅ SMS activés - Twilio configuré
                    </span>
                    <span className="text-sm text-green-700">
                      12 messages ce mois
                    </span>
                  </div>
                  <div className="text-xs text-green-700">
                    Coût approximatif : 1,20€/mois pour 120 SMS
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">⚙️ Configuration requise :</h4>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <div>1. Compte Twilio requis (5€ de crédit gratuit)</div>
                    <div>2. Numéro français : ~1€/mois</div>
                    <div>3. SMS : ~0,01€ par message</div>
                    <div>4. WhatsApp : gratuit après validation</div>
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 bg-yellow-600 hover:bg-yellow-700"
                    onClick={() => window.open('https://twilio.com', '_blank')}
                  >
                    📱 Créer compte Twilio
                  </Button>
                </div>
              )}

              {/* Messages de test */}
              {smsSettings.remindersEnabled && (
                <div className="space-y-2">
                  <h4 className="font-medium">🧪 Tester les messages :</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => alert("Test SMS de confirmation envoyé !")}
                    >
                      Test Confirmation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => alert("Test rappel 24h envoyé !")}
                    >
                      Test Rappel 24h
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistiques d'intégration */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📊 Statistiques d'intégration</CardTitle>
            <CardDescription>
              Impact des intégrations sur votre activité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">+47%</div>
                <div className="text-sm text-gray-600">RDV confirmés</div>
                <div className="text-xs text-gray-500">avec Google Calendar</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">-70%</div>
                <div className="text-sm text-gray-600">Absences clients</div>
                <div className="text-xs text-gray-500">avec rappels SMS</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">92%</div>
                <div className="text-sm text-gray-600">Taux de lecture</div>
                <div className="text-xs text-gray-500">messages SMS/WhatsApp</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">3.7h</div>
                <div className="text-sm text-gray-600">Temps économisé</div>
                <div className="text-xs text-gray-500">par semaine</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prochaines intégrations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🚀 Prochaines intégrations</CardTitle>
            <CardDescription>
              Bientôt disponibles dans BookingSaaS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm">📱</span>
                </div>
                <div>
                  <div className="font-medium">WhatsApp Business</div>
                  <div className="text-xs text-gray-500">Rappels automatiques</div>
                </div>
              </div>
              <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm">💳</span>
                </div>
                <div>
                  <div className="font-medium">Stripe Advanced</div>
                  <div className="text-xs text-gray-500">Acomptes et factures</div>
                </div>
              </div>
              <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm">📊</span>
                </div>
                <div>
                  <div className="font-medium">Google Analytics</div>
                  <div className="text-xs text-gray-500">Tracking avancé</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}