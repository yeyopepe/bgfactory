// Generador de src/test/TRACEABILITY.md. Corre en Node (lo invoca run.js tras
// ejecutar la batería).
//
// Cruza las fichas de funcionalidad reales de design/docs/features/ con los
// metadatos de funcionalidad declarados por cada fichero de test
// (registerFeature({ primary, secondary })). Produce:
//   - tabla funcionalidad -> tests (principal y secundarios), ordenada por número
//   - "Tests que declaran una funcionalidad inexistente"  -> marca anomalía (exit != 0)
//   - "Funcionalidades sin ningún test"                    -> solo informativo
//
// Sin fechas ni resultado de la última ejecución: el fichero debe ser estable
// entre ejecuciones para que su diff sólo refleje cambios de cobertura.

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const HEADER =
  '<!-- GENERADO AUTOMÁTICAMENTE por `npm test`. No editar a mano: cualquier cambio se sobrescribe. -->';

// Extrae { NNN(number): 'NNN — Título' } de design/docs/features/INDEX.md.
// Líneas del tipo:  - [002 — Alta/edición/borrado ...](002-....md)
function parseFeaturesIndex(indexText) {
  const map = new Map();
  const re = /^\s*-\s*\[(\d{1,4})\s*[—-]\s*([^\]]+)\]\([^)]+\)\s*$/;
  for (const line of indexText.split(/\r?\n/)) {
    const m = line.match(re);
    if (!m) continue;
    const num = parseInt(m[1], 10);
    const title = m[2].trim();
    map.set(num, `${m[1].padStart(3, '0')} — ${title}`);
  }
  return map;
}

function pad3(n) {
  return String(n).padStart(3, '0');
}

export async function generateTraceability(featuresDir, features, outPath) {
  const indexText = await readFile(join(featuresDir, 'INDEX.md'), 'utf8');
  const featureTitles = parseFeaturesIndex(indexText); // Map<number, string>

  // funcionalidad NNN -> { primary: Set<codes>, secondary: Set<codes> }
  const coverage = new Map();
  const ensure = (nnn) => {
    if (!coverage.has(nnn)) coverage.set(nnn, { primary: new Set(), secondary: new Set() });
    return coverage.get(nnn);
  };

  const unknownRefs = []; // { code, nnn }

  for (const f of features || []) {
    if (f.primary == null) continue;
    const codes = (f.caseCodes && f.caseCodes.length)
      ? f.caseCodes
      : [`FT-${pad3(f.primary)}-??`];

    for (const code of codes) {
      ensure(f.primary).primary.add(code);
      if (!featureTitles.has(f.primary)) unknownRefs.push({ code, nnn: f.primary });
      for (const sec of f.secondary || []) {
        ensure(sec).secondary.add(code);
        if (!featureTitles.has(sec)) unknownRefs.push({ code, nnn: sec });
      }
    }
  }

  // Filas: todas las fichas del índice + cualquier NNN referenciado que no exista.
  const allNumbers = new Set([...featureTitles.keys(), ...coverage.keys()]);
  const sorted = [...allNumbers].sort((a, b) => a - b);

  const rows = [];
  const withoutTests = [];
  for (const nnn of sorted) {
    const title = featureTitles.get(nnn) || `${pad3(nnn)} — (sin ficha en design/docs/features/)`;
    const cov = coverage.get(nnn);
    const cells = [];
    if (cov) {
      for (const c of [...cov.primary].sort()) cells.push(c);
      for (const c of [...cov.secondary].sort()) {
        if (!cov.primary.has(c)) cells.push(`${c} (secundaria)`);
      }
    }
    rows.push(`| ${title} | ${cells.length ? cells.join(', ') : '—'} |`);
    if (featureTitles.has(nnn) && (!cov || cells.length === 0)) withoutTests.push(title);
  }

  // Dedup de anomalías por (code, nnn)
  const seen = new Set();
  const anomalies = unknownRefs.filter(({ code, nnn }) => {
    const k = `${code}|${nnn}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((a, b) => (a.nnn - b.nnn) || a.code.localeCompare(b.code));

  const lines = [];
  lines.push(HEADER, '');
  lines.push('# Trazabilidad funcionalidad ↔ tests', '');
  lines.push('Relaciona cada funcionalidad de `design/docs/features/` con los tests funcionales que');
  lines.push('la cubren. "principal" = el test toma su código de esta funcionalidad; "secundaria" =');
  lines.push('el test la ejercita de forma incidental. Generado por `npm test`.', '');
  lines.push('| Funcionalidad (design/docs/features/) | Tests |');
  lines.push('|---|---|');
  lines.push(...rows);
  lines.push('');
  lines.push('## Anomalías', '');
  lines.push('### Tests que declaran una funcionalidad inexistente (hacen fallar la batería)', '');
  if (anomalies.length) {
    lines.push('| Test | Funcionalidad declarada |');
    lines.push('|---|---|');
    for (const a of anomalies) lines.push(`| ${a.code} | ${pad3(a.nnn)} (sin ficha en design/docs/features/) |`);
  } else {
    lines.push('_Ninguna._');
  }
  lines.push('');
  lines.push('### Funcionalidades sin ningún test (solo informativo)', '');
  if (withoutTests.length) {
    lines.push('| Funcionalidad |');
    lines.push('|---|');
    for (const t of withoutTests) lines.push(`| ${t} |`);
  } else {
    lines.push('_Ninguna._');
  }
  lines.push('');

  await writeFile(outPath, lines.join('\n'), 'utf8');
  return { hasAnomaly: anomalies.length > 0 };
}
