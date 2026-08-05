# 💥Errantes. Juego de mesa

## Elementos

- Tablero principal
- Cartas
  - Eventos
  - Misiones personales
  - Información: cartas con dos mitades que se resuelve una de las dos según se toma. Incluye indicación del enclave principal donde debe aparecer y una descripción
  - Trasfondos
  - Enclaves principales
  - Enclaves secundarios (circulares)
    - Enclave destruido/innaccesible
- Bolsa de saqueo
- Tableros jugador
  - Varios, con bloqueos y acciones adicionales pintadas 
- Tokens    
  - Objetos
  - Herida
  - Enemigos
  - Zombis
  - Personajes acompañantes
- Objetos
  - Materiales básicos
  - Objetos fabricables
- Dados
  - (1) Saqueo: 3xbasura, 1xnada, 2xobjeto
  - (1) Pelea: 2xherida, 1xesquiva, 2xnada, 1x-1enemigo
  - (1) Encuentros: 1x2zombis, 2x1zombi, 3xnada


## Preparación

- Prepara bolsa de saqueo con objetos básicos
- Prepara la pila de basura
- Cada jugador elige:
  - Un tablero de jugador
  - Toma 1 ficha de personaje
  - Toma 1 dado de búsqueda y 1 dado de combate
  - Toma cartas de trasfondo y resuélvelas 
- Baraja mazo de enclaves principales y saca uno a uno y colócalo en un lugar del tablero hasta completarlos.
- Baraja mazo de enclaves secundarios y saca uno a uno y colócalo en un lugar del tablero hasta completarlos.




## Secuencia de juego

1. Avanza al día siguiente en el calendario. Si es domingo -> termina la semana. (Se omite en el turno 1)
2. Resuelve los eventos del dia actual y cada jugador calcula el número de acciones que puede realizar este nuevo día, que es la suma de:
  1. 1 acción (mínimo disponible siempre, salvo que una carta indique lo contrario)
  2. Número de casillas "+1" que estén visibles en la mochila (no tapadas por ningún objeto). Si durante el día alguna de estas casillas es tapada por un objeto, solo afectará al cálculo de acciones a partir del día siguiente.
  3. Número de acciones a sumar o restar por el efecto de las cartas.
3. Los jugadores pueden realizar sus acciones en el orden que elijan, pudiendo repetir un mismo tipo de acción varias veces.
4. Cuando todos los jugadores hayan agotado sus acciones principales, se termina el día.
   1. Cada jugador que esté en un enclave con médico disponible, se cura 1 herida.
   2. Si un jugador ha decidido no usar todas sus acciones, estás se pierden, no se acumulan para el día siguiente.
5. Si has jugado la última semana -> termina la partida.



## Termina la semana

Cuando termina el domingo (y la semana):

1. Saca un objeto de la bolsa de saqueo y colocalo en cada enclave que tenga COMERCIANTE.
2. Baraja el mazo de eventos con las cartas boca abajo.
3. Toma la primera carta de evento y colócalo en el día de la semana que indique el dorso de la carta del mazo que estaba debajo y ha quedado a la vista.
4. Repite este paso hasta sacar el número de eventos indicado para la semana que va a comenzar.



## Termina la partida


## Acciones
### 1. Moverse

- requisitios para entrar en una localización: tenerlos en la mochila o que estén en la casilla.
- acción gratis al entrar en una localización: ?
- Si hay enemigos en la localización? -> combate

### 2. Saquear
Si en la localización actual queda algún objeto en la pila de saqueo, el jugador puede tirar 1 vez el dado de saqueo y, según el resultado, podrá conseguir una ficha de basura, el primer objeto en la pila de saqueo de la localización o simplemente nada.

Esta acción no puede realizarse si hay enemigos en la localización.

### 3. Cazar/pescar
En localizaciones dónde haya disponible animales para cazar o pescar <iconos>, si el jugador tiene en su mochila un arma o una caña de pescar, podrá conseguir 1 objeto comida.

Esta acción no puede realizarse si hay enemigos en la localización.

### 4. Comerciar
Una vez por turno: en localizaciones dónde haya disponible comerciantes <icono>, el jugador podrá intercambiar un objeto cualquiera de su mochila que no sea basura por el primero objeto de la pila de saqueo. Después de intercambiarlo, baraja la pila de saqueo.
Mete el objeto intercambiado en la pila de saqueo y barájala.

Esta acción no puede realizarse si hay enemigos en la localización.

### 5. Intercambiar
El jugador podrá gastar una acción para poder realizar cualquiera de estas actividades en el orden que quiera:
- intercambiar cualquiera cantidad de objetos con otros jugadores que estén en la misma localización.
- reordenar los objetos de su mochila.
- dejar cualquier número de objetos en la localización.

Esta acción no puede realizarse si hay enemigos en la localización.

### 6. Subir el nivel de asentamiento
Para subir en 1 el nivel de asentamiento hace falta reunir en esa localización la cantidad de basura requerida. Las fichas de basura se pueden ir dejando encima de la carta de la localización hasta reunir el número indicado, en ese momento:
1. Se sube el nivel de asentamiento
2. Las fichas de basura se meten de nuevo en la bolsa de saqueo

Esta acción no puede realizarse si hay enemigos en la localización.

### 7. Fabricar un objeto

Esta acción solo puede realizarse XXXXX
Esta acción no puede realizarse si hay enemigos en la localización.

### 8. Combate
- Cada vez que aparezcan nuevos enemigos en la localización del jugador realiza una secuencia de combate:
  - El jugador tira sus dados de combate 
  - El jugador puede tirar de nuevo 1 dado por cada arma que tenga en una mano (Max 2)
  - Resuelve los dados
- Cada vez que el jugador entre en una localización:
  1. Si hay al menos 1 enemigo en la localización -> ejecuta una secuencia de combate.
  2. Tira los dados de encuentro requeridos si es necesario. Si esto  añade enemigos nuevos a la localización -> ejecuta una nueva secuencia de combate.


## La mochila

### Como añadir objetos a la mochila
Cada vez que consigas un objeto nuevo lo tendrás que meter en tu mochila. Para ello, tienes que colocar la ficha del objeto en una de las casillas disponibles de tu mochila teniendo en cuenta que siempre tienen que estar "apoyados" sobre algo: XXXX

Si en algún momento sacas un objeto de tu mochila y este tenía encima otros objetos, todos estos objetos que se apoyaban en él "caen" en tu mochila hasta volver quedar apoyados en otro objeto o en uno de los bordes de tu mochila.


### Ordenar la mochila
Una vez colocado un objeto en la mochila solo puedes moverlo de 3 maneras:
- Con la acción de **fabricar un nuevo objeto**: en este caso primero saca de tu mochila los objetos necesarios para construir el nuevo, los metes de nuevo en la bolsa de saqueo y añades el nuevo a la mochila. En este momento puedes reordenar también los objetos de tu mochila si quieres.
- con las acciones de **intercambiar** y **comerciar**: en este caso también puedes aprovechar para reordenar los objetos de tu mochila como quieras cuando saques o metas nuevas objetos fruto del intercambio.


## Preguntas frecuentes