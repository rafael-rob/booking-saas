// src/app/dashboard/services/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Service } from "@prisma/client";
import { formatPrice } from "@/lib/utils";

export default function ServicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 60,
    price: 50,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchServices();
    }
  }, [session]);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingService
        ? `/api/services/${editingService.id}`
        : "/api/services";
      const method = editingService ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchServices();
        resetForm();
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: service.price,
    });
    setShowForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) return;

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...service,
          isActive: !service.isActive,
        }),
      });

      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      duration: 60,
      price: 50,
    });
    setEditingService(null);
    setShowForm(false);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="mb-2"
              >
                ← Retour au dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Mes services</h1>
              <p className="text-gray-600">
                Gérez les services que vous proposez
              </p>
            </div>
            <Button onClick={() => setShowForm(true)}>
              Ajouter un service
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des services */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {services.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="text-6xl mb-4">⚙️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun service configuré
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Commencez par créer votre premier service
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      Créer mon premier service
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                services.map((service) => (
                  <Card
                    key={service.id}
                    className={!service.isActive ? "opacity-60" : ""}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold">
                              {service.name}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                service.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {service.isActive ? "Actif" : "Inactif"}
                            </span>
                          </div>
                          {service.description && (
                            <p className="text-gray-600 mt-1">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <span>⏱️ {service.duration} minutes</span>
                            <span>💰 {formatPrice(service.price)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(service)}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActive(service)}
                          >
                            {service.isActive ? "Désactiver" : "Activer"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Formulaire */}
          {showForm && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingService ? "Modifier le service" : "Nouveau service"}
                  </CardTitle>
                  <CardDescription>
                    Configurez les détails de votre service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du service *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Ex: Consultation, Coupe, Massage..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Description du service (optionnel)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Durée (minutes) *</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="15"
                        step="15"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            duration: parseInt(e.target.value),
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Prix (€) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: parseFloat(e.target.value),
                          })
                        }
                        required
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1">
                        {editingService ? "Mettre à jour" : "Créer"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                      >
                        Annuler
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
