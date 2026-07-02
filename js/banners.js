// =============================================
//   banners.js — Gestión de banners publicitarios
//   Admin sube hasta 3 banners → se muestran
//   en index.html con rotación automática.
//   Almacenamiento: localStorage (dm_banners)
// =============================================

const BANNERS_KEY = 'dm_banners';
const MAX_BANNERS = 3;

// =============================================
//   LECTURA / ESCRITURA
// =============================================

function getBanners() {
  return JSON.parse(localStorage.getItem(BANNERS_KEY) || '[]');
}

function saveBanners(banners) {
  localStorage.setItem(BANNERS_KEY, JSON.stringify(banners));
}

// =============================================
//   PANEL ADMIN — subir / eliminar banners
// =============================================

function initAdminBanners() {
  const tab = document.getElementById('tab-banners');
  if (!tab) return;
  renderAdminBanners();
}

function openBannerFilePicker() {
  const banners = getBanners();
  if (banners.length >= MAX_BANNERS) {
    alert('Ya tenés 3 banners activos. Eliminá uno antes de subir otro.');
    return;
  }
  document.getElementById('banner-file-input').click();
}

function onBannerFileSelected(input) {
  const file = input.files[0];
  if (!file) return;

  // Validar tipo
  if (!file.type.startsWith('image/')) {
    alert('Solo se aceptan imágenes (JPG, PNG, GIF, WebP).');
    input.value = '';
    return;
  }

  // Validar tamaño (máx 2 MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('La imagen no puede superar los 2 MB.');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const banners = getBanners();
    if (banners.length >= MAX_BANNERS) return;

    const titleInput = document.getElementById('banner-title-input');
    const title = titleInput ? titleInput.value.trim() : '';

    banners.push({
      id:    Date.now(),
      image: e.target.result,   // base64
      title: title || '',
      date:  new Date().toLocaleDateString('es-AR'),
    });
    saveBanners(banners);
    renderAdminBanners();
    input.value = '';
    if (titleInput) titleInput.value = '';
  };
  reader.readAsDataURL(file);
}

function deleteAdminBanner(id) {
  if (!confirm('¿Eliminar este banner?')) return;
  const banners = getBanners().filter(b => b.id !== id);
  saveBanners(banners);
  renderAdminBanners();
}

function renderAdminBanners() {
  const list    = document.getElementById('admin-banners-list');
  const counter = document.getElementById('banner-count-label');
  if (!list) return;

  const banners = getBanners();
  if (counter) counter.textContent = `${banners.length} de ${MAX_BANNERS} banners activos`;

  // Botón de subir: deshabilitado si ya hay 3
  const uploadBtn = document.getElementById('banner-upload-btn');
  if (uploadBtn) {
    uploadBtn.disabled = banners.length >= MAX_BANNERS;
    uploadBtn.style.opacity = banners.length >= MAX_BANNERS ? '0.45' : '1';
  }

  if (banners.length === 0) {
    list.innerHTML = `
      <div class="admin-empty">
        <i class="ti ti-photo-off"></i>
        <p>No hay banners publicados aún.</p>
      </div>`;
    return;
  }

  list.innerHTML = banners.map(b => `
    <div class="admin-banner-item">
      <div class="admin-banner-preview">
        <img src="${b.image}" alt="${b.title || 'Banner'}" />
      </div>
      <div class="admin-banner-info">
        <div class="admin-item-name">${b.title || 'Sin título'}</div>
        <div class="admin-item-detail">Subido el ${b.date}</div>
      </div>
      <button class="admin-delete-btn" onclick="deleteAdminBanner(${b.id})" aria-label="Eliminar banner">
        <i class="ti ti-trash" style="font-size:16px"></i>
      </button>
    </div>
  `).join('');
}

// =============================================
//   INDEX — mostrar banners con rotación
// =============================================

let bannerInterval = null;
let bannerIndex    = 0;

function initIndexBanners() {
  const section = document.getElementById('banners-section');
  if (!section) return;

  renderIndexBanners();
}

function renderIndexBanners() {
  const section = document.getElementById('banners-section');
  if (!section) return;

  const banners = getBanners();

  if (banners.length === 0) {
    section.style.display = 'none';
    clearInterval(bannerInterval);
    return;
  }

  section.style.display = 'block';
  bannerIndex = 0;

  const track  = document.getElementById('banner-track');
  const dots   = document.getElementById('banner-dots');

  // Renderizar slides
  track.innerHTML = banners.map((b, i) => `
    <div class="banner-slide ${i === 0 ? 'active' : ''}" style="background-image: url('${b.image}')">
      ${b.title ? `<div class="banner-caption">${b.title}</div>` : ''}
    </div>
  `).join('');

  // Renderizar dots
  dots.innerHTML = banners.map((_, i) => `
    <button class="banner-dot ${i === 0 ? 'active' : ''}" onclick="goToBanner(${i})" aria-label="Banner ${i+1}"></button>
  `).join('');

  // Ocultar dots si solo hay 1
  dots.style.display = banners.length > 1 ? 'flex' : 'none';

  // Rotación automática
  clearInterval(bannerInterval);
  if (banners.length > 1) {
    bannerInterval = setInterval(() => {
      goToBanner((bannerIndex + 1) % banners.length);
    }, 4000);
  }
}

function goToBanner(idx) {
  const slides = document.querySelectorAll('.banner-slide');
  const dots   = document.querySelectorAll('.banner-dot');

  slides.forEach((s, i) => s.classList.toggle('active', i === idx));
  dots.forEach((d, i)   => d.classList.toggle('active', i === idx));

  bannerIndex = idx;

  // Reiniciar timer al hacer clic manual
  clearInterval(bannerInterval);
  const banners = getBanners();
  if (banners.length > 1) {
    bannerInterval = setInterval(() => {
      goToBanner((bannerIndex + 1) % banners.length);
    }, 4000);
  }
}
