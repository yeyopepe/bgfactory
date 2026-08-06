# 025 — Identificación de componentes al pasar el ratón

**Área**: Mesa de juego

Cualquier componente de la mesa (cuadro de texto, tablero simple, dado, visor de documentos, carta o mazo) puede mostrar su tipo y su identificador al pasar el ratón por encima, sin necesidad de abrirlo, con el formato "Tipo: id".

En modo edición, la etiqueta identificativa se muestra siempre, para cualquier componente, sin poder desactivarse. En modo juego, en cambio, cada componente tiene en sus propiedades generales (modal de edición, pestaña "Generales") un checkbox "Mostrar tooltip", desactivado por defecto: solo si está activado ese componente muestra el tooltip identificativo en modo juego; si está desactivado (el caso por defecto, y el de cualquier componente creado antes de que existiera este checkbox), no se muestra ningún tooltip en modo juego para ese componente.

- **Disponible en**: modo juego (tooltip nativo del navegador al dejar el ratón quieto sobre el componente, solo si el componente tiene "Mostrar tooltip" activado) y modo edición (una pequeña etiqueta propia anclada en la esquina superior izquierda del componente, visible en los mismos momentos en que ya se resalta con el contorno azul discontinuo: al pasar el ratón por encima o cuando está seleccionado, sin depender de ningún checkbox).
- **Código**: 00032, 00034.
- **Desde**: 2026-07-19
- **Última modificación**: 2026-07-19
