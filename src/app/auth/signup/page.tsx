// src/app/auth/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignUpFormData } from "@/types";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "pro"; // Plan par défaut

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<SignUpFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    businessName: "",
    phone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation basique
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          businessName: formData.businessName,
          phone: formData.phone,
        }),
      });

      if (response.ok) {
        // Connecter automatiquement l'utilisateur après inscription
        const signInResponse = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (signInResponse?.ok) {
          // Si un plan était sélectionné, rediriger vers Stripe pour l'abonnement
          if (selectedPlan && selectedPlan !== "trial") {
            router.push(`/pricing?plan=${selectedPlan}&auto=true`);
          } else {
            // Sinon aller directement au dashboard
            router.push("/dashboard?welcome=true");
          }
        } else {
          // Fallback si la connexion auto échoue
          router.push(
            `/auth/signin?message=Compte créé avec succès&email=${formData.email}`
          );
        }
      } else {
        const data = await response.json();
        setError(data.error || "Une erreur est survenue");
      }
    } catch (error) {
      setError("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Créer un compte
          </CardTitle>
          <CardDescription className="text-center">
            Commencez votre essai gratuit de 14 jours
          </CardDescription>
          {selectedPlan && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-center">
              <span className="text-sm text-blue-800">
                Plan sélectionné:{" "}
                <span className="font-semibold capitalize">{selectedPlan}</span>
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Jean Dupont"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Nom de votre activité</Label>
              <Input
                id="businessName"
                name="businessName"
                type="text"
                required
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Cabinet de thérapie, Salon de coiffure..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="jean@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone (optionnel)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="06 12 34 56 78"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 caractères"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Répétez votre mot de passe"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Création en cours..." : "Créer mon compte"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/auth/signin"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Se connecter
              </Link>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
