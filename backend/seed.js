const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Produit = require('./models/Produit');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connecté à MongoDB...');

  // Ne supprimer que les produits, jamais les utilisateurs
  await Produit.deleteMany();

  // Créer les utilisateurs seed seulement s'ils n'existent pas déjà
  let admin = await User.findOne({ email: 'admin@darsanaa.ma' });
  if (!admin) admin = await User.create({ nom: 'Admin Dar Sanaa', email: 'admin@darsanaa.ma', password: 'password123', role: 'admin', ville: 'Casablanca' });

  let artisan1 = await User.findOne({ email: 'mohammed@darsanaa.ma' });
  if (!artisan1) artisan1 = await User.create({ nom: 'Mohammed Salim', email: 'mohammed@darsanaa.ma', password: 'password123', role: 'artisan', ville: 'Fes' });

  let artisan2 = await User.findOne({ email: 'fatima@darsanaa.ma' });
  if (!artisan2) artisan2 = await User.create({ nom: 'Fatima Beziouiya', email: 'fatima@darsanaa.ma', password: 'password123', role: 'artisan', ville: 'Marrakech' });

  let artisan3 = await User.findOne({ email: 'ahmed@darsanaa.ma' });
  if (!artisan3) artisan3 = await User.create({ nom: 'Ahmed Alami', email: 'ahmed@darsanaa.ma', password: 'password123', role: 'artisan', ville: 'Fes' });

  const clientExists = await User.findOne({ email: 'client@darsanaa.ma' });
  if (!clientExists) await User.create({ nom: 'Client Demo', email: 'client@darsanaa.ma', password: 'password123', role: 'client', ville: 'Casablanca' });

  await Produit.create([
    { nom: 'Vase en Céramique Bleu', description: 'Pièce artisanale peinte à la main, inspirée des motifs fassis traditionnels.', prix: 450, stock: 25, categorie: 'Céramique', artisan_id: artisan1._id, image: 'pics/ceramicvase.jpg' },
    { nom: 'Bracelet Argent Gravé', description: 'Bijou fin inspiré des motifs berbères, fabriqué à la main.', prix: 320, stock: 5, categorie: 'Bijoux', artisan_id: artisan3._id, image: 'pics/bracelett.png' },
    { nom: 'Sac à Main Cuir Traditionnel', description: 'Cuir naturel de qualité supérieure, fabrication 100% manuelle.', prix: 680, stock: 0, categorie: 'Maroquinerie', artisan_id: artisan2._id, image: 'pics/bag.png' },
    { nom: 'Plateau en Zellij', description: 'Plateau décoratif en mosaïque de céramique colorée.', prix: 380, stock: 15, categorie: 'Décoration', artisan_id: artisan1._id, image: 'pics/horloge.jpg' },
    { nom: 'Tapis Berbère Fait Main', description: 'Tapis tissé à la main avec des laines naturelles teintes.', prix: 1200, stock: 8, categorie: 'Textile', artisan_id: artisan2._id, image: 'pics/tapis.jpg' },
    { nom: 'Bougie Artisanale au Jasmin', description: 'Bougie parfumée au jasmin dans un contenant en céramique.', prix: 95, stock: 30, categorie: 'Décoration', artisan_id: artisan3._id, image: 'pics/bougie.jpg' },
    { nom: 'Vase Artisanal Décoré', description: 'Vase artisanal peint à la main avec des motifs géométriques.', prix: 430, stock: 12, categorie: 'Céramique', artisan_id: artisan1._id, image: 'pics/vase.jpg' },
    { nom: 'Bol en Céramique', description: 'Bol artisanal fabriqué à la main, idéal pour la décoration.', prix: 510, stock: 20, categorie: 'Céramique', artisan_id: artisan1._id, image: 'pics/Bol en céramique.jpeg' },
  ]);

  console.log('✅ Base de données initialisée avec succès !');
  console.log('Utilisateurs existants préservés.');
  console.log('Comptes seed :');
  console.log('  admin@darsanaa.ma / password123 (Admin)');
  console.log('  mohammed@darsanaa.ma / password123 (Artisan)');
  console.log('  fatima@darsanaa.ma / password123 (Artisan)');
  console.log('  client@darsanaa.ma / password123 (Client)');
  process.exit();
};

seed().catch(err => { console.error(err); process.exit(1); });