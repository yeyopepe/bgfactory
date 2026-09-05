# Datos — Escala tipográfica (tokens)

Definición funcional de los tokens de tipografía: tamaños de texto, pesos de fuente e interlineado.

## 2.1 Tamaños de texto (8 pasos)

| Token | Valor | px aprox. | Estado | Reemplaza / uso funcional |
|---|---|---|---|---|
| `--text-2xs` | `0.7rem` | 11,2px | nuevo | `0.7rem` y `0.72rem` — etiquetas de componente en tabla |
| `--text-xs` | `0.75rem` | 12px | nuevo | `0.75rem` — errores, hints, toasts, insignias pequeñas. **También absorbe `0.8125rem` (13px)** |
| `--text-sm` | `0.875rem` | 14px | nuevo | `0.875rem` — el tamaño más usado: controles, labels, inputs, items de lista, texto general de UI. **También absorbe `0.9375rem` (15px) y `0.95rem`** |
| `--text-base` | `1rem` | 16px | nuevo | `1rem` — botones de cabecera de paneles |
| `--text-md` | `1.125rem` | 18px | nuevo | `1.125rem` — títulos de modales, previsualización de tipografía del dado |
| `--text-lg` | `1.5rem` | 24px | nuevo | `1.5rem` — título de la aplicación (`h1`) |
| `--text-xl` | `2rem` | 32px | nuevo | Reservado para uso futuro (sin uso actual) |
| `--text-display` | `4rem` | 64px | nuevo | `4rem` — resultado del dado a pantalla completa |

**Decisión sobre valores intermedios.** No se añaden pasos intermedios. Se consolidan al paso más cercano, aceptando la diferencia visual (1-2px):

| Valor actual | Se consolida en | Diferencia |
|---|---|---|
| `0.8125rem` (13px) | `--text-xs` (12px) | −1px |
| `0.9375rem` (15px) | `--text-sm` (14px) | −1px |
| `0.95rem` (~15,2px, solo en el texto de la ventana de progreso) | `--text-sm` (14px) | ~−1,2px |

Estas tres sustituciones se revisan una a una en la fase técnica.

## 2.2 Pesos de fuente (3 pasos)

Hoy no hay tokens; solo se usan los valores `normal` y `600`.

| Token | Valor | Estado | Uso funcional |
|---|---|---|---|
| `--font-normal` | `400` | nuevo | Peso normal (por defecto del navegador) |
| `--font-medium` | `500` | nuevo | Peso medio (labels de formulario) |
| `--font-semibold` | `600` | nuevo | Seminegrita (nombres de grupo, énfasis) |

## 2.3 Interlineado (3 niveles)

Hoy no hay tokens de interlineado.

| Token | Valor | Estado | Uso funcional |
|---|---|---|---|
| `--leading-tight` | `1.2` | nuevo | Títulos y cabeceras |
| `--leading-normal` | `1.5` | nuevo | Texto de interfaz general |
| `--leading-relaxed` | `1.65` | nuevo | Contenido de lectura (documentos embebidos) |
