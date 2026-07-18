- **Nombre**: build.py no debe reescribir el título entero al inyectar la versión
- **Código**: 00023
- **Tipo**: fix

## Prompt original del usuario

build.py no debería escribir escribir el title entero, solo buscar en el title el marcador con el número a sustituir. el fichero index.html debería conservar el titulo que tenga, con el marcador que sería lo que se reemplazaría

## Descripción completa

Al generar el entregable (`build.py`), la inyección del número de versión en el título de la página (introducida en el cambio 00022) sustituye el `<title>...</title>` completo por un texto que `build.py` tiene escrito literalmente, incluyendo el texto base del título ("Errantes, el juego de mesa"). Esto significa que si el título de `src/index.html` cambia en el futuro, `build.py` deja de coincidir con ese texto y la versión deja de inyectarse correctamente, sin ningún aviso.

El comportamiento esperado es que `src/index.html` conserve el título que se quiera mostrar, incluyendo dentro de él un marcador reservado para el número de versión (en vez de tenerlo ya escrito o vacío). `build.py`, al generar el entregable, debe buscar ese marcador dentro del título ya existente y sustituir únicamente esa parte por el número de versión — sin conocer ni reescribir el resto del texto del título.

**Casos límite:** si el marcador no aparece en el título de `src/index.html` (se ha eliminado o cambiado por error), `build.py` debe fallar explícitamente indicando el problema, igual que ya hace hoy cuando `CURRENT_VERSION` no tiene el formato esperado — no debe generar silenciosamente un entregable sin versión en el título.

## Apuntes técnicos

- Código afectado por el bug: `src/scripts/build.py`, línea con `html.replace('<title>Errantes, el juego de mesa</title>', f'<title>Errantes, el juego de mesa v.{{version}}</title>')` (añadida en el cambio 00022), que depende de conocer el texto completo del título.
- El título de desarrollo vive en `src/index.html` (`<title>Errantes, el juego de mesa (dev)</title>`); `build.py` ya tiene además otra sustitución previa (línea ~179) que quita el sufijo `(dev)` para producir el título del entregable — esa parte no es el bug reportado, pero es donde el marcador de versión deberá convivir dentro del texto del título.
