# Navegación 00236 — Flujo del picker: componente individual vs conjunto pre-definido

Caso de uso: ¿Cómo responde el picker a la selección según el tipo de entrada?

Esta es la única distinción de navegación relevante del cambio: seleccionar un componente individual abre un modal de configuración (comportamiento existente), mientras que seleccionar un conjunto pre-definido dispara la creación inmediata sin paso intermedio.

```mermaid
flowchart TD
    Mesa["Mesa en modo edición"]
    Mesa --> Abrir["Usuario pulsa '+' — Añadir componente"]
    Abrir --> Picker["Picker se abre\n—————————————\nSección: Componentes\nSección: Conjuntos pre-definidos"]

    Picker --> DecTipo{"¿Qué selecciona\nel usuario?"}

    DecTipo -->|"Componente individual\n(Texto, Dado, Carta, Mazo…)"| ModalConfig["Se abre modal de configuración\ndel componente elegido"]
    ModalConfig --> Configura["Usuario configura el componente\n(tamaño, nombre, propiedades…)"]
    Configura --> DecConfirm{"¿Confirma\no cancela?"}
    DecConfirm -->|Confirma| CreaUno["Se crea 1 componente\nen la mesa"]
    DecConfirm -->|Cancela| PickerCierra1["Picker cierra\nsin crear nada"]

    DecTipo -->|"Conjunto pre-definido\n(Baraja francesa 54 cartas)"| CierraPickerAuto["Picker cierra inmediatamente\nsin modal de configuración"]
    CierraPickerAuto --> CreaMasiva["Sistema crea automáticamente:\n• 55 recursos SVG\n• 54 cartas + 1 mazo\n• 1 grupo automático\n• Posicionamiento en cuadrícula"]
    CreaMasiva --> MesaResultado["Mesa muestra la baraja\ndesplegada y agrupada"]

    CreaUno --> MesaUno["Mesa muestra\nel componente añadido"]
    PickerCierra1 --> MesaOriginal["Mesa sin cambios"]
```

**Nota:** el picker no tiene estado de "loading" visible entre la selección del preset y el resultado — la creación es síncrona desde el punto de vista del usuario (o con un indicador breve si el tiempo de generación de 55 SVGs lo requiere; `pv-how` lo decide).
