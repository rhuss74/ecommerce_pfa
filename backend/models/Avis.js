const mongoose = require('mongoose');

const avisSchema = new mongoose.Schema({
  produit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Produit', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  commentaire: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Avis', avisSchema);
