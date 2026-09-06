// Funcionalidad 032 — Exportar/importar componentes en JSON, con selección.
// Nivel estado: exporta con buildComponentsExport/downloadJson (descarga
// interceptada) y reimporta; la fusión se prueba con mergeImportedGame directo.

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, captureDownload, getLastDownload, injectFileImport, restoreAllMocks } from '../helpers.js';
import { getComponents, addComponent, getResources, getTags, getGroups, getAppTitle } from '../../core/state.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { createComponent } from '../../core/component.js';
import { buildComponentsExport, parseImportedComponents } from '../../core/persistence.js';
import { mergeImportedGame } from '../../core/importMerge.js';
import { downloadJson } from '../../core/fileExport.js';
import { CURRENT_VERSION } from '../../data/version.js';

registerFeature({ primary: 32 });

// Atajo para invocar mergeImportedGame con listas vacías por defecto.
function merge({ mode, conflictMode = 'overwrite', existingComponents = [], existingResources = [], existingTags = [], selectedComponents = [], selectedResources = [], selectedTags = [], allImportedResources = [], allImportedTags = [] }) {
  return mergeImportedGame({
    mode, conflictMode,
    existingComponents, existingResources, existingTags,
    selectedComponents, selectedResources, selectedTags,
    allImportedResources, allImportedTags,
  });
}

const comp = (id, extra = {}) => ({ ...createComponent({ type: 'texto' }), id, ...extra });

describe('032 — Exportar/importar componentes en JSON', () => {
  beforeEach(resetState);
  afterEach(restoreAllMocks);

  it('FT-032-01 · exportar produce el formato esperado y reimportar reproduce el componente', async () => {
    captureDownload();

    addComponent(createDefaultComponent('carta'));
    const data = buildComponentsExport(getComponents(), getResources(), getTags(), getGroups(), getAppTitle());
    downloadJson('juego.json', data);

    const dl = await getLastDownload();
    expect(dl).toBeTruthy();
    expect(dl.filename).toBe('juego.json');
    expect(dl.data.version).toBe(CURRENT_VERSION);
    expect(dl.data.components).toHaveLength(1);

    resetState();
    expect(getComponents()).toHaveLength(0);

    injectFileImport(dl.data);
    expect(getComponents()).toHaveLength(1);
    expect(getComponents()[0].type).toBe('carta');
  });

  it('FT-032-02 · el fichero exportado incluye version y appTitle y solo lo que se le pasa', () => {
    const data = buildComponentsExport([comp('c1')], [], [], [], 'Mi juego');
    expect(data.version).toBe(CURRENT_VERSION);
    expect(data.appTitle).toBe('Mi juego');
    expect(data.components).toHaveLength(1);
  });

  it('FT-032-03 · parseImportedComponents acepta un fichero de otra versión', () => {
    const raw = JSON.stringify({ version: 999999, components: [comp('c1')] });
    const parsed = parseImportedComponents(raw);
    expect(parsed.error).toBeFalsy();
    expect(parsed.components).toHaveLength(1);
  });

  it('FT-032-04 · parseImportedComponents marca error en un fichero no válido', () => {
    expect(parseImportedComponents('').error).toBe(true);
    const roto = parseImportedComponents('{ roto');
    expect(roto.error).toBe(true);
    expect(typeof roto.detail).toBe('string');
    expect(parseImportedComponents('{"foo":1}').error).toBe(true);
  });

  it('FT-032-05 · modo overwrite parte de listas vacías y deja solo lo importado', () => {
    const { components } = merge({
      mode: 'overwrite',
      existingComponents: [comp('ex1')],
      selectedComponents: [comp('imp1')],
    });
    expect(components.map((c) => c.id)).toEqual(['imp1']);
  });

  it('FT-032-06 · modo add con id nuevo suma el importado al existente', () => {
    const { components } = merge({
      mode: 'add',
      existingComponents: [comp('ex1')],
      selectedComponents: [comp('imp1')],
    });
    expect(components.map((c) => c.id).sort()).toEqual(['ex1', 'imp1']);
  });

  it('FT-032-07 · modo add + id duplicado + overwrite reemplaza el existente', () => {
    const { components } = merge({
      mode: 'add', conflictMode: 'overwrite',
      existingComponents: [comp('dup', { name: 'viejo' })],
      selectedComponents: [comp('dup', { name: 'nuevo' })],
    });
    expect(components).toHaveLength(1);
    expect(components[0].name).toBe('nuevo');
  });

  it('FT-032-08 · modo add + id duplicado + keepBoth renombra el importado con -imported(n)', () => {
    const r1 = merge({
      mode: 'add', conflictMode: 'keepBoth',
      existingComponents: [comp('dup')],
      selectedComponents: [comp('dup')],
    });
    expect(r1.components.map((c) => c.id).sort()).toEqual(['dup', 'dup-imported']);

    // Si '-imported' también choca, pasa a '-imported(2)'.
    const r2 = merge({
      mode: 'add', conflictMode: 'keepBoth',
      existingComponents: [comp('dup'), comp('dup-imported')],
      selectedComponents: [comp('dup')],
    });
    expect(r2.components.map((c) => c.id).sort()).toEqual(['dup', 'dup-imported', 'dup-imported(2)']);
  });

  it('FT-032-09 · una etiqueta ausente referenciada por un componente importado se autocrea', () => {
    const { tags, report } = merge({
      mode: 'add',
      selectedComponents: [comp('c1', { etiquetaIds: ['tag-x'] })],
      allImportedTags: [{ id: 'tag-x', name: 'Facción' }],
    });
    expect(tags.some((t) => t.id === 'tag-x')).toBe(true);
    expect(report.some((r) => r.tipoError === 'etiqueta')).toBe(true);

    // Si ya existe una etiqueta con ese nombre, se reutiliza en vez de crear otra.
    const r2 = merge({
      mode: 'add',
      existingTags: [{ id: 'tag-existente', name: 'Facción' }],
      selectedComponents: [comp('c1', { etiquetaIds: ['tag-x'] })],
      allImportedTags: [{ id: 'tag-x', name: 'Facción' }],
    });
    expect(r2.tags.some((t) => t.id === 'tag-x')).toBe(false);
    expect(r2.tags.map((t) => t.id)).toEqual(['tag-existente']);
    expect(r2.report.some((r) => r.tipoError === 'etiquetaDuplicada')).toBe(true);
  });

  it('FT-032-10 · un recurso ausente referenciado se descarta y genera una fila de informe', () => {
    const importado = comp('c1', { properties: { imagenResourceId: 'res-x' } });
    const { components, report } = merge({
      mode: 'add',
      selectedComponents: [importado],
    });
    const c1 = components.find((c) => c.id === 'c1');
    expect(c1).toBeTruthy();
    expect(c1.properties.imagenResourceId).toBeNull();
    expect(report.some((r) => r.tipoError === 'recurso')).toBe(true);
  });

  it('FT-032-11 · round-trip por descarga con un tipo de properties no trivial (mazo)', async () => {
    captureDownload();
    addComponent(createDefaultComponent('mazo'));
    downloadJson('j.json', buildComponentsExport(getComponents(), [], [], [], 'x'));

    const dl = await getLastDownload();
    expect(dl.data.components).toHaveLength(1);

    resetState();
    injectFileImport(dl.data);
    expect(getComponents()).toHaveLength(1);
    expect(getComponents()[0].type).toBe('mazo');
    expect(Array.isArray(getComponents()[0].properties.cartaIds)).toBe(true);
  });
});
