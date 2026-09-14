// Verificación de integridad del entregable: genera el build con
// `scripts/build.py` y comprueba que el bundle JS resultante (el <script>
// inline no-JSON de index-v*.html) es sintácticamente válido. `npm test`
// solo ejecuta los módulos ES fuente sin pasar por `build.py`, así que un
// error de sintaxis introducido por la transformación del build (p. ej.
// `import { x as y }` reescrito literalmente a una destructuración de
// objeto, donde `as` no es válido) pasa inadvertido — bug 00284.
//
// Uso: node src/test/build-check.js
//      npm run test:all (lo incluye)

import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = fileURLToPath(new URL('.', import.meta.url));
const SRC_DIR = resolve(TEST_DIR, '..');
const REPO_ROOT = resolve(SRC_DIR, '..');
const BUILD_SCRIPT = join(SRC_DIR, 'scripts', 'build.py');
const VERSIONS_DIR = join(SRC_DIR, '_output', 'versions');

async function latestBuildFile() {
  const files = (await readdir(VERSIONS_DIR))
    .filter((f) => /^index-v\d+\.html$/.test(f))
    .sort();
  return join(VERSIONS_DIR, files[files.length - 1]);
}

async function main() {
  execFileSync('python', [BUILD_SCRIPT], { cwd: REPO_ROOT, stdio: 'inherit' });

  const builtFile = await latestBuildFile();
  const html = await readFile(builtFile, 'utf-8');

  const openTag = '<script>';
  const start = html.indexOf(openTag);
  const end = html.indexOf('</script>', start);
  if (start === -1 || end === -1) {
    console.error(`No se ha encontrado el <script> del bundle en ${builtFile}`);
    process.exit(1);
  }
  const bundleCode = html.slice(start + openTag.length, end);

  try {
    // eslint-disable-next-line no-new-func
    new Function(bundleCode);
  } catch (err) {
    console.error(`El bundle generado (${builtFile}) tiene un error de sintaxis:`);
    console.error(err.message);
    process.exit(1);
  }

  console.log(`Bundle sintácticamente válido: ${builtFile}`);
}

main();
