// Motor de test propio del framework funcional de BG Factory. Corre DENTRO del
// navegador headless (lo carga runner-page.html). No importa nada de Node ni de
// Playwright.
//
// API pública:
//   describe(nombre, fn)           agrupa casos
//   it(nombre, fn)                 registra un caso (fn puede ser async)
//   beforeEach(fn) / afterEach(fn) ganchos, uno o varios; async permitido
//   expect(actual)                 aserciones (ver más abajo)
//   registerFeature({ primary, secondary })  declara qué ficha de
//                                  design/docs/features/ valida este fichero
//   run()                          ejecuta todo y devuelve el array de resultados
//   getRegisteredFeature()         { primary, secondary } declarado, o null
//
// El código del test lleva su código FT-<NNN>-<nn> como prefijo del nombre del
// caso: it('FT-002-01 · crea una carta', ...).

const suite = {
  describes: [], // { name, its: [{ name, fn }], beforeEach: [], afterEach: [] }
  current: null,
  rootBeforeEach: [],
  rootAfterEach: [],
};

let registeredFeature = null;

export function describe(name, fn) {
  const block = { name, its: [], beforeEach: [], afterEach: [] };
  suite.describes.push(block);
  const prev = suite.current;
  suite.current = block;
  fn();
  suite.current = prev;
}

export function it(name, fn) {
  if (suite.current) {
    suite.current.its.push({ name, fn });
  } else {
    // it() suelto, sin describe: se mete en un bloque implícito.
    let implicit = suite.describes.find((d) => d.name === null);
    if (!implicit) {
      implicit = { name: null, its: [], beforeEach: [], afterEach: [] };
      suite.describes.push(implicit);
    }
    implicit.its.push({ name, fn });
  }
}

export function beforeEach(fn) {
  if (suite.current) suite.current.beforeEach.push(fn);
  else suite.rootBeforeEach.push(fn);
}

export function afterEach(fn) {
  if (suite.current) suite.current.afterEach.push(fn);
  else suite.rootAfterEach.push(fn);
}

export function registerFeature({ primary, secondary = [] } = {}) {
  registeredFeature = { primary, secondary };
}

export function getRegisteredFeature() {
  return registeredFeature;
}

// --- Aserciones ---

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual(a[k], b[k]));
}

function fail(message, expected, actual) {
  const err = new Error(message);
  err.expected = expected;
  err.actual = actual;
  err.isAssertion = true;
  throw err;
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) fail(`toBe: se esperaba ${JSON.stringify(expected)}, se obtuvo ${JSON.stringify(actual)}`, expected, actual);
    },
    toEqual(expected) {
      if (!deepEqual(actual, expected)) fail(`toEqual: se esperaba ${JSON.stringify(expected)}, se obtuvo ${JSON.stringify(actual)}`, expected, actual);
    },
    toBeTruthy() {
      if (!actual) fail(`toBeTruthy: valor falsy ${JSON.stringify(actual)}`, 'truthy', actual);
    },
    toBeFalsy() {
      if (actual) fail(`toBeFalsy: valor truthy ${JSON.stringify(actual)}`, 'falsy', actual);
    },
    toBeNull() {
      if (actual !== null) fail(`toBeNull: se obtuvo ${JSON.stringify(actual)}`, null, actual);
    },
    toContain(item) {
      const ok = typeof actual === 'string'
        ? actual.includes(item)
        : Array.isArray(actual) && actual.includes(item);
      if (!ok) fail(`toContain: ${JSON.stringify(actual)} no contiene ${JSON.stringify(item)}`, item, actual);
    },
    toHaveLength(n) {
      const len = actual == null ? undefined : actual.length;
      if (len !== n) fail(`toHaveLength: se esperaba longitud ${n}, se obtuvo ${len}`, n, len);
    },
    toBeGreaterThan(n) {
      if (!(actual > n)) fail(`toBeGreaterThan: ${JSON.stringify(actual)} no es > ${n}`, `>${n}`, actual);
    },
    toThrow() {
      if (typeof actual !== 'function') fail('toThrow: se esperaba una función', 'function', typeof actual);
      let threw = false;
      try { actual(); } catch { threw = true; }
      if (!threw) fail('toThrow: la función no lanzó', 'throw', 'no throw');
    },
  };
}

// --- Ejecución ---

async function runHooks(hooks) {
  for (const fn of hooks) {
    // eslint-disable-next-line no-await-in-loop
    await fn();
  }
}

export async function run() {
  const results = [];
  for (const block of suite.describes) {
    for (const test of block.its) {
      const label = block.name ? `${test.name}` : test.name;
      const entry = { name: label, status: 'pass' };
      try {
        await runHooks(suite.rootBeforeEach);
        await runHooks(block.beforeEach);
        await test.fn();
      } catch (err) {
        entry.status = 'fail';
        if (err && err.isAssertion) {
          entry.expected = err.expected;
          entry.actual = err.actual;
          entry.error = err.message;
        } else {
          entry.error = String(err && err.stack ? err.stack : err);
        }
      } finally {
        try {
          await runHooks(block.afterEach);
          await runHooks(suite.rootAfterEach);
        } catch (hookErr) {
          if (entry.status === 'pass') {
            entry.status = 'fail';
            entry.error = `afterEach falló: ${String(hookErr && hookErr.stack ? hookErr.stack : hookErr)}`;
          }
        }
      }
      results.push(entry);
    }
  }
  return results;
}
