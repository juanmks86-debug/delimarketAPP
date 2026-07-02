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
  const vendor   = JSON.parse(localStorage.getItem('dm_vendor_profile')   || 'null');
  const consumer = JSON.parse(localStorage.getItem('dm_consumer_profile') || 'null');
  const products = JSON.parse(localStorage.getItem('dm_vendor_products')  || '[]');
  const orders   = JSON.parse(localStorage.getItem('dm_orders')           || '[]');

  // Pendientes de aprobación
  const pending  = JSON.parse(localStorage.getItem('dm_vendors_pending')  || '[]');

  return {
    vendors:   vendor   ? [vendor]   : [DEMO_VENDOR],
    consumers: consumer ? [consumer] : [DEMO_CONSUMER],
    products:  products.length > 0 ? products : DEMO_PRODUCTS,
    orders,
    pending,
    isDemo:    !vendor && !consumer,
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
      <div class="admin-stat-icon blue"><i class="ti ti-package"></i></div>
      <div class="admin-stat-val">${data.products.length}</div>
      <div class="admin-stat-label">Productos publicados</div>
    </div>
    <div class="admin-stat-card">
      <div class="admin-stat-icon red"><i class="ti ti-receipt"></i></div>
      <div class="admin-stat-val">${data.orders.length}</div>
      <div class="admin-stat-label">Pedidos totales</div>
    </div>
  `;

  const actEl = document.getElementById('admin-activity');
  const activities = [];

  if (!data.isDemo) {
    if (data.vendors.length > 0) {
      activities.push({ color: 'orange', text: `<strong>${data.vendors[0].name}</strong> se registró como vendedor` });
    }
    if (data.consumers.length > 0) {
      activities.push({ color: 'green', text: `<strong>${data.consumers[0].firstname} ${data.consumers[0].lastname}</strong> se registró como consumidor` });
    }
    if (data.products.length > 0) {
      activities.push({ color: 'orange', text: `<strong>${data.vendors[0]?.name || 'Vendedor'}</strong> publicó ${data.products.length} producto(s)` });
    }
  }

  const banners = getBanners();
  if (banners.length > 0) {
    activities.push({ color: 'green', text: `<strong>${banners.length} banner(s)</strong> publicitario(s) activo(s)` });
  }

  if (activities.length === 0) {
    actEl.innerHTML = `<div class="admin-empty"><i class="ti ti-clock"></i><p>No hay actividad registrada aún.</p></div>`;
  } else {
    actEl.innerHTML = activities.map(a => `
      <div class="activity-item">
        <div class="activity-dot ${a.color}"></div>
        <div class="activity-text">${a.text}</div>
      </div>
    `).join('');
  }
}

// =============================================
//   RENDERIZAR VENDEDORES
// =============================================

function renderVendors(data) {
  const CATEGORY_LABELS = {
    frutas: 'Frutas y verduras', lacteos: 'Lácteos',
    panaderia: 'Panadería', carnes: 'Carnes', bebidas: 'Bebidas', otros: 'Otros'
  };

  const totalVendors = data.vendors.length + (data.pending?.length || 0);
  document.getElementById('vendor-count-label').textContent =
    `${data.vendors.length} aprobado(s)${data.pending?.length ? ` · ${data.pending.length} pendiente(s)` : ''}${data.isDemo ? ' — datos de ejemplo' : ''}`;

  const list = document.getElementById('admin-vendors-list');
  let html = '';

  // Pendientes de aprobación
  if (data.pending && data.pending.length > 0) {
    html += `<div class="admin-section-title" style="margin-bottom:10px">
      <i class="ti ti-clock" style="color:#E8920E;font-size:15px"></i>
      Pendientes de aprobación (${data.pending.length})
    </div>`;
    html += data.pending.map((v, idx) => `
      <div class="admin-list-item" style="border-left:3px solid #E8920E">
        <div class="admin-item-avatar vendor"><i class="ti ti-store"></i></div>
        <div class="admin-item-info">
          <div class="admin-item-name">${v.name}</div>
          <div class="admin-item-detail">${CATEGORY_LABELS[v.category] || v.category} · ${v.location} · DNI ${v.dni}</div>
          ${v.bio ? `<div class="admin-item-detail" style="font-style:italic">"${v.bio}"</div>` : ''}
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button onclick="approveVendor(${idx})" style="
            padding:6px 12px;background:#1D9E75;color:#fff;border:none;border-radius:8px;
            font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;
            display:flex;align-items:center;gap:4px">
            <i class="ti ti-check" style="font-size:14px"></i> Aprobar
          </button>
          <button onclick="rejectVendor(${idx})" style="
            padding:6px 12px;background:#FAECE7;color:#D85A30;border:none;border-radius:8px;
            font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;
            display:flex;align-items:center;gap:4px">
            <i class="ti ti-x" style="font-size:14px"></i> Rechazar
          </button>
        </div>
      </div>`).join('');
    html += `<div class="admin-section-title" style="margin-top:20px;margin-bottom:10px">Vendedores aprobados</div>`;
  }

  if (data.vendors.length === 0) {
    html += `<div class="admin-empty"><i class="ti ti-store"></i><p>No hay vendedores registrados.</p></div>`;
  } else {
    html += data.vendors.map((v, idx) => `
      <div class="admin-list-item">
        <div class="admin-item-avatar vendor"><i class="ti ti-store"></i></div>
        <div class="admin-item-info">
          <div class="admin-item-name">
            ${v.name}
            <span style="font-size:10px;background:#E1F5EE;color:#0F6E56;padding:2px 8px;border-radius:999px;margin-left:6px;font-weight:500">
              <i class="ti ti-circle-check" style="font-size:11px"></i> Aprobado
            </span>
          </div>
          <div class="admin-item-detail">${CATEGORY_LABELS[v.category] || v.category} · ${v.location} · DNI ${v.dni}</div>
          ${v.bio ? `<div class="admin-item-detail" style="font-style:italic">"${v.bio}"</div>` : ''}
        </div>
        ${!data.isDemo ? `
          <button class="admin-delete-btn" onclick="deleteVendor()" aria-label="Eliminar vendedor">
            <i class="ti ti-trash" style="font-size:16px"></i>
          </button>` : ''}
      </div>`).join('');
  }

  list.innerHTML = html;
}

// =============================================
//   RENDERIZAR CONSUMIDORES
// =============================================

function renderConsumers(data) {
  document.getElementById('consumer-count-label').textContent =
    `${data.consumers.length} consumidor(es) registrado(s)${data.isDemo ? ' — datos de ejemplo' : ''}`;

  const list = document.getElementById('admin-consumers-list');

  if (data.consumers.length === 0) {
    list.innerHTML = `<div class="admin-empty"><i class="ti ti-users"></i><p>No hay consumidores registrados.</p></div>`;
    return;
  }

  list.innerHTML = data.consumers.map((c) => `
    <div class="admin-list-item">
      <div class="admin-item-avatar consumer"><i class="ti ti-user"></i></div>
      <div class="admin-item-info">
        <div class="admin-item-name">${c.firstname} ${c.lastname}</div>
        <div class="admin-item-detail">
          DNI ${c.dni} · ${c.phone} · ${c.location}
        </div>
        <div class="admin-item-detail">${c.address}</div>
      </div>
      ${!data.isDemo ? `
        <button class="admin-delete-btn" onclick="deleteConsumer()" aria-label="Eliminar consumidor">
          <i class="ti ti-trash" style="font-size:16px"></i>
        </button>` : ''}
    </div>
  `).join('');
}

// =============================================
//   RENDERIZAR PRODUCTOS
// =============================================

function renderAdminProducts(data) {
  document.getElementById('product-count-label').textContent =
    `${data.products.length} producto(s) publicado(s)${data.isDemo ? ' — datos de ejemplo' : ''}`;

  const list = document.getElementById('admin-products-list');

  if (data.products.length === 0) {
    list.innerHTML = `<div class="admin-empty"><i class="ti ti-package"></i><p>No hay productos publicados.</p></div>`;
    return;
  }

  list.innerHTML = data.products.map((p, idx) => `
    <div class="admin-list-item" id="admin-product-${idx}">
      <div class="admin-item-avatar product"><i class="ti ${p.icon}"></i></div>
      <div class="admin-item-info">
        <div class="admin-item-name">${p.name}</div>
        <div class="admin-item-detail">
          <i class="ti ti-store" style="font-size:12px"></i> ${p.vendor}
          ${p.time ? ` · <i class="ti ti-clock" style="font-size:11px"></i> ${p.time}` : ''}
        </div>
      </div>
      <div class="admin-item-price">$${Number(p.price).toLocaleString('es-AR')}</div>
      ${!data.isDemo ? `
        <button class="admin-delete-btn" onclick="deleteAdminProduct(${idx})" aria-label="Eliminar producto">
          <i class="ti ti-trash" style="font-size:16px"></i>
        </button>` : ''}
    </div>
  `).join('');
}

// =============================================
//   ACCIONES DE ADMINISTRADOR
// =============================================

function approveVendor(idx) {
  const pending = JSON.parse(localStorage.getItem('dm_vendors_pending') || '[]');
  const vendor  = pending.splice(idx, 1)[0];
  if (!vendor) return;
  localStorage.setItem('dm_vendors_pending', JSON.stringify(pending));
  // Guardar como vendedor aprobado
  localStorage.setItem('dm_vendor_profile', JSON.stringify(vendor));
  showAdminToast(`✅ ${vendor.name} aprobado`);
  init();
}

function rejectVendor(idx) {
  if (!confirm('¿Rechazar y eliminar esta solicitud?')) return;
  const pending = JSON.parse(localStorage.getItem('dm_vendors_pending') || '[]');
  const vendor  = pending.splice(idx, 1)[0];
  localStorage.setItem('dm_vendors_pending', JSON.stringify(pending));
  showAdminToast(`❌ Solicitud de ${vendor?.name} rechazada`);
  init();
}

function deleteVendor() {
  if (!confirm('¿Eliminar este vendedor y todos sus productos?')) return;
  localStorage.removeItem('dm_vendor_profile');
  localStorage.removeItem('dm_vendor_products');
  init();
}

function deleteConsumer() {
  if (!confirm('¿Eliminar este consumidor?')) return;
  localStorage.removeItem('dm_consumer_profile');
  init();
}

function deleteAdminProduct(idx) {
  if (!confirm('¿Eliminar este producto del marketplace?')) return;
  const products = JSON.parse(localStorage.getItem('dm_vendor_products') || '[]');
  products.splice(idx, 1);
  localStorage.setItem('dm_vendor_products', JSON.stringify(products));
  init();
}

// =============================================
//   INIT
// =============================================

function init() {
  const data = getData();
  renderDashboard(data);
  renderVendors(data);
  renderConsumers(data);
  renderAdminProducts(data);
  initAdminBanners();
  initAdminTemas();
  initDarkMode();
}

function goToAdmin() {
  window.location.href = 'admin.html';
}

init();
