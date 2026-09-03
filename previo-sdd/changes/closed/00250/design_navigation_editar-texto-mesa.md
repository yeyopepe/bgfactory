# Navegación — editar el texto de la mesa desde Configuración

Caso de uso: cómo el usuario define o cambia el texto libre de la esquina inferior derecha de la mesa, y qué ve mientras lo hace.

```mermaid
stateDiagram-v2
    [*] --> Mesa

    Mesa: Mesa (modo juego o edición)
    Mesa: Esquina inferior derecha con el bloque de versión\n(y, si hay texto guardado, la nota encima)

    Configuracion: Modal "Configuración"
    Configuracion: Idioma · Texto en la mesa (editable) · Versión (solo lectura)

    Mesa --> Configuracion : clic en el icono de engranaje
    Configuracion --> Mesa : "Cerrar" / clic fuera / Esc (el texto ya está guardado)

    state Configuracion {
        [*] --> CampoVisible
        CampoVisible: Campo "Texto en la mesa" con el valor actual\n(vacío por defecto)
        CampoVisible --> Editando : el usuario escribe o borra en el campo
        Editando --> CampoVisible : cada cambio se guarda al momento\ny el footer de la mesa se refresca en vivo
    }

    note right of Configuracion
        Al refrescar el footer de la mesa:
        · texto con contenido → aparece encima de "BG Factory vXXXXX",
          en texto plano, respetando saltos de línea, con una fina
          línea separadora entre el texto del usuario y las líneas fijas
        · texto vacío → el footer vuelve a mostrar solo la versión
          y el enlace a GitHub, sin texto, sin separador ni hueco extra
        El texto es una preferencia global del navegador (como el idioma):
        sobrevive a recargas, NO se exporta ni importa con el juego.
    end note
```

## Notas

- El icono de engranaje que abre Configuración está disponible tanto en modo juego como en modo edición, así que este flujo se puede iniciar desde cualquiera de los dos.
- No hay paso de confirmación ni botón "Guardar": el texto se persiste a medida que se edita. "Cerrar" (o clic fuera / Esc) solo cierra el modal.
- El modal de Configuración no se cierra al editar; el usuario ve el footer de la mesa cambiar por detrás del modal en tiempo real.
