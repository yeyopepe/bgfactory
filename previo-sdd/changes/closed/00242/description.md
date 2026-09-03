- **Name**: Valor por defecto del modo de importación: "Sobrescribir todo el juego"
- **Code**: 00242
- **Type**: change
- **Creation date**: 2026-09-03

## Full description

En el flujo de importación, el segundo modal ("Importar — confirmar") ofrece un desplegable llamado "Modo de importación" con dos opciones:

- **Añadir a lo existente**: conserva todo el contenido actual del juego y le suma los elementos seleccionados del fichero.
- **Sobrescribir todo el juego**: borra primero todo el contenido actual y deja el juego únicamente con los elementos seleccionados del fichero.

Hoy ese desplegable aparece preseleccionado en "Añadir a lo existente". Este cambio hace que aparezca preseleccionado en **"Sobrescribir todo el juego"**. El usuario sigue pudiendo cambiarlo a "Añadir a lo existente" antes de confirmar; lo único que cambia es cuál viene marcada al abrir el modal.

El comportamiento es el mismo se lance la importación desde el modo juego o desde el modo edición. No aparece ningún elemento nuevo en pantalla ni cambia la disposición del modal: únicamente cambia qué opción está seleccionada de entrada.

### Puntos de alcance resueltos con el usuario

- **Salvaguardas adicionales**: ninguna. No se añade ningún aviso de confirmación extra al pulsar "Importar" con el modo "Sobrescribir" seleccionado. La confirmación que ya existe (el propio botón "Importar" del modal y el resultado que se muestra después) se considera suficiente.
- **Desplegable "Comportamiento ante id duplicado"**: sin cambios. Sigue visible y disponible siempre, aunque en modo "Sobrescribir" no tenga efecto (al partir de cero no puede haber ids duplicados). Ajustar ese desplegable no forma parte de lo pedido.
- **Consecuencias del nuevo valor por defecto** (ya descritas en la funcionalidad de exportar/importar, no se modifican aquí, pero se asumen de forma consciente): con "Sobrescribir todo el juego" se borra todo el contenido actual antes de importar; y si el fichero importado trae título de cabecera, el título de la partida actual se sustituye por el del fichero. En "Añadir a lo existente" el título actual se conservaba siempre.

## Technical notes

- El valor por defecto del desplegable vive en `src/ui/importConfirmModal.js`: el objeto de trabajo se inicializa como `{ mode: 'add', conflictMode: 'overwrite' }`. Basta con cambiar `mode: 'add'` por `mode: 'overwrite'`. El bucle que construye los `<option>` ya marca `option.selected` a partir de ese valor, así que no hay nada más que tocar en ese fichero.
- El valor `mode` lo consume `src/core/importMerge.js` (`mergeCollection` / `mergeImportedGame`) y se propaga desde `src/ui/editModeToggle.js` (callback `onAccept`). Ambos ya contemplan hoy `mode === 'overwrite'`; no hay cambios de interfaz ni de contrato entre capas.
- Documentación a revisar/actualizar (lo concreta `pv-how` en su `plan.md`):
  - `previo-sdd/design/docs/architecture/006-ui-layer.md`, entrada de `ui/importConfirmModal.js`: indica "«Modo de importación» (`Añadir a lo existente` por defecto / `Sobrescribir todo el juego`)".
  - `previo-sdd/design/docs/features/032-exportar-importar-componentes-en-json-con-seleccion.md`: el punto 2 de "Importar" y el nodo del diagrama Mermaid describen `Añadir a lo existente` como valor por defecto.
- `pv-internal-tech-analysis` no detectó inconsistencias entre documentación y código en esta zona.
