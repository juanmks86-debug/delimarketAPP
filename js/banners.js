// =============================================
//   banners.js — Gestión de banners publicitarios
//   Admin sube hasta 3 banners → se muestran
//   en index.html con rotación automática.
//   Almacenamiento: Supabase (tabla `banners` +
//   bucket de Storage `banners-imagenes`).
// =============================================

const MAX_BANNERS = 3;

// Cache en memoria de los banners activos, para no tener que
// esperar una consulta a Supabase en cada render.
let bannersCache = [];

// =============================================
//   LECTURA
// =============================================

async function refreshBanners() {
  try {
    const { data, error } = await supabaseClient
      .from('banners')
      .select('id, titulo, imagen_url, created_at')
      .eq('activo', true)
      .order('created_at', { ascending: true });
    if (error) throw error;

    bannersCache = (data || []).map(b => ({
      id: b.id,
      image: b.imagen_url,
      title: b.titulo || '',
      date: new Date(b.created_at).toLocaleDateString('es-AR'),
    }));
  } catch (e) {
    console.error('No se pudieron cargar los banners desde Supabase:', e);
    bannersCache = [];
  }
  return bannersCache;
}

// =============================================
//   PANEL ADMIN — subir / eliminar banners
// =============================================

async function initAdminBanners() {
  const tab = document.getElementById('tab-banners');
  if (!tab) return;
  await refreshBanners();
  renderAdminBanners();
}

function openBannerFilePicker() {
  if (bannersCache.length >= MAX_BANNERS) {
    alert('Ya tenés 3 banners activos. Eliminá uno antes de subir otro.');
    return;
  }
  document.getElementById('banner-file-input').click();
}

async function onBannerFileSelected(input) {
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

  if (bannersCache.length >= MAX_BANNERS) {
    alert('Ya tenés 3 banners activos. Eliminá uno antes de subir otro.');
    input.value = '';
    return;
  }

  const titleInput = document.getElementById('banner-title-input');
  const title = titleInput ? titleInput.value.trim() : '';

  const uploadBtn = document.getElementById('banner-upload-btn');
  if (uploadBtn) { uploadBtn.disabled = true; }

  try {
    file = await compressImage(file, 1600, 0.85);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from('banners-imagenes')
      .upload(path, file, { upsert: false, contentType: file.type });
    if (uploadError) throw uploadError;

    const { data: pub } = supabaseClient.storage.from('banners-imagenes').getPublicUrl(path);

    const { error: insertError } = await supabaseClient
      .from('banners')
      .insert({ titulo: title || null, imagen_url: pub.publicUrl, activo: true });
    if (insertError) throw insertError;

    await refreshBanners();
    renderAdminBanners();
    input.value = '';
    if (titleInput) titleInput.value = '';
  } catch (e) {
    console.error('No se pudo subir el banner a Supabase:', e);
    alert('No se pudo subir el banner. Intentá de nuevo.');
  } finally {
    if (uploadBtn) { uploadBtn.disabled = bannersCache.length >= MAX_BANNERS; }
  }
}

async function deleteAdminBanner(id) {
  if (!confirm('¿Eliminar este banner?')) return;

  const { error } = await supabaseClient.from('banners').delete().eq('id', id);
  if (error) {
    console.error('No se pudo eliminar el banner en Supabase:', error);
    alert('No se pudo eliminar el banner. Intentá de nuevo.');
    return;
  }

  await refreshBanners();
  renderAdminBanners();
}

function renderAdminBanners() {
  const list    = document.getElementById('admin-banners-list');
  const counter = document.getElementById('banner-count-label');
  if (!list) return;

  const banners = bannersCache;
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

async function initIndexBanners() {
  const section = document.getElementById('banners-section');
  if (!section) return;
  section.style.display = 'block';
  showSectionLoader('banner-track', 48);

  await refreshBanners();
  renderIndexBanners();
}

function renderIndexBanners() {
  const section = document.getElementById('banners-section');
  if (!section) return;

  const banners = bannersCache;

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
  const banners = bannersCache;
  if (banners.length > 1) {
    bannerInterval = setInterval(() => {
      goToBanner((bannerIndex + 1) % banners.length);
    }, 4000);
  }
}