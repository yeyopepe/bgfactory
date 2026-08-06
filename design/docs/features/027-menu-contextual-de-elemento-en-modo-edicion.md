# 027 — Menú contextual de elemento en modo edición

**Área**: Mesa de juego

En modo edición, pulsar el botón derecho del ratón sobre un elemento de la mesa abre, junto al cursor, un menú contextual con dos secciones — a diferencia del menú de modo juego, aquí no depende del ajuste "Click derecho" del componente ni de si está bloqueado: siempre se abre, e incluye siempre las mismas acciones.

Si el elemento pulsado no formaba parte de la selección en ese momento, el click derecho lo selecciona a él en solitario (reemplazando cualquier selección anterior, igual que un click izquierdo normal); si ya formaba parte de una selección múltiple, esa selección se mantiene intacta. El menú actúa siempre sobre el conjunto resultante — uno o varios elementos.

- **Sección de acciones**: "Clonar" y "Copiar" (mismo efecto que sus botones equivalentes del panel de listado de Componentes, ver [Panel flotante de componentes](003-panel-flotante-de-componentes-con-seleccion-resaltado-arrastre-y-redimensionado.md)) y "Eliminar" (mismo efecto y misma confirmación que ya tiene la tecla SUPR, ver [Atajos de teclado en modo edición](028-atajos-de-teclado-en-modo-edicion.md)). Con varios elementos afectados, cada acción se aplica a todos ellos: se clonan todos, se copian todos, o se eliminan todos (con la ventana de confirmación en bloque si son dos o más). Si alguno de los elementos afectados es una Copia vinculada (ver [Elementos tipo Copia, vinculados y sincronizados con un original](005-elementos-tipo-copia-vinculados-y-sincronizados-con-un-original.md)), "Clonar" y "Copiar" lo omiten en silencio y actúan solo sobre el resto — igual que sus botones no aparecen para una fila que ya es una Copia; si **todos** los elementos afectados son Copias, ambas filas aparecen deshabilitadas.
- **Sección "Añadir a grupo"**: una fila con un desplegable de todos los grupos existentes, en orden alfabético (ver [Grupos, organización de elementos por nombre](008-grupos-organizacion-de-elementos-por-nombre.md)). Elegir un grupo lo añade a todos los elementos afectados que todavía no lo tuvieran, sin quitarles ningún otro grupo al que ya pertenecieran ni tocar ninguna otra propiedad suya, y muestra un aviso breve de confirmación. Sin ningún grupo creado todavía en la partida, esta fila aparece deshabilitada.

El menú se cierra al hacer click fuera de él, al pulsar ESC, o al elegir cualquiera de sus acciones.

- **Disponible en**: modo edición.
- **Código**: 00170.
- **Desde**: 2026-08-06
- **Última modificación**: 2026-08-06
