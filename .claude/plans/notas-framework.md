# Puntos realmente diferenciadores con otros frameworks similares
- Foco en la validación visual: mockups y diagramas para validar pantallas y flujos.
- Diseñado para que la construcción sea 100% basada en IA: 
    - documentación técnica escrita específicamente para la IA, no para humanos.
    - pensado para no tener que revisar código
    - el humano trabaja solo en la dirección del proyecto, no en cómo se construye.
- Framework guiado exclusivamente mediante la interacción con la IA, sin tener que ejecutar comandos en un terminal ni otras herramientas, eso ya lo hace la IA. Puede suponer mayor consumo de tokens comparado con otros frameworks, pero creo que su simplicidad y facilidad de uso lo compensa.
- Simplicidad: XXXXXX
- Pensado para proyectos de cualquier tamaño PERO con una condición fundamental: Trabajo rápido y secuencial (cambios de uno en uno, sin desarrolladores en paralelo que hagan PRs que luego haya que combinar). La velocidad en el diseño y aplicación de cambios es tal, que suple con creces el coste de paralelizar el trabajo y luego combinarlo.
- Configurable:
    - fichero de contexto dónde elegir modelos a usar según tareas, rutas con la documentación, etc
    - diversas templates
- Extensible:
    - Indicaciones técnicas y de estilo mediante documentación mantenida al 100% por la IA
    - Pudiendo cambiar habilidades específicas, como la creación de mockups

| Complejidad proyecto | Recomendación |
|---|---|
| Baja | 1 repo, 1 dev |
| Media | 1 repo, 1 dev |
| Alta | n repos, n devs |

Posibles nombres y prefijo para las skills:
- FastSDD: f, fs, fst
- IASDD: 
- OnlyIA: oia
- VisualSDD: v, vs
    