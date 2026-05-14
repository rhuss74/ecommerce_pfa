const express = require('express');
const router = express.Router();
const Facture = require('../models/Facture');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/factures - admin
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const factures = await Facture.find()
      .populate({ path: 'commande_id', populate: { path: 'client_id', select: 'nom email' } })
      .sort({ createdAt: -1 });
    res.json(factures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/factures/:id - admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const facture = await Facture.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(facture);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
