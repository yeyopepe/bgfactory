// Utilidades compartidas por los tests funcionales. Corre DENTRO del navegador
// headless. Importa de ../core/* y ../modes/* con rutas relativas (las sirve
// run.js sobre src/).
//
//   resetState()            deja el estado y el localStorage a cero
//   mountEditMode()         initI18n() + renderEditMode(#content); devuelve #content
//   mountPlayMode()         initI18n() + renderPlayMode(#content); devuelve #content
//   loadFixture(nombre)     carga src/test/fixtures/<nombre>.json por el mismo
//                           camino que "Importar"
//   mockRandom(secuencia)   Math.random determinista (ciclo sobre la secuencia)
//   captureDownload()       intercepta downloadJson / <a download>.click()
//   getLastDownload()       { filename, data } de la última descarga capturada
//   injectFileImport(obj)   aplica un JSON exportado sin pasar por los modales
//   restoreAllMocks()       restaura Math.random / URL.createObjectURL / a.click

import {
  MODES, setMode,
  loadComponents, loadResources, loadTags, loadGroups,
  loadPanelState, loadResourcePanelState, loadTagPanelState,
  loadAppTitle, loadTableText, loadResourcesSeeded,
} from '../core/state.js';
import { DEFAULT_APP_TITLE } from '../core/appTitle.js';
import { initI18n } from '../core/i18n.js';
import { parseImportedComponents } from '../core/persistence.js';
import { mergeImportedGame } from '../core/importMerge.js';
import { renderEditMode } from '../modes/edit/editMode.js';
import { renderPlayMode } from '../modes/play/playMode.js';
import { renderModeSwitcher, renderEditToolbar } from '../ui/editModeToggle.js';

export { MODES };

let i18nReady = false;
function ensureI18n() {
  if (!i18nReady) {
    initI18n();
    i18nReady = true;
  }
}

export function resetState() {
  loadComponents([]);
  loadResources([]);
  loadTags([]);
  loadGroups([]);
  loadPanelState({});
  loadResourcePanelState({});
  loadTagPanelState({});
  loadAppTitle(DEFAULT_APP_TITLE);
  loadTableText('');
  loadResourcesSeeded(false);
  try {
    localStorage.removeItem('bgfactory:state');
    localStorage.removeItem('bgfactory:lang');
  } catch { /* localStorage no disponible: nada que limpiar */ }
}

function contentEl() {
  return document.getElementById('content');
}

// Pinta la "cromática" que en producción monta main.js#renderAll: la franja de
// modo edición (#edit-toolbar) y el selector de modo (#mode-switcher). Se llama
// aparte de renderEditMode/renderPlayMode porque esos sólo pintan #content.
export function mountChrome() {
  ensureI18n();
  renderModeSwitcher(document.getElementById('mode-switcher'));
  renderEditToolbar(document.getElementById('edit-toolbar'));
}

export function mountEditMode() {
  ensureI18n();
  setMode(MODES.EDIT);
  mountChrome();
  renderEditMode(contentEl());
  return contentEl();
}

export function mountPlayMode() {
  ensureI18n();
  setMode(MODES.PLAY);
  mountChrome();
  renderPlayMode(contentEl());
  return contentEl();
}

export async function loadFixture(nombre) {
  const raw = await fetch(`./fixtures/${nombre}.json`).then((r) => {
    if (!r.ok) throw new Error(`No se pudo leer el fixture ${nombre} (HTTP ${r.status})`);
    return r.text();
  });
  const parsed = parseImportedComponents(raw);
  if (parsed.error) throw new Error(`Fixture ${nombre} no parseable: ${parsed.detail}`);
  const merged = mergeImportedGame({
    mode: 'overwrite',
    conflictMode: 'overwrite',
    existingComponents: [],
    existingResources: [],
    existingTags: [],
    selectedComponents: parsed.components,
    selectedResources: parsed.resources,
    selectedTags: parsed.tags,
    allImportedResources: parsed.resources,
    allImportedTags: parsed.tags,
  });
  loadComponents(merged.components);
  loadResources(merged.resources);
  loadTags(merged.tags);
  return merged;
}

// --- Mocks ---

const originals = {
  random: null,
  createObjectURL: null,
  anchorClick: null,
};
let downloads = []; // { filename, data }
let blobByUrl = new Map();

export function mockRandom(secuencia) {
  if (!Array.isArray(secuencia) || secuencia.length === 0) {
    throw new Error('mockRandom requiere un array no vacío');
  }
  if (originals.random === null) originals.random = Math.random;
  let i = 0;
  Math.random = () => secuencia[i++ % secuencia.length];
}

export function captureDownload() {
  downloads = [];
  blobByUrl = new Map();

  if (originals.createObjectURL === null) {
    originals.createObjectURL = URL.createObjectURL;
  }
  if (originals.anchorClick === null) {
    originals.anchorClick = HTMLAnchorElement.prototype.click;
  }

  URL.createObjectURL = (blob) => {
    const url = `blob:mock/${blobByUrl.size + 1}`;
    blobByUrl.set(url, blob);
    return url;
  };

  HTMLAnchorElement.prototype.click = function mockedClick() {
    if (this.download) {
      const blob = blobByUrl.get(this.href);
      if (blob) {
        // Blob.text() es async; para mantener el helper síncrono guardamos una
        // promesa resuelta con el objeto ya parseado.
        downloads.push({
          filename: this.download,
          _pending: blob.text().then((txt) => {
            try { return JSON.parse(txt); } catch { return txt; }
          }),
        });
      } else {
        downloads.push({ filename: this.download, _pending: Promise.resolve(null) });
      }
      return;
    }
    return originals.anchorClick.call(this);
  };
}

export async function getLastDownload() {
  const last = downloads[downloads.length - 1];
  if (!last) return null;
  const data = await last._pending;
  return { filename: last.filename, data };
}

export function injectFileImport(jsonObject, { mode = 'overwrite', conflictMode = 'overwrite' } = {}) {
  const components = Array.isArray(jsonObject.components) ? jsonObject.components : [];
  const resources = Array.isArray(jsonObject.resources) ? jsonObject.resources : [];
  const tags = Array.isArray(jsonObject.tags) ? jsonObject.tags : [];
  const merged = mergeImportedGame({
    mode,
    conflictMode,
    existingComponents: [],
    existingResources: [],
    existingTags: [],
    selectedComponents: components,
    selectedResources: resources,
    selectedTags: tags,
    allImportedResources: resources,
    allImportedTags: tags,
  });
  loadComponents(merged.components);
  loadResources(merged.resources);
  loadTags(merged.tags);
  return merged;
}

export function restoreAllMocks() {
  if (originals.random) { Math.random = originals.random; originals.random = null; }
  if (originals.createObjectURL) { URL.createObjectURL = originals.createObjectURL; originals.createObjectURL = null; }
  if (originals.anchorClick) { HTMLAnchorElement.prototype.click = originals.anchorClick; originals.anchorClick = null; }
}
