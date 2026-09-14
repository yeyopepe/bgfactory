// Funcionalidad 041 — Pantalla de bienvenida al arrancar la aplicación.
// Nivel ui: ui/splashScreen.js#showSplashScreen() directamente sobre
// document.body, sin necesidad de main.js/boot.

import { describe, it, expect, afterEach, registerFeature } from '../harness.js';
import { mockRandom, restoreAllMocks } from '../helpers.js';
import { showSplashScreen } from '../../ui/splashScreen.js';

registerFeature({ primary: 41 });

const SPLASH_DURATION_MS = 3000; // debe coincidir con ui/splashScreen.js

describe('041 — Pantalla de bienvenida', () => {
  afterEach(() => {
    restoreAllMocks();
    document.querySelectorAll('.splash-overlay').forEach((n) => n.remove());
  });

  it('FT-041-01 · estructura DOM: logo, nombre con año en superíndice, enlace y barra de progreso', () => {
    showSplashScreen();

    const overlay = document.querySelector('.splash-overlay');
    expect(overlay).toBeTruthy();

    const windowEl = overlay.querySelector('.splash-window');
    expect(windowEl).toBeTruthy();
    expect(windowEl.querySelector('[class*="splash-window__logo--"]')).toBeTruthy();

    const title = windowEl.querySelector('.splash-window__title');
    expect(title.textContent).toContain('Board Game Factory');
    expect(title.querySelector('sup').textContent).toBe('(2026)');

    const link = windowEl.querySelector('.splash-window__link');
    expect(link.textContent).toBe('View on Github');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');

    expect(windowEl.querySelector('.splash-window__progress .splash-window__progress-fill')).toBeTruthy();
  });

  it('FT-041-02 · el logo se elige al azar entre 4 variantes', () => {
    const seen = new Set();
    // Math.random() = (n-1)/4 selecciona logoIndex = n, para n en 1..4.
    for (const value of [0, 0.25, 0.5, 0.75]) {
      mockRandom([value]);
      showSplashScreen();
      const logoEl = document.querySelector('.splash-overlay:last-of-type .splash-window__logo');
      const variantClass = [...logoEl.classList].find((c) => c.startsWith('splash-window__logo--'));
      seen.add(variantClass);
      document.querySelectorAll('.splash-overlay').forEach((n) => n.remove());
    }
    expect(seen.size).toBe(4);
  });

  it('FT-041-03 · el enlace abre en pestaña nueva sin cerrar la pantalla de bienvenida', () => {
    showSplashScreen();
    const link = document.querySelector('.splash-window__link');

    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    // El link no tiene ningún handler propio que quite el overlay: sigue en el DOM.
    expect(document.querySelector('.splash-overlay')).toBeTruthy();
  });

  it('FT-041-04 · la pantalla desaparece sola una vez transcurrido su tiempo fijo', async () => {
    showSplashScreen();
    expect(document.querySelector('.splash-overlay')).toBeTruthy();

    await new Promise((resolve) => setTimeout(resolve, SPLASH_DURATION_MS + 200));

    expect(document.querySelector('.splash-overlay')).toBeNull();
  });
});
