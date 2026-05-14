const mongoose = require('mongoose');

const factureSchema = new mongoose.Schema({
  commande_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Commande', required: true },
  montant_ht: { type: Number, required: true },
  montant_ttc: { type: Number, required: true },
  statut: { type: String, enum: ['Payee', 'En attente', 'En retard'], default: 'En attente' },
  date_echeance: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Facture', factureSchema);
