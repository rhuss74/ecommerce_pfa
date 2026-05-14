const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Non autorisé' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' });
  next();
};

const artisanOnly = (req, res, next) => {
  if (req.user.role !== 'artisan' && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Accès refusé' });
  next();
};

module.exports = { protect, adminOnly, artisanOnly };
