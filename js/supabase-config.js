// Conexión a Supabase
// Este archivo se puede subir a GitHub sin problema: la "publishable key"
// está diseñada para usarse en el navegador (no es secreta).
// La "secret key" NUNCA debe ir acá ni en ningún archivo del frontend.

const SUPABASE_URL = 'https://btfsppxnfmgtdpagejhh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ohKv3Wv28a132cpJuN3A1A_B_1tBDjI'; // sb_publishable_...

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Etiquetas de las franjas horarias, compartidas entre index.html y vendedor.html
const FRANJA_LABELS = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena:     'Cena',
};

// =============================================
//   LOADER (animación Lottie mientras carga
//   contenido desde Supabase: productos,
//   proveedores, banners, etc.)
// =============================================

/**
 * Devuelve el HTML del loader Lottie para insertar dentro de
 * cualquier contenedor mientras se espera una consulta a Supabase.
 */
function sectionLoaderHTML(size = 56) {
  return `
    <div class="section-loader">
      <lottie-player
        src="https://assets3.lottiefiles.com/packages/lf20_UJNc2t.json"
        background="transparent" speed="1" loop autoplay
        style="width:${size}px;height:${size}px">
      </lottie-player>
    </div>`;
}

/**
 * Muestra el loader dentro del elemento indicado (por id).
 */
function showSectionLoader(elementId, size = 56) {
  const el = document.getElementById(elementId);
  if (el) el.innerHTML = sectionLoaderHTML(size);
}