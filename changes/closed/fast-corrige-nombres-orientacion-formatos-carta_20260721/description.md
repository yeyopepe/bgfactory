- **Nombre**: Corrige nombres de orientación en los formatos de carta
- **Código**: fast-corrige-nombres-orientacion-formatos-carta_20260721
- **Tipo**: fast
- **Fecha**: 2026-07-21

## Prompt original del usuario

Algunos nombres en la lista de valores de proporción están mal: los horizontales son en realidad verticales y viceversa. Cambia solo los nombres de la lista

## Descripción completa

En el desplegable "Proporción" de una carta, los formatos "Poker" y "Tarot" tenían la orientación cambiada en su nombre respecto a la forma real que producen (un formato marcado como "horizontal" resultaba en una carta vertical, y viceversa). Se ha corregido el texto de esos 4 nombres para que digan la orientación correcta; "Cuadrada" no se ve afectada, al no tener orientación. Los valores internos y las proporciones numéricas no cambian, solo el texto visible.

## Cambios aplicados

- `src/core/cardProportions.js` (`CARD_PROPORTIONS`): intercambiado "horizontal"/"vertical" en los `label` de las 4 entradas afectadas (`'5:7'`, `'7:5'`, `'tarot-h'`, `'tarot-v'`), sin tocar `value` ni `ratio`.
- `design/docs/ARCHITECTURE.md` (sección 4, campo `proporcion` del tipo `'carta'`): actualizado el mismo texto parentético para que siga reflejando fielmente los nombres del catálogo.
