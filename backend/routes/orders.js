const express = require('express');
const router = express.Router();
const Commande = require('../models/Commande');
const Produit = require('../models/Produit');
const Facture = require('../models/Facture');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/commandes - client
router.post('/', protect, async (req, res) => {
  try {
    const { lignes, adresse_livraison, ville, telephone, mode_paiement } = req.body;

    // Vérifier stock et calculer total
    let total = 0;
    for (const ligne of lignes) {
      const produit = await Produit.findById(ligne.produit_id);
      if (!produit) return res.status(404).json({ message: `Produit non trouvé` });
      if (produit.stock < ligne.quantite)
        return res.status(400).json({ message: `Stock insuffisant pour ${produit.nom}` });
      total += produit.prix * ligne.quantite;
      ligne.prix_unitaire = produit.prix;
      ligne.nom = produit.nom;
    }

    // Créer la commande
    const commande = await Commande.create({
      client_id: req.user.id, lignes, total,
      adresse_livraison, ville, telephone, mode_paiement
    });

    // Mettre à jour le stock
    for (const ligne of lignes) {
      await Produit.findByIdAndUpdate(ligne.produit_id, { $inc: { stock: -ligne.quantite } });
    }

    // Créer la facture automatiquement
    await Facture.create({
      commande_id: commande._id,
      montant_ht: +(total / 1.2).toFixed(2),
      montant_ttc: total,
      date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    res.status(201).json(commande);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/commandes - client voit les siennes, admin voit toutes
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { client_id: req.user.id };
    const commandes = await Commande.find(filter)
      .populate('client_id', 'nom email')
      .sort({ createdAt: -1 });
    res.json(commandes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/commandes/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id).populate('client_id', 'nom email');
    if (!commande) return res.status(404).json({ message: 'Commande non trouvée' });
    res.json(commande);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/commandes/:id/statut - admin
router.put('/:id/statut', protect, adminOnly, async (req, res) => {
  try {
    const commande = await Commande.findByIdAndUpdate(
      req.params.id, { statut: req.body.statut }, { new: true }
    );
    res.json(commande);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
