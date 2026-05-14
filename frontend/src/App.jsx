import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

const INITIAL_PRODUCTS = [
  { id: 1, name: 'Vase en ceramique bleue', category: 'Ceramique', price: 450, stock: 14, artisanId: 2, description: 'Piece artisanale peinte a la main.' },
  { id: 2, name: 'Bracelet argent grave', category: 'Bijoux', price: 320, stock: 20, artisanId: 2, description: 'Bijou fin inspire de motifs marocains.' },
  { id: 3, name: 'Sac cuir traditionnel', category: 'Maroquinerie', price: 680, stock: 7, artisanId: 3, description: 'Cuir naturel, fabrication manuelle.' },
];

const INITIAL_REVIEWS = [
  { id: 1, productId: 1, userId: 1, rating: 5, comment: 'Magnifique vase, très belle qualité artisanale!', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 2, productId: 1, userId: 1, rating: 4, comment: 'Très joli mais un peu petit par rapport à mes attentes.', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 3, productId: 2, userId: 1, rating: 5, comment: 'Bracelet superbe, travail d\'artisanat exceptionnel!', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 4, productId: 3, userId: 1, rating: 4, comment: 'Sac de très bonne qualité, cuir authentique.', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
];

const INITIAL_USERS = [
  { id: 1, role: 'client', name: 'Client Demo', email: 'client@demo.com', password: 'demo123', city: 'Casablanca' },
  { id: 2, role: 'artisan', name: 'Mohammed Salim', email: 'artisan@demo.com', password: 'demo123', city: 'Fes' },
  { id: 3, role: 'artisan', name: 'Fatima Beziouiya', email: 'fatima@demo.com', password: 'demo123', city: 'Marrakech' },
];

const ORDER_STATUSES = ['En preparation', 'En cours', 'Livree'];

function loadFromStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function AppShell() {
  const [users, setUsers] = useState(() => loadFromStorage('users', INITIAL_USERS));
  const [products, setProducts] = useState(() => loadFromStorage('products', INITIAL_PRODUCTS));
  const [orders, setOrders] = useState(() => loadFromStorage('orders', []));
  const [reviews, setReviews] = useState(() => loadFromStorage('reviews', INITIAL_REVIEWS));
  const [cartByUser, setCartByUser] = useState(() => loadFromStorage('carts', {}));
  const [session, setSession] = useState(() => loadFromStorage('session', null));
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: 'Bonjour, je suis Dar Sanaa Bot. Je peux vous aider pour les produits, commandes et livraison.' },
  ]);

  useEffect(() => localStorage.setItem('users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('orders', JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage.setItem('reviews', JSON.stringify(reviews)), [reviews]);
  useEffect(() => localStorage.setItem('carts', JSON.stringify(cartByUser)), [cartByUser]);
  useEffect(() => localStorage.setItem('session', JSON.stringify(session)), [session]);

  const currentUser = useMemo(() => users.find((u) => u.id === session?.userId) ?? null, [users, session]);
  const cart = currentUser ? cartByUser[currentUser.id] ?? [] : [];

  const addToCart = (productId) => {
    if (!currentUser || currentUser.role !== 'client') return false;
    setCartByUser((prev) => {
      const current = prev[currentUser.id] ?? [];
      const existing = current.find((i) => i.productId === productId);
      const next = existing
        ? current.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i))
        : [...current, { productId, quantity: 1 }];
      return { ...prev, [currentUser.id]: next };
    });
    return true;
  };

  const updateCartItem = (productId, quantity) => {
    if (!currentUser) return;
    setCartByUser((prev) => {
      const current = prev[currentUser.id] ?? [];
      const next = current
        .map((item) => (item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item))
        .filter((item) => item.quantity > 0);
      return { ...prev, [currentUser.id]: next };
    });
  };

  const removeCartItem = (productId) => {
    if (!currentUser) return;
    setCartByUser((prev) => {
      const current = prev[currentUser.id] ?? [];
      return { ...prev, [currentUser.id]: current.filter((item) => item.productId !== productId) };
    });
  };

  const checkout = () => {
    if (!currentUser || currentUser.role !== 'client' || cart.length === 0) return;
    return true; // Retourner true pour rediriger vers la page de paiement
  };

  const processPayment = (paymentData) => {
    if (!currentUser || cart.length === 0) return { ok: false, message: 'Panier invalide' };
    
    const total = cart.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    // Simuler validation du paiement
    if (paymentData.cardNumber && paymentData.cardNumber.length >= 16) {
      const newOrder = {
        id: Date.now(),
        clientId: currentUser.id,
        status: ORDER_STATUSES[0],
        createdAt: new Date().toISOString(),
        items: cart.map((item) => ({ ...item })),
        total: total,
        paymentMethod: paymentData.method,
        shippingAddress: paymentData.shippingAddress,
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 jours
      };
      setOrders((prev) => [newOrder, ...prev]);
      setCartByUser((prev) => ({ ...prev, [currentUser.id]: [] }));
      return { ok: true, orderId: newOrder.id };
    }
    return { ok: false, message: 'Informations de paiement invalides' };
  };

  const register = ({ role, name, email, password, city }) => {
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return { ok: false, message: 'Email deja utilise.' };
    const newUser = { id: Date.now(), role, name, email, password, city };
    setUsers((prev) => [...prev, newUser]);
    setSession({ userId: newUser.id });
    return { ok: true };
  };

  const login = ({ email, password }) => {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { ok: false, message: 'Identifiants invalides.' };
    setSession({ userId: user.id });
    return { ok: true };
  };

  const logout = () => setSession(null);

  const updateProfile = (payload) => {
    if (!currentUser) return;
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, ...payload } : u)));
  };

  const addProduct = (data) => {
    if (!currentUser || currentUser.role !== 'artisan') return;
    const newProduct = { id: Date.now(), artisanId: currentUser.id, ...data, price: Number(data.price), stock: Number(data.stock) };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (id, data) => setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data, price: Number(data.price), stock: Number(data.stock) } : p)));
  const deleteProduct = (id) => setProducts((prev) => prev.filter((p) => p.id !== id));

  const addReview = (productId, rating, comment) => {
    if (!currentUser || currentUser.role !== 'client') return { ok: false, message: 'Seuls les clients peuvent laisser des avis' };
    
    // Vérifier si l'utilisateur a déjà laissé un avis pour ce produit
    const existingReview = reviews.find(r => r.productId === productId && r.userId === currentUser.id);
    if (existingReview) {
      return { ok: false, message: 'Vous avez déjà laissé un avis pour ce produit' };
    }
    
    const newReview = {
      id: Date.now(),
      productId,
      userId: currentUser.id,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };
    
    setReviews(prev => [newReview, ...prev]);
    return { ok: true };
  };

  const getProductReviews = (productId) => {
    return reviews.filter(r => r.productId === productId);
  };

  const getProductRating = (productId) => {
    const productReviews = getProductReviews(productId);
    if (productReviews.length === 0) return { average: 0, count: 0 };
    
    const average = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    return { average: Math.round(average * 10) / 10, count: productReviews.length };
  };

  const sendBotMessage = (text) => {
    const q = text.toLowerCase();
    let answer = '';
    
    // Commandes et processus
    if (q.includes('commande')) {
      answer = '🛒 Pour passer une commande:\n1. Parcourez les produits et utilisez les filtres\n2. Ajoutez les articles désirés au panier\n3. Connectez-vous à votre compte client\n4. Validez votre panier et confirmez l\'achat\n5. Suivez l\'état de votre commande dans "Mes commandes"';
    } else if (q.includes('livraison')) {
      answer = '📦 Processus de livraison:\n• Étape 1: En préparation (24-48h)\n• Étape 2: En cours de livraison (2-3 jours ouvrés)\n• Étape 3: Livrée\nVous recevrez des notifications à chaque étape. La livraison est gratuite pour toute commande supérieure à 500 DH.';
    } else if (q.includes('paiement')) {
      answer = '💳 Options de paiement:\n• Carte bancaire sécurisée\n• Virement bancaire\n• Paiement à la livraison\nToutes vos transactions sont sécurisées. Le paiement est validé lors de la confirmation de votre commande.';
    } else if (q.includes('retour') || q.includes('remboursement')) {
      answer = '🔄 Politique de retour:\n• 14 jours pour retourner un produit\n• Produit doit être en état neuf\n• Contactez-nous via l\'espace client\n• Remboursement sous 5-7 jours ouvrés';
    } 
    // Recommandations intelligentes
    else if (q.includes('recommand') || q.includes('suggestion') || q.includes('conseil')) {
      const recommendations = getSmartRecommendations(q, products, currentUser);
      answer = recommendations;
    } 
    // Recherche de produits
    else if (q.includes('trouver') || q.includes('cherche') || q.includes('produit')) {
      const searchResults = searchProducts(q, products);
      answer = searchResults;
    } 
    // Catégories populaires
    else if (q.includes('catégorie') || q.includes('cat')) {
      const categories = [...new Set(products.map(p => p.category))];
      answer = `📂 Nos catégories disponibles:\n${categories.map(cat => `• ${cat}`).join('\n')}\n\nUtilisez les filtres pour explorer chaque catégorie!`;
    } 
    // Informations artisans
    else if (q.includes('artisan')) {
      const artisans = users.filter(u => u.role === 'artisan');
      answer = `👨‍🎨 Nos artisans partenaires:\n${artisans.slice(0, 3).map(a => `• ${a.name} (${a.city})`).join('\n')}\n\nChaque artisan met tout son savoir-faire dans ses créations!`;
    } 
    // Prix et promotions
    else if (q.includes('prix') || q.includes('promotion') || q.includes('solde')) {
      const minPrice = Math.min(...products.map(p => p.price));
      const maxPrice = Math.max(...products.map(p => p.price));
      const avgPrice = Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length);
      answer = `💰 Informations sur les prix:\n• Prix minimum: ${minPrice} DH\n• Prix moyen: ${avgPrice} DH\n• Prix maximum: ${maxPrice} DH\n\nUtilisez le filtre de prix pour trouver des articles dans votre budget!`;
    } 
    // Stock et disponibilité
    else if (q.includes('stock') || q.includes('disponible')) {
      const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
      const lowStock = products.filter(p => p.stock < 5).length;
      answer = `📊 État des stocks:\n• Total produits disponibles: ${totalStock} unités\n• Produits en stock limité: ${lowStock}\n\nLes produits avec stock faible sont indiqués dans les fiches produits. N\'attendez pas pour commander!`;
    } 
    // Message par défaut avec suggestions
    else {
      answer = `🤖 Bonjour! Je suis votre assistant Dar Sanaa. Je peux vous aider avec:\n\n• 🔍 Recherche de produits\n• 📦 Suivi de commandes\n• 💳 Informations sur le paiement\n• 🚚 Détails de livraison\n• 👨‍🎨 Informations sur les artisans\n• 🎯 Recommandations personnalisées\n\nPosez-moi votre question ou dites "aide" pour plus d'options!`;
    }
    
    setChatMessages((prev) => [...prev, { from: 'user', text }, { from: 'bot', text: answer }]);
  };

  const getSmartRecommendations = (query, products, currentUser) => {
    let recommendations = [];
    
    // Recommandations basées sur le prix
    if (query.includes('pas cher') || query.includes('budget') || query.includes('petit prix')) {
      recommendations = products
        .filter(p => p.price <= 400)
        .sort((a, b) => a.price - b.price)
        .slice(0, 3);
    } else if (query.includes('luxe') || query.includes('haut de gamme') || query.includes('qualité')) {
      recommendations = products
        .filter(p => p.price >= 500)
        .sort((a, b) => b.price - a.price)
        .slice(0, 3);
    } else {
      // Recommandations par popularité (stock élevé = bonne vente)
      recommendations = products
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 3);
    }
    
    if (recommendations.length === 0) {
      return "🎯 Je vous recommande nos produits les plus populaires. Utilisez les filtres pour affiner votre recherche!";
    }
    
    return `🌟 Recommandations pour vous:\n${recommendations.map(p => 
      `• ${p.name} (${p.category}) - ${p.price} DH - Stock: ${p.stock}`
    ).join('\n')}\n\nCliquez sur un produit pour voir les détails!`;
  };

  const searchProducts = (query, products) => {
    const keywords = query.split(' ').filter(word => word.length > 2);
    let found = [];
    
    for (const keyword of keywords) {
      const matches = products.filter(p => 
        p.name.toLowerCase().includes(keyword) || 
        p.category.toLowerCase().includes(keyword) ||
        p.description.toLowerCase().includes(keyword)
      );
      found = [...found, ...matches];
    }
    
    // Supprimer les doublons
    const uniqueFound = found.filter((product, index, self) => 
      index === self.findIndex((p) => p.id === product.id)
    );
    
    if (uniqueFound.length === 0) {
      return "🔍 Je n'ai pas trouvé de produits correspondant à votre recherche. Essayez d'autres mots-clés ou utilisez les filtres de catégorie!";
    }
    
    return `🔍 Produits trouvés (${uniqueFound.length}):\n${uniqueFound.slice(0, 5).map(p => 
      `• ${p.name} - ${p.price} DH (${p.category})`
    ).join('\n')}${uniqueFound.length > 5 ? '\n\n... et d\'autres!' : ''}`;
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>Dar Sanaa - E-commerce Artisanal</h1>
        <nav>
          <Link to="/">Produits</Link>
          <Link to="/cart">Panier</Link>
          <Link to="/orders">Commandes</Link>
          <Link to="/profile">Profil</Link>
          <Link to="/artisan">Espace Artisan</Link>
          {currentUser ? <button onClick={logout}>Deconnexion</button> : <Link to="/auth">Connexion</Link>}
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<CatalogPage products={products} currentUser={currentUser} addToCart={addToCart} users={users} getProductRating={getProductRating} />} />
          <Route path="/product/:id" element={<ProductDetails products={products} addToCart={addToCart} currentUser={currentUser} getProductRating={getProductRating} getProductReviews={getProductReviews} addReview={addReview} />} />
          <Route path="/auth" element={<AuthPage login={login} register={register} currentUser={currentUser} />} />
          <Route path="/cart" element={<Protected user={currentUser} role="client"><CartPage cart={cart} products={products} updateCartItem={updateCartItem} removeCartItem={removeCartItem} checkout={checkout} /></Protected>} />
          <Route path="/payment" element={<Protected user={currentUser} role="client"><PaymentPage cart={cart} products={products} processPayment={processPayment} user={currentUser} /></Protected>} />
          <Route path="/orders" element={<Protected user={currentUser} role="client"><OrdersPage user={currentUser} orders={orders} products={products} /></Protected>} />
          <Route path="/profile" element={<Protected user={currentUser}><ProfilePage user={currentUser} updateProfile={updateProfile} /></Protected>} />
          <Route path="/artisan" element={<Protected user={currentUser} role="artisan"><ArtisanPage user={currentUser} products={products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} orders={orders} /></Protected>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <ChatbotPanel open={chatOpen} setOpen={setChatOpen} messages={chatMessages} onSend={sendBotMessage} />
    </div>
  );
}

function Protected({ user, role, children }) {
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function CatalogPage({ products, currentUser, addToCart, users }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [artisanFilter, setArtisanFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const categories = [...new Set(products.map(p => p.category))];
  const artisans = users.filter(u => u.role === 'artisan');

  const filtered = products
    .filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => !categoryFilter || p.category === categoryFilter)
    .filter((p) => !priceRange.min || p.price >= Number(priceRange.min))
    .filter((p) => !priceRange.max || p.price <= Number(priceRange.max))
    .filter((p) => !artisanFilter || p.artisanId === Number(artisanFilter))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });

  return (
    <section>
      <div className="filters-section">
        <input className="input" placeholder="Rechercher un produit..." value={search} onChange={(e) => setSearch(e.target.value)} />
        
        <div className="filters-row">
          <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select className="input" value={artisanFilter} onChange={(e) => setArtisanFilter(e.target.value)}>
            <option value="">Tous les artisans</option>
            {artisans.map(artisan => (
              <option key={artisan.id} value={artisan.id}>{artisan.name}</option>
            ))}
          </select>

          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Trier par nom</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>
        </div>

        <div className="price-range">
          <input 
            className="input" 
            type="number" 
            placeholder="Prix min" 
            value={priceRange.min} 
            onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
          />
          <span>-</span>
          <input 
            className="input" 
            type="number" 
            placeholder="Prix max" 
            value={priceRange.max} 
            onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
          />
        </div>
      </div>

      <div className="results-count">
        {filtered.length} produit{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
      </div>

      <div className="grid">
        {filtered.map((p) => {
          const artisan = users.find(u => u.id === p.artisanId);
          const rating = getProductRating(p.id);
          return (
            <article key={p.id} className="card">
              <h3>{p.name}</h3>
              <p>{p.category}</p>
              <p>{p.price} DH</p>
              <p>Stock: {p.stock}</p>
              {artisan && <p className="artisan-name">Par {artisan.name}</p>}
              {rating.count > 0 && (
                <div className="rating-display">
                  <div className="stars">
                    {'★'.repeat(Math.floor(rating.average)) + '☆'.repeat(5 - Math.floor(rating.average))}
                  </div>
                  <span className="rating-text">({rating.average}/5 - {rating.count} avis)</span>
                </div>
              )}
              <div className="row">
                <Link to={`/product/${p.id}`}>Details</Link>
                <button onClick={() => addToCart(p.id)} disabled={!currentUser || currentUser.role !== 'client'}>Ajouter au panier</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProductDetails({ products, addToCart, currentUser, getProductRating, getProductReviews, addReview }) {
  const id = Number(window.location.pathname.split('/').at(-1));
  const product = products.find((p) => p.id === id);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  
  if (!product) return <p>Produit introuvable.</p>;
  
  const productRating = getProductRating(product.id);
  const productReviews = getProductReviews(product.id);
  
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (rating === 0) {
      setReviewError('Veuillez sélectionner une note');
      return;
    }
    
    const result = addReview(product.id, rating, comment);
    if (result.ok) {
      setReviewSuccess('Avis ajouté avec succès!');
      setRating(0);
      setComment('');
      setReviewError('');
    } else {
      setReviewError(result.message);
    }
  };
  
  return (
    <div className="product-details-container">
      <article className="card product-main">
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <p>Categorie: {product.category}</p>
        <p>Prix: {product.price} DH</p>
        <p>Stock disponible: {product.stock}</p>
        
        {productRating.count > 0 && (
          <div className="product-rating">
            <div className="stars large">
              {'★'.repeat(Math.floor(productRating.average)) + '☆'.repeat(5 - Math.floor(productRating.average))}
            </div>
            <span className="rating-text">{productRating.average}/5 ({productRating.count} avis)</span>
          </div>
        )}
        
        <button onClick={() => addToCart(product.id)} disabled={!currentUser || currentUser.role !== 'client'}>
          Ajouter au panier
        </button>
      </article>

      {/* Section des avis */}
      <div className="reviews-section">
        <h3>Avis des clients</h3>
        
        {currentUser && currentUser.role === 'client' && (
          <div className="review-form">
            <h4>Laisser un avis</h4>
            <form onSubmit={handleSubmitReview}>
              <div className="rating-input">
                <label>Note:</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={star <= rating ? 'active' : ''}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="input"
                placeholder="Votre commentaire (optionnel)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              {reviewError && <p className="error">{reviewError}</p>}
              {reviewSuccess && <p className="success">{reviewSuccess}</p>}
              <button type="submit" className="btn-primary">Envoyer l'avis</button>
            </form>
          </div>
        )}
        
        <div className="reviews-list">
          {productReviews.length === 0 ? (
            <p>Soyez le premier à donner votre avis sur ce produit!</p>
          ) : (
            productReviews.map((review) => {
              const reviewUser = users.find(u => u.id === review.userId);
              return (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <strong>{reviewUser ? reviewUser.name : 'Client'}</strong>
                    <div className="review-rating">
                      {'★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  <p className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function AuthPage({ login, register, currentUser }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ role: 'client', name: '', city: '', email: '', password: '' });

  useEffect(() => {
    if (currentUser) navigate('/');
  }, [currentUser, navigate]);

  const onSubmit = (event) => {
    event.preventDefault();
    setError('');
    const result = mode === 'login' ? login(form) : register(form);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate('/');
  };

  return (
    <section className="auth">
      <div className="row">
        <button onClick={() => setMode('login')} className={mode === 'login' ? 'active' : ''}>Connexion</button>
        <button onClick={() => setMode('register')} className={mode === 'register' ? 'active' : ''}>Inscription</button>
      </div>
      <form onSubmit={onSubmit} className="form">
        {mode === 'register' && (
          <>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="client">Client</option>
              <option value="artisan">Artisan</option>
            </select>
            <input className="input" placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="input" placeholder="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          </>
        )}
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" type="password" placeholder="Mot de passe" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p className="error">{error}</p>}
        <button type="submit">{mode === 'login' ? 'Se connecter' : 'Creer un compte'}</button>
      </form>
      <p className="hint">Comptes demo: client@demo.com / demo123 et artisan@demo.com / demo123</p>
    </section>
  );
}

function CartPage({ cart, products, updateCartItem, removeCartItem, checkout }) {
  const navigate = useNavigate();
  const lines = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? { ...item, product } : null;
  }).filter(Boolean);
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  
  const handleCheckout = () => {
    if (checkout()) {
      navigate('/payment');
    }
  };
  
  return (
    <section>
      <h2>Panier</h2>
      {lines.length === 0 ? <p>Votre panier est vide.</p> : (
        <>
          {lines.map((line) => (
            <article key={line.productId} className="card row">
              <div>
                <strong>{line.product.name}</strong>
                <p>{line.product.price} DH</p>
              </div>
              <input className="qty" type="number" min="1" value={line.quantity} onChange={(e) => updateCartItem(line.productId, Number(e.target.value))} />
              <button onClick={() => removeCartItem(line.productId)}>Supprimer</button>
            </article>
          ))}
          <h3>Total: {total} DH</h3>
          {total > 500 && <p className="free-shipping">🚚 Livraison gratuite offerte!</p>}
          <button onClick={handleCheckout}>Procéder au paiement</button>
        </>
      )}
    </section>
  );
}

function OrdersPage({ user, orders, products }) {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const myOrders = orders.filter((o) => o.clientId === user.id);
  
  // Simuler l'évolution des statuts des commandes
  const getOrderStatus = (order, index) => {
    const daysSinceOrder = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceOrder === 0) return ORDER_STATUSES[0]; // En préparation
    if (daysSinceOrder <= 2) return ORDER_STATUSES[1]; // En cours
    return ORDER_STATUSES[2]; // Livrée
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'En preparation': return '#ffc107';
      case 'En cours': return '#17a2b8';
      case 'Livree': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'En preparation': return '⏳';
      case 'En cours': return '🚚';
      case 'Livree': return '✅';
      default: return '📦';
    }
  };

  return (
    <section>
      <h2>Mes commandes</h2>
      {myOrders.length === 0 ? (
        <div className="empty-orders">
          <p>Aucune commande pour le moment.</p>
          <button onClick={() => navigate('/')} className="btn-primary">Commencer mes achats</button>
        </div>
      ) : (
        <div className="orders-grid">
          {myOrders.map((order, index) => {
            const status = getOrderStatus(order, index);
            const estimatedDelivery = order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('fr-FR') : null;
            
            return (
              <article key={order.id} className="order-card">
                <div className="order-header">
                  <h3>Commande #{myOrders.length - index}</h3>
                  <span className="order-status" style={{ color: getStatusColor(status) }}>
                    {getStatusIcon(status)} {status}
                  </span>
                </div>
                
                <div className="order-info">
                  <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Total:</strong> {order.total} DH</p>
                  {estimatedDelivery && (
                    <p><strong>Livraison estimée:</strong> {estimatedDelivery}</p>
                  )}
                  {order.paymentMethod && (
                    <p><strong>Paiement:</strong> {order.paymentMethod === 'card' ? 'Carte bancaire' : order.paymentMethod === 'transfer' ? 'Virement' : 'Paiement à la livraison'}</p>
                  )}
                </div>

                <div className="order-items-preview">
                  {order.items.slice(0, 2).map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    if (!product) return null;
                    return (
                      <div key={item.productId} className="item-preview">
                        <span>{product.name}</span>
                        <span>x{item.quantity}</span>
                      </div>
                    );
                  })}
                  {order.items.length > 2 && (
                    <div className="more-items">+{order.items.length - 2} autre{order.items.length - 2 > 1 ? 's' : ''} article{order.items.length - 2 > 1 ? 's' : ''}</div>
                  )}
                </div>

                <div className="order-actions">
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="btn-secondary"
                  >
                    Voir détails
                  </button>
                  {status === 'En cours' && (
                    <button className="btn-primary">Suivre la livraison</button>
                  )}
                </div>

                {/* Timeline de suivi */}
                <div className="order-timeline">
                  <div className={`timeline-item ${status === 'En preparation' ? 'active' : 'completed'}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h4>Commande confirmée</h4>
                      <p>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className={`timeline-item ${status === 'En cours' || status === 'Livree' ? 'active' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h4>En cours de livraison</h4>
                      <p>{status === 'En cours' ? 'En transit' : new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className={`timeline-item ${status === 'Livree' ? 'active' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h4>Livrée</h4>
                      <p>{status === 'Livree' ? 'Livré avec succès' : 'En attente'}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal pour les détails de commande */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Détails de la commande #{myOrders.findIndex(o => o.id === selectedOrder.id) + 1}</h3>
              <button onClick={() => setSelectedOrder(null)} className="close-btn">×</button>
            </div>
            
            <div className="order-details">
              <div className="detail-section">
                <h4>Informations</h4>
                <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}</p>
                <p><strong>Total:</strong> {selectedOrder.total} DH</p>
                <p><strong>Statut:</strong> {getOrderStatus(selectedOrder, myOrders.findIndex(o => o.id === selectedOrder.id))}</p>
                {selectedOrder.shippingAddress && (
                  <p><strong>Adresse de livraison:</strong> {selectedOrder.shippingAddress}</p>
                )}
              </div>
              
              <div className="detail-section">
                <h4>Articles commandés</h4>
                {selectedOrder.items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (!product) return null;
                  return (
                    <div key={item.productId} className="order-item-detail">
                      <div className="item-info">
                        <strong>{product.name}</strong>
                        <p>{product.category}</p>
                      </div>
                      <div className="item-quantity-price">
                        <span>Quantité: {item.quantity}</span>
                        <span>{product.price * item.quantity} DH</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ProfilePage({ user, updateProfile }) {
  const [form, setForm] = useState({ name: user.name, city: user.city, email: user.email });
  return (
    <section className="form">
      <h2>Mon profil ({user.role})</h2>
      <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
      <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <button onClick={() => updateProfile(form)}>Mettre a jour</button>
    </section>
  );
}

function ArtisanPage({ user, products, addProduct, updateProduct, deleteProduct, orders }) {
  const myProducts = products.filter((p) => p.artisanId === user.id);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', price: '', stock: '', description: '' });
  const [activeTab, setActiveTab] = useState('products');

  // Calcul des statistiques
  const stats = {
    totalProducts: myProducts.length,
    totalStock: myProducts.reduce((sum, p) => sum + p.stock, 0),
    averagePrice: myProducts.length > 0 ? Math.round(myProducts.reduce((sum, p) => sum + p.price, 0) / myProducts.length) : 0,
    totalValue: myProducts.reduce((sum, p) => sum + (p.price * p.stock), 0),
    lowStockProducts: myProducts.filter(p => p.stock < 5).length,
    categories: [...new Set(myProducts.map(p => p.category))].length,
    recentOrders: orders.filter(order => 
      order.items.some(item => {
        const product = myProducts.find(p => p.id === item.productId);
        return product;
      })
    ).length
  };

  // Produits par catégorie
  const productsByCategory = myProducts.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  // Produits les plus chers
  const topExpensive = [...myProducts].sort((a, b) => b.price - a.price).slice(0, 3);

  // Produits avec stock faible
  const lowStockProducts = myProducts.filter(p => p.stock < 5).sort((a, b) => a.stock - b.stock);

  const submit = (event) => {
    event.preventDefault();
    if (editing) {
      updateProduct(editing.id, { ...form, artisanId: user.id });
      setEditing(null);
    } else {
      addProduct({ ...form, artisanId: user.id });
    }
    setForm({ name: '', category: '', price: '', stock: '', description: '' });
  };

  return (
    <section>
      <h2>Espace Artisan - {user.name}</h2>
      
      {/* Navigation par onglets */}
      <div className="artisan-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Tableau de bord
        </button>
        <button 
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          📦 Mes produits
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="artisan-dashboard">
          {/* Cartes de statistiques */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <h3>{stats.totalProducts}</h3>
              <p>Produits</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <h3>{stats.totalStock}</h3>
              <p>Unités en stock</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <h3>{stats.averagePrice} DH</h3>
              <p>Prix moyen</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💎</div>
              <h3>{stats.totalValue} DH</h3>
              <p>Valeur totale</p>
            </div>
          </div>

          <div className="dashboard-content">
            {/* Alertes */}
            {(stats.lowStockProducts > 0 || stats.recentOrders > 0) && (
              <div className="alerts-section">
                <h3>⚠️ Alertes</h3>
                {stats.lowStockProducts > 0 && (
                  <div className="alert warning">
                    <strong>Stock faible:</strong> {stats.lowStockProducts} produit{stats.lowStockProducts > 1 ? 's' : ''} nécessite{stats.lowStockProducts > 1 ? 'nt' : ''} un réapprovisionnement
                  </div>
                )}
                {stats.recentOrders > 0 && (
                  <div className="alert success">
                    <strong>Nouvelles commandes:</strong> {stats.recentOrders} commande{stats.recentOrders > 1 ? 's' : ''} récente{stats.recentOrders > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}

            <div className="dashboard-grid">
              {/* Répartition par catégorie */}
              <div className="dashboard-card">
                <h3>📂 Répartition par catégorie</h3>
                <div className="category-stats">
                  {Object.entries(productsByCategory).map(([category, count]) => (
                    <div key={category} className="category-stat">
                      <span>{category}</span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${(count / stats.totalProducts) * 100}%` }}
                        ></div>
                      </div>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Produits les plus chers */}
              <div className="dashboard-card">
                <h3>💎 Produits premium</h3>
                <div className="top-products">
                  {topExpensive.map((product, index) => (
                    <div key={product.id} className="top-product">
                      <span className="rank">#{index + 1}</span>
                      <div className="product-info">
                        <strong>{product.name}</strong>
                        <p>{product.category}</p>
                      </div>
                      <span className="price">{product.price} DH</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock faible */}
              {lowStockProducts.length > 0 && (
                <div className="dashboard-card">
                  <h3>⚠️ Stock faible</h3>
                  <div className="low-stock-list">
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="low-stock-item">
                        <div className="product-info">
                          <strong>{product.name}</strong>
                          <p>{product.category}</p>
                        </div>
                        <span className="stock-count">{product.stock} unités</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions rapides */}
              <div className="dashboard-card">
                <h3>⚡ Actions rapides</h3>
                <div className="quick-actions">
                  <button onClick={() => setActiveTab('products')} className="action-btn">
                    ➕ Ajouter un produit
                  </button>
                  <button className="action-btn">
                    📈 Voir les ventes
                  </button>
                  <button className="action-btn">
                    📊 Exporter les données
                  </button>
                  <button className="action-btn">
                    💬 Contacter le support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div>
          <h3>Gestion des produits</h3>
          <form className="form" onSubmit={submit}>
            <input className="input" placeholder="Nom produit" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="input" placeholder="Categorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            <input className="input" type="number" placeholder="Prix" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <input className="input" type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
            <textarea className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <button type="submit">{editing ? 'Modifier produit' : 'Ajouter produit'}</button>
          </form>
          <div className="grid">
            {myProducts.map((p) => (
              <article key={p.id} className={`card ${p.stock < 5 ? 'low-stock-card' : ''}`}>
                <h3>{p.name}</h3>
                <p>{p.category}</p>
                <p>{p.price} DH</p>
                <p>Stock: {p.stock} {p.stock < 5 && <span className="stock-warning">⚠️ Stock faible</span>}</p>
                <div className="row">
                  <button onClick={() => { setEditing(p); setForm({ name: p.name, category: p.category, price: p.price, stock: p.stock, description: p.description }); }}>Modifier</button>
                  <button onClick={() => deleteProduct(p.id)}>Supprimer</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function PaymentPage({ cart, products, processPayment, user }) {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    shippingAddress: user.city || '',
    billingAddress: user.city || ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const lines = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? { ...item, product } : null;
  }).filter(Boolean);
  
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shippingCost = total > 500 ? 0 : 30;
  const finalTotal = total + shippingCost;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');
    
    // Simuler traitement du paiement
    setTimeout(() => {
      const result = processPayment({
        method: paymentMethod,
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        shippingAddress: formData.shippingAddress
      });
      
      if (result.ok) {
        navigate('/orders?success=true');
      } else {
        setError(result.message);
      }
      setIsProcessing(false);
    }, 2000);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || '';
    return v;
  };

  if (lines.length === 0) {
    return <section><p>Votre panier est vide.</p></section>;
  }

  return (
    <section className="payment-section">
      <h2>Paiement sécurisé</h2>
      
      <div className="payment-container">
        <div className="order-summary">
          <h3>Récapitulatif de la commande</h3>
          {lines.map((line) => (
            <div key={line.productId} className="order-item">
              <span>{line.product.name} x {line.quantity}</span>
              <span>{line.product.price * line.quantity} DH</span>
            </div>
          ))}
          <div className="order-totals">
            <div className="total-line">
              <span>Sous-total:</span>
              <span>{total} DH</span>
            </div>
            <div className="total-line">
              <span>Livraison:</span>
              <span>{shippingCost === 0 ? 'Gratuite' : shippingCost + ' DH'}</span>
            </div>
            <div className="total-line final">
              <span>Total:</span>
              <span>{finalTotal} DH</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <h3>Méthode de paiement</h3>
          <div className="payment-methods">
            <label>
              <input
                type="radio"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Carte bancaire
            </label>
            <label>
              <input
                type="radio"
                value="transfer"
                checked={paymentMethod === 'transfer'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Virement bancaire
            </label>
            <label>
              <input
                type="radio"
                value="delivery"
                checked={paymentMethod === 'delivery'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Paiement à la livraison
            </label>
          </div>

          {paymentMethod === 'card' && (
            <div className="card-details">
              <h3>Informations de carte</h3>
              <input
                className="input"
                type="text"
                placeholder="Numéro de carte"
                value={formatCardNumber(formData.cardNumber)}
                onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                maxLength={19}
                required
              />
              <input
                className="input"
                type="text"
                placeholder="Nom sur la carte"
                value={formData.cardName}
                onChange={(e) => setFormData({...formData, cardName: e.target.value})}
                required
              />
              <div className="card-row">
                <input
                  className="input"
                  type="text"
                  placeholder="MM/AA"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  maxLength={5}
                  required
                />
                <input
                  className="input"
                  type="text"
                  placeholder="CVV"
                  value={formData.cvv}
                  onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                  maxLength={3}
                  required
                />
              </div>
            </div>
          )}

          <h3>Adresse de livraison</h3>
          <textarea
            className="input"
            placeholder="Adresse complète de livraison"
            value={formData.shippingAddress}
            onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})}
            required
          />

          {error && <p className="error">{error}</p>}
          
          <button type="submit" className="pay-button" disabled={isProcessing}>
            {isProcessing ? 'Traitement en cours...' : `Payer ${finalTotal} DH`}
          </button>
          
          <p className="security-note">
            🔒 Paiement 100% sécurisé. Vos informations sont cryptées et protégées.
          </p>
        </form>
      </div>
    </section>
  );
}

function ChatbotPanel({ open, setOpen, messages, onSend }) {
  const [input, setInput] = useState('');
  return (
    <div className="chatbot">
      <button className="chat-toggle" onClick={() => setOpen((v) => !v)}>Chatbot</button>
      {open && (
        <div className="chat-window">
          <h4>Assistant intelligent</h4>
          <div className="chat-messages">
            {messages.map((msg, index) => <p key={index} className={msg.from}>{msg.text}</p>)}
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            onSend(input.trim());
            setInput('');
          }} className="row">
            <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Posez votre question..." />
            <button type="submit">Envoyer</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
