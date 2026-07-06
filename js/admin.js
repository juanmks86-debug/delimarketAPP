// =============================================
//   admin.js — Lógica del panel administrador
// =============================================

const DEMO_VENDOR = {
  name: 'Finca El Sol', dni: '20345678', phone: '388 4001234',
  category: 'frutas', location: 'San Salvador de Jujuy',
  bio: 'Productores de frutas y verduras de estación.', address: 'Av. Bolivia 1200'
};
const DEMO_CONSUMER = {
  firstname: 'María', lastname: 'González', dni: '35678901',
  phone: '388 5556789', location: 'San Salvador de Jujuy', address: 'Gral. Paz 456'
};
const DEMO_PRODUCTS = [
  { icon:'ti-apple',  name:'Manzanas rojas x kg',  vendor:'Finca El Sol',  price:850  },
  { icon:'ti-bread',  name:'Pan casero artesanal',  vendor:'Panadería Luz', price:600  },
  { icon:'ti-egg',    name:'Huevos de campo x 12',  vendor:'Granja Ortiz',  price:1200 },
];

// =============================================
//   LEER DATOS DEL localStorage
// =============================================

function getData() {
  // dm_users guarda TODAS las cuentas registradas (vendedores y consumidores),
  // cada una con su "identifier" (correo/celular) único.
  const users    = JSON.parse(localStorage.getItem('dm_users')          || '[]');
  const products = JSON.parse(localStorage.getItem('dm_vendor_products')  || '[]');
  const orders   = JSON.parse(localStorage.getItem('dm_orders')           || '[]');

  // Pendientes de aprobación
  const pending  = JSON.parse(localStorage.getItem('dm_vendors_pending')  || '[]');
  const pendingIds = new Set(pending.map(p => p.identifier));

  const vendors = users
    .filter(u => u.role === 'vendor' && !pendingIds.has(u.identifier))
    .map(u => ({ ...u.profile, identifier: u.identifier }));

  const consumers = users
    .filter(u => u.role === 'consumer')
    .map(u => ({ ...u.profile, identifier: u.identifier }));

  const noRealData = users.length === 0 && pending.length === 0;

  return {
    vendors:   noRealData ? [DEMO_VENDOR]   : vendors,
    consumers: noRealData ? [DEMO_CONSUMER] : consumers,
    products:  products.length > 0 ? products : (noRealData ? DEMO_PRODUCTS : []),
    orders,
    pending,
    isDemo:    noRealData,
  };
}

// =============================================
//   NAVEGACIÓN DE TABS
// =============================================

function switchAdminTab(tab, btn) {
  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
  document.getElementById('tab-' + tab).style.display = 'block';

  const titles = {
    dashboard: 'Resumen', vendors: 'Vendedores',
    consumers: 'Consumidores', products: 'Productos',
    banners: 'Publicidad',
    temas: 'Temas'
  };
  document.getElementById('topbar-title').textContent = titles[tab] || tab;

  document.getElementById('sidebar').classList.remove('open');

  if (tab === 'banners') renderAdminBanners();
  if (tab === 'temas') initAdminTemas();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// =============================================
//   RENDERIZAR DASHBOARD
// =============================================

function renderDashboard(data) {
  const statsEl = document.getElementById('admin-stats');
  statsEl.innerHTML = `
    <div class="admin-stat-card">
      <div class="admin-stat-icon green"><i class="ti ti-users"></i></div>
      <div class="admin-stat-val">${data.consumers.length}</div>
      <div class="admin-stat-label">Consumidores</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-icon orange"><i class="ti ti-store"></i></div>
      <div class="admin-stat-val">${data.vendors.length}</div>
      <div class="admin-stat-label">Vendedores</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-icon blue"><i
