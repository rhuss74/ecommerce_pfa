const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  description: { type: String },
  prix: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  categorie: { type: String, required: true },
  artisan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Produit', produitSchema);
