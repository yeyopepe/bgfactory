#!/usr/bin/env node
/*
 * Ofusca un fichero JS usando el bundle vendorizado de javascript-obfuscator
 * (src/scripts/vendor/javascript-obfuscator.browser.js), sin depender de npm/npx.
 *
 * Uso: node obfuscate_bundle.js <input.js> <output.js>
 */

// El bundle es la build "browser" (UMD) de javascript-obfuscator, que espera
// el global `self` propio de navegadores/workers.
global.self = global;

const fs = require('fs');
const path = require('path');

const JavaScriptObfuscator = require(path.join(__dirname, 'vendor', 'javascript-obfuscator.browser.js'));

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
    console.error('Uso: node obfuscate_bundle.js <input.js> <output.js>');
    process.exit(1);
}

const code = fs.readFileSync(inputPath, 'utf-8');

const result = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    deadCodeInjection: true,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    renameGlobals: false,
    selfDefending: true,
});

fs.writeFileSync(outputPath, result.getObfuscatedCode(), 'utf-8');
