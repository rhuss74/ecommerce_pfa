const express = require('express');
const router = express.Router();
const Avis = require('../models/Avis');
const { protect } = require('../middleware/auth');

// GET /api/avis/:produit_id
router.get('/:produit_id', async (req, res) => {
  try {
    const avis = await Avis.find({ produit_id: req.params.produit_id })
      .populate('user_id', 'nom')
      .sort({ createdAt: -1 });
    res.json(avis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/avis - client connecté
router.post('/', protect, async (req, res) => {
  try {
    const { produit_id, rating, commentaire } = req.body;
    const avis = await Avis.create({ produit_id, user_id: req.user.id, rating, commentaire });
    res.status(201).json(avis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
