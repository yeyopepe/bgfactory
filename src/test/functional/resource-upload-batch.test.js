// Funcionalidad 009 — Subida múltiple y por carpeta de recursos.
// Nivel ui: mountEditMode() + simulación de `.files`/evento `change` sobre los
// <input type=file> ocultos que crea modes/edit/editMode.js (la lógica de lote
// `loadResourceBatch` no está exportada, se ejercita vía UI real).

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountEditMode } from '../helpers.js';
import { getResources } from '../../core/state.js';
import { t } from '../../core/i18n.js';

registerFeature({ primary: 9 });

// Construye un `File` real y lo asigna a `input.files` vía DataTransfer (API
// real de Chromium, soportada en el navegador headless de Playwright) — no hay
// ningún helper previo en helpers.js para esto (a diferencia de
// captureDownload/injectFileImport, que no cubren subida de ficheros).
function setInputFiles(input, files) {
  const dt = new DataTransfer();
  for (const file of files) dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function makeFile(name, { relativePath = null, content = 'x', type = 'image/svg+xml' } = {}) {
  const file = new File([content], name, { type });
  if (relativePath) {
    Object.defineProperty(file, 'webkitRelativePath', { value: relativePath, configurable: true });
  }
  return file;
}

// Localiza los 3 <input type=file> ocultos por su configuración (single /
// multiple / multiple+webkitdirectory) — editMode.js no les da ningún
// atributo/id propio que los distinga de otro modo.
function getUploadInputs() {
  const inputs = [...document.querySelectorAll('input[type=file]')];
  return {
    single: inputs.find((i) => !i.multiple),
    multiple: inputs.find((i) => i.multiple && !i.webkitdirectory),
    folder: inputs.find((i) => i.multiple && i.webkitdirectory),
  };
}

async function flushAsync() {
  // loadResourceFromFile encadena FileReader + convertImageToWebP (ambos
  // asíncronos); varias vueltas de microtarea/macrotarea bastan para que el
  // batch entero (incluido Promise.all) se resuelva antes de aserar.
  for (let i = 0; i < 5; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 0));
  }
}

describe('009 — Subida múltiple y por carpeta de recursos', () => {
  beforeEach(resetState);
  afterEach(() => {
    document.querySelectorAll('.modal-overlay').forEach((n) => n.remove());
  });

  it('FT-009-01 · un único fichero inválido corta con un aviso de error sin añadir nada', async () => {
    mountEditMode();
    const { single } = getUploadInputs();

    setInputFiles(single, [makeFile('documento.pdf', { type: 'application/pdf' })]);
    await flushAsync();

    expect(document.querySelector('.modal__header--error')).toBeTruthy();
    expect(getResources()).toHaveLength(0);
  });

  it('FT-009-02 · un lote con válidos e inválidos añade solo los válidos y resume los omitidos por formato', async () => {
    mountEditMode();
    const { multiple } = getUploadInputs();

    setInputFiles(multiple, [
      makeFile('a.svg'),
      makeFile('b.gif', { type: 'image/gif' }),
      makeFile('c.pdf', { type: 'application/pdf' }),
    ]);
    await flushAsync();

    expect(getResources()).toHaveLength(2);
    expect(getResources().map((r) => r.name).sort()).toEqual(['a', 'b']);

    const summary = document.querySelector('.modal-overlay .modal');
    expect(summary).toBeTruthy();
    expect(summary.textContent).toContain('c.pdf');
  });

  it('FT-009-03 · una carpeta sin ningún fichero válido en su primer nivel avisa sin añadir nada', async () => {
    mountEditMode();
    const { folder } = getUploadInputs();

    setInputFiles(folder, [
      makeFile('doc.pdf', { relativePath: 'Carpeta/doc.pdf', type: 'application/pdf' }),
    ]);
    await flushAsync();

    expect(document.querySelector('.modal-overlay .modal__content')?.textContent).toContain(t('error.noValidResourceInFolder'));
    expect(getResources()).toHaveLength(0);
  });

  it('FT-009-04 · una carpeta añade los válidos de primer nivel y cuenta los de subcarpetas como omitidos', async () => {
    mountEditMode();
    const { folder } = getUploadInputs();

    setInputFiles(folder, [
      makeFile('top.svg', { relativePath: 'Carpeta/top.svg' }),
      makeFile('sub.svg', { relativePath: 'Carpeta/Sub/sub.svg' }),
    ]);
    await flushAsync();

    expect(getResources()).toHaveLength(1);
    expect(getResources()[0].name).toBe('top');

    const summary = document.querySelector('.modal-overlay .modal');
    expect(summary.textContent).toContain('1'); // recuento de omitidos por subcarpeta
  });

  it('FT-009-05 · un nombre duplicado (incluso entre dos ficheros del mismo lote) agrupa un único aviso de confirmación', async () => {
    mountEditMode();
    const { multiple } = getUploadInputs();

    setInputFiles(multiple, [
      makeFile('mapa.svg'),
      makeFile('mapa.gif', { type: 'image/gif' }), // mismo nombre base, dentro del propio lote
      makeFile('unico.svg'),
    ]);
    await flushAsync();

    // El sin conflicto ('unico') ya se ha añadido sin esperar confirmación.
    expect(getResources().some((r) => r.name === 'unico')).toBe(true);

    const confirmModal = [...document.querySelectorAll('.modal-overlay .modal')].find((m) => m.textContent.includes('mapa'));
    expect(confirmModal).toBeTruthy();

    confirmModal.querySelector('.btn-accept').click();
    await flushAsync();

    // Tras confirmar, uno de los dos "mapa" queda como reemplazo (mismo id, no duplica el recurso).
    expect(getResources().filter((r) => r.name === 'mapa')).toHaveLength(1);
  });
});
