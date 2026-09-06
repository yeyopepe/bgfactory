# Datos: informe de resultado de los tests

Definición funcional del contenido del fichero de informe que se guarda, dentro de la carpeta de la versión en preparación, cada vez que se ejecuta la batería de tests como parte del proceso de preparación de una versión oficial. No es una definición técnica (formato de fichero, nombre exacto, ubicación exacta dentro de la carpeta): eso lo decide `pv-how`.

## Datos que contiene siempre

| Dato | Descripción funcional | Valores posibles |
|---|---|---|
| Versión | Identificador de la versión oficial que se está preparando | Texto (número de versión, p. ej. `0.9.6`) |
| Fecha y hora | Momento en que se ejecutó esta batería de tests | Fecha y hora |
| Resultado global | Si la ejecución ha pasado o ha fallado | `Correcto` / `Con fallos` |
| Total de tests | Cuántos tests se han ejecutado en total | Número entero |
| Tests correctos | Cuántos de esos tests han pasado | Número entero |
| Tests fallidos | Cuántos de esos tests han fallado | Número entero (0 si todo ha pasado) |

## Datos adicionales, solo si hay algún fallo

Uno de estos bloques por cada test fallido:

| Dato | Descripción funcional | Valores posibles |
|---|---|---|
| Identificador del test | Fichero y caso de test que ha fallado | Texto (`fichero › nombre del caso`) |
| Esperado | Qué resultado se esperaba en ese caso | Texto/valor (si el fallo es de una comprobación) |
| Obtenido | Qué resultado se ha obtenido realmente | Texto/valor (si el fallo es de una comprobación) |
| Error | Descripción del error, si el fallo no viene de una comprobación sino de una excepción | Texto (alternativo a esperado/obtenido) |

## Ejemplo — todos los tests pasan

```
Versión: 0.9.6
Fecha: 2026-09-06 18:32

Resultado: Correcto
Total: 24 — Correctos: 24 — Fallidos: 0
```

## Ejemplo — hay tests fallidos

```
Versión: 0.9.6
Fecha: 2026-09-06 18:32

Resultado: Con fallos
Total: 24 — Correctos: 22 — Fallidos: 2

Tests fallidos:

✗ functional/synced-copies.test.js › FT-005-01 crea una copia sincronizada y propaga el cambio de diseño
    esperado: "#ffcc00"
    obtenido: "#ffffff"

✗ functional/autosave.test.js › FT-029-02 recupera un estado guardado tras recargar
    error: Timeout esperando a que #content contenga el componente cargado
```
