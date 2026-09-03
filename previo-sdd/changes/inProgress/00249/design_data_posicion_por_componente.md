# Tabla B — Posición por componente

**Ventana:** Modal de edición de **componente** únicamente. Las otras dos ventanas de propiedades catalogadas en esta ficha (modal de grupo, modal de etiqueta) no tienen variación por tipo, así que no tienen Tabla B — se documentan solo con su bloque en la Tabla A. (Ver Tabla A y `description.md`.)

Filas = **solo los elementos cuya presencia o posición depende del tipo de componente**. Los elementos comunes a todos los tipos (identificador, secciones "General" / "Ayuda al jugador" / "Etiquetas" / "Interacciones programadas", "Tamaño", "Extrusión", pestaña "Copias", footer) están en la Tabla A con "Aparece en = Todos" y **no se repiten aquí**.

Columnas = los 7 tipos de componente.

Cada celda = **posición vertical del elemento dentro de su pestaña para ese tipo** (1 = lo más arriba de la pestaña). Vacío = el elemento no aparece para ese tipo.

Las filas se agrupan por pestaña y sección, en el orden en que aparecen en pantalla. Primera columna: 🔽 marca las filas que son una sección; el resto son campos.

Abreviaturas de tipo: **Texto** = Cuadro de texto · **T.simp** = Tablero simple · **T.pers** = Tablero personalizado · **Dado** · **Doc** = Visor de documentos · **Carta** = Carta/Ficha · **Mazo**.

---

## Pestaña "Generales"

| | Elemento | Texto | T.simp | T.pers | Dado | Doc | Carta | Mazo |
|:-:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 🔽 | Interacciones programadas *(sección)* | | | | | | | |
| | Al hacer clic *(interacción del tipo)* | — | — | — | 18 | — | 18 | 18 |

> Es el único elemento de la pestaña "Generales" que depende del tipo: solo aparece para los tipos con una interacción de clic izquierdo registrada (Dado = tirar, Carta = voltear, Mazo = robar). "Clic derecho" está justo debajo y sí aparece para todos (ver Tabla A, posición 19).

---

## Pestaña "Visuales"

Posición dentro de la pestaña "Visuales". "Tamaño" (posiciones 1–4) y sus 3 campos son comunes a todos y no se listan aquí. La sección "Extrusión" y sus 2 campos también son comunes, pero **su posición cambia según haya o no secciones intermedias** ("Estilo" del dado, "Visual" de los tableros), así que se incluye para dejar claro el desplazamiento.

| | Elemento | Texto | T.simp | T.pers | Dado | Doc | Carta | Mazo |
|:-:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 🔽 | Estilo *(sección — dado)* | — | — | — | 5 | — | — | — |
| | Color del cuerpo | — | — | — | 6 | — | — | — |
| | Color de los números | — | — | — | 7 | — | — | — |
| 🔽 | Visual *(sección — tableros)* | — | 5 | 5 | — | — | — | — |
| | Biselado | — | 6 | 6 | — | — | — | — |
| | Sombra | — | 7 | 7 | — | — | — | — |
| 🔽 | Borde *(sub-sección)* | — | 8 | 8 | — | — | — | — |
| | Color del borde | — | 9 | 9 | — | — | — | — |
| | Grosor del borde | — | 10 | 10 | — | — | — | — |
| 🔽 | Extrusión *(sección común, posición variable; rótulo "Borde y extrusión" en Texto)* | 5 | 11 | 11 | 8 | 5 | 5 | 5 |
| | Profundidad | 6 | 12 | 12 | 9 | 6 | 6 | 6 |
| | Color de extrusión | 7 | 13 | 13 | 10 | 7 | 7 | 7 |

> Lectura: en Texto / Doc / Carta / Mazo no hay secciones intermedias, así que "Extrusión" arranca en la posición 5 (justo tras "Tamaño"). En el Dado, la sección "Estilo" (5–7) la empuja a la 8. En los tableros, la sección "Visual" + "Borde" (5–10) la empujan a la 11.

---

## Pestaña "Específicas"

Aquí **todo** depende del tipo (cada tipo tiene su propio contenido). Posición dentro de la pestaña "Específicas".

| | Elemento | Texto | T.simp | T.pers | Dado | Doc | Carta | Mazo |
|:-:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| | **— Texto —** | | | | | | | |
| | Contenido | 1 | — | — | — | — | — | — |
| 🔽 | Visual *(sección)* | 2 | — | — | — | — | — | — |
| | Tamaño de fuente | 3 | — | — | — | — | — | — |
| | Color del texto | 4 | — | — | — | — | — | — |
| | Color de fondo | 5 | — | — | — | — | — | — |
| | Transparente | 6 | — | — | — | — | — | — |
| | **— Tablero simple —** | | | | | | | |
| 🔽 | Fondo *(sección)* | — | 1 | — | — | — | — | — |
| | Tipo de fondo | — | 2 | — | — | — | — | — |
| | Configurar fondo… | — | 3 | — | — | — | — | — |
| | **— Tablero personalizado —** | | | | | | | |
| | Editar diseño del tablero | — | — | 1 | — | — | — | — |
| | **— Dado —** | | | | | | | |
| | Configuración de caras | — | — | — | 1 | — | — | — |
| | Número máximo de caras | — | — | — | 2 | — | — | — |
| | Lista de valores | — | — | — | 3 | — | — | — |
| | Tipografía del resultado | — | — | — | 4 | — | — | — |
| | **— Visor de documentos —** | | | | | | | |
| | Tipo de contenido | — | — | — | — | 1 | — | — |
| | Contenido | — | — | — | — | 2 | — | — |
| | Formato | — | — | — | — | 3 | — | — |
| | URL de la página | — | — | — | — | 4 | — | — |
| | **— Carta/Ficha —** | | | | | | | |
| | Proporción | — | — | — | — | — | 1 | — |
| | Editar diseño de la carta | — | — | — | — | — | 2 | — |
| 🔽 | Estilo *(sección)* | — | — | — | — | — | 3 | — |
| | Copiar estilo | — | — | — | — | — | 4 | — |
| | Pegar estilo | — | — | — | — | — | 5 | — |
| | **— Mazo —** | | | | | | | |
| 🔽 | Forma *(sección)* | — | — | — | — | — | — | 1 |
| | Forma | — | — | — | — | — | — | 2 |
| | Orientación | — | — | — | — | — | — | 3 |
| 🔽 | Cartas reveladas *(sección)* | — | — | — | — | — | — | 4 |
| | Disposición carta revelada | — | — | — | — | — | — | 5 |
| | Texto carta revelada | — | — | — | — | — | — | 7 |
| | Cara de la carta revelada | — | — | — | — | — | — | 8 |
| 🔽 | Imagen *(sección)* | — | — | — | — | — | — | 9 |
| | Elegir imagen… | — | — | — | — | — | — | 11 |
| | Ajustar imagen… | — | — | — | — | — | — | 12 |
| | Quitar imagen | — | — | — | — | — | — | 13 |
| | Ver contenido del mazo | — | — | — | — | — | — | 14 |

> En el Mazo, las posiciones 6 y 10 las ocupan una nota informativa (bajo "Disposición carta revelada") y la previsualización de la imagen, respectivamente (ver Tabla A). Por eso "Texto carta revelada" es 7 y "Elegir imagen…" es 11.

---

## Leyenda de iconos

| Icono | Significado |
|:-:|---|
| 🔽 | La fila es una sección (o sub-sección) |
| *(sin icono)* | La fila es un campo, botón o texto informativo |

---

## Notas de lectura

- **Pestaña "Copias"**: no aparece en esta tabla porque su contenido es idéntico para los 7 tipos (lo que varía es si el componente tiene o no copias vinculadas, no el tipo). Ver Tabla A.
- **Footer**: idéntico para los 7 tipos. Ver Tabla A.
- Cuando un tipo no tiene ninguna fila específica en una sección, esa sección simplemente no se pinta y las siguientes suben.
