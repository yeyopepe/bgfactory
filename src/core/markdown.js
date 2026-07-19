// Conversor ligero de Markdown a HTML, pensado para notas de juego. Cubre la
// sintaxis básica de https://www.markdownguide.org/basic-syntax/ (encabezados,
// énfasis, citas anidadas, listas anidadas con contenido enriquecido, código
// en línea/bloques indentados, reglas horizontales, enlaces/auto-enlaces/
// referencias, imágenes y escapado de caracteres) — no CommonMark/GFM completo
// (sin tablas, código con vallas, listas de tareas...). Ver plan.md 00037 (a)
// para el alcance exacto y sus limitaciones conocidas.
// Usado por el componente "Visor de documentos" (ui/componentRenderer.js).

const ESCAPABLE_CHARS = '\\`*_{}[]()#+-.!|<>';

// Marcadores internos (zona de uso privado Unicode, improbable en texto de
// usuario) para "proteger" fragmentos ya resueltos de que un paso posterior
// del parser los reinterprete como sintaxis. Se generan con fromCharCode en
// vez de escribirse como literal para no depender de que el carácter en sí
// sobreviva intacto en el fichero fuente.
const ESCAPE_OPEN = String.fromCharCode(0xe000);
const ESCAPE_CLOSE = String.fromCharCode(0xe001);
const STASH_OPEN = String.fromCharCode(0xe002);
const STASH_CLOSE = String.fromCharCode(0xe003);
const HARD_BREAK_MARK = String.fromCharCode(0xe004);

const ESCAPE_RE = new RegExp(`${ESCAPE_OPEN}(\\d+)${ESCAPE_CLOSE}`, 'g');
const STASH_RE = new RegExp(`${STASH_OPEN}(\\d+)${STASH_CLOSE}`, 'g');
const HARD_BREAK_RE = new RegExp(HARD_BREAK_MARK, 'g');

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const HR_RE = /^([-*_])(?:[ \t]*\1){2,}$/;
const QUOTE_RE = /^ {0,3}>[ ]?(.*)$/;
const UNORDERED_RE = /^ {0,3}[-*+][ \t]+(.*)$/;
const ORDERED_RE = /^ {0,3}\d{1,9}\.[ \t]+(.*)$/;
const REF_DEF_RE = /^ {0,3}\[([^\]]+)\]:\s*(?:<([^>]*)>|(\S+))(?:\s+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?\s*$/;

// Indentación mínima para considerar una línea como contenido anidado dentro
// de un ítem de lista (2 espacios, o 1 tab ya expandido a 4).
const MIN_LIST_CONTINUATION_INDENT = 2;

// Marcador de lista de tareas al principio de un ítem de lista sin ordenar.
const TASK_MARKER_RE = /^\[( |x|X)\]\s+(.*)$/;

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function expandTabs(line) {
  return line.replace(/\t/g, '    ');
}

function leadingSpaces(line) {
  return line.match(/^ */)[0].length;
}

// Sustituye "\X" (X escapable) por un marcador interno, para que ningún otro
// paso del parser lo interprete como sintaxis. Se restaura al final con
// restoreEscapes, ya como el carácter literal (escapado a HTML si procede).
function protectEscapes(text, escapes) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length && ESCAPABLE_CHARS.includes(text[i + 1])) {
      escapes.push(text[i + 1]);
      out += `${ESCAPE_OPEN}${escapes.length - 1}${ESCAPE_CLOSE}`;
      i++;
    } else {
      out += ch;
    }
  }
  return out;
}

function restoreEscapes(html, escapes) {
  return html.replace(ESCAPE_RE, (_, idx) => escapeHtml(escapes[Number(idx)]));
}

// Extrae las definiciones de referencia ("[id]: url \"título\"") del flujo de
// líneas: no generan ningún bloque visible, solo alimentan el mapa que usan
// los enlaces/imágenes "por referencia" en parseInline.
function extractReferences(lines) {
  const refs = new Map();
  const remaining = [];
  for (const line of lines) {
    const match = line.match(REF_DEF_RE);
    if (match) {
      const id = match[1].trim().toLowerCase();
      const url = match[2] || match[3] || '';
      const title = match[4] || match[5] || match[6] || '';
      refs.set(id, { url: escapeHtml(url), title: escapeHtml(title) });
    } else {
      remaining.push(line);
    }
  }
  return { refs, lines: remaining };
}

// Aplica formato en línea (código, imágenes, enlaces, énfasis) a un fragmento
// de texto ya escapado a HTML. Cada regla "protege" su resultado con un
// marcador interno para que las reglas siguientes no lo reprocesen.
function parseInline(rawText, refs) {
  const stash = [];
  const save = (html) => {
    stash.push(html);
    return `${STASH_OPEN}${stash.length - 1}${STASH_CLOSE}`;
  };

  let out = escapeHtml(rawText);

  out = out.replace(/`([^`]+)`/g, (_, code) => save(`<code>${code}</code>`));

  out = out.replace(/!\[([^\]]*)\]\[([^\]]*)\]/g, (full, alt, id) => {
    const ref = refs.get((id || alt).trim().toLowerCase());
    if (!ref) return full;
    const title = ref.title ? ` title="${ref.title}"` : '';
    return save(`<img src="${ref.url}" alt="${alt}"${title}>`);
  });
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt, url, title) => {
    const titleAttr = title ? ` title="${title}"` : '';
    return save(`<img src="${url}" alt="${alt}"${titleAttr}>`);
  });

  out = out.replace(/&lt;((?:https?|ftp):\/\/[^\s&]+|[^\s@&<>]+@[^\s@&<>]+\.[^\s@&<>]+)&gt;/g, (_, target) => {
    const isEmail = target.includes('@') && !/^[a-z]+:\/\//i.test(target);
    return save(`<a href="${isEmail ? `mailto:${target}` : target}">${target}</a>`);
  });

  out = out.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, (full, label, id) => {
    const ref = refs.get((id || label).trim().toLowerCase());
    if (!ref) return full;
    const title = ref.title ? ` title="${ref.title}"` : '';
    return save(`<a href="${ref.url}"${title}>${label}</a>`);
  });
  out = out.replace(/\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, label, url, title) => {
    const titleAttr = title ? ` title="${title}"` : '';
    return save(`<a href="${url}"${titleAttr}>${label}</a>`);
  });

  out = out.replace(/\*\*_([^_]+?)_\*\*/g, '<strong><em>$1</em></strong>');
  out = out.replace(/__\*([^*]+?)\*__/g, '<strong><em>$1</em></strong>');
  out = out.replace(/(\*\*\*|___)([^*_]+?)\1/g, '<strong><em>$2</em></strong>');
  out = out.replace(/(\*\*|__)([^*_]+?)\1/g, '<strong>$2</strong>');
  out = out.replace(/(\*|_)([^*_]+?)\1/g, '<em>$2</em>');

  // Varias pasadas: un resultado guardado (p.ej. un enlace) puede contener a
  // su vez el marcador de otro resultado guardado (p.ej. una imagen dentro de
  // un enlace-imagen), así que una sola sustitución no basta para resolverlos
  // todos.
  let previous;
  do {
    previous = out;
    out = out.replace(STASH_RE, (_, idx) => stash[Number(idx)]);
  } while (out !== previous);

  return out;
}

// Combina las líneas de un párrafo aplicando la semántica estándar de salto
// de línea: una línea que termina en 2+ espacios fuerza un <br>; cualquier
// otro fin de línea se une con un único espacio.
function buildParagraph(lines, refs) {
  let combined = lines[0].trim();
  for (let i = 1; i < lines.length; i++) {
    const previousHadHardBreak = /  +$/.test(lines[i - 1]);
    combined += (previousHadHardBreak ? HARD_BREAK_MARK : ' ') + lines[i].trim();
  }
  return parseInline(combined, refs).replace(HARD_BREAK_RE, '<br>');
}

function isBlockStart(line) {
  const expanded = expandTabs(line);
  return (
    HR_RE.test(expanded.trim()) ||
    HEADING_RE.test(expanded) ||
    QUOTE_RE.test(expanded) ||
    UNORDERED_RE.test(expanded) ||
    ORDERED_RE.test(expanded) ||
    leadingSpaces(expanded) >= 4
  );
}

function parseBlockquote(lines, startIndex, refs) {
  let i = startIndex;
  const inner = [];
  while (i < lines.length) {
    const match = lines[i].match(QUOTE_RE);
    if (match) {
      inner.push(match[1]);
      i++;
      continue;
    }
    if (lines[i].trim() === '') {
      if (i + 1 < lines.length && QUOTE_RE.test(lines[i + 1])) {
        inner.push('');
        i++;
        continue;
      }
      break;
    }
    if (i > startIndex && QUOTE_RE.test(lines[i - 1])) {
      inner.push(lines[i]);
      i++;
      continue;
    }
    break;
  }
  return { html: `<blockquote>${parseBlocks(inner, refs)}</blockquote>`, nextIndex: i };
}

function parseCodeBlock(lines, startIndex) {
  let i = startIndex;
  const codeLines = [];
  while (i < lines.length) {
    const expanded = expandTabs(lines[i]);
    if (expanded.trim() === '') {
      codeLines.push('');
      i++;
      continue;
    }
    if (leadingSpaces(expanded) >= 4) {
      codeLines.push(escapeHtml(expanded.slice(4)));
      i++;
      continue;
    }
    break;
  }
  while (codeLines.length && codeLines[codeLines.length - 1] === '') codeLines.pop();
  return { html: `<pre><code>${codeLines.join('\n')}</code></pre>`, nextIndex: i };
}

function parseList(lines, startIndex, ordered, refs) {
  const markerRe = ordered ? ORDERED_RE : UNORDERED_RE;
  const items = [];
  let hasTaskItem = false;
  let i = startIndex;
  while (i < lines.length) {
    const line = expandTabs(lines[i]);
    const match = line.match(markerRe);
    if (!match) break;

    // Lista de tareas ("- [ ] texto" / "- [x] texto"): solo en listas sin
    // ordenar. El marcador se retira de la primera línea del ítem antes de
    // analizarla, para que no aparezca como texto literal.
    let taskChecked = null;
    let firstLine = match[1];
    if (!ordered) {
      const taskMatch = firstLine.match(TASK_MARKER_RE);
      if (taskMatch) {
        taskChecked = taskMatch[1].toLowerCase() === 'x';
        firstLine = taskMatch[2];
        hasTaskItem = true;
      }
    }

    const itemLines = [firstLine];
    i++;
    // Unidad de indentación de ESTE ítem: la de su primera línea de contenido
    // indentada (mínimo 2 espacios; 1 tab ya se expande a 4). Así "2 espacios"
    // y "1 tab" funcionan igual de bien como indentación para anidar, sin
    // exigir un valor fijo que no coincide con cómo se escribe a mano.
    let itemIndentUnit = null;
    while (i < lines.length) {
      const raw = expandTabs(lines[i]);
      if (raw.trim() === '') {
        const nextIndent = i + 1 < lines.length ? leadingSpaces(expandTabs(lines[i + 1])) : 0;
        if (nextIndent >= (itemIndentUnit || MIN_LIST_CONTINUATION_INDENT)) {
          itemLines.push('');
          i++;
          continue;
        }
        break;
      }
      const indent = leadingSpaces(raw);
      if (indent >= (itemIndentUnit || MIN_LIST_CONTINUATION_INDENT)) {
        if (itemIndentUnit === null) itemIndentUnit = indent;
        itemLines.push(raw.slice(itemIndentUnit));
        i++;
        continue;
      }
      if (isBlockStart(raw)) break;
      itemLines.push(raw.trim());
      i++;
    }

    const blockHtml = parseBlocks(itemLines, refs);
    const soleParagraph = blockHtml.match(/^<p>([\s\S]*)<\/p>$/);
    const itemContent = soleParagraph ? soleParagraph[1] : blockHtml;
    if (taskChecked === null) {
      items.push(`<li>${itemContent}</li>`);
    } else {
      const checkedAttr = taskChecked ? ' checked' : '';
      items.push(`<li class="task-list-item"><input type="checkbox" disabled${checkedAttr}> ${itemContent}</li>`);
    }
  }
  const tag = ordered ? 'ol' : 'ul';
  const listClass = !ordered && hasTaskItem ? ' class="task-list"' : '';
  return { html: `<${tag}${listClass}>${items.join('')}</${tag}>`, nextIndex: i };
}

function parseBlocks(lines, refs) {
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const raw = expandTabs(lines[i]);
    if (raw.trim() === '') {
      i++;
      continue;
    }

    if (HR_RE.test(raw.trim())) {
      blocks.push('<hr>');
      i++;
      continue;
    }

    const heading = raw.match(HEADING_RE);
    if (heading) {
      const level = heading[1].length;
      blocks.push(`<h${level}>${parseInline(heading[2], refs)}</h${level}>`);
      i++;
      continue;
    }

    if (QUOTE_RE.test(raw)) {
      const result = parseBlockquote(lines, i, refs);
      blocks.push(result.html);
      i = result.nextIndex;
      continue;
    }

    if (UNORDERED_RE.test(raw) || ORDERED_RE.test(raw)) {
      const result = parseList(lines, i, ORDERED_RE.test(raw), refs);
      blocks.push(result.html);
      i = result.nextIndex;
      continue;
    }

    if (leadingSpaces(raw) >= 4) {
      const result = parseCodeBlock(lines, i);
      blocks.push(result.html);
      i = result.nextIndex;
      continue;
    }

    const paragraphLines = [];
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
      paragraphLines.push(lines[i]);
      i++;
    }
    blocks.push(`<p>${buildParagraph(paragraphLines, refs)}</p>`);
  }
  return blocks.join('');
}

export function markdownToHtml(text) {
  // Normaliza saltos de línea antes de nada: un "\r" sobrante (ficheros con
  // \r\n, habituales en Windows) rompe el anclaje final ($) de las expresiones
  // regulares de bloque, ya que "." no incluye \r.
  const normalized = (text || '').replace(/\r\n?/g, '\n');
  const escapes = [];
  const protectedText = protectEscapes(normalized, escapes);
  const { refs, lines: contentLines } = extractReferences(protectedText.split('\n'));

  const html = parseBlocks(contentLines, refs);
  return restoreEscapes(html, escapes);
}
