const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { protect, artisanOnly } = require('../middleware/auth');

cloudinary.config({
  cloud_name: 'deteysl6r',
  api_key: '845393536793882',
  api_secret: 'LmjkzMgwXGrMpRjO3hTf2-2w30g'
});

// Stockage en mémoire puis upload vers Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Fichier non supporté, images uniquement'), false);
  }
});

// POST /api/upload/product - upload image produit
router.post('/product', protect, artisanOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé' });
    
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'dar_sanaa/produits', transformation: [{ width: 800, height: 800, crop: 'limit' }] },
        (error, result) => { if (error) reject(error); else resolve(result); }
      ).end(req.file.buffer);
    });

    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/upload/avatar - upload photo profil artisan
router.post('/avatar', protect, artisanOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé' });

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'dar_sanaa/avatars', transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }] },
        (error, result) => { if (error) reject(error); else resolve(result); }
      ).end(req.file.buffer);
    });

    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
