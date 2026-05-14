const express = require('express');
const router = express.Router();
const Produit = require('../models/Produit');
const { protect, artisanOnly, adminOnly } = require('../middleware/auth');

// GET /api/produits - public
router.get('/', async (req, res) => {
  try {
    const { categorie, search, artisan_id } = req.query;
    let filter = {};
    if (categorie) filter.categorie = categorie;
    if (search) filter.nom = { $regex: search, $options: 'i' };
    if (artisan_id) filter.artisan_id = artisan_id;
    const produits = await Produit.find(filter).populate('artisan_id', 'nom ville');
    res.json(produits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/produits/:id - public
router.get('/:id', async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id).populate('artisan_id', 'nom ville');
    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(produit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/produits - artisan/admin
router.post('/', protect, artisanOnly, async (req, res) => {
  try {
    const { nom, description, prix, stock, categorie, image } = req.body;
    const produit = await Produit.create({
      nom, description, prix, stock, categorie, image,
      artisan_id: req.user.id
    });
    res.status(201).json(produit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/produits/:id - artisan/admin
router.put('/:id', protect, artisanOnly, async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);
    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });
    if (produit.artisan_id.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Non autorisé' });
    const updated = await Produit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/produits/:id - artisan/admin
router.delete('/:id', protect, artisanOnly, async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);
    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });
    if (produit.artisan_id.toString() !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Non autorisé' });
    await produit.deleteOne();
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
