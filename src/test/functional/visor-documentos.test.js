// Funcionalidad 021 — Componente "Visor de documentos".
//
// Valida la conversión de Markdown a HTML (core/markdown.js, envoltorio de
// vendor/marked.js — un caso representativo de GFM, no exhaustivo), el
// saneado de HTML (core/sanitizeHtml.js: elimina <script>, manejadores de
// evento inline y `javascript:` en href/src, conservando el resto), los
// valores por defecto del modelo, y el render sobre la mesa en las ramas
// texto/markdown, texto/html y URL (iframe sandbox + aviso de error), así
// como la hoja en blanco sin aviso cuando no hay contenido.
//
// [gotcha] el runner no carga CSS: no se comprueba maquetación real
// (anchuras, scroll), mismo criterio acotado que otras baterías existentes
// (resource-image-modal.test.js, infinite-table.test.js).

import { describe, it, expect, beforeEach, afterEach, registerFeature } from '../harness.js';
import { resetState, mountPlayMode, mountEditMode } from '../helpers.js';
import { getComponents, addComponent } from '../../core/state.js';
import { createComponent } from '../../core/component.js';
import { createDefaultComponent } from '../../ui/componentModal.js';
import { markdownToHtml } from '../../core/markdown.js';
import { sanitizeHtml } from '../../core/sanitizeHtml.js';

registerFeature({ primary: 21 });

describe('021 — Visor de documentos', () => {
  beforeEach(resetState);

  afterEach(() => {
    document.querySelectorAll('.modal-overlay').forEach((o) => o.remove());
  });

  function addComp(id, propsExtra = {}, compExtra = {}) {
    const c = createDefaultComponent('documento');
    c.id = id;
    Object.assign(c.properties, propsExtra);
    Object.assign(c, compExtra);
    addComponent(c);
    return c;
  }

  it('FT-021-01 · markdownToHtml — caso representativo GFM (state)', () => {
    const html = markdownToHtml('# T\n\n**b** ~~s~~\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] hecho\n- [ ] pendiente');

    expect(html).toContain('<h1>');
    expect(html).toContain('<strong>b</strong>');
    expect(html.includes('<del>s</del>') || html.includes('<s>s</s>')).toBe(true);
    expect(html).toContain('<table>');

    const checkboxes = [...html.matchAll(/<input[^>]*type="checkbox"[^>]*>/g)].map((m) => m[0]);
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toContain('checked');
    expect(checkboxes[1].includes('checked')).toBe(false);
    expect(checkboxes.every((c) => c.includes('disabled'))).toBe(true);

    expect(markdownToHtml('').trim()).toBe('');
  });

  it('FT-021-02 · sanitizeHtml — elimina <script> (state)', () => {
    let result = sanitizeHtml('<p>ok</p><script>alert(1)</script>');
    expect(result).toContain('<p>ok</p>');
    expect(result.includes('<script')).toBe(false);

    result = sanitizeHtml('<div><script>x</script>text</div>');
    expect(result).toContain('text');
    expect(result.includes('<script')).toBe(false);
  });

  it('FT-021-03 · sanitizeHtml — elimina manejadores de evento inline (state)', () => {
    let result = sanitizeHtml('<a href="#" onclick="x()">l</a>');
    expect(result.includes('onclick')).toBe(false);
    expect(result).toContain('<a');
    expect(result).toContain('href="#"');

    result = sanitizeHtml('<img src="x" ONERROR="y">');
    expect(result.toLowerCase().includes('onerror')).toBe(false);

    result = sanitizeHtml('<div onmouseover="z">d</div>');
    expect(result.includes('onmouseover')).toBe(false);
  });

  it('FT-021-04 · sanitizeHtml — neutraliza javascript: en href/src (state)', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">l</a>')).toBe('<a>l</a>');
    expect(sanitizeHtml('<a href="  javascript:x">l</a>')).toBe('<a>l</a>');
    expect(sanitizeHtml('<img src="javascript:x">').includes('src=')).toBe(false);
    expect(sanitizeHtml('<a href="https://ok">l</a>')).toContain('href="https://ok"');
  });

  it('FT-021-05 · sanitizeHtml — conserva marcado y atributos legítimos (state)', () => {
    const html = '<p class="c" id="i"><b>x</b> <em>y</em></p>';
    const result = sanitizeHtml(html);
    expect(result).toContain('class="c"');
    expect(result).toContain('id="i"');
    expect(result).toContain('<b>x</b>');
    expect(result).toContain('<em>y</em>');
  });

  it('FT-021-06 · defaults del modelo (state)', () => {
    const c = createDefaultComponent('documento');
    expect(c.width).toBe(240);
    expect(c.height).toBe(320);
    expect(c.properties).toEqual({ tipoContenido: 'texto', contenido: '', formato: 'markdown', url: '' });

    const bare = createComponent({ type: 'documento' });
    expect(bare.width).toBeNull();
    expect(bare.height).toBeNull();
    expect(bare.properties).toEqual({});
  });

  it('FT-021-07 · render rama texto/markdown (ui)', () => {
    addComp('doc-md', { tipoContenido: 'texto', formato: 'markdown', contenido: '# Hola\n\n**mundo**' });

    let content = mountPlayMode();
    let viewerContent = content.querySelector('.document-viewer .document-viewer__content');
    expect(viewerContent.innerHTML).toContain('<h1>');
    expect(viewerContent.innerHTML).toContain('<strong>mundo</strong>');

    content = mountEditMode();
    viewerContent = content.querySelector('.document-viewer .document-viewer__content');
    expect(viewerContent.innerHTML).toContain('<h1>');
    expect(viewerContent.innerHTML).toContain('<strong>mundo</strong>');
  });

  it('FT-021-08 · render rama texto/html con sanitizado (ui)', () => {
    addComp('doc-html', {
      tipoContenido: 'texto',
      formato: 'html',
      contenido: '<p>hola</p><script>alert(1)</script><a href="javascript:x">l</a>',
    });

    const content = mountPlayMode();
    const viewerContent = content.querySelector('.document-viewer .document-viewer__content');
    expect(viewerContent.innerHTML).toContain('<p>hola</p>');
    expect(viewerContent.innerHTML.includes('<script')).toBe(false);
    expect(viewerContent.querySelector('a').hasAttribute('href')).toBe(false);
  });

  it('FT-021-09 · render rama URL: iframe sandbox + aviso de error (ui)', () => {
    addComp('doc-url', { tipoContenido: 'url', url: 'https://ejemplo.invalido/x' });

    const content = mountPlayMode();
    const viewer = content.querySelector('.document-viewer');
    const iframe = viewer.querySelector('iframe');
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin allow-popups');
    expect(iframe.src).toBe('https://ejemplo.invalido/x');

    const errorOverlay = viewer.querySelector('.document-viewer__error');
    expect(errorOverlay.textContent).toBeTruthy();
    expect(errorOverlay.style.display).toBe('none');

    iframe.dispatchEvent(new Event('error'));
    expect(errorOverlay.style.display).toBe('flex');
  });

  it('FT-021-10 · componente sin contenido = hoja en blanco sin aviso (ui)', () => {
    addComp('doc-empty', { tipoContenido: 'texto', contenido: '', formato: 'markdown' });

    const content = mountPlayMode();
    const viewer = content.querySelector('.document-viewer');
    const viewerContent = viewer.querySelector('.document-viewer__content');
    expect(viewerContent.innerHTML.trim()).toBe('');
    expect(viewer.querySelector('.document-viewer__error')).toBeNull();
  });

  it('FT-021-11 · conmutar tipoContenido no pierde la config de la otra opción (state)', () => {
    const c = addComp('doc-switch', {
      tipoContenido: 'texto', contenido: 'texto guardado', formato: 'html', url: 'https://guardada',
    });

    expect(c.properties.contenido).toBe('texto guardado');
    expect(c.properties.url).toBe('https://guardada');

    c.properties.tipoContenido = 'url';

    expect(c.properties.contenido).toBe('texto guardado');
    expect(c.properties.url).toBe('https://guardada');
  });
});
