'use client';

import { useEffect, useState } from 'react';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading API spec:', err);
        setError('Erreur lors du chargement de la documentation API');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (spec && !loading) {
      // Load Swagger UI dynamically
      import('swagger-ui-react').then(({ default: SwaggerUI }) => {
        const container = document.getElementById('swagger-ui');
        if (container) {
          // Clear container
          container.innerHTML = '';
          
          // Create a div for SwaggerUI
          const swaggerDiv = document.createElement('div');
          container.appendChild(swaggerDiv);
          
          // Render SwaggerUI (this is a simplified approach)
          // In a real implementation, you'd use a proper React mounting approach
        }
      }).catch((err) => {
        console.error('Error loading SwaggerUI:', err);
        setError('Erreur lors du chargement de l\'interface Swagger');
      });
    }
  }, [spec, loading]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de la documentation API...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erreur de chargement
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Documentation API
              </h1>
              <p className="text-gray-600 mt-2">
                Documentation complète de l'API Booking SaaS
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                OpenAPI 3.0
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                v{spec?.info?.version || '1.0.0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Manual API Documentation Display */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* API Information */}
              <div className="lg:col-span-1">
                <div className="sticky top-6">
                  <h2 className="text-xl font-semibold mb-4">Information</h2>
                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Version</dt>
                      <dd className="text-sm text-gray-900">{spec?.info?.version}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="text-sm text-gray-900">{spec?.info?.description}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Contact</dt>
                      <dd className="text-sm text-gray-900">{spec?.info?.contact?.email}</dd>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Serveurs</h3>
                  <div className="space-y-2">
                    {spec?.servers?.map((server: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded">
                        <div className="font-mono text-sm text-blue-600">{server.url}</div>
                        <div className="text-xs text-gray-500">{server.description}</div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold mt-6 mb-3">Tags</h3>
                  <div className="space-y-1">
                    {spec?.tags?.map((tag: any, index: number) => (
                      <div key={index} className="flex items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {tag.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">{tag.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* API Endpoints */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Endpoints</h2>
                <div className="text-center py-12">
                  <div className="text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg mb-2">
                    Interface Swagger UI en cours de développement
                  </p>
                  <p className="text-gray-500 text-sm">
                    En attendant, vous pouvez accéder à la spécification OpenAPI complète à :
                  </p>
                  <a 
                    href="/api/docs" 
                    className="inline-flex items-center mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Voir la spécification JSON
                  </a>
                </div>

                {/* Quick Reference */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Endpoints principaux</h3>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">GET /api/health</code>
                        <span className="text-xs text-gray-500">Health Check</span>
                      </div>
                      <p className="text-sm text-gray-600">État de santé basique du système</p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">GET /api/health/detailed</code>
                        <span className="text-xs text-gray-500">Health Check détaillé</span>
                      </div>
                      <p className="text-sm text-gray-600">État de santé détaillé avec métriques (authentifié)</p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">GET /api/health/readiness</code>
                        <span className="text-xs text-gray-500">Kubernetes Readiness</span>
                      </div>
                      <p className="text-sm text-gray-600">Probe de préparation pour Kubernetes</p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">GET /api/health/liveness</code>
                        <span className="text-xs text-gray-500">Kubernetes Liveness</span>
                      </div>
                      <p className="text-sm text-gray-600">Probe de vitalité pour Kubernetes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}