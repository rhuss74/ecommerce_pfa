const mongoose = require('mongoose');

const ligneCommandeSchema = new mongoose.Schema({
  produit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Produit' },
  nom: String,
  quantite: Number,
  prix_unitaire: Number,
});

const commandeSchema = new mongoose.Schema({
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lignes: [ligneCommandeSchema],
  statut: { type: String, enum: ['En preparation', 'En cours', 'Livree'], default: 'En preparation' },
  total: { type: Number, required: true },
  adresse_livraison: String,
  ville: String,
  telephone: String,
  mode_paiement: String,
}, { timestamps: true });

module.exports = mongoose.model('Commande', commandeSchema);
