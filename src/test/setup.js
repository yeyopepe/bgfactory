// Setup automático del framework de tests: instala las dependencias de
// desarrollo y el binario de Chromium que necesita Playwright.
//
// Uso:  node src/test/setup.js      (idempotente: no reinstala si ya está)
//       npm run test:setup
//       npm run test:all            (setup + batería)
//
// No forma parte del entregable ni del build. Sólo desarrollo.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const NODE_MODULES = join(REPO_ROOT, 'node_modules');
const PLAYWRIGHT_PKG = join(NODE_MODULES, 'playwright', 'package.json');

function run(cmd, args) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (res.status !== 0) {
    console.error(`\nFalló: ${cmd} ${args.join(' ')} (código ${res.status}).`);
    process.exit(res.status || 1);
  }
}

// 1. npm install (solo si falta node_modules/playwright)
if (!existsSync(PLAYWRIGHT_PKG)) {
  run('npm', ['install']);
} else {
  console.log('node_modules/playwright ya presente — se omite `npm install`.');
}

// 2. Binario de Chromium para Playwright (idempotente: si ya está, no descarga)
run('npx', ['playwright', 'install', 'chromium']);

console.log('\nSetup completo. Lanza la batería con `npm test`.');
