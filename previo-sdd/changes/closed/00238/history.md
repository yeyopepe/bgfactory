# Prompt history — 00238

Historical information about the analysis process, not current information. Records, verbatim and without rephrasing, the successive prompts with which the user raised and expanded this entry — they can be incomplete or contradictory with each other, since they reflect how the request evolved session by session, not the final result (that lives in `description.md`).

**Exclusive use of `pv-new` and `pv-fix`.** No other skill in the framework (`pv-how`, `pv-do`, `pv-status`, etc.) should read this file or take it into account: the source of truth for what's being asked is always `description.md`.

## 2026-09-05 — initial session

pensemos un framework de tests funcionales

> quiero ver qué dependencias y cobertura da cada punto A y B

> descartado lo que sea manua, qué nos queda?

> Ok. documenta el cambio y añade una descripción de la arquitectura técnica (carpetas, ficheros) y del procecidimiento

> Quiero documentado el arbol de carpetas y ficheros y añade también carpeta/ficheros de un caso de ejemplo: crear un componente tipo carta, crear una copia, cambiar algo en el diseño de la carta y comprobar que se ha cambiado tanto en el original como en la copia

> Añade también que estos tests deberían corresponderse con lo que tiene la documentación funcional. sería interesante modificar la documentación funcional para añadir en cada funcionalidad el código del tests o los tests que puedan existir (cada test debería tener un código único)? Se te ocurre algo mejor?

> ¿Y si creamos un documentación adicional con una tabla que relacione cada funcionalidad de la documentación con uno o varios tests relacionados?

> No podemos cambiar ninguna plantilla ni fichero del framework Previo

> Ok, documenta todo esto, añade un ejemplo del fichero TRACEABILITY.md. También quiero una lista básica de los primeros tests a implementar con la funcionalidad más básica posible. Luego lanza /pv-how 238

Decisiones cerradas en esta sesión: (1) generador de TRACEABILITY.md entra en el alcance actual; (2) numeración de tests ligada a la funcionalidad, formato `FT-<NNN>-<nn>`; (3) test que declara una funcionalidad inexistente = fallo de la batería; funcionalidad sin test = solo informe; (4) la documentación funcional ya está completa (40 fichas) — este cambio no crea ni modifica fichas; (5) `package.json` en la raíz del repo.

> Crea una batería de tests inicial muy básica

