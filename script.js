// =============================================
// CONFIG API
// =============================================
const API_URL = 'http://localhost:5000/api';

async function apiCall(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('ds_token');
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) options.body = JSON.stringify(body);
    try {
        const res = await fetch(`${API_URL}${endpoint}`, options);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Erreur serveur');
        return data;
    } catch (err) {
        console.error('API Error:', err.message);
        throw err;
    }
}

// =============================================
// 1. AUTH - LOGIN / REGISTER
// =============================================

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

const loginForm = document.getElementById('loginForm');
const authModeSelect = document.getElementById('authMode');
const registerOnlyFields = document.querySelectorAll('.register-only');
const loginOnlyFields = document.querySelectorAll('.login-only');

function updateAuthModeUI() {
    if (!authModeSelect) return;
    const isRegister = authModeSelect.value === 'register';
    registerOnlyFields.forEach((el) => {
        el.style.display = isRegister ? '' : 'none';
        const input = el.querySelector('input');
        if (input) input.required = isRegister;
    });
    loginOnlyFields.forEach((el) => { el.style.display = isRegister ? 'none' : ''; });
    const roleSelect = document.getElementById('role');
    if (roleSelect) {
        const adminOption = roleSelect.querySelector('option[value="admin"]');
        if (adminOption) adminOption.style.display = isRegister ? 'none' : '';
        if (isRegister && roleSelect.value === 'admin') roleSelect.value = 'client';
    }
}

if (authModeSelect) {
    authModeSelect.addEventListener('change', updateAuthModeUI);
    updateAuthModeUI();
}

if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const mode = document.getElementById('authMode')?.value || 'login';
        const role = document.getElementById('role')?.value || 'client';
        const usernameOrEmail = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const fullname = document.getElementById('fullname')?.value.trim();

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Chargement...</span>';

        try {
            let data;
            if (mode === 'register') {
                if (role === 'admin') { alert('La création du rôle admin est désactivée.'); return; }
                if (password.length < 6) { alert('Mot de passe trop court (min 6 caractères).'); return; }
                data = await apiCall('/auth/register', 'POST', {
                    nom: fullname || usernameOrEmail,
                    email: usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@darsanaa.ma`,
                    password, role
                });
            } else {
                data = await apiCall('/auth/login', 'POST', {
                    email: usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@darsanaa.ma`,
                    password
                });
                // Vérifier le rôle
                if (data.user.role !== role) {
                    alert(`Identifiants invalides pour ce rôle.`);
                    return;
                }
            }

            localStorage.setItem('ds_token', data.token);
            localStorage.setItem('ds_current_user', JSON.stringify(data.user));

            if (data.user.role === 'admin') window.location.href = 'dashboard.html';
            else if (data.user.role === 'artisan') window.location.href = 'artisan.html';
            else window.location.href = 'index.html';

        } catch (err) {
            alert(err.message || 'Identifiants invalides.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Se connecter</span><i class="fas fa-arrow-right"></i>';
        }
    });
}

// Logout
document.addEventListener('click', function (e) {
    if (e.target.closest('.nav-link')?.textContent.includes('Déconnexion')) {
        e.preventDefault();
        localStorage.removeItem('ds_token');
        localStorage.removeItem('ds_current_user');
        window.location.href = 'login.html';
    }
});

// =============================================
// 2. UTILITIES
// =============================================

function showMessage(text) { alert(text); }

function getCurrentUser() {
    const raw = localStorage.getItem('ds_current_user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

// =============================================
// 3. SIDEBAR NAVIGATION (Dashboard Admin)
// =============================================

const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        if (this.classList.contains('artisan-nav-link')) return;
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        const sectionName = this.dataset.section + '-section';
        const sectionElement = document.getElementById(sectionName);
        if (!sectionElement) return;
        sectionElement.classList.add('active');
        const titles = {
            'overview': 'Tableau de Bord', 'products': 'Gestion des Produits',
            'clients': 'Gestion des Clients', 'stock': 'Gestion du Stock',
            'orders': 'Gestion des Commandes', 'invoices': 'Gestion des Factures'
        };
        const pageTitle = document.getElementById('page-title');
        if (pageTitle && titles[this.dataset.section]) pageTitle.textContent = titles[this.dataset.section];
    });
});

// =============================================
// 4. MODAL
// =============================================

const modal = document.getElementById('crud-modal');
let editingRow = null;

function openModal(type, data = null) {
    const titles = {
        'product': data ? 'Modifier le Produit' : 'Ajouter un Produit',
        'client': data ? 'Modifier le Client' : 'Ajouter un Client',
        'stock': data ? 'Modifier le Stock' : 'Ajouter un Stock',
        'order': data ? 'Modifier la Commande' : 'Nouvelle Commande',
        'invoice': data ? 'Modifier la Facture' : 'Créer une Facture'
    };
    document.getElementById('modal-title').textContent = titles[type];
    document.getElementById('modal-body').innerHTML = getForm(type, data);
    modal.classList.add('active');
    document.querySelector('#modal-body form').addEventListener('submit', function (e) {
        e.preventDefault();
        if (editingRow) updateRow(type, editingRow, new FormData(this));
        else addNewRow(type, new FormData(this));
    });
}

function closeModal() { modal.classList.remove('active'); editingRow = null; }
modal?.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

// =============================================
// 5. FORMS
// =============================================

function getForm(type, data = null) {
    const d = data || {};
    if (type === 'product') return `<form>
        <div class="form-group"><label>Nom du produit *</label><input type="text" name="name" value="${d.name || ''}" required></div>
        <div class="form-group"><label>Catégorie *</label>
        <select name="category" required>
            <option value="">Sélectionner</option>
            <option value="Céramique" ${d.category === 'Céramique' ? 'selected' : ''}>Céramique</option>
            <option value="Bijoux" ${d.category === 'Bijoux' ? 'selected' : ''}>Bijoux</option>
            <option value="Maroquinerie" ${d.category === 'Maroquinerie' ? 'selected' : ''}>Maroquinerie</option>
            <option value="Décoration" ${d.category === 'Décoration' ? 'selected' : ''}>Décoration</option>
            <option value="Textile" ${d.category === 'Textile' ? 'selected' : ''}>Textile</option>
        </select></div>
        <div class="form-group"><label>Prix (DH) *</label><input type="number" name="price" value="${d.price || ''}" required></div>
        <div class="form-group"><label>Stock *</label><input type="number" name="stock" value="${d.stock || ''}" required></div>
        <div class="form-group"><label>Artisan *</label><input type="text" name="artisan" value="${d.artisan || ''}" required></div>
        <div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button><button type="submit" class="btn btn-primary">Enregistrer</button></div>
    </form>`;
    if (type === 'client') return `<form>
        <div class="form-group"><label>Nom complet *</label><input type="text" name="name" value="${d.name || ''}" required></div>
        <div class="form-group"><label>Email *</label><input type="email" name="email" value="${d.email || ''}" required></div>
        <div class="form-group"><label>Téléphone *</label><input type="tel" name="phone" value="${d.phone || ''}" required></div>
        <div class="form-group"><label>Ville *</label><select name="city" required>
            <option value="">Sélectionner</option>
            <option value="Casablanca" ${d.city === 'Casablanca' ? 'selected' : ''}>Casablanca</option>
            <option value="Rabat" ${d.city === 'Rabat' ? 'selected' : ''}>Rabat</option>
            <option value="Marrakech" ${d.city === 'Marrakech' ? 'selected' : ''}>Marrakech</option>
        </select></div>
        <div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button><button type="submit" class="btn btn-primary">Enregistrer</button></div>
    </form>`;
    if (type === 'stock') return `<form>
        <div class="form-group"><label>Nom du produit *</label><input type="text" name="product" value="${d.product || ''}" required></div>
        <div class="form-group"><label>Quantité *</label><input type="number" name="quantity" value="${d.quantity || ''}" required></div>
        <div class="form-group"><label>Seuil Minimum *</label><input type="number" name="min_threshold" value="${d.min_threshold || ''}" required></div>
        <div class="form-group"><label>Emplacement *</label><input type="text" name="location" value="${d.location || ''}" placeholder="Ex: A-12-03" required></div>
        <div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button><button type="submit" class="btn btn-primary">Enregistrer</button></div>
    </form>`;
    if (type === 'order') return `<form>
        <div class="form-group"><label>Client *</label><input type="text" name="client" value="${d.client || ''}" required></div>
        <div class="form-group"><label>Date *</label><input type="date" name="order_date" value="${d.order_date || ''}" required></div>
        <div class="form-group"><label>Nombre d'articles *</label><input type="number" name="items" value="${d.items || ''}" required></div>
        <div class="form-group"><label>Montant (DH) *</label><input type="number" name="amount" value="${d.amount || ''}" required></div>
        <div class="form-group"><label>Statut *</label><select name="status" required>
            <option value="En preparation" ${d.status === 'En preparation' ? 'selected' : ''}>Préparation</option>
            <option value="En cours" ${d.status === 'En cours' ? 'selected' : ''}>En cours</option>
            <option value="Livree" ${d.status === 'Livree' ? 'selected' : ''}>Livrée</option>
        </select></div>
        <div class="form-group"><label>Paiement *</label><select name="payment_status" required>
            <option value="En attente" ${d.payment_status === 'En attente' ? 'selected' : ''}>En attente</option>
            <option value="Payé" ${d.payment_status === 'Payé' ? 'selected' : ''}>Payé</option>
        </select></div>
        <div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button><button type="submit" class="btn btn-primary">Enregistrer</button></div>
    </form>`;
    if (type === 'invoice') return `<form>
        <div class="form-group"><label>N° Commande *</label><input type="text" name="order_num" value="${d.order_num || ''}" required></div>
        <div class="form-group"><label>Client *</label><input type="text" name="client" value="${d.client || ''}" required></div>
        <div class="form-group"><label>Date émission *</label><input type="date" name="issue_date" value="${d.issue_date || ''}" required></div>
        <div class="form-group"><label>Date échéance *</label><input type="date" name="due_date" value="${d.due_date || ''}" required></div>
        <div class="form-group"><label>Montant HT (DH) *</label><input type="number" name="amount_ht" value="${d.amount_ht || ''}" required></div>
        <div class="form-group"><label>Montant TTC (DH) *</label><input type="number" name="amount_ttc" value="${d.amount_ttc || ''}" required></div>
        <div class="form-group"><label>Statut *</label><select name="status" required>
            <option value="En attente" ${d.status === 'En attente' ? 'selected' : ''}>En attente</option>
            <option value="Payée" ${d.status === 'Payée' ? 'selected' : ''}>Payée</option>
            <option value="En retard" ${d.status === 'En retard' ? 'selected' : ''}>En retard</option>
        </select></div>
        <div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button><button type="submit" class="btn btn-primary">Créer</button></div>
    </form>`;
}

// =============================================
// 6. UPDATE / ADD ROWS (Dashboard - inchangé)
// =============================================

function updateRow(type, row, formData) {
    const cells = row.querySelectorAll('td');
    if (type === 'product') {
        const stock = formData.get('stock');
        let stockClass = 'in-stock', stockText = 'En stock (' + stock + ')';
        if (stock == 0) { stockClass = 'out-stock'; stockText = 'Rupture'; }
        else if (stock < 10) { stockClass = 'low-stock'; stockText = 'Stock faible (' + stock + ')'; }
        cells[2].textContent = formData.get('name');
        cells[3].innerHTML = `<span class="badge badge-purple">${formData.get('category')}</span>`;
        cells[4].textContent = formData.get('price') + ' DH';
        cells[5].innerHTML = `<span class="stock-status ${stockClass}">${stockText}</span>`;
        cells[6].textContent = formData.get('artisan');
    }
    if (type === 'client') {
        cells[1].textContent = formData.get('name');
        cells[2].textContent = formData.get('email');
        cells[3].textContent = formData.get('phone');
        cells[4].textContent = formData.get('city');
    }
    if (type === 'stock') {
        const quantity = formData.get('quantity'), minThreshold = formData.get('min_threshold');
        let stockClass = 'in-stock', stockText = 'Normal';
        if (quantity == 0) { stockClass = 'out-stock'; stockText = 'Rupture'; }
        else if (quantity < minThreshold) { stockClass = 'low-stock'; stockText = 'Faible'; }
        cells[1].textContent = formData.get('product'); cells[2].textContent = quantity;
        cells[3].textContent = minThreshold; cells[4].textContent = formData.get('location');
        cells[5].innerHTML = `<span class="stock-status ${stockClass}">${stockText}</span>`;
        cells[6].textContent = new Date().toLocaleDateString('fr-FR');
    }
    if (type === 'order') {
        cells[1].textContent = formData.get('client');
        cells[2].textContent = new Date(formData.get('order_date')).toLocaleDateString('fr-FR');
        cells[3].textContent = formData.get('items') + ' articles';
        cells[4].textContent = formData.get('amount') + ' DH';
        cells[5].innerHTML = `<span class="badge badge-info">${formData.get('status')}</span>`;
        cells[6].innerHTML = `<span class="badge badge-orange">${formData.get('payment_status')}</span>`;
    }
    if (type === 'invoice') {
        cells[1].textContent = formData.get('order_num'); cells[2].textContent = formData.get('client');
        cells[3].textContent = new Date(formData.get('issue_date')).toLocaleDateString('fr-FR');
        cells[4].textContent = new Date(formData.get('due_date')).toLocaleDateString('fr-FR');
        cells[5].textContent = formData.get('amount_ht') + ' DH'; cells[6].textContent = formData.get('amount_ttc') + ' DH';
        cells[7].innerHTML = `<span class="badge badge-orange">${formData.get('status')}</span>`;
    }
    closeModal(); showMessage('Élément modifié avec succès !');
}

function addNewRow(type, formData) {
    let tableBody;
    if (type === 'product') tableBody = document.querySelector('#products-table tbody');
    else tableBody = document.querySelector('#' + type + 's-section table tbody');
    const rowCount = tableBody.children.length + 1;
    const actionButtons = `<div class="action-buttons">
        <button class="btn-action btn-view"><i class="fas fa-eye"></i></button>
        <button class="btn-action btn-edit"><i class="fas fa-edit"></i></button>
        <button class="btn-action btn-delete"><i class="fas fa-trash"></i></button>
    </div>`;
    let newRow = '';
    if (type === 'product') {
        const stock = formData.get('stock');
        let stockClass = 'in-stock', stockText = 'En stock (' + stock + ')';
        if (stock == 0) { stockClass = 'out-stock'; stockText = 'Rupture'; }
        else if (stock < 10) { stockClass = 'low-stock'; stockText = 'Stock faible (' + stock + ')'; }
        newRow = `<tr><td>#P${String(rowCount).padStart(3,'0')}</td><td><div class="table-image"><i class="fas fa-box"></i></div></td>
            <td>${formData.get('name')}</td><td><span class="badge badge-purple">${formData.get('category')}</span></td>
            <td>${formData.get('price')} DH</td><td><span class="stock-status ${stockClass}">${stockText}</span></td>
            <td>${formData.get('artisan')}</td><td>${actionButtons}</td></tr>`;
    }
    if (type === 'client') {
        newRow = `<tr><td>#C${String(rowCount).padStart(3,'0')}</td><td>${formData.get('name')}</td>
            <td>${formData.get('email')}</td><td>${formData.get('phone')}</td>
            <td>${formData.get('city')}</td><td>0</td><td>0 DH</td><td>${actionButtons}</td></tr>`;
    }
    if (type === 'stock') {
        const quantity = formData.get('quantity'), minThreshold = formData.get('min_threshold');
        let stockClass = 'in-stock', stockText = 'Normal';
        if (quantity == 0) { stockClass = 'out-stock'; stockText = 'Rupture'; }
        else if (quantity < minThreshold) { stockClass = 'low-stock'; stockText = 'Faible'; }
        newRow = `<tr><td>#S${String(rowCount).padStart(3,'0')}</td><td>${formData.get('product')}</td>
            <td>${quantity}</td><td>${minThreshold}</td><td>${formData.get('location')}</td>
            <td><span class="stock-status ${stockClass}">${stockText}</span></td>
            <td>${new Date().toLocaleDateString('fr-FR')}</td><td>${actionButtons}</td></tr>`;
    }
    if (type === 'order') {
        const id = '#CMD' + (1000 + rowCount);
        newRow = `<tr><td>${id}</td><td>${formData.get('client')}</td>
            <td>${new Date(formData.get('order_date')).toLocaleDateString('fr-FR')}</td>
            <td>${formData.get('items')} articles</td><td>${formData.get('amount')} DH</td>
            <td><span class="badge badge-info">${formData.get('status')}</span></td>
            <td><span class="badge badge-orange">${formData.get('payment_status')}</span></td>
            <td>${actionButtons}</td></tr>`;
    }
    if (type === 'invoice') {
        const year = new Date().getFullYear();
        newRow = `<tr><td>#FAC${year}-${String(rowCount).padStart(3,'0')}</td>
            <td>${formData.get('order_num')}</td><td>${formData.get('client')}</td>
            <td>${new Date(formData.get('issue_date')).toLocaleDateString('fr-FR')}</td>
            <td>${new Date(formData.get('due_date')).toLocaleDateString('fr-FR')}</td>
            <td>${formData.get('amount_ht')} DH</td><td>${formData.get('amount_ttc')} DH</td>
            <td><span class="badge badge-orange">${formData.get('status')}</span></td>
            <td>${actionButtons}</td></tr>`;
    }
    tableBody.insertAdjacentHTML('beforeend', newRow);
    closeModal(); showMessage('Élément ajouté avec succès !');
}

// =============================================
// 7. DELETE / EDIT BUTTONS
// =============================================

document.addEventListener('click', function (e) {
    // Ne pas interférer avec le dashboard admin qui gère ses propres boutons
    if (window.location.pathname.includes('dashboard')) return;
    const deleteButton = e.target.closest('.btn-delete');
    if (deleteButton) {
        if (confirm('Supprimer cet élément ?')) { deleteButton.closest('tr').remove(); showMessage('Élément supprimé'); }
    }
    if (e.target.closest('.btn-view')) showMessage('Fonctionnalité en développement');
    const editButton = e.target.closest('.btn-edit');
    if (editButton) {
        const row = editButton.closest('tr');
        editingRow = row;
        const cells = row.querySelectorAll('td');
        const section = row.closest('.content-section');
        let type = '', data = {};
        if (section?.id === 'products-section') {
            type = 'product';
            data = { name: cells[2].textContent, category: cells[3].textContent.trim(), price: cells[4].textContent.replace(' DH', '').trim(), stock: cells[5].textContent.match(/\d+/) ? cells[5].textContent.match(/\d+/)[0] : '0', artisan: cells[6].textContent };
        }
        if (section?.id === 'clients-section') { type = 'client'; data = { name: cells[1].textContent, email: cells[2].textContent, phone: cells[3].textContent, city: cells[4].textContent }; }
        if (section?.id === 'stock-section') { type = 'stock'; data = { product: cells[1].textContent, quantity: cells[2].textContent, min_threshold: cells[3].textContent, location: cells[4].textContent }; }
        if (section?.id === 'orders-section') {
            type = 'order';
            const dateParts = cells[2].textContent.split('/');
            data = { client: cells[1].textContent, order_date: dateParts[2]+'-'+dateParts[1]+'-'+dateParts[0], items: cells[3].textContent.replace(' articles','').trim(), amount: cells[4].textContent.replace(' DH','').trim(), status: cells[5].textContent.trim(), payment_status: cells[6].textContent.trim() };
        }
        if (section?.id === 'invoices-section') {
            type = 'invoice';
            const issueParts = cells[3].textContent.split('/'), dueParts = cells[4].textContent.split('/');
            data = { order_num: cells[1].textContent, client: cells[2].textContent, issue_date: issueParts[2]+'-'+issueParts[1]+'-'+issueParts[0], due_date: dueParts[2]+'-'+dueParts[1]+'-'+dueParts[0], amount_ht: cells[5].textContent.replace(' DH','').trim(), amount_ttc: cells[6].textContent.replace(' DH','').trim(), status: cells[7].textContent.trim() };
        }
        openModal(type, data);
    }
});

// =============================================
// 8. SEARCH
// =============================================

document.querySelectorAll('.search-box input').forEach(searchInput => {
    searchInput.addEventListener('input', function () {
        const searchText = this.value.toLowerCase();
        const activeTable = document.querySelector('.content-section.active table tbody');
        if (activeTable) activeTable.querySelectorAll('tr').forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(searchText) ? '' : 'none';
        });
    });
});

window.openModal = openModal;
window.closeModal = closeModal;

// =============================================
// 9. ACCESS CONTROL
// =============================================

const currentPath = window.location.pathname.toLowerCase();
if (currentPath.endsWith('/dashboard.html') || currentPath.endsWith('dashboard.html')) {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') { alert('Accès réservé à l\'administrateur.'); window.location.href = 'login.html'; }
}
if (currentPath.endsWith('/artisan.html') || currentPath.endsWith('artisan.html')) {
    const user = getCurrentUser();
    if (!user || user.role !== 'artisan') { alert('Accès réservé aux artisans.'); window.location.href = 'login.html'; }
    else initArtisanSpace(user);
}

const isIndexPage = !!document.querySelector('.products-grid');
if (isIndexPage) initStorefrontFeatures();

// =============================================
// 10. STOREFRONT
// =============================================

async function initStorefrontFeatures() {
    let products = [];
    try {
        const apiProducts = await apiCall("/produits");
        products = apiProducts.map(p => ({
            id: p._id,
            name: p.nom,
            artisan: p.artisan_id?.nom || "Artisan",
            price: p.prix,
            stock: p.stock
        }));
    } catch(err) {
        console.warn("API indisponible");
        products = extractProductsFromCards();
    }
    const cartButton = document.querySelector('.cart-btn');
    const cartCount = document.querySelector('.cart-count');
    const searchButton = document.querySelector('.search-btn');
    const adminButton = document.querySelector('.admin-btn');
    let cart = getCart();
    let autoCloseCheckoutTimer = null;
    const widgets = buildStoreWidgets();

    if (adminButton) {
        const currentUser = getCurrentUser();
        if (currentUser) {
            if (currentUser.role === 'admin') { adminButton.innerHTML = '<i class="fas fa-user-shield"></i> Admin'; adminButton.href = 'dashboard.html'; }
            else if (currentUser.role === 'artisan') { adminButton.innerHTML = '<i class="fas fa-user-cog"></i> Espace Artisan'; adminButton.href = 'artisan.html'; }
            else { adminButton.innerHTML = '<i class="fas fa-user"></i> Mon Compte'; adminButton.href = 'login.html'; }
        }
    }

    function refreshCartCount() {
        if (!cartCount) return;
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    function requireClientAuth() {
        const user = getCurrentUser();
        if (!user || user.role !== 'client') { alert('Connectez-vous en tant que client pour acheter.'); window.location.href = 'login.html'; return null; }
        return user;
    }

    function renderCartAndOrders() {
        const user = getCurrentUser();
        const orders = getOrderHistory();
        widgets.orderList.innerHTML = '';
        if (orders.length === 0) { widgets.orderList.innerHTML = '<p class="widget-empty">Aucune commande pour le moment.</p>'; }
        else {
            const filterValue = widgets.orderFilter.value;
            const filteredOrders = orders.filter((order) => filterValue === 'all' || getStatusLabel(getStatusIndex(order)) === filterValue);
            if (filteredOrders.length === 0) widgets.orderList.innerHTML = '<p class="widget-empty">Aucune commande pour ce filtre.</p>';
            filteredOrders.forEach((order, index) => {
                const statusIndex = getStatusIndex(order);
                const statusLabel = getStatusLabel(statusIndex);
                const itemsHtml = (order.items || []).map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    return product ? `<li>${product.name} x ${item.quantity}</li>` : '';
                }).join('');
                const div = document.createElement('div');
                div.className = 'widget-order-line';
                div.innerHTML = `
                    <div class="widget-order-head"><strong>Commande #${filteredOrders.length - index}</strong><span class="badge badge-info">${statusLabel}</span></div>
                    <small>${order.createdAt} • Ref: ${order.reference || 'CMD-' + String(order.id).slice(-6)}</small>
                    <div class="widget-order-total">${order.total} DH</div>
                    <div class="widget-order-meta"><span><i class="fas fa-credit-card"></i> ${order.paymentMethod || 'Carte bancaire'}</span><span><i class="fas fa-truck"></i> ${order.deliveryCity || 'Casablanca'}</span></div>
                    <ul class="widget-order-items">${itemsHtml || '<li>Articles indisponibles</li>'}</ul>
                    <div class="order-timeline">
                        <div class="step ${statusIndex >= 0 ? 'active' : ''}">Preparation</div>
                        <div class="step ${statusIndex >= 1 ? 'active' : ''}">En cours</div>
                        <div class="step ${statusIndex >= 2 ? 'active' : ''}">Livree</div>
                    </div>`;
                widgets.orderList.appendChild(div);
            });
        }

        widgets.cartList.innerHTML = '';
        if (!user || user.role !== 'client') { widgets.cartList.innerHTML = '<p class="widget-empty">Connectez-vous comme client pour commander.</p>'; widgets.checkoutBtn.style.display = 'none'; return; }
        widgets.checkoutBtn.style.display = '';
        if (cart.length === 0) { widgets.cartList.innerHTML = '<p class="widget-empty">Votre panier est vide.</p>'; return; }
        let subtotal = 0;
        cart.forEach((item, idx) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) return;
            subtotal += product.price * item.quantity;
            const line = document.createElement('div');
            line.className = 'widget-cart-line';
            line.innerHTML = `<div><strong>${product.name}</strong><small>${product.price} DH / unite</small></div>
                <div class="widget-cart-actions">
                    <button data-op="minus" data-idx="${idx}">-</button><span>${item.quantity}</span>
                    <button data-op="plus" data-idx="${idx}">+</button>
                    <button data-op="del" data-idx="${idx}" class="danger">x</button>
                </div>`;
            widgets.cartList.appendChild(line);
        });
        const shipping = subtotal >= 1000 ? 0 : 35;
        const serviceFee = subtotal > 0 ? Math.round(subtotal * 0.02) : 0;
        const total = subtotal + shipping + serviceFee;
        widgets.subtotalValue.textContent = `${subtotal} DH`;
        widgets.shippingValue.textContent = `${shipping} DH`;
        widgets.feeValue.textContent = `${serviceFee} DH`;
        widgets.cartTotal.textContent = `${total} DH`;
        widgets.etaValue.textContent = shipping === 0 ? '24h - 48h' : '48h - 72h';
    }

    function addToCart(productId) {
        if (!requireClientAuth()) return;
        const found = cart.find((item) => item.productId === productId);
        if (found) found.quantity += 1; else cart.push({ productId, quantity: 1 });
        saveCart(cart); refreshCartCount(); renderCartAndOrders();
    }
    window.addToCart = addToCart;

    document.querySelectorAll('.product-card').forEach((card, index) => {
        const product = products[index];
        const addButton = card.querySelector('.btn-add-cart');
        if (addButton && product) addButton.addEventListener('click', () => addToCart(product.id));
        card.style.cursor = 'pointer';
        card.addEventListener('dblclick', () => {
            if (!product) return;
            widgets.productDetails.innerHTML = `<h4>${product.name}</h4><p>${product.artisan}</p><p>Prix: ${product.price} DH</p><p>Stock: ${product.stock}</p>`;
            widgets.widgetPanel.classList.add('active');
        });
    });

    if (searchButton) searchButton.addEventListener('click', function () { widgets.searchBar.classList.toggle('active'); widgets.searchInput.focus(); });
    widgets.searchInput.addEventListener('input', function () {
        const q = this.value.trim().toLowerCase();
        document.querySelectorAll('.product-card').forEach((card) => { card.style.display = q === '' || card.textContent.toLowerCase().includes(q) ? '' : 'none'; });
    });

    if (cartButton) cartButton.addEventListener('click', function () {
        widgets.widgetPanel.classList.add('active');
        widgets.tabButtons.forEach((btn) => btn.classList.remove('active'));
        widgets.tabButtons[0].classList.add('active');
        widgets.tabContents.forEach((tab, i) => tab.style.display = i === 0 ? '' : 'none');
        renderCartAndOrders();
    });

    widgets.cartList.addEventListener('click', function (event) {
        const target = event.target.closest('button');
        if (!target) return;
        const idx = Number(target.dataset.idx);
        if (!cart[idx]) return;
        if (target.dataset.op === 'plus') cart[idx].quantity += 1;
        if (target.dataset.op === 'minus') cart[idx].quantity = Math.max(1, cart[idx].quantity - 1);
        if (target.dataset.op === 'del') cart.splice(idx, 1);
        saveCart(cart); refreshCartCount(); renderCartAndOrders();
    });

    // CHECKOUT - connecté au backend
    widgets.checkoutBtn.addEventListener('click', async function () {
        const user = requireClientAuth();
        if (!user || cart.length === 0) return;

        const fullName = widgets.checkoutName.value.trim();
        const city = widgets.checkoutCity.value.trim();
        const address = widgets.checkoutAddress.value.trim();
        const phone = widgets.checkoutPhone.value.trim();
        const paymentMethod = widgets.checkoutPayment.value;

        if (!fullName || !city || !address || !phone) {
            widgets.checkoutStatus.textContent = 'Merci de remplir les informations de livraison.';
            widgets.checkoutStatus.className = 'checkout-status error';
            return;
        }

        const lignes = cart.map(item => ({ produit_id: item.productId, quantite: item.quantity }));

        try {
            widgets.checkoutBtn.disabled = true;
            widgets.checkoutBtn.textContent = 'Traitement...';

            // Appel API backend
            const commande = await apiCall('/commandes', 'POST', {
                lignes, adresse_livraison: address, ville: city, telephone: phone, mode_paiement: paymentMethod
            });

            // Sauvegarder en local aussi pour l'affichage
            const subtotal = cart.reduce((sum, item) => {
                const product = products.find((p) => p.id === item.productId);
                return sum + (product ? product.price * item.quantity : 0);
            }, 0);
            const shipping = subtotal >= 1000 ? 0 : 35;
            const serviceFee = Math.round(subtotal * 0.02);
            const total = subtotal + shipping + serviceFee;

            const order = {
                id: commande._id || Date.now(),
                reference: `CMD-${String(commande._id || Date.now()).slice(-6)}`,
                total, createdAt: new Date().toLocaleString('fr-FR'), createdTs: Date.now(),
                status: 'Preparation', paymentMethod, deliveryName: fullName,
                deliveryCity: city, deliveryAddress: address, deliveryPhone: phone,
                subtotal, shipping, serviceFee, items: [...cart]
            };
            saveOrderHistory([order, ...getOrderHistory()]);
            cart = []; saveCart(cart); refreshCartCount(); renderCartAndOrders();

            widgets.checkoutStatus.textContent = `Commande ${order.reference} confirmée avec succès !`;

            // Bouton télécharger facture PDF
            const pdfBtn = document.createElement('button');
            pdfBtn.style.cssText = 'background:#c17f3e;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;margin-top:10px;font-size:14px;width:100%;';
            pdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Télécharger ma Facture PDF';
            pdfBtn.onclick = function() {
                const token = localStorage.getItem('ds_token');
                fetch('http://localhost:5000/api/pdf/facture/' + commande._id, {
                    headers: { 'Authorization': 'Bearer ' + token }
                }).then(r => r.blob()).then(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'Facture_DarSanaa_' + String(commande._id).slice(-6).toUpperCase() + '.pdf';
                    a.click();
                    URL.revokeObjectURL(url);
                }).catch(err => alert('Erreur PDF: ' + err.message));
            };
            widgets.checkoutStatus.parentNode.insertBefore(pdfBtn, widgets.checkoutStatus.nextSibling);
            widgets.checkoutStatus.className = 'checkout-status success';

            if (autoCloseCheckoutTimer) clearTimeout(autoCloseCheckoutTimer);
            autoCloseCheckoutTimer = setTimeout(() => {
                widgets.widgetPanel.classList.remove('active');
                widgets.checkoutStatus.textContent = '';
                widgets.checkoutStatus.className = 'checkout-status';
                autoCloseCheckoutTimer = null;
            }, 2500);

        } catch (err) {
            widgets.checkoutStatus.textContent = err.message || 'Erreur lors de la commande.';
            widgets.checkoutStatus.className = 'checkout-status error';
        } finally {
            widgets.checkoutBtn.disabled = false;
            widgets.checkoutBtn.textContent = 'Confirmer achat';
        }
    });

    widgets.closeCheckoutBtn.addEventListener('click', function () {
        if (autoCloseCheckoutTimer) { clearTimeout(autoCloseCheckoutTimer); autoCloseCheckoutTimer = null; }
        widgets.widgetPanel.classList.remove('active');
        widgets.checkoutStatus.textContent = ''; widgets.checkoutStatus.className = 'checkout-status';
    });

    widgets.tabButtons.forEach((button, index) => {
        button.addEventListener('click', function () {
            widgets.tabButtons.forEach((btn) => btn.classList.remove('active'));
            this.classList.add('active');
            widgets.tabContents.forEach((tab, idx) => tab.style.display = idx === index ? '' : 'none');
            if (index <= 1) renderCartAndOrders();
        });
    });

    widgets.orderFilter.addEventListener('change', renderCartAndOrders);
    widgets.refreshOrdersBtn.addEventListener('click', function () {
        const updated = getOrderHistory().map((order) => advanceOrderStatus(order));
        saveOrderHistory(updated); renderCartAndOrders();
    });
    widgets.closeWidget.addEventListener('click', () => widgets.widgetPanel.classList.remove('active'));
    initChatbot(products);
    refreshCartCount();
}

function extractProductsFromCards() {
    return Array.from(document.querySelectorAll('.product-card')).map((card, index) => ({
        id: index + 1,
        name: card.querySelector('h3')?.textContent?.trim() || `Produit ${index + 1}`,
        artisan: card.querySelector('.product-artisan')?.textContent?.trim() || 'Artisan',
        price: Number((card.querySelector('.product-price')?.textContent?.match(/\d+/) || ['0'])[0]),
        stock: 20 - (index * 4) > 0 ? 20 - (index * 4) : 0
    }));
}

function getCart() {
    const user = getCurrentUser();
    if (!user || user.role !== 'client') return [];
    try { return JSON.parse(localStorage.getItem(`ds_cart_${user.id}`) || '[]'); } catch { return []; }
}

function saveCart(cart) {
    const user = getCurrentUser();
    if (!user || user.role !== 'client') return;
    localStorage.setItem(`ds_cart_${user.id}`, JSON.stringify(cart));
}

function getOrderHistory() {
    const user = getCurrentUser();
    if (!user || user.role !== 'client') return [];
    try { return JSON.parse(localStorage.getItem(`ds_orders_${user.id}`) || '[]'); } catch { return []; }
}

function saveOrderHistory(orders) {
    const user = getCurrentUser();
    if (!user || user.role !== 'client') return;
    localStorage.setItem(`ds_orders_${user.id}`, JSON.stringify(orders));
}

function getStatusIndex(order) { const s = ['Preparation', 'En cours', 'Livree']; const i = s.indexOf(order.status); return i !== -1 ? i : 0; }
function getStatusLabel(index) { return ['Preparation', 'En cours', 'Livree'][Math.max(0, Math.min(2, index))]; }
function advanceOrderStatus(order) { const i = getStatusIndex(order); if (i >= 2) return order; return { ...order, status: getStatusLabel(i + 1) }; }

// =============================================
// 11. CHATBOT
// =============================================

function initChatbot(products) {
    const chatbotBtn = document.createElement('button');
    chatbotBtn.className = 'chatbot-floating-btn';
    chatbotBtn.innerHTML = '<i class="fas fa-comment-dots"></i> Chat';
    document.body.appendChild(chatbotBtn);
    const chatPanel = document.createElement('div');
    chatPanel.className = 'chatbot-panel';
    chatPanel.innerHTML = `<div class="chatbot-head"><h4>Assistant Dar Sanaâ</h4><button class="chat-close">&times;</button></div>
        <div class="chatbot-messages"><p class="bot">Bonjour. Je peux répondre aux questions sur les produits, commandes, paiement et livraison.</p></div>
        <form class="chatbot-form"><input type="text" placeholder="Posez votre question..." required><button type="submit">Envoyer</button></form>`;
    document.body.appendChild(chatPanel);
    const messages = chatPanel.querySelector('.chatbot-messages');
    const form = chatPanel.querySelector('.chatbot-form');
    const input = form.querySelector('input');
    chatbotBtn.addEventListener('click', () => chatPanel.classList.toggle('active'));
    chatPanel.querySelector('.chat-close').addEventListener('click', () => chatPanel.classList.remove('active'));
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const question = input.value.trim();
        if (!question) return;
        const ask = document.createElement('p'); ask.className = 'user'; ask.textContent = question; messages.appendChild(ask);
        const bot = document.createElement('p'); bot.className = 'bot'; bot.textContent = buildChatbotAnswer(question.toLowerCase(), products); messages.appendChild(bot);
        messages.scrollTop = messages.scrollHeight; input.value = '';
    });
}

function buildChatbotAnswer(question, products) {
    const intents = {
        order: ['commande', 'achat', 'acheter', 'panier', 'confirmer'],
        delivery: ['livraison', 'delai', 'expedition', 'suivi'],
        payment: ['paiement', 'payer', 'carte', 'facture'],
        recommendation: ['recommand', 'conseille', 'idee', 'suggestion'],
        productSearch: ['produit', 'trouver', 'chercher', 'disponible', 'stock'],
        greeting: ['bonjour', 'salut', 'hello', 'bonsoir']
    };
    const responses = {
        greeting: ['Bonjour, je suis là pour vous guider sur les produits et les commandes.', 'Salut ! Dites-moi ce que vous cherchez.', 'Bienvenue chez Dar Sanaâ !'],
        order: ['Pour commander: ajoutez les articles au panier puis cliquez sur "Confirmer achat".', 'Le parcours: panier → confirmation → suivi.'],
        delivery: ['Le suivi passe par 3 étapes: Preparation, En cours, puis Livrée.', 'Vous pouvez voir l\'évolution dans l\'onglet "Suivi commande".'],
        payment: ['Le paiement est validé à la confirmation du panier.', 'Montant total calculé automatiquement avant validation.'],
        recommendation: [`Je vous recommande: ${products.slice(0,2).map(p=>p.name).join(' et ')}.`],
        productSearch: ['Utilisez la loupe en haut pour filtrer les produits.', 'Double-cliquez sur un produit pour voir ses détails.'],
        fallback: ['Je peux aider sur les produits, commandes, paiement et livraison.', 'Pouvez-vous préciser votre besoin ?']
    };
    const detected = Object.entries(intents).find(([, kw]) => kw.some(k => question.includes(k)))?.[0];
    const bucket = responses[detected || 'fallback'];
    return bucket[question.split('').reduce((a,c) => a + c.charCodeAt(0), 0) % bucket.length];
}

function buildStoreWidgets() {
    const searchBar = document.createElement('div');
    searchBar.className = 'store-search-bar';
    searchBar.innerHTML = '<input type="text" placeholder="Rechercher un produit...">';
    document.body.appendChild(searchBar);
    const panel = document.createElement('aside');
    panel.className = 'store-widget-panel';
    panel.innerHTML = `<div class="store-widget-head"><h3>Panier & Suivi</h3><button class="close-widget">&times;</button></div>
        <div class="store-widget-tabs"><button class="active">Panier</button><button>Suivi commande</button><button>Produit sélectionné</button></div>
        <div class="store-widget-content">
            <div class="store-tab">
                <div class="cart-lines"></div>
                <div class="checkout-box">
                    <div class="checkout-box-head"><h4>Confirmer la commande</h4><button class="close-checkout-btn"><i class="fas fa-times"></i></button></div>
                    <div class="checkout-grid">
                        <input class="checkout-name" type="text" placeholder="Nom complet">
                        <input class="checkout-city" type="text" placeholder="Ville">
                        <input class="checkout-phone" type="text" placeholder="Telephone">
                        <select class="checkout-payment">
                            <option value="Carte bancaire">Carte bancaire</option>
                            <option value="Paiement a la livraison">Paiement à la livraison</option>
                            <option value="Virement">Virement</option>
                        </select>
                    </div>
                    <textarea class="checkout-address" rows="2" placeholder="Adresse de livraison"></textarea>
                    <div class="checkout-summary">
                        <p>Sous-total: <strong class="subtotal-value">0 DH</strong></p>
                        <p>Livraison: <strong class="shipping-value">0 DH</strong></p>
                        <p>Frais service: <strong class="fee-value">0 DH</strong></p>
                        <p>Livraison estimée: <strong class="eta-value">--</strong></p>
                    </div>
                    <div class="cart-total">Total: <strong class="total-value">0 DH</strong></div>
                    <p class="checkout-status"></p>
                </div>
                <button class="btn btn-primary checkout-btn">Confirmer achat</button>
            </div>
            <div class="store-tab" style="display:none;">
                <div class="order-tools">
                    <select class="order-filter">
                        <option value="all">Toutes les commandes</option>
                        <option value="Preparation">Preparation</option>
                        <option value="En cours">En cours</option>
                        <option value="Livree">Livree</option>
                    </select>
                    <button class="btn btn-secondary refresh-orders-btn">Actualiser statuts</button>
                </div>
                <div class="order-lines"></div>
            </div>
            <div class="store-tab" style="display:none;"><div class="product-details"><p class="widget-empty">Double-cliquez sur un produit pour voir les détails.</p></div></div>
        </div>`;
    document.body.appendChild(panel);
    return {
        searchBar, searchInput: searchBar.querySelector('input'),
        widgetPanel: panel, closeWidget: panel.querySelector('.close-widget'),
        tabButtons: panel.querySelectorAll('.store-widget-tabs button'),
        tabContents: panel.querySelectorAll('.store-tab'),
        cartList: panel.querySelector('.cart-lines'), orderList: panel.querySelector('.order-lines'),
        orderFilter: panel.querySelector('.order-filter'), refreshOrdersBtn: panel.querySelector('.refresh-orders-btn'),
        checkoutName: panel.querySelector('.checkout-name'), checkoutCity: panel.querySelector('.checkout-city'),
        checkoutPhone: panel.querySelector('.checkout-phone'), checkoutPayment: panel.querySelector('.checkout-payment'),
        checkoutAddress: panel.querySelector('.checkout-address'), subtotalValue: panel.querySelector('.subtotal-value'),
        shippingValue: panel.querySelector('.shipping-value'), feeValue: panel.querySelector('.fee-value'),
        etaValue: panel.querySelector('.eta-value'), checkoutStatus: panel.querySelector('.checkout-status'),
        closeCheckoutBtn: panel.querySelector('.close-checkout-btn'), cartTotal: panel.querySelector('.total-value'),
        checkoutBtn: panel.querySelector('.checkout-btn'), productDetails: panel.querySelector('.product-details')
    };
}

// =============================================
// 12. ESPACE ARTISAN - connecté au backend
// =============================================

function initArtisanSpace(currentUser) {
    const artisanName = document.getElementById('artisan-name');
    const title = document.getElementById('artisan-page-title');
    if (artisanName) artisanName.textContent = currentUser.nom || currentUser.name;

    const links = document.querySelectorAll('.artisan-nav-link');
    links.forEach((link) => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            links.forEach((l) => l.classList.remove('active'));
            this.classList.add('active');
            const id = this.dataset.section;
            document.querySelectorAll('.content-section').forEach((sec) => sec.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            if (title) { const map = { 'artisan-products': 'Gestion des Produits', 'artisan-stock': 'Gestion du Stock', 'artisan-profile': 'Profil Artisan' }; title.textContent = map[id]; }
        });
    });

    const tableBody = document.querySelector('#artisan-products-table tbody');
    const stockBody = document.querySelector('#artisan-stock-table tbody');
    const form = document.getElementById('artisan-product-form');
    const editId = document.getElementById('artisan-edit-id');
    const cancelBtn = document.getElementById('artisan-cancel-edit');
    const submitBtn = document.getElementById('artisan-submit-btn');
    const pName = document.getElementById('artisan-product-name');
    const pCategory = document.getElementById('artisan-product-category');
    const pPrice = document.getElementById('artisan-product-price');
    const pStock = document.getElementById('artisan-product-stock');
    const pDesc = document.getElementById('artisan-product-description');

    function stockBadge(stock) {
        if (stock <= 0) return '<span class="stock-status out-stock">Rupture</span>';
        if (stock < 8) return '<span class="stock-status low-stock">Faible</span>';
        return '<span class="stock-status in-stock">Normal</span>';
    }

    async function renderTables() {
        try {
            const produits = await apiCall(`/produits?artisan_id=${currentUser.id}`);
            tableBody.innerHTML = '';
            stockBody.innerHTML = '';
            if (produits.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999">Aucun produit ajouté</td></tr>';
                stockBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999">Aucun produit</td></tr>';
                return;
            }
            produits.forEach((p) => {
                const imgHtml = p.image
                    ? `<img src="${p.image}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;">`
                    : `<i class="fas fa-box" style="color:#c17f3e"></i>`;
                tableBody.insertAdjacentHTML('beforeend', `<tr>
                    <td>#A${String(p._id).slice(-4)}</td>
                    <td>${imgHtml}</td>
                    <td>${p.nom}</td>
                    <td>${p.categorie}</td>
                    <td>${p.prix} DH</td>
                    <td>${p.stock}</td>
                    <td><div class="action-buttons">
                        <button class="btn-action btn-edit artisan-edit" data-id="${p._id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-action btn-delete artisan-del" data-id="${p._id}"><i class="fas fa-trash"></i></button>
                    </div></td></tr>`);
                stockBody.insertAdjacentHTML('beforeend', `<tr>
                    <td>${p.nom}</td>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <button class="stock-minus" data-id="${p._id}" style="background:#c17f3e;color:white;border:none;border-radius:4px;width:28px;height:28px;cursor:pointer;font-size:16px;">-</button>
                            <strong id="stock-val-${p._id}">${p.stock}</strong>
                            <button class="stock-plus" data-id="${p._id}" style="background:#c17f3e;color:white;border:none;border-radius:4px;width:28px;height:28px;cursor:pointer;font-size:16px;">+</button>
                        </div>
                    </td>
                    <td>${stockBadge(p.stock)}</td>
                    <td>${new Date().toLocaleDateString('fr-FR')}</td>
                    <td><button class="stock-edit" data-id="${p._id}" style="background:#c17f3e;color:white;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;"><i class="fas fa-pencil-alt"></i></button></td>
                </tr>`);
            });

            stockBody.querySelectorAll('.stock-minus, .stock-plus').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.dataset.id;
                    const current = parseInt(document.getElementById('stock-val-' + id).textContent);
                    const newStock = this.classList.contains('stock-plus') ? current + 1 : Math.max(0, current - 1);
                    try { await apiCall('/produits/' + id, 'PUT', { stock: newStock }); await renderTables(); }
                    catch(err) { alert(err.message); }
                });
            });

            stockBody.querySelectorAll('.stock-edit').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.dataset.id;
                    const current = parseInt(document.getElementById('stock-val-' + id).textContent);
                    const newVal = prompt('Nouvelle quantité en stock (actuel: ' + current + '):', current);
                    if (newVal === null || newVal === '') return;
                    const stock = parseInt(newVal);
                    if (isNaN(stock) || stock < 0) { alert('Valeur invalide'); return; }
                    try { await apiCall('/produits/' + id, 'PUT', { stock }); await renderTables(); }
                    catch(err) { alert(err.message); }
                });
            });

        } catch (err) { console.error('Erreur chargement produits:', err); }
    }

    function resetForm() {
        editId.value = ''; pName.value = ''; pCategory.value = ''; pPrice.value = ''; pStock.value = ''; pDesc.value = '';
        submitBtn.textContent = 'Ajouter Produit';
        const imageUrl = document.getElementById('artisan-product-image-url');
        const imgPreview = document.getElementById('product-img-preview');
        if (imageUrl) imageUrl.value = '';
        if (imgPreview) imgPreview.innerHTML = '<i class="fas fa-image"></i>';
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        const imageUrl = document.getElementById('artisan-product-image-url');
        const payload = { nom: pName.value.trim(), categorie: pCategory.value, prix: Number(pPrice.value), stock: Number(pStock.value), description: pDesc.value.trim() };
        if (imageUrl && imageUrl.value) payload.image = imageUrl.value;
        try {
            if (editId.value) await apiCall(`/produits/${editId.value}`, 'PUT', payload);
            else await apiCall('/produits', 'POST', payload);
            await renderTables();
            resetForm();
            showMessage(editId.value ? 'Produit modifié !' : 'Produit ajouté !');
        } catch (err) { alert(err.message); }
    });

    tableBody.addEventListener('click', async function (event) {
        const editBtn = event.target.closest('.artisan-edit');
        const delBtn = event.target.closest('.artisan-del');
        if (editBtn) {
            try {
                const p = await apiCall(`/produits/${editBtn.dataset.id}`);
                editId.value = p._id; pName.value = p.nom; pCategory.value = p.categorie;
                pPrice.value = p.prix; pStock.value = p.stock; pDesc.value = p.description || '';
                submitBtn.textContent = 'Modifier Produit';
            } catch (err) { alert(err.message); }
        }
        if (delBtn) {
            if (!confirm('Supprimer ce produit ?')) return;
            try { await apiCall(`/produits/${delBtn.dataset.id}`, 'DELETE'); await renderTables(); resetForm(); }
            catch (err) { alert(err.message); }
        }
    });

    cancelBtn.addEventListener('click', resetForm);

    // Profil artisan
    const profileForm = document.getElementById('artisan-profile-form');
    const profileName = document.getElementById('artisan-profile-name');
    const profileEmail = document.getElementById('artisan-profile-email');
    const profilePassword = document.getElementById('artisan-profile-password');
    profileName.value = currentUser.nom || currentUser.name || '';
    profileEmail.value = currentUser.email || '';

    profileForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        try {
            const body = { nom: profileName.value.trim(), email: profileEmail.value.trim() };
            if (profilePassword.value.trim()) body.password = profilePassword.value.trim();
            await apiCall('/users/profile', 'PUT', body);
            const updatedUser = { ...currentUser, nom: body.nom, email: body.email };
            localStorage.setItem('ds_current_user', JSON.stringify(updatedUser));
            if (artisanName) artisanName.textContent = body.nom;
            profilePassword.value = '';
            showMessage('Profil mis à jour avec succès.');
        } catch (err) { alert(err.message); }
    });

    const logoutBtn = document.querySelector('.artisan-logout-link');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (event) {
            event.preventDefault();
            localStorage.removeItem('ds_token');
            localStorage.removeItem('ds_current_user');
            window.location.href = 'login.html';
        });
    }

    renderTables();
}
