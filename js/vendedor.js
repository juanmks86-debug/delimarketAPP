// =============================================
//   vendedor.js — Auth, Login, Registro, Panel
//   Estado guardado en localStorage.
// =============================================

// ===== ESTADO =====
let selectedRole = null;
let vendorProfile = null;
let consumerProfile = null;
let myProducts = [];

const CATEGORY_LABELS = {
  frutas:    'Frutas y verduras',
  lacteos:   'Lácteos',
  panaderia: 'Panadería y repostería',
  carnes:    'Carnes y aves',
  bebidas:   'Bebidas',
  otros:     'Otros productos',
};

const CATEGORY_ICONS = {
  'ti-apple':  'Frutas y verduras',
  'ti-egg':    'Lácteos y huevos',
  'ti-bread':  'Panadería',
  'ti-fish':   'Carnes y aves',
  'ti-bottle': 'Bebidas',
  'ti-leaf':   'Otros',
};

// =============================================
//   NAVEGACIÓN
// =============================================

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
}

// =============================================
//   SELECTOR DE ROL
// =============================================

function selectRole(btn) {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedRole = btn.dataset.role;

  const actionBtns = document.getElementById('auth-action-btns');
  const adminBtn   = document.getElementById('btn-continue');

  if (selectedRole === 'admin') {
    actionBtns.style.display = 'none';
    adminBtn.style.display = 'flex';
  } else {
    actionBtns.style.display = 'flex';
    adminBtn.style.display = 'none';
  }
}

// =============================================
//   CONTINUAR → decide flujo según rol + acción
// =============================================

function continueLogin(action) {
  if (!selectedRole) return;

  // Guardar rol actual para saber adónde ir después de auth
  sessionStorage.setItem('dm_pending_role', selectedRole);
  sessionStorage.setItem('dm_pending_action', action || 'login');

  if (selectedRole === 'admin') {
    const pass = prompt('Ingresá la contraseña de administrador:');
    if (pass === null) return; // canceló

    // La contraseña YA NO se valida en el navegador.
    // Se envía a una función serverless (/api/admin-login) que la compara
    // contra process.env.ADMIN_PASSWORD en el servidor de Vercel.
    fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // Guardamos el token temporal firmado; admin.html lo va a
          // verificar contra el servidor antes de mostrar el panel.
          sessionStorage.setItem('dm_admin_token', data.token);
          window.location.href = 'admin.html';
        } else {
          alert('Contraseña incorrecta. Acceso denegado.');
        }
      })
      .catch(() => alert('Error al validar la contraseña. Intentá de nuevo.'));
    return;
  }

  if (action === 'login') {
    showScreen('auth-login');
  } else {
    // Registrarme
    if (selectedRole === 'consumer') {
      showScreen('register-consumer');
    } else {
      showScreen('register');
    }
  }
}

// =============================================
//   UTILIDADES DE CONTRASEÑA
// =============================================

function togglePass(inputId) {
  const input = document.getElementById(inputId);
  const eye   = document.getElementById(inputId + '-eye');
  if (input.type === 'password') {
    input.type = 'text';
    eye.className = 'ti ti-eye-off';
  } else {
    input.type = 'password';
    eye.className = 'ti ti-eye';
  }
}

function validatePassword(pass) {
  const errors = [];
  if (pass.length < 4)           errors.push('muy corta');
  if (pass.length > 8)           errors.push('máximo 8 caracteres');
  if (!/[A-Z]/.test(pass))       errors.push('falta una mayúscula');
  if (!/[0-9]/.test(pass))       errors.push('falta un número');
  if (!/[^A-Za-z0-9]/.test(pass)) errors.push('falta un símbolo');
  return errors;
}

function checkPassStrength(inputId, strengthId, bar1, bar2, bar3, msgId) {
  const pass = document.getElementById(inputId).value;
  const strengthEl = document.getElementById(strengthId);
  strengthEl.style.display = pass.length > 0 ? 'block' : 'none';

  const hasUpper  = /[A-Z]/.test(pass);
  const hasNum    = /[0-9]/.test(pass);
  const hasSymbol = /[^A-Za-z0-9]/.test(pass);
  const score = [hasUpper, hasNum, hasSymbol].filter(Boolean).length;

  const colors  = ['#D85A30', '#E8920E', '#1D9E75'];
  const labels  = ['Débil — falta mayúscula, número y símbolo', 'Regular — falta completar requisitos', '¡Contraseña válida!'];
  const barEls  = [bar1, bar2, bar3].map(id => document.getElementById(id));

  barEls.forEach((b, i) => {
    b.style.background = i < score ? colors[score - 1] : '#E0E0E0';
  });
  document.getElementById(msgId).textContent = labels[score - 1] || 'Completá los requisitos';
  document.getElementById(msgId).style.color  = colors[score - 1] || '#999';
}

function showAuthError(containerId, msgId, msg) {
  document.getElementById(containerId).style.display = 'block';
  document.getElementById(msgId).textContent = msg;
}
function hideAuthError(containerId) {
  document.getElementById(containerId).style.display = 'none';
}

// =============================================
//   LOGIN CON CREDENCIALES
// =============================================

function doLogin() {
  const identifier = document.getElementById('login-identifier').value.trim();
  const password   = document.getElementById('login-password').value;
  hideAuthError('login-error');

  if (!identifier || !password) {
    showAuthError('login-error', 'login-error-msg', 'Completá correo/celular y contraseña.');
    return;
  }

  const role = sessionStorage.getItem('dm_pending_role') || 'consumer';

  if (role === 'consumer') {
    const users = JSON.parse(localStorage.getItem('dm_users') || '[]');
    const user  = users.find(u => u.role === 'consumer' && (u.identifier === identifier || u.phone === identifier));
    if (!user) {
      showAuthError('login-error', 'login-error-msg', 'No encontramos una cuenta con ese correo o celular. ¿Querés registrarte?');
      return;
    }
    if (user.password !== btoa(password)) {
      showAuthError('login-error', 'login-error-msg', 'Contraseña incorrecta. Intentá de nuevo.');
      return;
    }
    consumerProfile = user.profile;
    localStorage.setItem('dm_consumer_profile', JSON.stringify(user.profile));
    showWelcomeToast('¡Bienvenido/a de nuevo, ' + user.profile.firstname + '!');
    setTimeout(() => window.location.href = 'index.html', 900);

  } else if (role === 'vendor') {
    const users = JSON.parse(localStorage.getItem('dm_users') || '[]');
    const user  = users.find(u => u.role === 'vendor' && (u.identifier === identifier || u.phone === identifier));
    if (!user) {
      showAuthError('login-error', 'login-error-msg', 'No encontramos una cuenta de vendedor con ese correo o celular.');
      return;
    }
    if (user.password !== btoa(password)) {
      showAuthError('login-error', 'login-error-msg', 'Contraseña incorrecta. Intentá de nuevo.');
      return;
    }
    // Verificar si está pendiente de aprobación
    const pending = JSON.parse(localStorage.getItem('dm_vendors_pending') || '[]');
    const isPending = pending.some(p => p.dni === user.profile.dni);
    if (isPending) {
      showAuthError('login-error', 'login-error-msg', '⏳ Tu cuenta está pendiente de aprobación por el administrador.');
      return;
    }
    vendorProfile = user.profile;
    myProducts = JSON.parse(localStorage.getItem('dm_vendor_products_' + user.profile.name) || '[]');
    localStorage.setItem('dm_vendor_profile', JSON.stringify(user.profile));
    loadVendorPanel();
    showScreen('vendor');
  }
}

// =============================================
//   REGISTRO CONSUMIDOR
// =============================================

function previewConsumerAvatar(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      const circle = document.querySelector('#screen-register-consumer .avatar-circle');
      circle.style.backgroundImage = `url(${e.target.result})`;
      circle.style.backgroundSize = 'cover';
      circle.style.backgroundPosition = 'center';
      document.getElementById('consumer-avatar-icon').style.display = 'none';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function registerConsumer() {
  const firstname   = document.getElementById('c-firstname').value.trim();
  const lastname    = document.getElementById('c-lastname').value.trim();
  const dni         = document.getElementById('c-dni').value.trim();
  const phone       = document.getElementById('c-phone').value.trim();
  const identifier  = document.getElementById('c-identifier').value.trim();
  const location    = document.getElementById('c-location').value.trim();
  const address     = document.getElementById('c-address').value.trim();
  const password    = document.getElementById('c-password').value;
  hideAuthError('c-register-error');

  if (!firstname || !lastname || !dni || !phone || !identifier || !location || !address || !password) {
    showAuthError('c-register-error', 'c-register-error-msg', 'Completá todos los campos obligatorios (*).');
    return;
  }
  if (dni.length < 7 || dni.length > 8) {
    showAuthError('c-register-error', 'c-register-error-msg', 'El DNI debe tener 7 u 8 dígitos.');
    return;
  }
  const passErrors = validatePassword(password);
  if (passErrors.length > 0) {
    showAuthError('c-register-error', 'c-register-error-msg', 'La contraseña no cumple los requisitos: ' + passErrors.join(', ') + '.');
    return;
  }

  // Verificar si ya existe
  const users = JSON.parse(localStorage.getItem('dm_users') || '[]');
  if (users.find(u => u.identifier === identifier)) {
    showAuthError('c-register-error', 'c-register-error-msg', 'Ya existe una cuenta con ese correo o celular. ¿Querés iniciar sesión?');
    return;
  }

  const profile = { firstname, lastname, dni, phone, location, address };
  users.push({ role: 'consumer', identifier, phone, password: btoa(password), profile });
  localStorage.setItem('dm_users', JSON.stringify(users));

  consumerProfile = profile;
  localStorage.setItem('dm_consumer_profile', JSON.stringify(profile));
  showWelcomeToast('¡Cuenta creada! Bienvenido/a, ' + firstname + ' 🎉');
  setTimeout(() => window.location.href = 'index.html', 900);
}

// =============================================
//   REGISTRO VENDEDOR
// =============================================

function updateBioCount(textarea) {
  document.getElementById('bio-count').textContent = textarea.value.length + ' / 160';
}

function previewAvatar(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      const circle = document.querySelector('#screen-register .avatar-circle');
      circle.style.backgroundImage = `url(${e.target.result})`;
      circle.style.backgroundSize = 'cover';
      circle.style.backgroundPosition = 'center';
      document.getElementById('avatar-icon').style.display = 'none';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function registerVendor() {
  const name       = document.getElementById('biz-name').value.trim();
  const dni        = document.getElementById('biz-dni').value.trim();
  const phone      = document.getElementById('biz-phone').value.trim();
  const category   = document.getElementById('biz-category').value;
  const location   = document.getElementById('biz-location').value.trim();
  const bio        = document.getElementById('biz-bio').value.trim();
  const address    = document.getElementById('biz-address').value.trim();
  const identifier = document.getElementById('biz-identifier').value.trim();
  const password   = document.getElementById('biz-password').value;
  hideAuthError('biz-register-error');

  if (!name || !dni || !phone || !category || !location || !identifier || !password) {
    showAuthError('biz-register-error', 'biz-register-error-msg', 'Completá todos los campos obligatorios (*).');
    return;
  }
  if (dni.length < 7 || dni.length > 8) {
    showAuthError('biz-register-error', 'biz-register-error-msg', 'El DNI debe tener 7 u 8 dígitos.');
    return;
  }
  const passErrors = validatePassword(password);
  if (passErrors.length > 0) {
    showAuthError('biz-register-error', 'biz-register-error-msg', 'La contraseña no cumple los requisitos: ' + passErrors.join(', ') + '.');
    return;
  }

  const users = JSON.parse(localStorage.getItem('dm_users') || '[]');
  if (users.find(u => u.identifier === identifier)) {
    showAuthError('biz-register-error', 'biz-register-error-msg', 'Ya existe una cuenta con ese correo o celular. ¿Querés iniciar sesión?');
    return;
  }

  const profile = { name, dni, phone, category, location, bio, address };
  users.push({ role: 'vendor', identifier, phone, password: btoa(password), profile });
  localStorage.setItem('dm_users', JSON.stringify(users));

  // Guardar en lista de pendientes para aprobación del admin
  const pending = JSON.parse(localStorage.getItem('dm_vendors_pending') || '[]');
  pending.push(profile);
  localStorage.setItem('dm_vendors_pending', JSON.stringify(pending));

  showWelcomeToast('¡Solicitud enviada! El administrador revisará tu cuenta 🕐');
  setTimeout(() => showScreen('login'), 2500);
}

// =============================================
//   TOAST DE BIENVENIDA
// =============================================

function showWelcomeToast(msg) {
  let toast = document.getElementById('dm-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dm-toast';
    toast.style.cssText = `
      position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);
      background:#1D9E75;color:#fff;padding:12px 20px;border-radius:12px;
      font-size:14px;font-weight:500;z-index:9999;opacity:0;
      transition:opacity 0.3s,transform 0.3s;max-width:90vw;text-align:center;
      display:flex;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="ti ti-circle-check" style="font-size:18px;flex-shrink:0"></i> ${msg}`;
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2800);
}

// =============================================
//   PANEL VENDEDOR
// =============================================

function loadVendorPanel() {
  if (!vendorProfile) return;
  document.getElementById('vendor-display-name').textContent = vendorProfile.name;
  document.getElementById('profile-biz-name').textContent = vendorProfile.name;
  document.getElementById('profile-bio').textContent = vendorProfile.bio || 'Sin descripción aún.';
  document.getElementById('profile-dni').textContent = vendorProfile.dni;
  document.getElementById('profile-phone').textContent = vendorProfile.phone;
  document.getElementById('profile-category').textContent = CATEGORY_LABELS[vendorProfile.category] || vendorProfile.category;
  document.getElementById('profile-location').textContent = vendorProfile.location;
  document.getElementById('profile-address').textContent = vendorProfile.address || '—';
  document.getElementById('stat-products').textContent = myProducts.length;
  renderMyProducts();
}

// =============================================
//   TABS DEL PANEL
// =============================================

function switchTab(tab, btn) {
  document.querySelectorAll('.vendor-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  ['dashboard', 'products', 'orders', 'profile'].forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
  if (tab === 'orders') renderVendorOrders();
}

// =============================================
//   PRODUCTOS
// =============================================

let editingProductIdx = null;

function openProductModal(editIdx = null) {
  editingProductIdx = editIdx;
  const modal = document.getElementById('product-modal');
  const title = modal.querySelector('.modal-title');

  if (editIdx !== null && myProducts[editIdx]) {
    const p = myProducts[editIdx];
    document.getElementById('p-name').value    = p.name;
    document.getElementById('p-category').value = p.icon;
    document.getElementById('p-price').value   = p.price;
    document.getElementById('p-time').value    = p.time !== '—' ? p.time : '';
    document.getElementById('p-desc').value    = p.desc || '';
    window._pendingProductImage = p.image || null;
    const preview = document.getElementById('p-img-preview');
    const imgIcon = document.getElementById('p-img-icon');
    if (p.image && preview) {
      preview.src = p.image; preview.style.display = 'block';
      if (imgIcon) imgIcon.style.display = 'none';
    } else {
      if (preview) { preview.src = ''; preview.style.display = 'none'; }
      if (imgIcon) imgIcon.style.display = 'flex';
    }
    if (title) title.textContent = 'Editar producto';
    const saveBtn = document.getElementById('p-save-btn');
    if (saveBtn) saveBtn.textContent = 'Guardar cambios';
  } else {
    ['p-name', 'p-price', 'p-time', 'p-desc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('p-category').value = '';
    window._pendingProductImage = null;
    const preview = document.getElementById('p-img-preview');
    const imgIcon = document.getElementById('p-img-icon');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    if (imgIcon) imgIcon.style.display = 'flex';
    if (title) title.textContent = 'Agregar producto';
    const saveBtn = document.getElementById('p-save-btn');
    if (saveBtn) saveBtn.textContent = 'Publicar producto';
  }
  modal.classList.add('open');
}

function openProductImagePicker() {
  document.getElementById('p-img-input').click();
}

function onProductImageSelected(input) {
  const file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { alert('Solo se aceptan imágenes.'); return; }
  if (file.size > 2 * 1024 * 1024) { alert('La imagen no puede superar 2 MB.'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    window._pendingProductImage = e.target.result;
    const preview = document.getElementById('p-img-preview');
    const imgIcon = document.getElementById('p-img-icon');
    if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
    if (imgIcon) imgIcon.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('product-modal')) closeProductModal();
}

function saveProduct() {
  const name  = document.getElementById('p-name').value.trim();
  const icon  = document.getElementById('p-category').value;
  const price = parseInt(document.getElementById('p-price').value);
  const time  = document.getElementById('p-time').value.trim() || '—';
  const desc  = document.getElementById('p-desc').value.trim();

  if (!name || !icon || !price) {
    alert('Completá nombre, categoría y precio');
    return;
  }

  const product = {
    id: editingProductIdx !== null ? myProducts[editingProductIdx].id : Date.now(),
    name, icon, price, time, desc,
    vendor: vendorProfile.name,
    categoryLabel: CATEGORY_ICONS[icon] || 'Otros',
    image: window._pendingProductImage || null,
  };

  if (editingProductIdx !== null) {
    myProducts[editingProductIdx] = product;
  } else {
    myProducts.push(product);
  }
  editingProductIdx = null;
  localStorage.setItem('dm_vendor_products', JSON.stringify(myProducts));
  document.getElementById('stat-products').textContent = myProducts.length;
  renderMyProducts();
  closeProductModal();
}

function renderMyProducts() {
  const list = document.getElementById('my-products-list');
  if (myProducts.length === 0) {
    list.innerHTML = `
      <div style="padding:32px 0;text-align:center;color:var(--color-text-tertiary);font-size:13px;">
        <i class="ti ti-package" style="font-size:36px;display:block;margin-bottom:10px;"></i>
        Aún no publicaste productos.
      </div>`;
    return;
  }
  list.innerHTML = myProducts.map((p, idx) => `
    <div class="my-product-item">
      <div class="my-product-img">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--border-radius-md)">`
          : `<i class="ti ${p.icon}" aria-hidden="true"></i>`}
      </div>
      <div class="my-product-info">
        <div class="my-product-name">${p.name}</div>
        <div class="my-product-price">$${p.price.toLocaleString('es-AR')} · ${p.categoryLabel}</div>
      </div>
      <div class="my-product-actions">
        <button class="icon-btn" onclick="openProductModal(${idx})" aria-label="Editar">
          <i class="ti ti-pencil" style="font-size:15px"></i>
        </button>
        <button class="icon-btn danger" onclick="deleteProduct(${idx})" aria-label="Eliminar">
          <i class="ti ti-trash" style="font-size:15px"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function deleteProduct(idx) {
  if (!confirm('¿Eliminar este producto?')) return;
  myProducts.splice(idx, 1);
  localStorage.setItem('dm_vendor_products', JSON.stringify(myProducts));
  document.getElementById('stat-products').textContent = myProducts.length;
  renderMyProducts();
}

// =============================================
//   PEDIDOS RECIBIDOS (vista vendedor)
// =============================================

const STATUS_LABELS_V = { pending: 'Pendiente', delivery: 'En camino', done: 'Entregado' };
const STATUS_NEXT = {
  pending:  { next: 'delivery', label: 'Marcar en camino', icon: 'ti-truck-delivery' },
  delivery: { next: 'done',     label: 'Marcar entregado', icon: 'ti-home-check'     },
  done:     null,
};

function renderVendorOrders() {
  const allOrders = JSON.parse(localStorage.getItem('dm_orders') || '[]');
  // Solo mostrar pedidos que contienen productos de este vendedor
  const myOrders = vendorProfile
    ? allOrders.filter(order =>
        order.items.some(i => i.vendor === vendorProfile.name)
      )
    : allOrders;

  const list = document.getElementById('vendor-orders-list');
  if (!list) return;

  if (myOrders.length === 0) {
    list.innerHTML = `
      <div style="padding:40px 0;text-align:center;color:var(--color-text-tertiary);font-size:13px;">
        <i class="ti ti-receipt" style="font-size:40px;display:block;margin-bottom:12px;"></i>
        Todavía no recibiste pedidos.
      </div>`;
    return;
  }

  list.innerHTML = myOrders.map((order, idx) => {
    // Índice real en allOrders para poder actualizar estado
    const realIdx = allOrders.findIndex(o => o.id === order.id);
    const next = STATUS_NEXT[order.status];
    // Solo mostrar items de este vendedor
    const myItems = order.items.filter(i => i.vendor === vendorProfile?.name);
    return `
      <div class="order-card" style="margin-bottom:12px">
        <div class="order-card-header">
          <div>
            <div class="order-card-id">${order.id}</div>
            <div class="order-card-date">${order.date}</div>
            <div style="font-size:12px;color:var(--color-text-secondary);margin-top:3px">
              <i class="ti ti-user" style="font-size:11px"></i> ${order.consumer}
              · <i class="ti ti-phone" style="font-size:11px"></i> ${order.phone}
            </div>
          </div>
          <span class="order-status-badge status-${order.status}">${STATUS_LABELS_V[order.status]}</span>
        </div>
        <div class="order-card-items" style="margin:10px 0">
          ${myItems.map(i => `
            <div class="order-card-item">
              <span><i class="ti ${i.icon}" style="font-size:11px"></i> ${i.name} x${i.qty}</span>
              <span>$${(i.price * i.qty).toLocaleString('es-AR')}</span>
            </div>
          `).join('')}
        </div>
        <div class="order-card-footer">
          <div>
            <div style="font-size:11px;color:var(--color-text-tertiary)">Entregar en</div>
            <div style="font-size:13px;color:var(--color-text-primary)">${order.address}</div>
          </div>
          <div class="order-card-total">$${myItems.reduce((s,i) => s + i.price*i.qty, 0).toLocaleString('es-AR')}</div>
        </div>
        ${next ? `
          <button onclick="advanceOrderStatus(${realIdx})" style="
            width:100%;margin-top:12px;padding:10px;background:#1D9E75;color:#fff;border:none;
            border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;
            display:flex;align-items:center;justify-content:center;gap:8px;">
            <i class="ti ${next.icon}" style="font-size:15px"></i> ${next.label}
          </button>` : `
          <div style="text-align:center;margin-top:12px;font-size:12px;color:#1D9E75;font-weight:500;">
            <i class="ti ti-circle-check" style="font-size:14px"></i> Pedido completado
          </div>`}
      </div>`;
  }).join('');
}

function doLogout() {
  if (!confirm('¿Cerrar sesión?')) return;
  localStorage.removeItem('dm_vendor_profile');
  localStorage.removeItem('dm_consumer_profile');
  sessionStorage.removeItem('dm_pending_role');
  sessionStorage.removeItem('dm_pending_action');
  vendorProfile = null;
  consumerProfile = null;
  myProducts = [];
  window.location.href = 'index.html';
}

function advanceOrderStatus(idx) {
  const allOrders = JSON.parse(localStorage.getItem('dm_orders') || '[]');
  const next = STATUS_NEXT[allOrders[idx].status];
  if (!next) return;
  allOrders[idx].status = next.next;
  localStorage.setItem('dm_orders', JSON.stringify(allOrders));
  renderVendorOrders();
}

// =============================================
//   INIT
// =============================================
(function init() {
  const savedVendor = localStorage.getItem('dm_vendor_profile');
  if (savedVendor) {
    vendorProfile = JSON.parse(savedVendor);
    myProducts = JSON.parse(localStorage.getItem('dm_vendor_products') || '[]');
  }
  const savedConsumer = localStorage.getItem('dm_consumer_profile');
  if (savedConsumer) consumerProfile = JSON.parse(savedConsumer);

  // Si viene del index con un rol pre-seleccionado, simularlo
  const pendingRole = sessionStorage.getItem('dm_pending_role');
  if (pendingRole) {
    const btn = document.querySelector(`.role-btn[data-role="${pendingRole}"]`);
    if (btn) selectRole(btn);
  }
  initDarkMode();
})();