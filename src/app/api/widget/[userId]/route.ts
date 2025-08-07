// src/app/api/widget/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const theme = searchParams.get("theme") || "default";
    const width = searchParams.get("width") || "100%";
    const height = searchParams.get("height") || "600px";
    const lang = searchParams.get("lang") || "fr";

    // Récupérer les services actifs de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: "asc" }
        },
        availability: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Générer le widget HTML complet
    const widgetHTML = generateWidgetHTML({
      user,
      theme,
      width,
      height,
      lang,
      userId
    });

    // Retourner le HTML avec les bons headers
    return new NextResponse(widgetHTML, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300", // Cache 5 minutes
        "X-Frame-Options": "ALLOWALL", // Permet l'iframe
      },
    });

  } catch (error) {
    console.error("Erreur widget:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du widget" },
      { status: 500 }
    );
  }
}

function generateWidgetHTML({ user, theme, width, height, lang, userId }: any) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  
  const themeStyles = {
    default: {
      primary: "#3b82f6",
      secondary: "#e5e7eb",
      text: "#1f2937",
      background: "#ffffff"
    },
    dark: {
      primary: "#6366f1",
      secondary: "#374151",
      text: "#f9fafb",
      background: "#111827"
    },
    modern: {
      primary: "#06b6d4",
      secondary: "#f0f9ff",
      text: "#0c4a6e",
      background: "#ffffff"
    },
    medical: {
      primary: "#10b981",
      secondary: "#ecfdf5",
      text: "#065f46",
      background: "#ffffff"
    }
  };

  const colors = themeStyles[theme as keyof typeof themeStyles] || themeStyles.default;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réservation - ${user.businessName || user.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${colors.background};
            color: ${colors.text};
            line-height: 1.6;
        }
        
        .widget-container {
            max-width: 100%;
            padding: 20px;
            background: ${colors.background};
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .widget-header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid ${colors.secondary};
        }
        
        .business-name {
            font-size: 24px;
            font-weight: bold;
            color: ${colors.primary};
            margin-bottom: 8px;
        }
        
        .business-subtitle {
            color: ${colors.text};
            opacity: 0.7;
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .service-card {
            background: ${colors.secondary};
            padding: 20px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid transparent;
        }
        
        .service-card:hover {
            border-color: ${colors.primary};
            transform: translateY(-2px);
        }
        
        .service-card.selected {
            border-color: ${colors.primary};
            background: ${colors.primary};
            color: white;
        }
        
        .service-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .service-details {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .service-price {
            font-size: 16px;
            font-weight: bold;
            margin-top: 8px;
        }
        
        .booking-form {
            display: none;
            background: ${colors.secondary};
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
        }
        
        .form-input {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 16px;
            background: white;
        }
        
        .form-input:focus {
            outline: none;
            border-color: ${colors.primary};
            box-shadow: 0 0 0 3px ${colors.primary}20;
        }
        
        .btn-primary {
            background: ${colors.primary};
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: background 0.2s;
        }
        
        .btn-primary:hover {
            opacity: 0.9;
        }
        
        .btn-secondary {
            background: transparent;
            color: ${colors.primary};
            border: 1px solid ${colors.primary};
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
        }
        
        .success-message {
            background: #10b981;
            color: white;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            margin-top: 16px;
        }
        
        .error-message {
            background: #ef4444;
            color: white;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            margin-top: 16px;
        }
        
        .powered-by {
            text-align: center;
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid ${colors.secondary};
            font-size: 12px;
            opacity: 0.6;
        }
        
        .powered-by a {
            color: ${colors.primary};
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="widget-container">
        <!-- Header -->
        <div class="widget-header">
            <div class="business-name">${user.businessName || user.name}</div>
            <div class="business-subtitle">Réservez votre rendez-vous en ligne</div>
        </div>
        
        <!-- Services -->
        <div class="services-grid" id="servicesGrid">
            ${user.services.map((service: any) => `
                <div class="service-card" onclick="selectService('${service.id}', '${service.name}', ${service.price}, ${service.duration})">
                    <div class="service-name">${service.name}</div>
                    <div class="service-details">
                        ${service.description || 'Service professionnel'}
                        <br>📅 ${service.duration} min
                    </div>
                    <div class="service-price">${service.price}€</div>
                </div>
            `).join('')}
        </div>
        
        <!-- Formulaire de réservation -->
        <div class="booking-form" id="bookingForm">
            <h3 style="margin-bottom: 16px; color: ${colors.primary};">📅 Informations de réservation</h3>
            
            <form id="bookingFormElement" onsubmit="submitBooking(event)">
                <div class="form-group">
                    <label class="form-label">👤 Votre nom *</label>
                    <input type="text" class="form-input" id="clientName" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">📧 Votre email *</label>
                    <input type="email" class="form-input" id="clientEmail" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">📱 Votre téléphone</label>
                    <input type="tel" class="form-input" id="clientPhone">
                </div>
                
                <div class="form-group">
                    <label class="form-label">📅 Date souhaitée *</label>
                    <input type="date" class="form-input" id="bookingDate" required min="${new Date().toISOString().split('T')[0]}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">⏰ Heure souhaitée *</label>
                    <select class="form-input" id="bookingTime" required>
                        <option value="">Sélectionnez une heure</option>
                        ${generateTimeSlots()}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">💬 Commentaire (optionnel)</label>
                    <textarea class="form-input" id="bookingNotes" rows="3" placeholder="Des informations particulières ?"></textarea>
                </div>
                
                <button type="submit" class="btn-primary" id="submitBtn">
                    ✨ Confirmer ma réservation
                </button>
                
                <button type="button" class="btn-secondary" onclick="goBackToServices()" style="margin-top: 12px; width: 100%;">
                    ← Choisir un autre service
                </button>
            </form>
        </div>
        
        <!-- Messages -->
        <div id="messageContainer"></div>
        
        <!-- Powered by -->
        <div class="powered-by">
            Powered by <a href="https://bookingsaas.fr" target="_blank">BookingSaaS</a>
        </div>
    </div>

    <script>
        let selectedService = null;
        const userId = '${userId}';
        const baseUrl = '${baseUrl}';
        
        function selectService(serviceId, serviceName, price, duration) {
            selectedService = {
                id: serviceId,
                name: serviceName,
                price: price,
                duration: duration
            };
            
            // Marquer le service sélectionné
            document.querySelectorAll('.service-card').forEach(card => {
                card.classList.remove('selected');
            });
            event.target.closest('.service-card').classList.add('selected');
            
            // Afficher le formulaire
            document.getElementById('bookingForm').style.display = 'block';
            document.getElementById('bookingForm').scrollIntoView({ behavior: 'smooth' });
        }
        
        function goBackToServices() {
            document.getElementById('bookingForm').style.display = 'none';
            document.querySelectorAll('.service-card').forEach(card => {
                card.classList.remove('selected');
            });
            selectedService = null;
            clearMessages();
        }
        
        async function submitBooking(event) {
            event.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.textContent = 'Création en cours...';
            submitBtn.disabled = true;
            
            clearMessages();
            
            const formData = {
                serviceId: selectedService.id,
                clientName: document.getElementById('clientName').value,
                clientEmail: document.getElementById('clientEmail').value,
                clientPhone: document.getElementById('clientPhone').value,
                date: document.getElementById('bookingDate').value,
                time: document.getElementById('bookingTime').value,
                notes: document.getElementById('bookingNotes').value,
            };
            
            try {
                const response = await fetch(\`\${baseUrl}/api/booking/\${userId}/create\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showMessage('success', \`✅ Réservation confirmée !<br>
                        📅 \${selectedService.name}<br>
                        🗓️ \${formatDate(formData.date)} à \${formData.time}<br>
                        💰 Prix : \${selectedService.price}€<br><br>
                        Un email de confirmation va vous être envoyé.\`);
                    document.getElementById('bookingFormElement').reset();
                    
                    // Analytics - Track conversion
                    trackBookingSuccess(selectedService, formData);
                } else {
                    showMessage('error', \`❌ \${result.error || 'Erreur lors de la réservation'}\`);
                }
            } catch (error) {
                console.error('Erreur:', error);
                showMessage('error', '❌ Erreur de connexion. Veuillez réessayer.');
            } finally {
                submitBtn.textContent = '✨ Confirmer ma réservation';
                submitBtn.disabled = false;
            }
        }
        
        function showMessage(type, message) {
            const container = document.getElementById('messageContainer');
            container.innerHTML = \`<div class="\${type}-message">\${message}</div>\`;
        }
        
        function clearMessages() {
            document.getElementById('messageContainer').innerHTML = '';
        }
        
        function formatDate(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString('fr-FR');
        }
        
        function trackBookingSuccess(service, booking) {
            // Analytics simple
            if (typeof gtag !== 'undefined') {
                gtag('event', 'booking_completed', {
                    event_category: 'widget',
                    event_label: service.name,
                    value: service.price
                });
            }
            
            // Log pour BookingSaaS analytics
            fetch(\`\${baseUrl}/api/widget/analytics\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    event: 'booking_completed',
                    service: service.name,
                    price: service.price,
                    source: 'widget'
                })
            }).catch(console.error);
        }
    </script>
</body>
</html>`;
}

function generateTimeSlots() {
  const slots = [];
  for (let hour = 8; hour <= 19; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(`<option value="${timeString}">${timeString}</option>`);
    }
  }
  return slots.join('');
}