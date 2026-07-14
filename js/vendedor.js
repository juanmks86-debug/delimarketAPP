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
  pizzas:      'Pizzería',
  empanadas:   'Casa de empanadas',
  hamburguesas:'Hamburguesería',
  milanesas:   'Rotisería y comida casera',
  bebidas:     'Bebidas y kiosco',
  postres:     'Heladería y postres',
  otros:       'Otros productos',
};

const CATEGORY_ICONS = {
  'ti-pizza':          'Pizzas',
  'ti-bread':          'Empanadas',
  'ti-burger':         'Hamburguesas',
  'ti-meat':           'Milanesas y comida casera',
  'ti-bottle':         'Bebidas',
  'ti-ice-cream':      'Postres',
  'ti-tools-kitchen-2':'Otros',
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

// Antes las contraseñas se guardaban con btoa(), que NO es cifrado
// (cualquiera las puede decodificar al instante). Ahora usamos
// SHA-256 + salt aleatoria, con la API nativa del navegador (Web Crypto).
function generateSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
  const enc  = new TextEncoder();
  const data = enc.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

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

async function doLogin() {
  const identifier = document.getElementById('login-identifier').value.trim();
  const password   = document.getElementById('login-password').value;
  hideAuthError('login-error');

  if (!identifier || !password) {
    showAuthError('login-error', 'login-error-msg', 'Completá correo/celular y contraseña.');
    return;
  }

  const role = sessionStorage.getItem('dm_pending_role') || 'consumer';

  if (role === 'consumer') {
    const { data, error } = await supabaseClient.rpc('login_cliente', {
      p_identifier: identifier,
      p_password: password,
    });

    if (error) {
      showAuthError('login-error', 'login-error-msg', 'Error de conexión. Intentá de nuevo.');
      return;
    }
    if (!data.success) {
      const mensajes = {
        no_existe: 'No encontramos una cuenta con ese correo o celular. ¿Querés registrarte?',
        password_incorrecta: 'Contraseña incorrecta. Intentá de nuevo.',
      };
      showAuthError('login-error', 'login-error-msg', mensajes[data.error] || 'No se pudo iniciar sesión.');
      return;
    }

    consumerProfile = { ...data.perfil, identifier: data.perfil.email };
    localStorage.setItem('dm_consumer_profile', JSON.stringify(consumerProfile));
    showWelcomeToast('¡Bienvenido/a de nuevo, ' + consumerProfile.firstname + '!');
    setTimeout(() => window.location.href = 'index.html', 900);

  } else if (role === 'vendor') {
    const { data, error } = await supabaseClient.rpc('login_vendedor', {
      p_identifier: identifier,
      p_password: password,
    });

    if (error) {
      showAuthError('login-error', 'login-error-msg', 'Error de conexión. Intentá de nuevo.');
      return;
    }
    if (!data.success) {
      const mensajes = {
        no_existe: 'No encontramos una cuenta de vendedor con ese correo o celular.',
        password_incorrecta: 'Contraseña incorrecta. Intentá de nuevo.',
        pendiente: '⏳ Tu cuenta está pendiente de aprobación por el administrador.',
        rechazado: 'Tu cuenta fue rechazada por el administrador.',
      };
      showAuthError('login-error', 'login-error-msg', mensajes[data.error] || 'No se pudo iniciar sesión.');
      return;
    }

    // perfil.id es el uuid real en Supabase; identifier queda como el email/celular
    vendorProfile = { ...data.perfil, identifier: data.perfil.email };
    myProducts = JSON.parse(localStorage.getItem('dm_vendor_products_' + vendorProfile.id) || '[]');
    localStorage.setItem('dm_vendor_profile', JSON.stringify(vendorProfile));
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

async function registerConsumer() {
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

  // Verificar si ya existe / crear la cuenta en Supabase
  const { data, error } = await supabaseClient.rpc('registrar_cliente', {
    p_nombre: firstname,
    p_apellido: lastname,
    p_dni: dni,
    p_email: identifier,
    p_telefono: phone,
    p_ubicacion: location,
    p_direccion: address,
    p_password: password,
  });

  if (error) {
    showAuthError('c-register-error', 'c-register-error-msg', 'Error de conexión. Intentá de nuevo.');
    return;
  }
  if (!data.success) {
    showAuthError('c-register-error', 'c-register-error-msg', 'Ya existe una cuenta con ese correo o celular. ¿Querés iniciar sesión?');
    return;
  }

  // perfil.id es el uuid real en Supabase; identifier queda como el email/celular
  consumerProfile = { ...data.perfil, identifier: data.perfil.email };
  localStorage.setItem('dm_consumer_profile', JSON.stringify(consumerProfile));
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

async function registerVendor() {
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

  const { data, error } = await supabaseClient.rpc('registrar_vendedor', {
    p_nombre_negocio: name,
    p_nombre_contacto: null,
    p_dni: dni,
    p_email: identifier,
    p_telefono: phone,
    p_categoria: category,
    p_ubicacion: location,
    p_bio: bio,
    p_direccion: address,
    p_password: password,
  });

  if (error) {
    showAuthError('biz-register-error', 'biz-register-error-msg', 'Error de conexión. Intentá de nuevo.');
    return;
  }
  if (!data.success) {
    showAuthError('biz-register-error', 'biz-register-error-msg', 'Ya existe una cuenta con ese correo o celular. ¿Querés iniciar sesión?');
    return;
  }

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

/**
 * Trae desde Supabase (tabla `productos`) los productos publicados por
 * este vendedor y los deja en `myProducts` con el mismo shape que antes
 * tenían los objetos guardados en localStorage.
 */
async function loadMyProducts() {
  if (!vendorProfile) return;
  try {
    const { data, error } = await supabaseClient
      .from('productos')
      .select('id, nombre, descripcion, precio, tiempo_preparacion, imagen_url, categoria')
      .eq('vendedor_id', vendorProfile.id)
      .eq('activo', true)
      .order('created_at', { ascending: false });
    if (error) throw error;

    myProducts = (data || []).map(p => ({
      id: p.id,
      name: p.nombre,
      icon: p.categoria,
      price: p.precio,
      time: p.tiempo_preparacion || '—',
      desc: p.descripcion || '',
      image: p.imagen_url || null,
      vendor: vendorProfile.name,
      vendorIdentifier: vendorProfile.id,
      categoryLabel: CATEGORY_ICONS[p.categoria] || 'Otros',
    }));
  } catch (e) {
    console.error('No se pudieron cargar tus productos desde Supabase:', e);
    myProducts = [];
  }
}

async function loadVendorPanel() {
  if (!vendorProfile) return;
  document.getElementById('vendor-display-name').textContent = vendorProfile.name;
  document.getElementById('profile-biz-name').textContent = vendorProfile.name;
  document.getElementById('profile-bio').textContent = vendorProfile.bio || 'Sin descripción aún.';
  document.getElementById('profile-dni').textContent = vendorProfile.dni;
  document.getElementById('profile-phone').textContent = vendorProfile.phone;
  document.getElementById('profile-category').textContent = CATEGORY_LABELS[vendorProfile.category] || vendorProfile.category;
  document.getElementById('profile-location').textContent = vendorProfile.location;
  document.getElementById('profile-address').textContent = vendorProfile.address || '—';

  await loadMyProducts();
  document.getElementById('stat-products').textContent = myProducts.length;

  const ratingStats = getVendorRatingStats(vendorProfile.name);
  document.getElementById('stat-rating-value').textContent =
    ratingStats.avg !== null ? ratingStats.avg.toFixed(1) + ' ★' : '—';
  document.getElementById('stat-rating-sub').textContent =
    ratingStats.count > 0
      ? ratingStats.count + (ratingStats.count === 1 ? ' reseña' : ' reseñas')
      : 'Sin reseñas aún';

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
    window._pendingProductImageFile = null;
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
    window._pendingProductImageFile = null;
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
  window._pendingProductImageFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('p-img-preview');
    const imgIcon = document.getElementById('p-img-icon');
    if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
    if (imgIcon) imgIcon.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

/**
 * Sube la imagen del producto al bucket "productos-imagenes" de Supabase Storage
 * y devuelve la URL pública para guardar en la columna imagen_url.
 */
async function uploadProductImage(file, vendorId) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${vendorId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabaseClient
    .storage
    .from('productos-imagenes')
    .upload(path, file, { upsert: false, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data } = supabaseClient.storage.from('productos-imagenes').getPublicUrl(path);
  return data.publicUrl;
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('product-modal')) closeProductModal();
}

async function saveProduct() {
  const name  = document.getElementById('p-name').value.trim();
  const icon  = document.getElementById('p-category').value;
  const price = parseInt(document.getElementById('p-price').value);
  const time  = document.getElementById('p-time').value.trim() || '—';
  const desc  = document.getElementById('p-desc').value.trim();

  if (!name || !icon || !price) {
    alert('Completá nombre, categoría y precio');
    return;
  }

  const saveBtn = document.getElementById('p-save-btn');
  const originalBtnText = saveBtn ? saveBtn.textContent : '';
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando...'; }

  try {
    // Si el vendedor eligió una foto nueva, subirla a Storage.
    // Si no, conservar la que ya tenía el producto (o null si es nuevo).
    let imageUrl = editingProductIdx !== null ? (myProducts[editingProductIdx].image || null) : null;
    if (window._pendingProductImageFile) {
      imageUrl = await uploadProductImage(window._pendingProductImageFile, vendorProfile.id);
    }

    const row = {
      nombre: name,
      categoria: icon,
      precio: price,
      tiempo_preparacion: time,
      descripcion: desc,
      imagen_url: imageUrl,
    };

    if (editingProductIdx !== null) {
      const id = myProducts[editingProductIdx].id;
      const { error } = await supabaseClient.from('productos').update(row).eq('id', id);
      if (error) throw error;

      myProducts[editingProductIdx] = {
        ...myProducts[editingProductIdx],
        name, icon, price, time, desc, image: imageUrl,
        categoryLabel: CATEGORY_ICONS[icon] || 'Otros',
      };
    } else {
      const { data, error } = await supabaseClient
        .from('productos')
        .insert({ ...row, vendedor_id: vendorProfile.id, activo: true })
        .select()
        .single();
      if (error) throw error;

      myProducts.push({
        id: data.id, name, icon, price, time, desc,
        vendor: vendorProfile.name,
        vendorIdentifier: vendorProfile.id,
        categoryLabel: CATEGORY_ICONS[icon] || 'Otros',
        image: imageUrl,
      });
    }

    editingProductIdx = null;
    window._pendingProductImageFile = null;
    document.getElementById('stat-products').textContent = myProducts.length;
    renderMyProducts();
    closeProductModal();
  } catch (e) {
    console.error('No se pudo guardar el producto en Supabase:', e);
    alert('No se pudo guardar el producto. Intentá de nuevo.');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = originalBtnText; }
  }
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
          ? `<img src="${p.image}" alt="${escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--border-radius-md)">`
          : `<i class="ti ${p.icon}" aria-hidden="true"></i>`}
      </div>
      <div class="my-product-info">
        <div class="my-product-name">${escapeHtml(p.name)}</div>
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

async function deleteProduct(idx) {
  if (!confirm('¿Eliminar este producto?')) return;
  const product = myProducts[idx];
  if (!product) return;

  const { error } = await supabaseClient.from('productos').delete().eq('id', product.id);
  if (error) {
    console.error('No se pudo eliminar el producto en Supabase:', error);
    alert('No se pudo eliminar el producto. Intentá de nuevo.');
    return;
  }

  myProducts.splice(idx, 1);
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

async function renderVendorOrders() {
  const list = document.getElementById('vendor-orders-list');
  if (!list || !vendorProfile) return;

  const { data, error } = await supabaseClient
    .from('pedidos')
    .select('id, consumidor_nombre, telefono, direccion, items, estado, created_at')
    .contains('vendedor_ids', [vendorProfile.id])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('No se pudieron cargar tus pedidos desde Supabase:', error);
    list.innerHTML = `
      <div style="padding:40px 0;text-align:center;color:var(--color-text-tertiary);font-size:13px;">
        No se pudieron cargar los pedidos. Intentá de nuevo.
      </div>`;
    return;
  }

  const myOrders = (data || []).map(o => ({
    id: o.id,
    date: new Date(o.created_at).toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    consumer: o.consumidor_nombre,
    phone: o.telefono,
    address: o.direccion,
    items: o.items,
    status: o.estado,
  }));

  if (myOrders.length === 0) {
    list.innerHTML = `
      <div style="padding:40px 0;text-align:center;color:var(--color-text-tertiary);font-size:13px;">
        <i class="ti ti-receipt" style="font-size:40px;display:block;margin-bottom:12px;"></i>
        Todavía no recibiste pedidos.
      </div>`;
    return;
  }

  list.innerHTML = myOrders.map(order => {
    const next = STATUS_NEXT[order.status];
    // Solo mostrar items de este vendedor (el pedido puede incluir otros)
    const myItems = order.items.filter(i => i.vendedor_id === vendorProfile.id);
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
              <span><i class="ti ${i.icon}" style="font-size:11px"></i> ${escapeHtml(i.name)} x${i.qty}</span>
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
          <button onclick="advanceOrderStatus('${order.id}')" style="
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
  if (vendorProfile) {
    localStorage.removeItem('dm_vendor_profile');
    vendorProfile = null;
    myProducts = [];
  }
  if (consumerProfile) {
    localStorage.removeItem('dm_consumer_profile');
    consumerProfile = null;
  }
  sessionStorage.removeItem('dm_pending_role');
  sessionStorage.removeItem('dm_pending_action');
  window.location.href = 'index.html';
}

async function advanceOrderStatus(id) {
  // Necesitamos el estado actual del pedido para saber cuál es el siguiente
  const { data: order, error: fetchError } = await supabaseClient
    .from('pedidos').select('estado').eq('id', id).single();
  if (fetchError || !order) return;

  const nextStep = STATUS_NEXT[order.estado];
  if (!nextStep) return;

  const { error } = await supabaseClient
    .from('pedidos').update({ estado: nextStep.next }).eq('id', id);
  if (error) {
    console.error('No se pudo actualizar el estado del pedido:', error);
    return;
  }

  renderVendorOrders();
}

// =============================================
//   INIT
// =============================================
(function init() {
  const savedVendor = localStorage.getItem('dm_vendor_profile');
  if (savedVendor) {
    vendorProfile = JSON.parse(savedVendor);
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