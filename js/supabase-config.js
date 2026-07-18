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

// =============================================
//   COMPRESIÓN DE IMÁGENES
//   Antes de subir fotos (producto, perfil, banner) a Storage:
//   muchos celulares sacan fotos de 4-8 MB, lo que hace lenta la
//   subida y ocupa espacio de más. Esto la redimensiona y la
//   re-comprime en el navegador antes de mandarla a Supabase.
// =============================================

/**
 * Redimensiona (si hace falta) y re-comprime una imagen en JPEG.
 * Devuelve una Promise<File>. Si algo falla, devuelve el archivo
 * original tal cual para no romper la subida.
 */
function compressImage(file, maxDimension = 1280, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
          } else {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return; }
          const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
          resolve(new File([blob], newName, { type: 'image/jpeg' }));
        }, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}