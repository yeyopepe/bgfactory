# Historial de prompts — 00208

Información histórica del proceso de análisis, no información vigente. Recoge, tal cual y sin reformular, los prompts sucesivos con los que el usuario ha ido planteando y ampliando esta entrada — pueden ser incompletos o contradictorios entre sí, ya que reflejan cómo evolucionó la petición sesión a sesión, no el resultado final (eso vive en `description.md`).

**Uso exclusivo de `ms-new` y `ms-fix`.** Ninguna otra skill del framework (`ms-how`, `ms-do`, `ms-status`, etc.) debe leer este fichero ni tenerlo en cuenta: la fuente de la verdad sobre qué se pide es siempre `description.md`.

## 2026-08-14 — sesión inicial

en las propiedades de todos elementos, pestaña general, hay que crear una nueva sección llamada "Ayuda jugador" y meter ahí dentro el check "mostrar tooltip" y un cuadro de texto llamado "Tooltip".
Esta sección "Ayudar jugador" debe estar debajo de la sección General.
El comportamiento es el siguiente:
- Si está marcado "mostrar tooltip" y hay un texto en "tooltip", se usa ese texto para mostrar al usuario.
- Si está marcado "mostrar tooltip" y no hay un texto en "tooltip", se usa el id para mostrar al usuario (comportamiento actual)

## 2026-08-14 — ampliación

Respuesta a la lista de dudas de alcance planteada por `ms-new`:

1. "Multilinea y soporte para html básico" (respecto al campo "Tooltip", en vez del `<input>` de una línea propuesto).
8. "Los mazos deben tener el mismo comportamiento, solo que el valor por defecto de su tooltip es 'Pulsa para sacar la primera carta' y el check se marca por defecto al crear nuevos mazos." (en vez de dejar "Mazo" fuera de alcance, como se había propuesto).

Pregunta de aclaración: "¿Un mazo ya existente (guardado antes de este cambio, sin los campos nuevos) debe seguir mostrando su tooltip por defecto tras el cambio, o se aplica la regla general (ausencia = desmarcado, deja de mostrarlo)?"
Respuesta: "Regla general, sin excepción".
