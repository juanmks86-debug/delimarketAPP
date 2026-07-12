// =============================================
//   carousel.js — Lógica del carrusel
//   Responsabilidad: dimensiones, navegación,
//   dots, swipe táctil y resize responsivo.
// =============================================

const track = document.getElementById('track');
const arrowLeft = document.getElementById('arrowLeft');
const arrowRight = document.getElementById('arrowRight');
const dotsEl = document.getElementById('dots');
const container = track.parentElement;

let current = 0;
let cardWidth = 0;
let visible = 1;
let maxIndex = 0;

/**
 * Calcula dimensiones según el ancho disponible
 * y reconstruye los dots.
 */
function calcDimensions() {
  const totalCards = track.children.length;
  const containerW = container.offsetWidth;
  // Tope subido de 3 a 4: en pantallas de escritorio (.screen ahora
  // llega a 1100px) entran cómodamente 4 tarjetas por fila en vez
  // de solo 3, aprovechando mejor el ancho disponible.
  visible = Math.max(1, Math.min(4, Math.floor(containerW / 160)));
  const gap = 12;
  cardWidth = (containerW - gap * (visible - 1)) / visible;

  Array.from(track.children).forEach(card => {
    card.style.flex = `0 0 ${cardWidth}px`;
    card.style.maxWidth = `${cardWidth}px`;
  });

  maxIndex = Math.max(0, totalCards - visible);
  current = Math.min(current, maxIndex);

  // Reconstruir dots
  dotsEl.innerHTML = '';
  for (let i = 0; i <= maxIndex; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i === current ? ' active' : '');
    d.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(d);
  }

  goTo(current);
}

/**
 * Navega al índice indicado y actualiza UI.
 */
function goTo(idx) {
  current = Math.max(0, Math.min(idx, maxIndex));
  track.style.transform = `translateX(-${current * (cardWidth + 12)}px)`;
  arrowLeft.classList.toggle('disabled', current === 0);
  arrowRight.classList.toggle('disabled', current === maxIndex);
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
}

// Botones de flecha
arrowLeft.addEventListener('click', () => goTo(current - 1));
arrowRight.addEventListener('click', () => goTo(current + 1));

// Swipe táctil
let startX = 0;
track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
track.addEventListener('touchend', e => {
  const diff = startX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 40) goTo(current + (diff > 0 ? 1 : -1));
});

// Responsivo: recalcular al cambiar tamaño
const ro = new ResizeObserver(() => calcDimensions());
ro.observe(container);
calcDimensions();
