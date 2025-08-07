// src/app/dashboard/widget/page.tsx
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function WidgetPage() {
  const { data: session } = useSession();
  const [widgetSettings, setWidgetSettings] = useState({
    theme: "default",
    width: "100%",
    height: "600px",
    lang: "fr",
    showPrices: true,
    showDuration: true,
    customCSS: "",
    embedTitle: "Réservation en ligne",
  });
  
  const [previewMode, setPreviewMode] = useState("desktop");
  const [copiedCode, setCopiedCode] = useState(false);

  const baseUrl = process.env.NEXTAUTH_URL || typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const userId = session?.user?.id;

  // Générer l'URL du widget
  const widgetUrl = userId ? 
    `${baseUrl}/api/widget/${userId}?theme=${widgetSettings.theme}&width=${encodeURIComponent(widgetSettings.width)}&height=${encodeURIComponent(widgetSettings.height)}&lang=${widgetSettings.lang}` 
    : '';

  // Code embed à copier
  const embedCode = `<iframe 
  src="${widgetUrl}"
  width="${widgetSettings.width}"
  height="${widgetSettings.height}"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
  title="${widgetSettings.embedTitle}">
</iframe>`;

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
    }
  };

  const themeOptions = [
    { value: "default", label: "🔵 Défaut (Bleu)", color: "#3b82f6" },
    { value: "dark", label: "🌙 Sombre (Violet)", color: "#6366f1" },
    { value: "modern", label: "💎 Moderne (Cyan)", color: "#06b6d4" },
    { value: "medical", label: "🏥 Médical (Vert)", color: "#10b981" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900">Widget Embeddable</h1>
            <p className="text-gray-600 mt-2">
              Intégrez vos réservations sur n'importe quel site web
            </p>
          </div>
          <Badge variant="secondary" className="mt-4 md:mt-0">
            🚀 Phase 2C - Widget
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Configuration */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎨 Personnalisation
                </CardTitle>
                <CardDescription>
                  Configurez l'apparence de votre widget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Thème */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Thème</label>
                  <Select 
                    value={widgetSettings.theme} 
                    onValueChange={(value) => setWidgetSettings(prev => ({ ...prev, theme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themeOptions.map(theme => (
                        <SelectItem key={theme.value} value={theme.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: theme.color }}
                            />
                            {theme.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Largeur</label>
                    <Input
                      value={widgetSettings.width}
                      onChange={(e) => setWidgetSettings(prev => ({ ...prev, width: e.target.value }))}
                      placeholder="100% ou 400px"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hauteur</label>
                    <Input
                      value={widgetSettings.height}
                      onChange={(e) => setWidgetSettings(prev => ({ ...prev, height: e.target.value }))}
                      placeholder="600px"
                    />
                  </div>
                </div>

                {/* Langue */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Langue</label>
                  <Select 
                    value={widgetSettings.lang} 
                    onValueChange={(value) => setWidgetSettings(prev => ({ ...prev, lang: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Options d'affichage */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Afficher les prix</span>
                    <Switch
                      checked={widgetSettings.showPrices}
                      onCheckedChange={(checked) => setWidgetSettings(prev => ({ ...prev, showPrices: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Afficher la durée</span>
                    <Switch
                      checked={widgetSettings.showDuration}
                      onCheckedChange={(checked) => setWidgetSettings(prev => ({ ...prev, showDuration: checked }))}
                    />
                  </div>
                </div>

                {/* Titre personnalisé */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Titre du widget</label>
                  <Input
                    value={widgetSettings.embedTitle}
                    onChange={(e) => setWidgetSettings(prev => ({ ...prev, embedTitle: e.target.value }))}
                    placeholder="Réservation en ligne"
                  />
                </div>

              </CardContent>
            </Card>

            {/* Code d'intégration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Code d'intégration
                </CardTitle>
                <CardDescription>
                  Copiez ce code dans votre site web
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={embedCode}
                  readOnly
                  rows={8}
                  className="font-mono text-sm"
                />
                
                <Button 
                  onClick={copyEmbedCode} 
                  className="w-full"
                  variant={copiedCode ? "outline" : "default"}
                >
                  {copiedCode ? (
                    <>✅ Code copié !</>
                  ) : (
                    <>📋 Copier le code</>
                  )}
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Instructions :</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Copiez le code ci-dessus</li>
                    <li>2. Collez-le dans votre site WordPress, HTML, etc.</li>
                    <li>3. Le widget s'adapte automatiquement</li>
                    <li>4. Les réservations arrivent dans votre dashboard</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Statistiques Widget
                </CardTitle>
                <CardDescription>
                  Performance de votre widget embeddé
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">47</div>
                    <div className="text-sm text-gray-600">Vues ce mois</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600">Réservations</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">25.5%</div>
                    <div className="text-sm text-gray-600">Taux conversion</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">340€</div>
                    <div className="text-sm text-gray-600">CA généré</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prévisualisation */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      👀 Prévisualisation
                    </CardTitle>
                    <CardDescription>
                      Aperçu de votre widget en temps réel
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={previewMode === "desktop" ? "default" : "outline"}
                      onClick={() => setPreviewMode("desktop")}
                    >
                      🖥️ Desktop
                    </Button>
                    <Button
                      size="sm"
                      variant={previewMode === "mobile" ? "default" : "outline"}
                      onClick={() => setPreviewMode("mobile")}
                    >
                      📱 Mobile
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`border border-gray-200 rounded-lg overflow-hidden ${
                  previewMode === "mobile" ? "max-w-sm mx-auto" : ""
                }`}>
                  {widgetUrl && (
                    <iframe
                      src={widgetUrl}
                      width="100%"
                      height="600"
                      frameBorder="0"
                      style={{ 
                        minHeight: "600px",
                        backgroundColor: "white" 
                      }}
                      title="Prévisualisation Widget"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Avantages du widget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Avantages du Widget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">✅</span>
                    </div>
                    <div>
                      <div className="font-medium">Intégration universelle</div>
                      <div className="text-sm text-gray-600">WordPress, Wix, HTML, Shopify...</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm">📱</span>
                    </div>
                    <div>
                      <div className="font-medium">100% Responsive</div>
                      <div className="text-sm text-gray-600">S'adapte à tous les écrans</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-sm">🎨</span>
                    </div>
                    <div>
                      <div className="font-medium">Personnalisable</div>
                      <div className="text-sm text-gray-600">Thèmes et couleurs</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 text-sm">⚡</span>
                    </div>
                    <div>
                      <div className="font-medium">Ultra-rapide</div>
                      <div className="text-sm text-gray-600">Chargement optimisé</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Exemples d'utilisation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🌐 Exemples d'utilisation</CardTitle>
            <CardDescription>
              Comment utiliser votre widget sur différentes plateformes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* WordPress */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">W</span>
                  </div>
                  <h4 className="font-semibold">WordPress</h4>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>1. Éditeur → Bloc HTML personnalisé</div>
                  <div>2. Coller le code iframe</div>
                  <div>3. Publier la page</div>
                </div>
              </div>

              {/* HTML */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">H</span>
                  </div>
                  <h4 className="font-semibold">Site HTML</h4>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>1. Ouvrir votre fichier HTML</div>
                  <div>2. Coller le code iframe</div>
                  <div>3. Sauvegarder et uploader</div>
                </div>
              </div>

              {/* Shopify */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">S</span>
                  </div>
                  <h4 className="font-semibold">Shopify</h4>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>1. Pages → Ajouter une page</div>
                  <div>2. HTML editor → Coller iframe</div>
                  <div>3. Sauvegarder</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}