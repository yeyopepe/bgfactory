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
  - (1) Pelea: 1xherida, 2xesquiva, 1x-1enemigo, 2xdispersión
  - (1) Encuentros: 1x2zombis, 2x1zombi, 3xnada

## 0. Descripción
Errantes es un juego de supervivencia

### ¿Cómo se gana?

### ¿Cómo se pierde?
Los personajes pueden morir de muy diveras maneras:
- Estando en una localización cuando esta se infesta y se desata el apocalipsis.
- Cuando sufre una herida y ya no tiene ningún sitio para colocar la ficha de herida.



## 1. Preparación de la partida

### Componentes y mazos
- Prepara la bolsa de saqueo con todas las fichas de objetos básicos. Deja aparte todos los objetos fabricables.
- Prepara la pila inicial de basura
- Prepara la pila de objetos fabricables
- Cada jugador elige un personaje con:
  - 1 tablero de jugador
  - 1 ficha de personaje
  - 1 dado de búsqueda y 1 dado de combate más otros dados extra que pueda indicar el tablero de jugador.
  - <u>**???**</u> Toma cartas de trasfondo y resuélvelas
  - <u>**???**</u> Algunos objetos iniciales?
- Crea y braja el mazo de eventos.
- Crea y braja el mazo con localizaciones principales.
- Crea y braja el mazo con localizaciones secundarias (cartas alargadas).
- Crea y braja el mazo con localizaciones secundarias (cartas cuadradas).

### El personaje
- Tablero de personaje
  - Mochila
  - Acciones y dados extra

- Cartas de trasfondo

### El mapa
1. **Cartas de montaña**: Toma las 6 **cartas de montaña** y colócalas aleatoriamente dentro de las 3 zonas grises del tablero.
2. **Localizaciones principales**: Elige una casilla de localización principal del tablero (<icono>), toma la primera carta del mazo de **localizaciones principales** y colócala teniendo en cuenta que debes tapar la casilla con <icono>. Si no fuera posible tapar la casilla <icono> elegida, coloca la carta tapando otra casilla de localización principal <icono>. En el difícil caso que no puedas colocar la carta sobre ninguna casilla de localización principal, descártala y saca la siguiente carta.
Repite hasta colocar 4 localizaciones principales (quedarán casillas libres). Retira del juego las cartas sobrantes.
3. **Localizaciones secundarias**:
  1. Empezando desde la esquina superior izquierda ve sacando cartas del mazo de **localizaciones secundarias (cartas alargadas)** y colocándolas de izquierda a derecha y de arriba a abajo hasta haber cubierto el tablero todo lo posible.
  2. Es posible que obtengas una carta que no puedas colocar inmediatamante a la derecha y/o abajo de la última que colocaste. No pasa nada: colócala en el primer sitio que puedas más adelante y cuando saques la siguiente carta intenta colocarla en el hueco que has dejado anteriormente.
  3. No importa que vayan quedando casillas vacías en el tablero, pero intenta ir encajando cada carta de la mejor manera posible siguiendo siempre la dirección izquierda-derecha, arriba-abajo.
  4. Cuando ya no puedas colocar más cartas de localizaciones secundarias retira del juego las cartas sobrantes del mazo. También es posible que se hayan terminado.
  5. Finalmente rellena todas las casillas restantes con cartas del mazo con **localizaciones secundarias (cartas cuadradas)**. Cuandoel mapa esté completo retira del juego las cartas sobrantes del mazo.
4. En cada localización que permita subir su nivel de asentamiento coloca una ficha de nivel de asentamiento con valor 0.
5. **Pilas de saqueo**:
  1. Toma tantas fichas de la bolsa de saqueo como indique el límite de saqueo de la localización, barájalas y ponlas boca abajo formando una pila sobre la carta.
  2. Repite este paso hasta que todas las localizaciones tengan su pila de saqueo. Las fichas restantes déjalas en la bolsa.



### Calendario de eventos
Coloca el número de eventos para la primera semana según el nivel de dificultad elegido (ver sección [Termina la semana]()).

**Niveles de dificultad**
Número de eventos semanales:

| Dificultad | Semana 1 | Semana 2 |
|---|---|---|
| Fácil | 1 | 1 |
| Normal | 1 | 2 |
| Difícil | 2 | 3 |

Es posible que obtengas más de un evento para un mismo dia de la semana. En ese caso forma una pequeño mazo para ese día y, cuando llegue el momento de resolverlos, hazlo en estricto orden, terminando de resolver por completo cada evento antes de desvelar el siguiente.


## 2. Secuencia de juego

1. Avanza al día siguiente en el calendario. Si es domingo -> termina la semana. (Se omite en el turno 1)
2. Resuelve los eventos del dia actual y cada jugador calcula el número de acciones que puede realizar este nuevo día, que es la suma de:
  1. 1 acción (mínimo disponible siempre, salvo que una carta indique lo contrario)
  2. Número de casillas "+1" que estén visibles en la mochila (no tapadas por ningún objeto). Si durante el día alguna de estas casillas es tapada por un objeto, solo afectará al cálculo de acciones a partir del día siguiente.
  3. Número de acciones a sumar o restar por el efecto de las cartas.
3. Los jugadores pueden realizar sus acciones en el orden que elijan, pudiendo repetir un mismo tipo de acción varias veces.
4. Cuando todos los jugadores hayan agotado sus acciones principales, se termina el día.
   1. Cada jugador que esté en un enclave con médico disponible, se cura 1 herida.
   2. Si un jugador ha decidido no usar todas sus acciones, estás se pierden, no se acumulan para el día siguiente.
5. Si has jugado el último día de la última semana -> termina la partida.


#### Termina la semana

Cuando termina el domingo y, por lo tanto, la semana en curso:

1. Saca un objeto de la bolsa de saqueo y colocalo en la parte superior de la pila de saqueo de cada localización que tenga comerciantes (<icono>) disponibles. Si no quedan objetos en la bolsa de saqueo, no realices este paso.
2. Según el nivel de dificultad repite este paso las veces indicadas:
  1. Toma la primera carta del mazo de eventos (boca abajo,sin darle la vuelta) y colócalo en el día de la semana que indique el dorso de la que ahora es la primera carta del mazo.


#### Termina la partida

- Terminan las 2/3 semanas de juego
- El jugador recibe una herida pero no tiene niguna casilla en la que poder colocarla, por lo tanto muere
- <u>**???**</u> La esperanza del jugador llega a cero  y se suicida


## 3. Acciones que pueden realizarse siempre

### 3.1 Acciones que cuestan 1 punto de acción

### Moverse

Tu personaje se mueve de su localización a otra adyacente si cumple las condiciones:

- Si la localización de destino tiene un requisito solo puedes entrar en ella si tienes el/los objeto/s necesario/s en tu mochila (solo puede entrar el propietario y quién viaje con él) o si alguien antes que tú los ha dejado en la localización; mientras nadie retire esos objetos, cualquiera puede entrar en la localización.
- Si la localización de destino no indica nada, puedes moverte a ella libremente.

Cuando un jugador realiza esta acción puede llevar consigo a cualquier otro personaje que esté en su misma localización y quiera viajar con él. Esto no implica ninguna acción para estos personajes que acompañan al del jugador.
- <u>**???**</u> acción gratis al entrar en una localización
- <u>**???**</u> Si hay enemigos en la localización -> combate

- Si la localización tiene el icono 💀, se resuelve automáticamente un encuentro: tira tantos dados de encuentros como indique la carta y coloca en la localización tantos enemigos como indique la tirada.



### Subir el nivel de asentamiento
Para subir en 1 el nivel de asentamiento hace falta reunir en esa localización la cantidad de basura requerida. Las fichas de basura se pueden ir dejando encima de la carta de la localización hasta reunir el número indicado, en ese momento:
1. Se sube el nivel de asentamiento
2. Las fichas de basura se meten en la bolsa de saqueo

Todas las localizaciones empiezan con nivel de asentamiento 0, indicando la carta de cada localización cuál es el nivel máximo.

### Acciones con objetos
Las siguientes acciones solo pueden realizarla personajes que disponen de la combinación indicada de objetos

#### Radio + pilas
De vez en cuando captas alguna emisión interesante. Puedes hacer una de las siguientes acciones:
- Consigues información valiosa: puedes mirar la pila de saqueo de una localización cualquiera menos la tuya y devolverla en cualquier orden.
- Te anticipas a los enemigos: puedes mover hasta 3 enemigos de una misma localización (que no sea la tuya) a otra adyacente.




## 4. Acciones que pueden realizarse si NO hay enemigos en la localización

### 4.1 Acciones que cuestan 1 punto de acción

### Saquear
Esta acción permite al jugador saquear la localización en busca de objetos interesantes o necesarios. Para ello el jugador tira tantos dados de saqueo como indique el nivel de saqueo de la localización y resuelve sus resultados (ver apartado "Resultados del dado de saqueo").

Una vez resueltos los resultados de todos los dados, el jugador puede meter en su mochila un solo objeto entre todos los obtenidos, dejando todos los demás en la localización.

#### Resultados del dado de saqueo
- 🔩: Consigue una ficha de la pila de basura.
- 📦: Saca un objeto de la bolsa de saqueo.
- No encuentras nada.


### Cazar/pescar
En localizaciones dónde haya disponible animales para cazar o pescar <iconos>, si el jugador tiene en su mochila un arma o una caña de pescar, podrá conseguir 1 objeto comida.
- Caza: cuchillo y lanza.
- Pesca: caña de pescar.

### Comerciar
Una vez por turno: en localizaciones dónde haya disponible comerciantes <icono>, el jugador podrá intercambiar un objeto cualquiera de su mochila que no sea basura por el primero objeto de la pila de saqueo. Después de intercambiarlo, baraja la pila de saqueo.
Mete el objeto intercambiado en la pila de saqueo y barájala.

### Intercambiar
El jugador podrá gastar una acción para poder realizar cualquiera de estas actividades en el orden que quiera:
- Intercambiar cualquiera cantidad de objetos con otros jugadores que estén en la misma localización.
- Reordenar los objetos de su mochila.
- Dejar o recoger cualquier número de objetos que haya en la localización.

### Fabricar un objeto

Si estás en una localización que puede aumentar su nivel de asentamiento (independientemente de su valor), puedes realizar esta acción para combinar varios objetos que tengas en tu mochila o que estén en la localización y fabricar uno nuevo. Todos los objetos utilizados vuelven a la bolsa de saqueo y el objeto construido lo puedes meter en tu mochila, pudiendo reórdenarla si quieres dentro de la misma acción.

Consulta la [Lista de objetos]() para más información.


### 4.2 Acciones gratuitas

### Conseguir agua
<u>**???**</u>
Si el personaje dispone de una botella de agua, puede consumirla y rellenarla automáticamente, así que puede curarse 1 herida sin sacarla de su mochila.
Localización con icono de agua



## 5. Localizaciones infestadas
En el momento en que una localización llegue a su límite de enemigos, los jugadores deben colocar una ficha de Localización Infestada.
Las localizaciones con una ficha de Localización Infestada siguen funcionando igual que antes con la única excepción de que los jugadores no pueden entrar ni pasar por dicha casilla.
Si una localización llega a su límite de enemigos, los personajes que haya en esa localización mueren.

Límite enemigos de una localización = nivel de asentamiento x 5.
Límite para localizaciones con nivel de asentamiento 0 = 3.






## 6. Combate
Se produce un combate siempre que se cumple al menos una de las siguientes condiciones:

1. Si uno o varios personajes entran en una localización que contiene al menos 1 enemigo, realiza inmediatamente una secuencia de combate.
  
2. Si algún efecto añade enemigos en la localización en la que se encuentran uno o varios personajes, realiza inmediatamente una secuencia de combate.

Es posible que tras una sola acción tengas que realizar varias secuencias de combate, como por ejemplo:
1. Tu personaje entra en una localización que tiene 2 enemigos.
2. Realizas inmediatamente una secuencia de combate (1 dado) y obtienes 💀, así que retiras uno de los enemigos.
3. La localización tiene un nivel de peligro 1, así que tiras un dado de encuentros y obtienes un 2, por lo que añades 2 enemigos más a la localización (ahora hay 3).
4. Realizas inmediatamente otra secuencia de combate (1 dado) y obtienes una herida (🩸).

### Secuencia de combate
  1. Tira los dados de combate del personaje.
  2. <u>**???**</u> El jugador puede tirar de nuevo 1 dado por cada arma que tenga en una mano (Max 2)
  3. Resuelve los dados (ver apartado [Resultados del dado de pelea]())
  4. Si el personaje está en una localización con al menos nivel de asentamiento 1, mata tantos enemigos adicionales como el nivel de asentamiento.



#### Resultados del dado de pelea
- 🩸Herida: coloca una ficha de herida en un espacio vacío de su mochila. Si no tienes ningún espacio vacío puedes abandonar un objeto (colocándolo arriba del todo en la pila de saqueo de la localización actual) para colocar la herida en su lugar. Si tampoco puedes hacer esto, tu personaje muere.
Esta acción no permite mover ningún otro objeto de la mochila.
- 💀 Enemigo aniquilado: tu personaje consigue matar a un enemigo y descarta una ficha de enemigo de la localización actual.
- 💢 Dispersar: tu personaje gana tiempo y consigue dispersar al enemigo. Mueve un enemigo de tu localización a cada localización adyacente. Tu localización actual puede quedar vacía tras esta acción.
- 🏃‍♂️ Esquiva: tu personaje esquiva el ataque del enemigo.



## 7. La mochila

### Como añadir objetos a la mochila
Cada vez que consigas un objeto nuevo lo tendrás que meter en tu mochila. Para ello, tienes que colocar la ficha del objeto en una de las casillas disponibles de tu mochila teniendo en cuenta que siempre tienen que estar "apoyados" sobre algo: XXXX

Si en algún momento tienes que sacar un objeto de tu mochila (por ejemplo por efecto de alguna carta) y este tenía encima otros objetos, todos estos objetos que se apoyaban en él "caen" en tu mochila hasta volver quedar apoyados en otro objeto o en uno de los bordes de tu mochila. En este caso no puedes reordenar tu mochila hasta que realices la acción que te permita hacerlo (sigue leyendo.).

### Ordenar la mochila
Una vez colocado un objeto en la mochila solo puedes moverlo de 3 maneras:
- Con la acción de [Fabricar]() un nuevo objeto: en este caso primero saca de tu mochila los objetos necesarios para construir el nuevo, los metes de nuevo en la bolsa de saqueo y añades el nuevo a la mochila. En este momento puedes reordenar también los objetos de tu mochila si quieres.
- con las acciones de [Intercambiar]() y [Comerciar](): en este caso también puedes aprovechar para reordenar los objetos de tu mochila como quieras cuando saques o metas nuevas objetos fruto del intercambio.






## 8. Explicación de las cartas

### Cartas de localización
- Imagen: <imagen>
1. Fondo de la carta que representa la localización.
2. Requisito/s para entrar/pasar por la localización.
3. Nivel de asentamiento:
  1. Máximo nivel de asentamiento (ver acción [Subir el nivel de asentamiento]())
  2. Número de fichas de basura necesarias acumular en la localización para subir de nivel
4. Nivel de saqueo: indica el número de dados de saqueo que se pueden tirar en la localización (ver acción [Saquear]())
5. Acciones disponibles en la localización (iconos):
  1. Encuentros: indica el número de dados de encuentro que hay que tirar al entrar en esta localización (ver acción [Moverse]())
  2. Hay un médico disponible en la localización (ver [Secuencia de juego]())
  3. Hay comerciantes disponible en la localización (ver acción [Comerciar]())
  4. Se puede [Cazar]() en la localización.
  5. Se puede [Pescar]() en la localización.

### Cartas de evento
1. 💥: el efecto del evento debe resolverse de inmediato al reverla la carta.
2. 📅: el efecto del evento dura todo el día en curso.
3. 👨‍👩‍👧‍👦: cada jugador se ve afectado o debe resolver el efecto del evento.
4. 🙍‍♀️: solo el jugador que revela el evento debe resolver el efecto del evento.


## 9. Preguntas frecuentes

## 10. Lista de objetos

### Objetos básicos
| Objeto | Acción |
|---|---|
| Basura||
| Pilas ||
| Cinta aislante||
| Agua ||
| Desinfectante ||
| Linterna ||
| Barra de hierro ||
| Cuchillo ||
| Radio ||
| Comida ||
| Cuerda ||
| Palo ||
| Aguja ||
| Pico ||
| Saco de dormir ||
| Vendas ||
| Arco | Hay que tenerlo en la mochila (junto con flechas) para poder cazar en las localizaciones permitidas |
| Flechas | Hay que tenerlo en la mochila (junto con el arco) para poder cazar en las localizaciones permitidas |


### Objetos fabricables
| Objeto | Acción | Se fabrica con... |
|---|---|---|
| Botiquín | Retira inmeditamente hasta 3 fichas de herida. Luego devuelve este objeto a la pila de objetos fabricables | Vendas, Alcohol, Aguja |
| Caña de pescar || Hay que tenerlo en la mochila para poder pescar en las localizaciones permitidas | Palo, Cuerda |
| Lanza | Hay que tenerlo en la mochila para poder cazar en las localizaciones permitidas | Palo, Cuchillo, Cinta aislante |




