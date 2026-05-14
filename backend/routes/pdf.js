const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Commande = require('../models/Commande');
const Facture = require('../models/Facture');
const { protect } = require('../middleware/auth');

// GET /api/pdf/facture/:commandeId - Générer PDF facture
router.get('/facture/:commandeId', protect, async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.commandeId)
      .populate('client_id', 'nom email ville');

    if (!commande) return res.status(404).json({ message: 'Commande non trouvée' });

    // Vérifier que c'est bien la commande du client ou un admin
    if (req.user.role !== 'admin' && commande.client_id._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const facture = await Facture.findOne({ commande_id: commande._id });

    // Créer le PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // En-têtes HTTP pour téléchargement
    const filename = `Facture_DarSanaa_${String(commande._id).slice(-6).toUpperCase()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // ===== COULEURS =====
    const DARK_RED = '#8B1A1A';
    const GOLD = '#C17F3E';
    const DARK = '#1A1A1A';
    const GRAY = '#666666';
    const LIGHT = '#FFF8F0';

    // ===== EN-TETE =====
    // Bande de couleur en haut
    doc.rect(0, 0, doc.page.width, 120).fill(DARK_RED);

    // Logo / Titre
    doc.fillColor('white')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('Dar Sanaâ', 50, 30);

    doc.fontSize(11)
       .font('Helvetica')
       .text('Plateforme Artisanale Marocaine', 50, 65);

    doc.fontSize(10)
       .text('contact@darsanaa.ma  |  +212 532458870  |  Casablanca, Maroc', 50, 85);

    // Titre FACTURE à droite
    doc.fontSize(32)
       .font('Helvetica-Bold')
       .fillColor('white')
       .text('FACTURE', 350, 35, { align: 'right', width: 200 });

    doc.fontSize(12)
       .font('Helvetica')
       .text(`N° FAC-${String(commande._id).slice(-6).toUpperCase()}`, 350, 75, { align: 'right', width: 200 });

    // ===== INFOS FACTURE =====
    doc.fillColor(DARK);
    const dateEmission = facture ? new Date(facture.createdAt) : new Date();
    const dateEcheance = facture?.date_echeance ? new Date(facture.date_echeance) : new Date(Date.now() + 30*24*60*60*1000);

    // Boîte infos gauche (client)
    doc.rect(50, 140, 240, 110).fill(LIGHT).stroke(GOLD);
    doc.fillColor(GOLD).fontSize(10).font('Helvetica-Bold')
       .text('FACTURÉ À', 60, 150);
    doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold')
       .text(commande.client_id?.nom || 'Client', 60, 165);
    doc.fontSize(10).font('Helvetica')
       .text(commande.client_id?.email || '', 60, 180)
       .text(commande.ville || '', 60, 195)
       .text(commande.adresse_livraison || '', 60, 210, { width: 220 });

    // Boîte infos droite (facture)
    doc.rect(310, 140, 235, 110).fill(LIGHT).stroke(GOLD);
    doc.fillColor(GOLD).fontSize(10).font('Helvetica-Bold')
       .text('DÉTAILS FACTURE', 320, 150);

    const infoRows = [
      ['N° Commande', `CMD-${String(commande._id).slice(-6).toUpperCase()}`],
      ['Date émission', dateEmission.toLocaleDateString('fr-FR')],
      ['Date échéance', dateEcheance.toLocaleDateString('fr-FR')],
      ['Statut', facture?.statut || 'En attente'],
      ['Mode paiement', commande.mode_paiement || 'Carte bancaire'],
    ];

    let infoY = 165;
    infoRows.forEach(([label, value]) => {
      doc.fillColor(GRAY).fontSize(9).font('Helvetica').text(label + ' :', 320, infoY);
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(value, 430, infoY);
      infoY += 16;
    });

    // ===== TABLEAU DES ARTICLES =====
    const tableTop = 275;

    // En-tête tableau
    doc.rect(50, tableTop, 495, 28).fill(DARK_RED);
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
    doc.text('#', 60, tableTop + 9);
    doc.text('Article', 80, tableTop + 9);
    doc.text('Qté', 330, tableTop + 9);
    doc.text('Prix unit.', 380, tableTop + 9);
    doc.text('Total', 460, tableTop + 9);

    // Lignes articles
    let y = tableTop + 28;
    let subtotal = 0;

    commande.lignes.forEach((ligne, index) => {
      const lineTotal = ligne.quantite * ligne.prix_unitaire;
      subtotal += lineTotal;
      const fill = index % 2 === 0 ? 'white' : '#FFF8F0';

      doc.rect(50, y, 495, 25).fill(fill);
      doc.fillColor(DARK).fontSize(10).font('Helvetica');
      doc.text(String(index + 1), 60, y + 7);
      doc.text(ligne.nom || 'Produit', 80, y + 7, { width: 240 });
      doc.text(String(ligne.quantite), 330, y + 7);
      doc.text(`${ligne.prix_unitaire} DH`, 380, y + 7);
      doc.fillColor(GOLD).font('Helvetica-Bold')
         .text(`${lineTotal} DH`, 460, y + 7);
      y += 25;
    });

    // Ligne de séparation
    doc.moveTo(50, y + 10).lineTo(545, y + 10).strokeColor(GOLD).lineWidth(1).stroke();
    y += 20;

    // ===== TOTAUX =====
    const shipping = subtotal >= 1000 ? 0 : 35;
    const serviceFee = Math.round(subtotal * 0.02);
    const totalTTC = subtotal + shipping + serviceFee;
    const totalHT = facture?.montant_ht || parseFloat((totalTTC / 1.2).toFixed(2));
    const tva = totalTTC - totalHT;

    const totalsX = 350;
    const totalsW = 195;

    const totalsRows = [
      ['Sous-total HT', `${subtotal} DH`, false],
      ['Frais de livraison', shipping === 0 ? 'Gratuit' : `${shipping} DH`, false],
      ['Frais de service (2%)', `${serviceFee} DH`, false],
      ['TVA (20%)', `${tva.toFixed(2)} DH`, false],
    ];

    totalsRows.forEach(([label, value]) => {
      doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(label, totalsX, y + 5);
      doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text(value, totalsX + 120, y + 5, { width: 75, align: 'right' });
      y += 20;
    });

    // Total final
    y += 5;
    doc.rect(totalsX - 10, y, totalsW + 10, 35).fill(DARK_RED);
    doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
       .text('TOTAL TTC', totalsX, y + 10)
       .text(`${totalTTC} DH`, totalsX + 100, y + 10, { width: 85, align: 'right' });
    y += 50;

    // ===== STATUT =====
    const statutColor = facture?.statut === 'Payee' ? '#27ae60' : facture?.statut === 'En retard' ? '#e74c3c' : GOLD;
    doc.rect(50, y, 150, 35).fill(statutColor);
    doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
       .text(`${facture?.statut || 'En attente'}`, 60, y + 10);
    y += 55;

    // ===== ADRESSE DE LIVRAISON =====
    if (commande.adresse_livraison) {
      doc.rect(50, y, 495, 50).fill(LIGHT).stroke(GOLD);
      doc.fillColor(GOLD).fontSize(10).font('Helvetica-Bold').text('ADRESSE DE LIVRAISON', 60, y + 8);
      doc.fillColor(DARK).fontSize(10).font('Helvetica')
         .text(`${commande.adresse_livraison}, ${commande.ville || ''}  |  Tél: ${commande.telephone || ''}`, 60, y + 24, { width: 470 });
      y += 65;
    }

    // ===== PIED DE PAGE =====
    doc.rect(0, doc.page.height - 60, doc.page.width, 60).fill(DARK_RED);
    doc.fillColor('white').fontSize(9).font('Helvetica')
       .text('Merci pour votre confiance ! — Dar Sanaâ, votre destination pour l\'artisanat marocain authentique.', 50, doc.page.height - 45, { align: 'center', width: doc.page.width - 100 })
       .text('www.darsanaa.ma  |  contact@darsanaa.ma  |  +212 532458870', 50, doc.page.height - 28, { align: 'center', width: doc.page.width - 100 });

    doc.end();

  } catch (err) {
    console.error('Erreur génération PDF:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
