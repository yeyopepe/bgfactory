<#
.SYNOPSIS
  Genera la version entregable del prototipo: un unico fichero HTML
  autocontenido (JS, CSS, imagenes y fuentes incrustados) a partir de los
  modulos ES separados en /src. No requiere Node.js.

.DESCRIPTION
  1. Recorre el grafo de imports ES a partir de src/main.js.
  2. Transforma cada modulo (quita import/export, los sustituye por un
     mini sistema require/module.exports en tiempo de ejecucion).
  3. Incrusta como data URIs cualquier imagen/fuente referenciada desde
     src/styles/main.css (url(...)) o desde src/index.html (<img>, <link>,
     <source>), reescribiendo las referencias.
  4. Concatena los modulos transformados + un runtime minimo + el CSS
     (ya con los assets incrustados) dentro de una copia de src/index.html.
  5. Escribe el resultado en src/_output/versions/index-vXXXX.html, con XXXX
     el numero de CURRENT_VERSION en src/data/version.js.
#>

$ErrorActionPreference = 'Stop'

$srcDir = Split-Path -Parent $PSScriptRoot
$versionsDir = Join-Path $srcDir '_output/versions'
$entryModule = 'main.js'

if (-not (Test-Path $versionsDir)) {
  New-Item -ItemType Directory -Path $versionsDir | Out-Null
}

function Get-MimeType {
  param([string]$extension)

  switch ($extension.ToLowerInvariant()) {
    '.png' { 'image/png' }
    '.jpg' { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    '.gif' { 'image/gif' }
    '.svg' { 'image/svg+xml' }
    '.webp' { 'image/webp' }
    '.ico' { 'image/x-icon' }
    '.woff' { 'font/woff' }
    '.woff2' { 'font/woff2' }
    '.ttf' { 'font/ttf' }
    '.otf' { 'font/otf' }
    '.eot' { 'application/vnd.ms-fontobject' }
    default { 'application/octet-stream' }
  }
}

function ConvertTo-DataUri {
  param([string]$relAssetPath)

  $fullPath = [System.IO.Path]::GetFullPath((Join-Path $srcDir $relAssetPath))
  if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) { return $null }

  $bytes = [System.IO.File]::ReadAllBytes($fullPath)
  $base64 = [System.Convert]::ToBase64String($bytes)
  $mime = Get-MimeType ([System.IO.Path]::GetExtension($fullPath))
  return "data:$mime;base64,$base64"
}

function Embed-CssAssetUrls {
  param([string]$cssContent, [string]$cssBaseDir)

  $pattern = 'url\(\s*([''"]?)((?!data:|https?://|//)[^''"\)]+)\1\s*\)'
  return [regex]::Replace($cssContent, $pattern, {
    param($m)
    $path = $m.Groups[2].Value
    $relAsset = if ($cssBaseDir) { "$cssBaseDir/$path" } else { $path }
    $dataUri = ConvertTo-DataUri $relAsset
    if ($null -eq $dataUri) { return $m.Value }
    return "url(`"$dataUri`")"
  })
}

function Embed-HtmlAssetRefs {
  param([string]$htmlContent)

  $pattern = '(<(?:img|link|source)\b[^>]*?\b(?:src|href)=")((?!data:|https?://|//|#)[^"]+)(")'
  return [regex]::Replace($htmlContent, $pattern, {
    param($m)
    $dataUri = ConvertTo-DataUri $m.Groups[2].Value
    if ($null -eq $dataUri) { return $m.Value }
    return "$($m.Groups[1].Value)$dataUri$($m.Groups[3].Value)"
  })
}

function Resolve-ModulePath {
  param([string]$currentRelPath, [string]$specifier)

  $currentDir = Split-Path $currentRelPath -Parent
  $baseAbs = if ($currentDir) { Join-Path $srcDir $currentDir } else { $srcDir }
  $fullPath = [System.IO.Path]::GetFullPath((Join-Path $baseAbs $specifier))
  $srcFull = [System.IO.Path]::GetFullPath($srcDir)
  $relPath = $fullPath.Substring($srcFull.Length + 1) -replace '\\', '/'
  return $relPath
}

$order = New-Object System.Collections.Generic.List[string]
$visited = New-Object 'System.Collections.Generic.HashSet[string]'

function Visit-Module {
  param([string]$relPath)

  if ($visited.Contains($relPath)) { return }
  [void]$visited.Add($relPath)

  $content = Get-Content -Raw -Encoding UTF8 -Path (Join-Path $srcDir $relPath)
  $importMatches = [regex]::Matches($content, "import\s*\{\s*([^}]+?)\s*\}\s*from\s*['""]([^'""]+)['""]\s*;?")
  foreach ($m in $importMatches) {
    $specifier = $m.Groups[2].Value
    $depRelPath = Resolve-ModulePath -currentRelPath $relPath -specifier $specifier
    Visit-Module -relPath $depRelPath
  }

  $order.Add($relPath)
}

Visit-Module -relPath $entryModule

$bundleParts = New-Object System.Collections.Generic.List[string]

foreach ($relPath in $order) {
  $content = Get-Content -Raw -Encoding UTF8 -Path (Join-Path $srcDir $relPath)

  $exportNames = New-Object System.Collections.Generic.List[string]

  $content = [regex]::Replace($content, 'export\s+function\s+(\w+)', {
    param($m)
    $exportNames.Add($m.Groups[1].Value)
    return "function $($m.Groups[1].Value)"
  })

  $content = [regex]::Replace($content, 'export\s+const\s+(\w+)', {
    param($m)
    $exportNames.Add($m.Groups[1].Value)
    return "const $($m.Groups[1].Value)"
  })

  $content = [regex]::Replace($content, "import\s*\{\s*([^}]+?)\s*\}\s*from\s*['""]([^'""]+)['""]\s*;?", {
    param($m)
    $names = $m.Groups[1].Value
    $specifier = $m.Groups[2].Value
    $depRelPath = Resolve-ModulePath -currentRelPath $relPath -specifier $specifier
    return "const { $names } = require('$depRelPath');"
  })

  $exportAssignments = ($exportNames | ForEach-Object { "module.exports.$_ = $_;" }) -join "`n"

  $wrapped = @"
__modules['$relPath'] = function(module, exports, require) {
$content
$exportAssignments
};
"@
  $bundleParts.Add($wrapped)
}

$runtime = @'
var __modules = {};
var __cache = {};
function require(path) {
  if (__cache[path]) { return __cache[path].exports; }
  var module = { exports: {} };
  __cache[path] = module;
  __modules[path](module, module.exports, require);
  return module.exports;
}
'@

$bundleJs = $runtime + "`n" + ($bundleParts -join "`n") + "`nrequire('$entryModule');"

$cssRelPath = 'styles/main.css'
$css = Get-Content -Raw -Encoding UTF8 -Path (Join-Path $srcDir $cssRelPath)
$css = Embed-CssAssetUrls -cssContent $css -cssBaseDir (Split-Path $cssRelPath -Parent)

$html = Get-Content -Raw -Encoding UTF8 -Path (Join-Path $srcDir 'index.html')
$html = $html -replace '\s*<link rel="stylesheet" href="styles/main.css" />', ''
$html = $html -replace '\s*<script type="module" src="main.js"></script>', ''
$html = Embed-HtmlAssetRefs -htmlContent $html
$html = $html -replace '</title>', "</title>`n  <style>`n$css`n  </style>"
$html = $html -replace '</body>', "  <script>`n$bundleJs`n  </script>`n</body>"
$html = $html -replace '<title>Errantes \(dev\)</title>', '<title>Errantes</title>'

# La version del entregable viene de src/data/version.js (unica fuente de
# verdad, actualizada en el paso 3 de src/_changes/changes_workflow.md), no de
# un contador automatico: asi el numero del entregable coincide con el codigo
# xxxx de la carpeta src/_changes/xxxx/ que motivo la version.
$versionJsPath = Join-Path $srcDir 'data/version.js'
$versionJsContent = Get-Content -Raw -Encoding UTF8 -Path $versionJsPath
$versionMatch = [regex]::Match($versionJsContent, "CURRENT_VERSION\s*=\s*'v(\d+)'")
if (-not $versionMatch.Success) {
  throw "src/data/version.js no tiene una CURRENT_VERSION con formato 'vNNNN'. Actualizala (paso 3 de changes_workflow.md) antes de generar el entregable."
}
$version = $versionMatch.Groups[1].Value

$outputPath = Join-Path $versionsDir "index-v$version.html"
Set-Content -Path $outputPath -Value $html -NoNewline -Encoding UTF8

Write-Host "Build generado en $outputPath"
