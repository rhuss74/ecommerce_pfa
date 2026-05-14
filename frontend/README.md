# Dar Sanaa Frontend (React)

Frontend React pour la marketplace de produits artisanaux.

## Fonctionnalites implementees

- Authentification et inscription avec roles `client` et `artisan`
- Catalogue produits avec recherche et detail produit
- Panier client (ajout, modification quantite, suppression)
- Commandes client (confirmation d achat + historique + statut)
- Profil utilisateur modifiable
- Espace artisan (ajout, modification, suppression produit + gestion stock)
- Chatbot intelligent (FAQ, aide recherche produit, recommandations)

## Comptes de demonstration

- Client: `client@demo.com` / `demo123`
- Artisan: `artisan@demo.com` / `demo123`

## Installation

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
```

## Notes integration backend

La version actuelle fonctionne avec un stockage local (`localStorage`) pour permettre le prototypage rapide.
Pour brancher votre backend JS, remplacez progressivement les operations locales dans `src/App.jsx` par des appels API (auth, produits, panier, commandes, stock).
