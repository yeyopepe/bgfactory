// Pantalla de bienvenida al arrancar: overlay a pantalla completa con un logo
// aleatorio, el nombre de la app y una barra de progreso que se llena en 5 s.
// Sin botones ni vía de cierre manual — se cierra sola a los SPLASH_DURATION_MS.
// Estructura DOM propia (no reutiliza .modal/.modal-overlay), mismo criterio que
// ui/progressModal.js. La barra se llena sola por @keyframes CSS
// (splash-progress-fill en main.css); este módulo solo la crea y programa el cierre.

const SPLASH_DURATION_MS = 3000; // debe coincidir con el @keyframes splash-progress-fill de .splash-window__progress-fill (main.css)
const LOGO_COUNT = 4;

export function showSplashScreen() {
  const overlay = document.createElement('div');
  overlay.className = 'splash-overlay';

  const windowEl = document.createElement('div');
  windowEl.className = 'splash-window';

  const logoArea = document.createElement('div');
  // Clase base + una de las 4 variantes de logo, elegida al azar en cada arranque.
  const logoIndex = Math.floor(Math.random() * LOGO_COUNT) + 1;
  logoArea.className = `splash-window__logo splash-window__logo--${logoIndex}`;
  windowEl.appendChild(logoArea);

  const title = document.createElement('p');
  title.className = 'splash-window__title';
  title.textContent = 'Board Game Factory';
  const sup = document.createElement('sup');
  sup.textContent = '(2026)';
  title.appendChild(sup);
  windowEl.appendChild(title);

  // Enlace externo al repo. Texto literal fijo (no i18n, a diferencia de
  // #app-version a). Mismo patrón createElement + props que main.js#renderAppVersion.
  const link = document.createElement('a');
  link.className = 'splash-window__link';
  link.href = 'https://github.com/yeyopepe/bgfactory';
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'View on Github';
  windowEl.appendChild(link);

  const progress = document.createElement('div');
  progress.className = 'splash-window__progress';
  const fill = document.createElement('div');
  fill.className = 'splash-window__progress-fill';
  progress.appendChild(fill);
  windowEl.appendChild(progress);

  overlay.appendChild(windowEl);
  document.body.appendChild(overlay);

  // La barra se llena sola por @keyframes CSS en cuanto el navegador la pinta;
  // no se arranca desde aquí (el arranque síncrono de main.js bloquea el hilo y
  // un rAF no garantizaría un frame intermedio con la barra vacía).

  // No se guarda referencia ni se cancela: el splash siempre completa sus 5 s.
  window.setTimeout(() => {
    overlay.remove();
  }, SPLASH_DURATION_MS);
}
