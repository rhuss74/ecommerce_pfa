const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/users - admin
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/profile - utilisateur connecté
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/profile - utilisateur connecté
router.put('/profile', protect, async (req, res) => {
  try {
    const { nom, email, ville, password, avatar } = req.body;
    const user = await User.findById(req.user.id);
    if (nom) user.nom = nom;
    if (email) user.email = email;
    if (ville) user.ville = ville;
    if (password) user.password = password;
    if (avatar) user.avatar = avatar;
    await user.save();
    res.json({ message: 'Profil mis à jour', user: { id: user._id, nom: user.nom, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id - admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
