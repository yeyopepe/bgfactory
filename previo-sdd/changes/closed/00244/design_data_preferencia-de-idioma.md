# Datos — Preferencia de idioma del usuario

Definición funcional del dato que guarda la elección de idioma. **No** es una decisión sobre el mecanismo de almacenamiento ni el nombre técnico de la clave (eso lo resuelve `pv-how`): es qué información se guarda, qué valores admite y cómo se comporta ante ausencia o valores inválidos.

## Dato

| Dato | Descripción funcional | Valores posibles | Obligatorio |
|---|---|---|---|
| Idioma elegido por el usuario | El idioma en el que el usuario quiere ver la aplicación. Se guarda en el navegador, en un sitio **separado** de la información de la partida, para que sobreviva a los cambios de versión de la aplicación. | Uno de los códigos de idioma disponibles: `es`, `en`. (Ampliable si se añaden idiomas en el futuro.) | No — su ausencia es un estado válido (ver más abajo). |

## Comportamiento

| Situación | Resultado |
|---|---|
| Hay un valor guardado y corresponde a un idioma disponible | Ese es el idioma activo al arrancar. |
| No hay ningún valor guardado (usuario nuevo, o partidas anteriores a este cambio) | Se resuelve por **autodetección**: si el idioma del navegador es español → `es`; en cualquier otro caso → `en`. No se escribe nada hasta que el usuario elija explícitamente. |
| Hay un valor guardado pero no corresponde a ningún idioma disponible (dato corrupto o de una versión futura) | Se ignora y se resuelve por autodetección, igual que si no hubiera valor. |
| El usuario cambia el idioma en el panel de configuración | Se guarda el nuevo código de idioma en ese momento, sustituyendo el anterior. |
| Se importa una partida (fichero JSON) | No afecta a este dato: el fichero de partida no contiene el idioma y la importación no lo modifica. |
| Cambia la versión de la aplicación | Este dato **no** se ve afectado (a diferencia de la partida guardada, que se descarta). El idioma elegido se mantiene. |

## Alcance

- Un único valor por navegador y perfil. No se sincroniza entre navegadores ni dispositivos.
- No forma parte del objeto de estado de la partida ni del fichero de exportación.
