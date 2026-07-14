// =============================================
//   temas.js — Temas estacionales (admin activa)
//              + Modo nocturno (vendedor/consumidor)
//   El tema activo vive en Supabase (tabla ajustes_sitio),
//   así todos los visitantes ven el mismo tema.
//   localStorage keys:
//     dm_dark_mode     → '1' | '0'  (preferencia de este navegador)
// =============================================

// =============================================
//   ESCAPE DE TEXTO (seguridad)
//   Se usa en main.js, vendedor.js y admin.js antes de
//   insertar cualquier texto ingresado por un usuario
//   (nombre de producto, de vendedor, etc.) dentro de
//   innerHTML, para que no se pueda inyectar HTML/JS.
//   Va acá porque temas.js es el único script que cargan
//   las 3 páginas (index, vendedor y admin).
// =============================================
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// =============================================
//   RESEÑAS / CALIFICACIÓN
//   Se guardan en localStorage (dm_reviews) como
//   { orderId, vendor, stars, comment, consumer, date }.
//   Ojo: al no haber backend, cada dispositivo tiene su
//   propia lista — un vendedor solo ve en su celular las
//   reseñas que se hayan guardado en ESE mismo navegador.
// =============================================
function getVendorReviews(vendorName) {
  const all = JSON.parse(localStorage.getItem('dm_reviews') || '[]');
  return all.filter(r => r.vendor === vendorName);
}

function getVendorRatingStats(vendorName) {
  const reviews = getVendorReviews(vendorName);
  if (reviews.length === 0) return { avg: null, count: 0 };
  const avg = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
  return { avg: Math.round(avg * 10) / 10, count: reviews.length };
}

// =============================================
//   DEFINICIÓN DE TEMAS
// =============================================

const TEMAS = {
  ninguno: {
    label: 'Sin tema',
    icon: 'ti-layout-grid',
    preview: '#f0f0f0',
    vars: {},
    particles: null,
  },
  navidad: {
    label: 'Navidad',
    icon: 'ti-christmas-tree',
    preview: 'linear-gradient(135deg,#1a5c2a,#c41e3a)',
    vars: {
      '--theme-primary':    '#c41e3a',
      '--theme-secondary':  '#1a5c2a',
      '--theme-accent':     '#f5c518',
      '--theme-hero-bg':    'linear-gradient(135deg,#1a5c2a 0%,#c41e3a 100%)',
      '--theme-hero-text':  '#ffffff',
      '--theme-navbar-bg':  '#1a5c2a',
      '--theme-navbar-text':'#ffffff',
    },
    particles: { type: 'snow', emoji: '❄️', count: 30 },
  },
  anonuevo: {
    label: 'Año Nuevo',
    icon: 'ti-confetti',
    preview: 'linear-gradient(135deg,#1a1a2e,#f5c518)',
    vars: {
      '--theme-primary':    '#f5c518',
      '--theme-secondary':  '#1a1a2e',
      '--theme-accent':     '#ff6b6b',
      '--theme-hero-bg':    'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
      '--theme-hero-text':  '#f5c518',
      '--theme-navbar-bg':  '#1a1a2e',
      '--theme-navbar-text':'#f5c518',
    },
    particles: { type: 'confetti', emoji: '🎆', count: 40 },
  },
  verano: {
    label: 'Verano',
    icon: 'ti-sun',
    preview: 'linear-gradient(135deg,#f7971e,#ffd200)',
    vars: {
      '--theme-primary':    '#f7971e',
      '--theme-secondary':  '#0099cc',
      '--theme-accent':     '#ffd200',
      '--theme-hero-bg':    'linear-gradient(135deg,#0099cc 0%,#f7971e 100%)',
      '--theme-hero-text':  '#ffffff',
      '--theme-navbar-bg':  '#0099cc',
      '--theme-navbar-text':'#ffffff',
    },
    particles: { type: 'float', emoji: '☀️', count: 15 },
  },
  carnaval: {
    label: 'Carnaval',
    icon: 'ti-masks-theater',
    preview: 'linear-gradient(135deg,#ff6b35,#f7c59f,#efefd0,#004e89)',
    vars: {
      '--theme-primary':    '#ff6b35',
      '--theme-secondary':  '#004e89',
      '--theme-accent':     '#f7c59f',
      '--theme-hero-bg':    'linear-gradient(135deg,#ff6b35 0%,#004e89 100%)',
      '--theme-hero-text':  '#ffffff',
      '--theme-navbar-bg':  '#ff6b35',
      '--theme-navbar-text':'#ffffff',
    },
    particles: { type: 'confetti', emoji: '🎭', count: 35 },
  },
  primavera: {
    label: 'Primavera',
    icon: 'ti-flower',
    preview: 'linear-gradient(135deg,#a8edea,#fed6e3)',
    vars: {
      '--theme-primary':    '#e91e8c',
      '--theme-secondary':  '#4caf50',
      '--theme-accent':     '#ffeb3b',
      '--theme-hero-bg':    'linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)',
      '--theme-hero-text':  '#333333',
      '--theme-navbar-bg':  '#e91e8c',
      '--theme-navbar-text':'#ffffff',
    },
    particles: { type: 'float', emoji: '🌸', count: 25 },
  },
  invierno: {
    label: 'Invierno',
    icon: 'ti-snowflake',
    preview: 'linear-gradient(135deg,#2c3e7a,#a8c0ff)',
    vars: {
      '--theme-primary':    '#2c3e7a',
      '--theme-secondary':  '#5b86e5',
      '--theme-accent':     '#a8c0ff',
      '--theme-hero-bg':    'linear-gradient(135deg,#2c3e7a 0%,#5b86e5 100%)',
      '--theme-hero-text':  '#ffffff',
      '--theme-navbar-bg':  '#2c3e7a',
      '--theme-navbar-text':'#ffffff',
    },
    particles: { type: 'snow', emoji: '❄️', count: 35 },
  },
  mundial: {
    label: 'Mundial',
    icon: 'ti-trophy',
    preview: 'linear-gradient(135deg,#1a3a1a,#f5c518)',
    vars: {
      '--theme-primary':    '#1a6b1a',
      '--theme-secondary':  '#f5c518',
      '--theme-accent':     '#ffffff',
      '--theme-hero-bg':    'linear-gradient(135deg,#1a3a1a 0%,#2d7a2d 100%)',
      '--theme-hero-text':  '#f5c518',
      '--theme-navbar-bg':  '#1a3a1a',
      '--theme-navbar-text':'#f5c518',
    },
    particles: { type: 'float', emoji: '⚽', count: 20 },
  },
  vacaciones: {
    label: 'Vacaciones de invierno',
    icon: 'ti-plane',
    preview: 'linear-gradient(135deg,#667eea,#764ba2)',
    vars: {
      '--theme-primary':    '#667eea',
      '--theme-secondary':  '#764ba2',
      '--theme-accent':     '#f093fb',
      '--theme-hero-bg':    'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
      '--theme-hero-text':  '#ffffff',
      '--theme-navbar-bg':  '#667eea',
      '--theme-navbar-text':'#ffffff',
    },
    particles: { type: 'snow', emoji: '🧊', count: 20 },
  },
};

// =============================================
//   APLICAR TEMA EN INDEX
// =============================================

function applyTema(temaId) {
  const tema = TEMAS[temaId] || TEMAS['ninguno'];
  const root = document.documentElement;

  // Limpiar variables anteriores
  Object.keys(TEMAS).forEach(id => {
    if (TEMAS[id].vars) {
      Object.keys(TEMAS[id].vars).forEach(v => root.style.removeProperty(v));
    }
  });

  // Aplicar nuevas variables
  if (tema.vars) {
    Object.entries(tema.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }

  // Clase en body para CSS adicional
  document.body.className = document.body.className
    .replace(/\btema-\S+/g, '').trim();
  if (temaId !== 'ninguno') {
    document.body.classList.add('tema-' + temaId);
  }

  // Partículas
  stopParticles();
  if (tema.particles) startParticles(tema.particles);
}

async function initIndexTema() {
  const { data, error } = await supabaseClient
    .from('ajustes_sitio')
    .select('tema_activo')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('No se pudo cargar el tema activo desde Supabase:', error);
    applyTema('ninguno');
    return;
  }

  applyTema(data?.tema_activo || 'ninguno');
}

// =============================================
//   PARTÍCULAS DECORATIVAS
// =============================================

let particleInterval = null;
const PARTICLE_CONTAINER_ID = 'dm-particles';

function startParticles(config) {
  let container = document.getElementById(PARTICLE_CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = PARTICLE_CONTAINER_ID;
    container.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      pointer-events:none;z-index:9999;overflow:hidden;
    `;
    document.body.appendChild(container);
  }
  container.innerHTML = '';

  for (let i = 0; i < config.count; i++) {
    setTimeout(() => createParticle(container, config), i * 200);
  }

  particleInterval = setInterval(() => {
    createParticle(container, config);
    // Limpiar partículas viejas
    const old = container.querySelectorAll('.dm-particle');
    if (old.length > config.count * 2) old[0].remove();
  }, 800);
}

function createParticle(container, config) {
  const p = document.createElement('span');
  p.className = 'dm-particle';
  p.textContent = config.emoji;

  const size  = 14 + Math.random() * 18;
  const left  = Math.random() * 100;
  const delay = Math.random() * 3;
  const dur   = config.type === 'snow'     ? 6 + Math.random() * 6
              : config.type === 'confetti' ? 4 + Math.random() * 4
              :                              8 + Math.random() * 6;

  p.style.cssText = `
    position:absolute;
    font-size:${size}px;
    left:${left}%;
    top:-40px;
    opacity:0.85;
    animation: dm-fall-${config.type} ${dur}s ${delay}s linear forwards;
    user-select:none;
  `;
  container.appendChild(p);
  setTimeout(() => p.remove(), (dur + delay + 1) * 1000);
}

function stopParticles() {
  clearInterval(particleInterval);
  const c = document.getElementById(PARTICLE_CONTAINER_ID);
  if (c) c.remove();
}

// Inyectar keyframes de partículas
(function injectParticleStyles() {
  if (document.getElementById('dm-particle-styles')) return;
  const style = document.createElement('style');
  style.id = 'dm-particle-styles';
  style.textContent = `
    @keyframes dm-fall-snow {
      0%   { transform: translateY(0) rotate(0deg);   opacity: 0.85; }
      100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
    }
    @keyframes dm-fall-confetti {
      0%   { transform: translateY(0) rotate(0deg) scale(1);    opacity: 1; }
      50%  { transform: translateY(50vh) rotate(180deg) scale(0.8); }
      100% { transform: translateY(110vh) rotate(360deg) scale(0.5); opacity: 0; }
    }
    @keyframes dm-fall-float {
      0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.85; }
      25%  { transform: translateY(25vh) translateX(20px) rotate(15deg); }
      50%  { transform: translateY(55vh) translateX(-10px) rotate(-10deg); }
      100% { transform: translateY(110vh) translateX(15px) rotate(20deg); opacity: 0; }
    }

    /* Tema Navidad */
    body.tema-navidad .navbar  { background: var(--theme-navbar-bg) !important; }
    body.tema-navidad .logo    { color: var(--theme-navbar-text) !important; }
    body.tema-navidad .hero    { background: var(--theme-hero-bg) !important; }
    body.tema-navidad .hero h2,
    body.tema-navidad .hero p  { color: var(--theme-hero-text) !important; }
    body.tema-navidad .hero-icon { color: var(--theme-accent) !important; }
    body.tema-navidad .cat-chip.active { background: var(--theme-primary) !important; color: #fff !important; }
    body.tema-navidad .checkout-btn,
    body.tema-navidad .add-to-cart-btn { background: var(--theme-primary) !important; }

    /* Tema Año Nuevo */
    body.tema-anonuevo .navbar  { background: var(--theme-navbar-bg) !important; }
    body.tema-anonuevo .logo    { color: var(--theme-navbar-text) !important; }
    body.tema-anonuevo .hero    { background: var(--theme-hero-bg) !important; }
    body.tema-anonuevo .hero h2,
    body.tema-anonuevo .hero p  { color: var(--theme-hero-text) !important; }
    body.tema-anonuevo .cat-chip.active { background: var(--theme-primary) !important; }
    body.tema-anonuevo .checkout-btn,
    body.tema-anonuevo .add-to-cart-btn { background: var(--theme-primary) !important; }

    /* Tema Verano */
    body.tema-verano .navbar  { background: var(--theme-navbar-bg) !important; }
    body.tema-verano .logo    { color: var(--theme-navbar-text) !important; }
    body.tema-verano .hero    { background: var(--theme-hero-bg) !important; }
    body.tema-verano .hero h2,
    body.tema-verano .hero p  { color: var(--theme-hero-text) !important; }
    body.tema-verano .cat-chip.active { background: var(--theme-primary) !important; color: #fff !important; }
    body.tema-verano .checkout-btn,
    body.tema-verano .add-to-cart-btn { background: var(--theme-primary) !important; }

    /* Tema Carnaval */
    body.tema-carnaval .navbar  { background: var(--theme-navbar-bg) !important; }
    body.tema-carnaval .logo    { color: var(--theme-navbar-text) !important; }
    body.tema-carnaval .hero    { background: var(--theme-hero-bg) !important; }
    body.tema-carnaval .hero h2,
    body.tema-carnaval .hero p  { color: var(--theme-hero-text) !important; }
    body.tema-carnaval .cat-chip.active { background: var(--theme-primary) !important; color: #fff !important; }
    body.tema-carnaval .checkout-btn,
    body.tema-carnaval .add-to-cart-btn { background: var(--theme-primary) !important; }

    /* Tema Primavera */
    body.tema-primavera .navbar  { background: var(--theme-navbar-bg) !important; }
    body.tema-primavera .logo    { color: var(--theme-navbar-text) !important; }
    body.tema-primavera .hero    { background: var(--theme-hero-bg) !important; }
    body.tema-primavera .cat-chip.active { background: var(--theme-primary) !important; color: #fff !important; }
    body.tema-primavera .checkout-btn,
    body.tema-primavera .add-to-cart-btn { background: var(--theme-primary) !important; }

    /* Tema Invierno */
    body.tema-invierno .navbar  { background: var(--theme-navbar-bg) !important; }
    body.tema-invierno .logo    { color: var(--theme-navbar-text) !important; }
    body.tema-invierno .hero    { background: var(--theme-hero-bg) !important; }
    body.tema-invierno .hero h2,
    body.tema-invierno .hero p  { color: var(--theme-hero-text) !important; }
    body.tema-invierno .cat-chip.active { background: var(--theme-primary) !important; color: #fff !important; }
    body.tema-invierno .checkout-btn,
    body.tema-invierno .add-to-cart-btn { background: var(--theme-primary) !important; }

    /* Tema Mundial */
    body.tema-mundial .navbar  { background: var(--theme-navbar-bg) !important; }
    body.tema-mundial .logo    { color: var(--theme-navbar-text) !important; }
    body.tema-mundial .hero    { background: var(--theme-hero-bg) !important; }
    body.tema-mundial .hero h2,
    body.tema-mundial .hero p  { color: var(--theme-hero-text) !important; }
    body.tema-mundial .cat-chip.active { background: var(--theme-primary) !important; color: #fff !important; }
    body.tema-mundial .checkout-btn,
    body.tema-mundial .add-to-cart-btn { background: var(--theme-primary) !important; }

    /* Tema Vacaciones */
    body.tema-vacaciones .navbar  { background: var(--theme-navbar-bg) !important; }
    body.tema-vacaciones .logo    { color: var(--theme-navbar-text) !important; }
    body.tema-vacaciones .hero    { background: var(--theme-hero-bg) !important; }
    body.tema-vacaciones .hero h2,
    body.tema-vacaciones .hero p  { color: var(--theme-hero-text) !important; }
    body.tema-vacaciones .cat-chip.active { background: var(--theme-primary) !important; color: #fff !important; }
    body.tema-vacaciones .checkout-btn,
    body.tema-vacaciones .add-to-cart-btn { background: var(--theme-primary) !important; }

    /* Contraste de los botones del navbar (Ingresar / Modo nocturno)
       cuando hay un tema decorativo activo. Antes se quedaban con su
       gris clarito de siempre, pensado para fondo blanco, y casi no
       se veían sobre el navbar oscuro/de color del tema. */
    body[class*="tema-"]:not(.tema-ninguno) .navbar .nav-btn,
    body[class*="tema-"]:not(.tema-ninguno) .navbar .dark-mode-toggle {
      color: var(--theme-navbar-text, #fff) !important;
      border-color: rgba(255,255,255,0.45) !important;
    }
    body[class*="tema-"]:not(.tema-ninguno) .navbar .nav-btn:hover,
    body[class*="tema-"]:not(.tema-ninguno) .navbar .dark-mode-toggle:hover {
      background: rgba(255,255,255,0.15) !important;
    }
    body[class*="tema-"]:not(.tema-ninguno) .navbar .nav-btn.primary {
      border-color: transparent !important;
    }

    /* MODO NOCTURNO */
    body.dark-mode {
      --color-background-primary:   #1a1a1a !important;
      --color-background-secondary: #242424 !important;
      --color-text-primary:         #f0f0f0 !important;
      --color-text-secondary:       #aaaaaa !important;
      --color-text-tertiary:        #666666 !important;
      --color-border-tertiary:      #333333 !important;
      --color-border-secondary:     #444444 !important;
    }
    body.dark-mode .navbar,
    body.dark-mode .vendor-navbar,
    body.dark-mode .admin-main { background: #1a1a1a !important; }
    body.dark-mode .product-card,
    body.dark-mode .my-product-item,
    body.dark-mode .stat-card,
    body.dark-mode .order-item { background: #242424 !important; border-color: #333 !important; }
    body.dark-mode .search-bar { background: #242424 !important; border-color: #333 !important; }
    body.dark-mode input, body.dark-mode textarea {
      background: #2a2a2a !important; color: #f0f0f0 !important; border-color: #444 !important;
    }
    body.dark-mode .modal-sheet { background: #1e1e1e !important; }
    body.dark-mode .vendor-tab { color: #aaa !important; }
    body.dark-mode .vendor-tab.active { color: #5DCAA5 !important; border-bottom-color: #5DCAA5 !important; }

    /* Botón toggle dark mode */
    .dark-mode-toggle {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; border-radius: 999px;
      border: 0.5px solid var(--color-border-secondary);
      background: transparent; cursor: pointer;
      font-size: 13px; color: var(--color-text-secondary);
      font-family: var(--font-sans); transition: background 0.2s;
    }
    .dark-mode-toggle:hover { background: var(--color-background-secondary); }
    .dark-mode-toggle i { font-size: 16px; }
  `;
  document.head.appendChild(style);
})();

// =============================================
//   MODO NOCTURNO
// =============================================

function initDarkMode() {
  const saved = localStorage.getItem('dm_dark_mode');
  if (saved === '1') {
    document.body.classList.add('dark-mode');
  }
  updateDarkToggleUI();
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('dm_dark_mode', isDark ? '1' : '0');
  updateDarkToggleUI();
}

function updateDarkToggleUI() {
  const isDark = document.body.classList.contains('dark-mode');
  document.querySelectorAll('.dark-mode-toggle').forEach(btn => {
    // Solo ícono (sol/luna) — el patrón es reconocible sin texto y
    // ahorra espacio en el navbar. El title queda para accesibilidad
    // y para quien pase el mouse por encima.
    btn.innerHTML = isDark ? '<i class="ti ti-sun"></i>' : '<i class="ti ti-moon"></i>';
    btn.title = isDark ? 'Modo claro' : 'Modo nocturno';
  });
}

// =============================================
//   ADMIN: PANEL DE TEMAS
// =============================================

async function initAdminTemas() {
  const container = document.getElementById('admin-temas-grid');
  if (!container) return;

  const { data, error } = await supabaseClient
    .from('ajustes_sitio')
    .select('tema_activo')
    .eq('id', 1)
    .single();
  if (error) console.error('No se pudo cargar el tema activo desde Supabase:', error);

  const current = data?.tema_activo || 'ninguno';

  container.innerHTML = Object.entries(TEMAS).map(([id, t]) => `
    <div class="admin-tema-card ${current === id ? 'active' : ''}" onclick="setTema('${id}', this)">
      <div class="admin-tema-preview" style="background:${t.preview}">
        <i class="ti ${t.icon}" style="font-size:28px;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.4)"></i>
        ${t.particles ? `<span class="admin-tema-particle">${t.particles.emoji}</span>` : ''}
      </div>
      <div class="admin-tema-label">${t.label}</div>
      ${current === id ? '<div class="admin-tema-active-badge"><i class="ti ti-check"></i> Activo</div>' : ''}
    </div>
  `).join('');
}

async function setTema(id, el) {
  const { error } = await supabaseClient
    .from('ajustes_sitio')
    .update({ tema_activo: id, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) {
    console.error('No se pudo guardar el tema activo en Supabase:', error);
    showAdminToast('❌ No se pudo activar el tema. Intentá de nuevo.');
    return;
  }

  // Actualizar UI
  document.querySelectorAll('.admin-tema-card').forEach(c => {
    c.classList.remove('active');
    c.querySelector('.admin-tema-active-badge')?.remove();
  });
  el.classList.add('active');
  const badge = document.createElement('div');
  badge.className = 'admin-tema-active-badge';
  badge.innerHTML = '<i class="ti ti-check"></i> Activo';
  el.appendChild(badge);

  showAdminToast(`Tema "${TEMAS[id]?.label}" activado`);
}

function showAdminToast(msg) {
  let t = document.getElementById('admin-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'admin-toast';
    t.style.cssText = `
      position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
      background:#1D9E75;color:#fff;padding:10px 20px;border-radius:999px;
      font-size:13px;font-weight:500;z-index:9999;opacity:0;transition:opacity 0.3s;
      pointer-events:none;
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => t.style.opacity = '0', 2500);
}