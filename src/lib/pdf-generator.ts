// src/lib/pdf-generator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getSectorConfig } from './sector-config';

export interface ReportData {
  period: {
    start: string;
    end: string;
    label: string;
  };
  business: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  bookings: any[];
  clients: any[];
  services: any[];
  stats: {
    totalBookings: number;
    totalRevenue: number;
    totalClients: number;
    averagePrice: number;
    noShowRate: number;
    topServices: any[];
    topClients: any[];
  };
  sector?: string;
}

export class PDFReportGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private sectorConfig: any;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
  }

  private addHeader(data: ReportData) {
    const { business, period, sector } = data;
    this.sectorConfig = sector ? getSectorConfig(sector) : null;

    // Logo et nom business (simulé)
    this.doc.setFillColor(59, 130, 246); // Bleu
    this.doc.rect(this.margin, this.margin, this.pageWidth - 2 * this.margin, 25, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(20);
    this.doc.text(`${this.sectorConfig?.icon || '📊'} ${business.name}`, this.margin + 5, this.margin + 15);
    
    this.doc.setFontSize(12);
    this.doc.text(`Rapport d'activité - ${period.label}`, this.margin + 5, this.margin + 22);
    
    // Informations secteur
    if (this.sectorConfig) {
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(10);
      this.doc.text(this.sectorConfig.name, this.pageWidth - this.margin - 50, this.margin + 15);
    }

    // Date génération
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFontSize(8);
    const today = new Date().toLocaleDateString('fr-FR');
    this.doc.text(`Généré le ${today}`, this.pageWidth - this.margin - 50, this.margin + 22);
  }

  private addSummaryStats(data: ReportData, yPosition: number) {
    const { stats } = data;
    
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(16);
    this.doc.text('📈 Résumé de période', this.margin, yPosition);
    
    yPosition += 15;

    // Cartes de stats (4 colonnes)
    const cardWidth = (this.pageWidth - 2 * this.margin - 30) / 4;
    const cardHeight = 25;
    
    const statsCards = [
      { label: 'Réservations', value: stats.totalBookings.toString(), color: [59, 130, 246] },
      { label: 'Chiffre d\'affaires', value: `${stats.totalRevenue}€`, color: [16, 185, 129] },
      { label: 'Clients', value: stats.totalClients.toString(), color: [139, 92, 246] },
      { label: 'Prix moyen', value: `${stats.averagePrice}€`, color: [245, 158, 11] },
    ];

    statsCards.forEach((card, index) => {
      const x = this.margin + index * (cardWidth + 10);
      
      // Fond coloré
      this.doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      this.doc.rect(x, yPosition, cardWidth, cardHeight, 'F');
      
      // Texte blanc
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(10);
      this.doc.text(card.label, x + 5, yPosition + 8);
      
      this.doc.setFontSize(16);
      this.doc.text(card.value, x + 5, yPosition + 18);
    });

    return yPosition + cardHeight + 20;
  }

  private addBookingsTable(data: ReportData, yPosition: number) {
    const { bookings } = data;
    
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(16);
    this.doc.text('📅 Réservations de la période', this.margin, yPosition);
    
    yPosition += 10;

    if (bookings.length === 0) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text('Aucune réservation sur cette période', this.margin, yPosition + 10);
      return yPosition + 30;
    }

    // Préparer les données pour le tableau
    const tableData = bookings.map(booking => [
      new Date(booking.startTime).toLocaleDateString('fr-FR'),
      new Date(booking.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      booking.clientName,
      booking.service?.name || 'Service supprimé',
      this.getStatusLabel(booking.status),
      `${booking.service?.price || 0}€`
    ]);

    autoTable(this.doc, {
      startY: yPosition,
      head: [['Date', 'Heure', 'Client', 'Service', 'Statut', 'Prix']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 35 },
        3: { cellWidth: 40 },
        4: { cellWidth: 20, textColor: this.getStatusColor('CONFIRMED') },
        5: { cellWidth: 20, halign: 'right' }
      }
    });

    return (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addTopServices(data: ReportData, yPosition: number) {
    const { stats } = data;
    
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(16);
    this.doc.text('🏆 Top Services', this.margin, yPosition);
    
    yPosition += 10;

    if (!stats.topServices || stats.topServices.length === 0) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text('Aucun service populaire identifié', this.margin, yPosition + 10);
      return yPosition + 30;
    }

    const tableData = stats.topServices.map((service, index) => [
      `${index + 1}`,
      service.name,
      `${service.bookings}`,
      `${service.revenue}€`,
      `${service.averagePrice}€`
    ]);

    autoTable(this.doc, {
      startY: yPosition,
      head: [['Rang', 'Service', 'Réservations', 'CA généré', 'Prix moyen']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [16, 185, 129] }
    });

    return (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addClientAnalysis(data: ReportData, yPosition: number) {
    const { stats } = data;
    
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(16);
    this.doc.text('👥 Analyse Clientèle', this.margin, yPosition);
    
    yPosition += 10;

    // Stats générales clients
    this.doc.setFontSize(12);
    this.doc.text(`• Nombre total de clients : ${stats.totalClients}`, this.margin, yPosition);
    yPosition += 8;
    this.doc.text(`• Taux d'absence : ${Math.round(stats.noShowRate)}%`, this.margin, yPosition);
    yPosition += 15;

    // Top clients si disponible
    if (stats.topClients && stats.topClients.length > 0) {
      this.doc.setFontSize(14);
      this.doc.text('Meilleurs clients', this.margin, yPosition);
      yPosition += 10;

      const tableData = stats.topClients.map((client, index) => [
        `${index + 1}`,
        client.name,
        `${client.totalBookings}`,
        `${client.totalSpent}€`,
        client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('fr-FR') : 'N/A'
      ]);

      autoTable(this.doc, {
        startY: yPosition,
        head: [['Rang', 'Client', 'RDV', 'CA', 'Dernière visite']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [139, 92, 246] }
      });

      return (this.doc as any).lastAutoTable.finalY + 20;
    }

    return yPosition;
  }

  private addSectorInsights(data: ReportData, yPosition: number) {
    if (!this.sectorConfig) return yPosition;

    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(16);
    this.doc.text(`${this.sectorConfig.icon} Insights ${this.sectorConfig.name}`, this.margin, yPosition);
    
    yPosition += 15;

    // Recommandations sectorielles
    const recommendations = this.getSectorRecommendations(data);
    
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Recommandations pour votre secteur :', this.margin, yPosition);
    yPosition += 10;

    recommendations.forEach(rec => {
      this.doc.setFontSize(10);
      this.doc.setTextColor(50, 50, 50);
      this.doc.text(`• ${rec}`, this.margin + 5, yPosition);
      yPosition += 8;
    });

    return yPosition + 10;
  }

  private addFooter() {
    const footerY = this.pageHeight - 20;
    
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Généré par BookingSaaS - Tous droits réservés', this.margin, footerY);
    this.doc.text(`Page 1/${this.doc.getNumberOfPages()}`, this.pageWidth - this.margin - 20, footerY);
  }

  private getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmé',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé'
    };
    return labels[status] || status;
  }

  private getStatusColor(status: string): number[] {
    const colors: { [key: string]: number[] } = {
      'PENDING': [245, 158, 11],
      'CONFIRMED': [16, 185, 129],
      'COMPLETED': [59, 130, 246],
      'CANCELLED': [239, 68, 68]
    };
    return colors[status] || [100, 100, 100];
  }

  private getSectorRecommendations(data: ReportData): string[] {
    const sector = this.sectorConfig?.name?.toLowerCase();
    const { stats } = data;

    const recommendations: { [key: string]: string[] } = {
      'barbier': [
        'Proposez des forfaits coupe mensuelle pour fidéliser vos clients réguliers',
        'Optimisez vos créneaux : 30min pour coupe simple, 45min pour coupe+barbe',
        'Activez les rappels SMS pour réduire les absences de 70%',
        stats.noShowRate > 15 ? 'Votre taux d\'absence est élevé, renforcez les rappels' : 'Excellent taux de présence, continuez ainsi !'
      ],
      'beauté': [
        'Créez des packages de soins pour augmenter votre panier moyen',
        'Proposez des rendez-vous de suivi pour les soins longue durée',
        'Développez la vente de produits cosmétiques en complément',
        'Planifiez vos soins longs en fin de journée pour optimiser le planning'
      ],
      'massage': [
        'Éduquez vos clients sur les bienfaits des séances régulières',
        'Proposez des forfaits détente de 5 ou 10 séances',
        'Créez une ambiance relaxante avec musique et parfums d\'ambiance',
        'Laissez 10min entre chaque séance pour aérer et préparer l\'espace'
      ]
    };

    return recommendations[sector] || [
      'Analysez vos heures de pointe pour optimiser vos tarifs',
      'Fidélisez vos meilleurs clients avec des offres personnalisées',
      'Utilisez les statistiques pour identifier vos services les plus rentables'
    ];
  }

  public generateReport(data: ReportData): Uint8Array {
    let yPosition = this.margin + 35;

    // Construire le rapport
    this.addHeader(data);
    yPosition = this.addSummaryStats(data, yPosition);
    yPosition = this.addBookingsTable(data, yPosition);
    
    // Nouvelle page si nécessaire
    if (yPosition > this.pageHeight - 100) {
      this.doc.addPage();
      yPosition = this.margin;
    }
    
    yPosition = this.addTopServices(data, yPosition);
    yPosition = this.addClientAnalysis(data, yPosition);
    
    // Nouvelle page si nécessaire
    if (yPosition > this.pageHeight - 80) {
      this.doc.addPage();
      yPosition = this.margin;
    }
    
    yPosition = this.addSectorInsights(data, yPosition);
    
    this.addFooter();

    // Retourner le PDF en tant que buffer
    return this.doc.output('arraybuffer');
  }

  public generateInvoice(booking: any, business: any): Uint8Array {
    this.doc = new jsPDF();

    // En-tête facture
    this.doc.setFillColor(59, 130, 246);
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.text('FACTURE', this.margin, 25);
    
    this.doc.setFontSize(12);
    this.doc.text(`N° ${booking.id.slice(-8).toUpperCase()}`, this.pageWidth - 60, 25);

    // Informations business
    let yPos = 60;
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(16);
    this.doc.text('De :', this.margin, yPos);
    
    this.doc.setFontSize(12);
    this.doc.text(business.name || 'Professionnel', this.margin, yPos + 10);
    if (business.address) this.doc.text(business.address, this.margin, yPos + 20);
    if (business.phone) this.doc.text(business.phone, this.margin, yPos + 30);
    
    // Informations client
    this.doc.setFontSize(16);
    this.doc.text('À :', this.pageWidth / 2, yPos);
    
    this.doc.setFontSize(12);
    this.doc.text(booking.clientName, this.pageWidth / 2, yPos + 10);
    this.doc.text(booking.clientEmail, this.pageWidth / 2, yPos + 20);

    // Détails de la prestation
    yPos += 60;
    
    autoTable(this.doc, {
      startY: yPos,
      head: [['Description', 'Date', 'Durée', 'Prix unitaire', 'Total']],
      body: [[
        booking.service?.name || 'Service',
        new Date(booking.startTime).toLocaleDateString('fr-FR'),
        `${booking.service?.duration || 0}min`,
        `${booking.service?.price || 0}€`,
        `${booking.service?.price || 0}€`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Total
    const finalY = (this.doc as any).lastAutoTable.finalY + 20;
    this.doc.setFontSize(16);
    this.doc.text(`Total : ${booking.service?.price || 0}€`, this.pageWidth - 60, finalY);

    // Mentions légales
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('TVA non applicable - Article 293B du CGI', this.margin, this.pageHeight - 30);
    this.doc.text('Merci pour votre confiance !', this.margin, this.pageHeight - 20);

    return this.doc.output('arraybuffer');
  }
}