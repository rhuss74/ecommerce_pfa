const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/produits', require('./routes/products'));
app.use('/api/commandes', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/factures', require('./routes/factures'));
app.use('/api/avis', require('./routes/avis'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/pdf', require('./routes/pdf'));

// Route de test
app.get('/', (req, res) => res.json({ message: 'API Dar Sanaâ opérationnelle ✅' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
