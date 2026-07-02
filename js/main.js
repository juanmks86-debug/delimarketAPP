// =============================================
//   main.js — Router, Carrito, Productos
//   dinámicos y sesión del consumidor.
// =============================================

// ===== PRODUCTOS DEMO (fallback si no hay vendedores) =====
const DEMO_PRODUCTS = [
  { id:'d1', icon:'ti-apple',   name:'Manzanas rojas x kg',    vendor:'Finca El Sol',    price:850,  time:'30 min', desc:'Manzanas rojas de cosecha propia, frescas y dulces.',        stars:'4.8', reviews:'124' },
  { id:'d2', icon:'ti-bread',   name:'Pan casero artesanal',   vendor:'Panadería Luz',   price:600,  time:'45 min', desc:'Pan horneado diariamente con masa madre y harina integral.', stars:'4.9', reviews:'87'  },
  { id:'d3', icon:'ti-egg',     name:'Huevos de campo x 12',   vendor:'Granja Ortiz',    price:1200, time:'20 min', desc:'Huevos de gallinas criadas en libertad, alimentadas con granos naturales.', stars:'5.0', reviews:'203' },
  { id:'d4', icon:'ti-bottle',  name:'Leche fresca 1 litro',   vendor:'Tambo Serrano',   price:450,  time:'40 min', desc:'Leche fresca entera, pasteurizada en el día.',               stars:'4.7', reviews:'56'  },
  { id:'d5', icon:'ti-fish',    name:'Pollo entero fresco',    vendor:'Granja Pérez',    price:3500, time:'50 min', desc:'Pollo criado en granja familiar, sin hormonas ni antibióticos.', stars:'4.6', reviews:'91' },
  { id:'d6', icon:'ti-leaf',    name:'Verdura de estación',    vendor:'Huerta Verde',    price:700,  time:'25 min', desc:'Mix de verduras de hoja y pimientos de temporada.',          stars:'4.8', reviews:'145' },
  { id:'d7', icon:'ti-cheese',  name:'Queso cremoso 500g',     vendor:'Tambo Serrano',   price:1800, time:'35 min', desc:'Queso cremoso artesanal elaborado con leche fresca de vaca.', stars:'4.9', reviews:'178' },
  { id:'d8', icon:'ti-droplet', name:'Miel artesanal 250g',    vendor:'Apiario Norte',   price:2200, time:'30 min', desc:'Miel pura de flores silvestres de la Puna jujeña.',          stars:'5.0', reviews:'67'  },
];

// ===== ESTADO GLOBAL =====
let cart = JSON.parse(localStorage.getItem('dm_cart') || '[]');
let favorites = JSON.parse(localStorage.getItem('dm_favorites') || '[]');
let currentProduct = null;
let detailQty = 1;
let allProducts = [];
let activeCategory = 'todos';
let activeSortOrder = 'default'; // 'default' | 'price-asc' | 'price-desc' | 'newest'

function saveCart() { localStorage.setItem('dm_cart', JSON.stringify(cart)); }
function saveFavorites() { localStorage.setItem('dm_favorites', JSON.stringify(favorites)); }

function isFavorite(productId) { return favorites.some(f => f.id === productId); }

function toggleFavorite(e, product) {
  e.stopPropagation();
  if (isFavorite(product.id)) {
    favorites = favorites.filter(f => f.id !== product.id);
    showToast('Eliminado de favoritos', 'ti-heart');
  } else {
    favorites.push(product);
    showToast('Agregado a favoritos ❤️', 'ti-heart-filled');
  }
  saveFavorites();
  applyFilters();
}

// =============================================
//   SESIÓN DEL CONSUMIDOR
// =============================================

function initSession() {
  const saved = localStorage.getItem('dm_consumer_profile');
  const navActions = document.getElementById('nav-actions');
  const heroCta    = document.getElementById('hero-cta');

  if (saved) {
    const profile = JSON.parse(saved);
    const firstName = profile.firstname || 'Usuario';
    navActions.innerHTML = `
      <button class="dark-mode-toggle" onclick="toggleDarkMode()" title="Modo nocturno">
        <i class="ti ti-moon"></i>
      </button>
      <button class="consumer-badge" onclick="showScreen('orders')">
        <div class="consumer-avatar-small"><i class="ti ti-user"></i></div>
        <span class="consumer-name-small">${firstName}</span>
      </button>
      <button class="nav-btn" onclick="logoutConsumer()" title="Cerrar sesión" style="padding:7px 10px">
        <i class="ti ti-logout" style="font-size:16px"></i>
      </button>
      <button class="nav-btn primary" onclick="goToVendedor('vendor')">
        <i class="ti ti-plus" style="font-size:16px"></i>
        <span class="btn-label"> Publicar</span>
      </button>
    `;
    if (heroCta) heroCta.innerHTML = `
      <button class="hero-btn-secondary" onclick="goToVendedor('vendor')">
        <i class="ti ti-store" style="font-size:16px"></i>
        Publicar mis productos
      </button>
    `;
  } else {
    navActions.innerHTML = `
      <button class="dark-mode-toggle" onclick="toggleDarkMode()" title="Modo nocturno">
        <i class="ti ti-moon"></i>
      </button>
      <button class="nav-btn" onclick="goToVendedor('consumer')">
        <i class="ti ti-user" style="font-size:16px"></i>
        <span class="btn-label"> Ingresar</span>
      </button>
      <button class="nav-btn primary" onclick="goToVendedor('vendor')">
        <i class="ti ti-plus" style="font-size:16px"></i>
        <span class="btn-label"> Publicar</span>
      </button>
    `;
    if (heroCta) heroCta.innerHTML = `
      <button class="hero-btn-primary" onclick="goToVendedor('consumer')">
        <i class="ti ti-user-plus" style="font-size:16px"></i>
        Crear mi cuenta gratis
      </button>
      <button class="hero-btn-secondary" onclick="goToVendedor('consumer')">
        <i class="ti ti-login" style="font-size:16px"></i>
        Ya tengo cuenta
      </button>
    `;
  }
}

function logoutConsumer() {
  if (!confirm('¿Cerrar sesión?')) return;
  localStorage.removeItem('dm_consumer_profile');
  sessionStorage.removeItem('dm_pending_role');
  sessionStorage.removeItem('dm_pending_action');
  initSession();
  showToast('Sesión cerrada', 'ti-logout');
}

function goToVendedor(role) {
  sessionStorage.setItem('dm_pending_role', role);
  window.location.href = 'vendedor.html';
}

// =============================================
//   PRODUCTOS DINÁMICOS
// =============================================

/**
 * Carga productos del localStorage del vendedor.
 * Si hay productos reales los mezcla con los demo,
 * si no hay muestra solo los demo.
 */
function loadProducts() {
  const vendorProducts = JSON.parse(localStorage.getItem('dm_vendor_products') || '[]');

  // Los productos del vendedor van primero, luego los demo
  allProducts = vendorProducts.length > 0
    ? [...vendorProducts, ...DEMO_PRODUCTS]
    : [...DEMO_PRODUCTS];

  renderProducts(allProducts);
}

/**
 * Crea el HTML de una card de producto.
 */
function buildCard(p) {
  const isFav = isFavorite(p.id);
  const imgContent = p.image
    ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">`
    : `<i class="ti ${p.icon}" aria-hidden="true"></i>`;
  return `
    <div class="product-card" onclick='showDetail(${JSON.stringify(p)})'>
      <div class="product-img" style="position:relative">
        ${imgContent}
        <button onclick='toggleFavorite(event, ${JSON.stringify(p)})' style="
          position:absolute;top:6px;right:6px;width:28px;height:28px;border-radius:50%;
          background:rgba(255,255,255,0.9);border:none;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 1px 4px rgba(0,0,0,0.15);">
          <i class="ti ${isFav ? 'ti-heart-filled' : 'ti-heart'}" style="font-size:15px;color:${isFav ? '#e53935' : '#999'}"></i>
        </button>
      </div>
      <div class="product-info">
        <div class="delivery-badge">
          <i class="ti ti-clock" style="font-size:10px" aria-hidden="true"></i> ${p.time || '—'}
        </div>
        <div class="product-name">${p.name}</div>
        <div class="product-vendor">
          <i class="ti ti-store" style="font-size:12px" aria-hidden="true"></i> ${p.vendor}
        </div>
        <div class="product-bottom">
          <span class="product-price">$${Number(p.price).toLocaleString('es-AR')}</span>
          <button class="add-btn" onclick="event.stopPropagation();addToCartDirect(${JSON.stringify(p).replace(/"/g,'&quot;')})">
            <i class="ti ti-plus" aria-label="Agregar"></i>
          </button>
        </div>
      </div>
    </div>`;
}

/**
 * Renderiza la lista de productos en el track del carrusel.
 */
function renderProducts(products) {
  const track = document.getElementById('track');
  if (!track) return;

  if (products.length === 0) {
    track.innerHTML = `
      <div style="padding:32px;text-align:center;color:var(--color-text-tertiary);font-size:13px;min-width:200px">
        <i class="ti ti-package" style="font-size:36px;display:block;margin-bottom:10px;"></i>
        No hay productos en esta categoría.
      </div>`;
  } else {
    track.innerHTML = products.map(buildCard).join('');
  }

  // Reiniciar el carrusel para recalcular dimensiones
  if (typeof calcDimensions === 'function') calcDimensions();
}

// =============================================
//   NAVEGACIÓN (Router SPA)
// =============================================

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  window.scrollTo(0, 0);
  if (name === 'cart') renderCart();
}

// =============================================
//   DETALLE DE PRODUCTO
// =============================================

function showDetail(product) {
  currentProduct = product;
  detailQty = 1;

  // Mostrar imagen o ícono en detalle
  const detailImgEl = document.querySelector('.detail-img');
  const detailIconEl = document.getElementById('detail-icon');
  if (product.image) {
    detailImgEl.style.backgroundImage = `url(${product.image})`;
    detailImgEl.style.backgroundSize = 'cover';
    detailImgEl.style.backgroundPosition = 'center';
    detailIconEl.style.display = 'none';
  } else {
    detailImgEl.style.backgroundImage = 'none';
    detailImgEl.style.backgroundSize = '';
    detailIconEl.style.display = '';
    detailIconEl.className = 'ti ' + product.icon;
  }
  document.getElementById('detail-name').textContent = product.name;
  document.getElementById('detail-vendor').textContent = product.vendor;
  document.getElementById('detail-stars').textContent = product.stars || '—';
  document.getElementById('detail-reviews').textContent = product.reviews ? '(' + product.reviews + ')' : '';
  document.getElementById('detail-time').textContent = product.time || '—';
  document.getElementById('detail-desc').textContent = product.desc || 'Sin descripción.';
  document.getElementById('detail-price-display').textContent = '$' + Number(product.price).toLocaleString('es-AR');
  document.getElementById('detail-qty').textContent = detailQty;
  updateDetailTotal();
  showScreen('detail');
}

function changeQty(delta) {
  detailQty = Math.max(1, detailQty + delta);
  document.getElementById('detail-qty').textContent = detailQty;
  updateDetailTotal();
}

function updateDetailTotal() {
  if (!currentProduct) return;
  document.getElementById('detail-total').textContent =
    '$' + (currentProduct.price * detailQty).toLocaleString('es-AR');
}

function addDetailToCart() {
  if (!currentProduct) return;
  for (let i = 0; i < detailQty; i++) addToCartDirect(currentProduct);
  showScreen('cart');
}

// =============================================
//   CARRITO
// =============================================

function addToCartDirect(product) {
  const existing = cart.find(i => i.name === product.name);
  if (existing) { existing.qty++; }
  else { cart.push({ ...product, qty: 1 }); }
  saveCart();
  updateCartBadges();
}

function updateCartBadges() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('#cartCount, #cartCountDetail').forEach(el => {
    el.textContent = total;
  });
}

function renderCart() {
  const itemsEl   = document.getElementById('cart-items');
  const emptyEl   = document.getElementById('cart-empty');
  const summaryEl = document.getElementById('cart-summary');

  if (cart.length === 0) {
    emptyEl.style.display = 'flex';
    itemsEl.innerHTML = '';
    summaryEl.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  summaryEl.style.display = 'block';

  itemsEl.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-img" style="${item.image ? 'overflow:hidden;border-radius:var(--border-radius-md)' : ''}">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">`
          : `<i class="ti ${item.icon}" aria-hidden="true"></i>`}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-vendor">${item.vendor}</div>
        <div class="cart-item-qty-row">
          <button class="cart-qty-btn" onclick="changeCartQty(${idx}, -1)">−</button>
          <div class="cart-qty-val">${item.qty}</div>
          <button class="cart-qty-btn" onclick="changeCartQty(${idx}, 1)">+</button>
        </div>
      </div>
      <div class="cart-item-price">$${(item.price * item.qty).toLocaleString('es-AR')}</div>
      <button class="cart-delete-btn" onclick="removeCartItem(${idx})" aria-label="Eliminar">
        <i class="ti ti-trash" style="font-size:16px" aria-hidden="true"></i>
      </button>
    </div>
  `).join('');

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('summary-subtotal').textContent = '$' + subtotal.toLocaleString('es-AR');
  document.getElementById('summary-total').textContent    = '$' + subtotal.toLocaleString('es-AR');
}

function changeCartQty(idx, delta) {
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  saveCart();
  updateCartBadges();
  renderCart();
}

function removeCartItem(idx) {
  cart.splice(idx, 1);
  saveCart();
  updateCartBadges();
  renderCart();
}

// =============================================
//   CATEGORÍAS (con filtrado real)
// =============================================

const CATEGORY_MAP = {
  'todos':             null,
  'frutas y verduras': 'ti-apple',
  'lácteos':           'ti-egg',
  'panadería':         'ti-bread',
  'carnes':            'ti-fish',
  'bebidas':           'ti-bottle',
};

let activeCategoryIcon = null;

document.querySelectorAll('.cat-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const label = chip.textContent.trim().toLowerCase();
    activeCategoryIcon = CATEGORY_MAP[label] ?? null;
    applyFilters();
  });
});

document.querySelector('.search-bar input').addEventListener('input', () => applyFilters());

// Inyectar selector de orden y favoritos en la sección
function injectSortBar() {
  const sectionTitle = document.querySelector('.section .section-title');
  if (!sectionTitle) return;
  const bar = document.createElement('div');
  bar.id = 'sort-bar';
  bar.style.cssText = 'display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center;';
  bar.innerHTML = `
    <select id="sort-select" onchange="activeSortOrder=this.value;applyFilters()" style="
      padding:6px 12px;border-radius:999px;border:0.5px solid var(--color-border-secondary);
      background:var(--color-background-primary);font-size:13px;color:var(--color-text-secondary);
      font-family:var(--font-sans);cursor:pointer;outline:none;">
      <option value="default">Ordenar</option>
      <option value="price-asc">Menor precio</option>
      <option value="price-desc">Mayor precio</option>
      <option value="newest">Más nuevos</option>
    </select>
    <button id="fav-filter-btn" onclick="toggleFavFilter(this)" style="
      display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;
      border:0.5px solid var(--color-border-secondary);background:var(--color-background-primary);
      font-size:13px;color:var(--color-text-secondary);font-family:var(--font-sans);cursor:pointer;">
      <i class="ti ti-heart" style="font-size:14px"></i> Favoritos
    </button>`;
  sectionTitle.parentNode.insertBefore(bar, sectionTitle.nextSibling);
}

let showOnlyFavorites = false;
function toggleFavFilter(btn) {
  showOnlyFavorites = !showOnlyFavorites;
  btn.style.background = showOnlyFavorites ? '#fdecea' : 'var(--color-background-primary)';
  btn.style.borderColor = showOnlyFavorites ? '#e53935' : 'var(--color-border-secondary)';
  btn.style.color       = showOnlyFavorites ? '#e53935' : 'var(--color-text-secondary)';
  applyFilters();
}

function applyFilters() {
  const q = document.querySelector('.search-bar input').value.trim().toLowerCase();
  let filtered = activeCategoryIcon
    ? allProducts.filter(p => p.icon === activeCategoryIcon)
    : [...allProducts];
  if (q) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q)
    );
  }
  if (showOnlyFavorites) {
    filtered = filtered.filter(p => isFavorite(p.id));
  }
  // Ordenar
  if (activeSortOrder === 'price-asc')  filtered.sort((a,b) => a.price - b.price);
  if (activeSortOrder === 'price-desc') filtered.sort((a,b) => b.price - a.price);
  if (activeSortOrder === 'newest')     filtered.sort((a,b) => (b.id > a.id ? 1 : -1));
  renderProducts(filtered);
}

// =============================================
//   INIT
// =============================================
initSession();
loadProducts();
injectSortBar();
initIndexBanners();
initIndexTema();
initDarkMode();

// =============================================
//   SISTEMA DE PEDIDOS
// =============================================

const STATUS_LABELS = {
  pending:  'Pendiente',
  delivery: 'En camino',
  done:     'Entregado',
};

// ----- TOAST -----
function showToast(msg, icon = 'ti-check') {
  const toast = document.getElementById('toast');
  toast.innerHTML = `<i class="ti ${icon}" style="font-size:16px"></i> ${msg}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ----- ABRIR MODAL CHECKOUT -----
function openCheckout() {
  if (cart.length === 0) return;

  // Mostrar items del carrito en el modal
  const itemsEl = document.getElementById('checkout-summary-items');
  itemsEl.innerHTML = cart.map(item => `
    <div class="checkout-item-row">
      <span>${item.name} x${item.qty}</span>
      <span>$${(item.price * item.qty).toLocaleString('es-AR')}</span>
    </div>
  `).join('');

  // Mostrar dirección del consumidor si está logueado
  const profile = JSON.parse(localStorage.getItem('dm_consumer_profile') || 'null');
  document.getElementById('checkout-address').textContent =
    profile ? profile.address : 'Ingresá para agregar tu dirección';

  // Total
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('checkout-total-val').textContent = '$' + total.toLocaleString('es-AR');

  document.getElementById('checkout-modal').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('open');
}

function closeCheckoutOutside(e) {
  if (e.target === document.getElementById('checkout-modal')) closeCheckout();
}

// ----- CONFIRMAR PEDIDO -----
function confirmOrder() {
  if (cart.length === 0) return;

  const profile = JSON.parse(localStorage.getItem('dm_consumer_profile') || 'null');
  const total   = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const order = {
    id:       'PED-' + Date.now().toString().slice(-6),
    date:     new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    items:    cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, icon: i.icon, vendor: i.vendor })),
    total,
    status:   'pending',
    consumer: profile ? `${profile.firstname} ${profile.lastname}` : 'Invitado',
    address:  profile ? profile.address : '—',
    phone:    profile ? profile.phone : '—',
  };

  // Guardar en pedidos globales (los ve el vendedor y admin)
  const allOrders = JSON.parse(localStorage.getItem('dm_orders') || '[]');
  allOrders.unshift(order);
  localStorage.setItem('dm_orders', JSON.stringify(allOrders));

  // Limpiar carrito
  cart = [];
  saveCart();
  updateCartBadges();
  closeCheckout();

  showToast('¡Pedido confirmado! 🎉', 'ti-circle-check');

  // Notificación por WhatsApp al vendedor
  sendWhatsAppNotification(order);

  // Mostrar pantalla mis pedidos
  setTimeout(() => {
    showScreen('orders');
    renderMyOrders();
  }, 800);
}

// ----- WHATSAPP AL VENDEDOR -----
function sendWhatsAppNotification(order) {
  // Obtener teléfono del vendedor registrado
  const vendorProfile = JSON.parse(localStorage.getItem('dm_vendor_profile') || 'null');
  const vendorPhone = vendorProfile?.phone;

  if (!vendorPhone) return; // sin teléfono no se puede enviar

  // Limpiar número: solo dígitos, agregar código Argentina si no tiene
  let phone = vendorPhone.replace(/\D/g, '');
  if (phone.startsWith('0')) phone = phone.slice(1);
  if (!phone.startsWith('54')) phone = '54' + phone;

  // Armar mensaje
  const itemsText = order.items
    .map(i => `• ${i.name} x${i.qty} — $${(i.price * i.qty).toLocaleString('es-AR')}`)
    .join('\n');

  const msg = encodeURIComponent(
    `🛒 *Nuevo pedido ${order.id}*\n\n` +
    `👤 Cliente: ${order.consumer}\n` +
    `📍 Dirección: ${order.address}\n` +
    `📞 Teléfono: ${order.phone}\n\n` +
    `📦 Productos:\n${itemsText}\n\n` +
    `💰 *Total: $${order.total.toLocaleString('es-AR')}*`
  );

  // Abrir WhatsApp en nueva pestaña
  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
}

// ----- MIS PEDIDOS (vista consumidor) -----
function renderMyOrders() {
  const allOrders = JSON.parse(localStorage.getItem('dm_orders') || '[]');
  const body = document.getElementById('my-orders-body');

  if (allOrders.length === 0) {
    body.innerHTML = `
      <div style="padding:48px 16px;text-align:center;color:var(--color-text-tertiary)">
        <i class="ti ti-receipt" style="font-size:48px;display:block;margin-bottom:12px"></i>
        <p style="font-size:14px">Todavía no realizaste pedidos.</p>
      </div>`;
    return;
  }

  body.innerHTML = allOrders.map(order => {
    const steps = [
      { key: 'pending',  label: 'Confirmado', icon: 'ti-check' },
      { key: 'delivery', label: 'En camino',  icon: 'ti-truck-delivery' },
      { key: 'done',     label: 'Entregado',  icon: 'ti-home' },
    ];
    const stepIdx = steps.findIndex(s => s.key === order.status);

    const stepperHTML = steps.map((s, i) => `
      ${i > 0 ? `<div class="step-line ${i <= stepIdx ? 'done' : ''}"></div>` : ''}
      <div class="step">
        <div class="step-dot ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}">
          <i class="ti ${s.icon}" style="font-size:12px"></i>
        </div>
        <div class="step-label ${i === stepIdx ? 'active' : ''}">${s.label}</div>
      </div>
    `).join('');

    return `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <div class="order-card-id">${order.id}</div>
            <div class="order-card-date">${order.date}</div>
          </div>
          <span class="order-status-badge status-${order.status}">
            ${STATUS_LABELS[order.status]}
          </span>
        </div>

        <div class="order-stepper">${stepperHTML}</div>

        <div class="order-card-items">
          ${order.items.map(i => `
            <div class="order-card-item">
              <span><i class="ti ${i.icon}" style="font-size:12px"></i> ${i.name} x${i.qty}</span>
              <span>$${(i.price * i.qty).toLocaleString('es-AR')}</span>
            </div>
          `).join('')}
        </div>

        <div class="order-card-footer">
          <div style="font-size:12px;color:var(--color-text-secondary)">
            <i class="ti ti-map-pin" style="font-size:12px"></i> ${order.address}
          </div>
          <div class="order-card-total">$${order.total.toLocaleString('es-AR')}</div>
        </div>
      </div>`;
  }).join('');
}
