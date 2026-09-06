// Punto de entrada CLI del framework de tests funcionales de BG Factory.
// Único fichero que conoce Node y Playwright.
//
// Flujo:
//   1. Levanta un servidor HTTP estático local sobre `src/` (los ES modules
//      necesitan http, no file://). Bloquea el path traversal.
//   2. Arranca Chromium headless (Playwright).
//   3. Por cada src/test/functional/*.test.js: navega a runner-page.html con
//      ?file=<test>, espera el resultado que la página expone en window, lo
//      recoge. Recarga por fichero => módulos ES frescos, listeners del
//      eventBus a cero, sin contaminación entre ficheros.
//   4. Imprime el resumen. Captura screenshot al primer fallo de cada fichero.
//   5. Genera src/test/TRACEABILITY.md cruzando design/docs/features/ con los
//      metadatos de funcionalidad declarados por los tests.
//   6. Exit code != 0 si hubo algún fallo o alguna anomalía de trazabilidad.
//
// Uso:  node src/test/run.js       (requiere `npm install` + `npx playwright install chromium`)
//       npm test                    (equivalente)
//       npm run test:all            (setup + batería)

import { createServer } from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateTraceability } from './traceability.js';

const TEST_DIR = fileURLToPath(new URL('.', import.meta.url));
const SRC_DIR = resolve(TEST_DIR, '..');
const REPO_ROOT = resolve(SRC_DIR, '..');
const FUNCTIONAL_DIR = join(TEST_DIR, 'functional');
const SCREENSHOT_DIR = join(TEST_DIR, '_screenshots');
const FEATURES_DIR = join(REPO_ROOT, 'previo-sdd', 'design', 'docs', 'features');
const TRACEABILITY_OUT = join(TEST_DIR, 'TRACEABILITY.md');

const PER_FILE_TIMEOUT_MS = 30000;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

// Servidor estático que sólo sirve ficheros DENTRO de SRC_DIR. Cualquier ruta
// que tras normalizar salga de ahí -> 403.
function startStaticServer() {
  return new Promise((resolvePromise) => {
    const server = createServer(async (req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
        const rel = urlPath.replace(/^\/+/, '');
        const target = resolve(SRC_DIR, rel);
        const within = target === SRC_DIR || target.startsWith(SRC_DIR + sep);
        if (!within) {
          res.writeHead(403).end('Forbidden');
          return;
        }
        if (!existsSync(target)) {
          res.writeHead(404).end('Not found');
          return;
        }
        const body = await readFile(target);
        const type = CONTENT_TYPES[extname(target).toLowerCase()] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type }).end(body);
      } catch (err) {
        res.writeHead(500).end(String(err && err.message ? err.message : err));
      }
    });
    server.listen(0, '127.0.0.1', () => {
      resolvePromise(server);
    });
  });
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('\nNo se ha podido cargar `playwright`. Ejecuta primero:');
    console.error('  npm install');
    console.error('  npx playwright install chromium');
    console.error('  (o: npm run test:all)\n');
    process.exit(2);
  }

  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const server = await startStaticServer();
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  let testFiles = [];
  try {
    testFiles = (await readdir(FUNCTIONAL_DIR))
      .filter((f) => f.endsWith('.test.js'))
      .sort();
  } catch {
    console.error(`No existe ${FUNCTIONAL_DIR} o no se puede leer.`);
  }

  const allCases = []; // { file, name, status, expected?, actual?, error? }
  const allFeatures = []; // { file, primary, secondary }

  for (const file of testFiles) {
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('pageerror', (e) => consoleErrors.push(String(e)));

    let results = null;
    let features = null;
    try {
      await page.goto(`${base}/test/runner-page.html?file=functional/${file}`, {
        waitUntil: 'load',
      });
      await page.waitForFunction(
        () => window.__BGF_TEST_RESULTS__ !== undefined,
        { timeout: PER_FILE_TIMEOUT_MS },
      );
      results = await page.evaluate(() => window.__BGF_TEST_RESULTS__);
      features = await page.evaluate(() => window.__BGF_TEST_FEATURES__ ?? null);
    } catch (err) {
      results = [{
        name: `(carga de ${file})`,
        status: 'fail',
        error: `${err && err.message ? err.message : err}` +
          (consoleErrors.length ? `\n    pageerror: ${consoleErrors.join('\n    ')}` : ''),
      }];
    }

    let screenshotTaken = false;
    for (const c of results || []) {
      const entry = { file, ...c };
      allCases.push(entry);
      if (c.status === 'fail' && !screenshotTaken) {
        try {
          await page.screenshot({
            path: join(SCREENSHOT_DIR, `${file.replace(/\.js$/, '')}.png`),
            fullPage: true,
          });
        } catch { /* screenshot best-effort */ }
        screenshotTaken = true;
      }
    }

    if (features) {
      allFeatures.push({
        file,
        primary: features.primary,
        secondary: Array.isArray(features.secondary) ? features.secondary : [],
        caseCodes: (results || [])
          .map((c) => (String(c.name).match(/^(FT-\d+-\d+)/) || [])[1])
          .filter(Boolean),
      });
    }

    await page.close();
  }

  await browser.close();
  server.close();

  // --- Resumen ---
  const failed = allCases.filter((c) => c.status === 'fail');
  const passed = allCases.filter((c) => c.status === 'pass');

  console.log('');
  console.log(`Total: ${allCases.length} — OK: ${passed.length} — FALLOS: ${failed.length}`);
  console.log('');
  for (const c of failed) {
    console.log(`  ✗ ${c.file} › ${c.name}`);
    if (c.expected !== undefined || c.actual !== undefined) {
      console.log(`      esperado: ${JSON.stringify(c.expected)}`);
      console.log(`      obtenido: ${JSON.stringify(c.actual)}`);
    }
    if (c.error) {
      console.log(`      error: ${c.error}`);
    }
  }
  if (failed.length) console.log('');

  // --- Trazabilidad ---
  let traceOutcome = { hasAnomaly: false };
  try {
    traceOutcome = await generateTraceability(FEATURES_DIR, allFeatures, TRACEABILITY_OUT);
    console.log(`Trazabilidad escrita en ${relative(REPO_ROOT, TRACEABILITY_OUT)}` +
      (traceOutcome.hasAnomaly ? ' — CON ANOMALÍAS (ver el fichero)' : ''));
  } catch (err) {
    console.error(`No se ha podido generar TRACEABILITY.md: ${err && err.message ? err.message : err}`);
    traceOutcome = { hasAnomaly: true };
  }

  process.exit(failed.length > 0 || traceOutcome.hasAnomaly ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
