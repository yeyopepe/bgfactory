## (a) Anotaciones funcionales

Sin dudas de alcance pendientes de resolver con el usuario. Queda fuera de alcance cualquier cambio al mecanismo genérico de `ui/globalShortcuts.js` para resolver el botón "Cancelar" de una modal (p.ej. pasar a usar un atributo `data-*` en vez de una clase CSS): la causa raíz es específica de `ui/cardTextBoxModal.js` (es el único footer de modal del proyecto con dos botones que comparten la clase `btn-cancel`) y se corrige sin tocar ese módulo compartido.

## (b) Solución técnica

1. **`src/styles/main.css`**: añadir una nueva clase `.btn-duplicate` con el mismo aspecto visual que `.btn-cancel` (mismo patrón `.btn-<intención>` ya documentado en `STYLE_BIBLE.md` sección 8 para variantes de botón standalone que no siguen BEM):
   - Añadirla a la regla base compartida de la línea 557: `.btn-cancel, .btn-duplicate, .btn-accept, .btn-eliminar { ... }`.
   - Replicar para `.btn-duplicate` las mismas reglas de `.btn-cancel` (líneas 566, 571, 575, 580: color de fondo/texto, hover, disabled, disabled:hover), agrupando el selector (`.btn-cancel, .btn-duplicate { ... }` en cada bloque) para no duplicar declaraciones.
2. **`src/ui/cardTextBoxModal.js`** (línea 445): cambiar `duplicateBtn.className = 'btn-cancel'` por `duplicateBtn.className = 'btn-duplicate'`. Con esto el botón "Duplicar" mantiene idéntico aspecto visual, pero deja de compartir clase con el botón "Cancelar" real de esa misma modal.

Con este cambio, `ui/globalShortcuts.js` no necesita ninguna modificación: su `querySelector('.modal__footer .btn-cancel')` (línea 24) pasa a encontrar de forma única al botón "Cancelar", que es el único que conserva esa clase en el footer de `cardTextBoxModal.js`. Se ha verificado que ningún otro footer de modal del proyecto tiene más de un botón con la clase `btn-cancel`, así que este cambio no afecta a ningún otro flujo de ESC existente.

## (d) Cambios en estilo

En `STYLE_BIBLE.md` sección 8 (o donde se documenten `.btn-cancel`/`.btn-accept`/`.btn-eliminar`), añadir `.btn-duplicate` a la lista de variantes de botón standalone: mismo aspecto visual que `.btn-cancel` (fondo neutro/secundario), usada específicamente cuando un footer de modal necesita un botón "Duplicar" (u otra acción no destructiva/no primaria) distinto del botón "Cancelar" de esa misma modal, para que ambos conserven selectores CSS únicos.
