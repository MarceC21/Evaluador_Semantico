# Defensa — Fase 2 (interfaz base)

Explicación simple de cómo funciona cada parte, para la defensa
individual. Se actualiza en cada fase.

## Orden general

Cuando presiono **Evaluar**, la interfaz llama las funciones de
`LN.api` en el orden que marca `docs/CONTRATO.md`:

1. `validarInterpretacion(lenguaje, interpretacion)` — revisa que el
   dominio no esté vacío, que cada función tenga un valor para cada
   combinación de argumentos, y que cada predicado tenga al menos una
   tupla.
2. `analizarFormula(texto, lenguaje)` — convierte el texto en un árbol
   (AST) y calcula las variables libres. Esto en realidad ya se hizo
   en vivo mientras escribía, para poder subrayar errores al instante;
   al presionar Evaluar se repite por si el lenguaje cambió mientras
   tanto.
3. `validarEntorno(libres, interpretacion, entorno)` — revisa que cada
   variable libre tenga un valor del dominio asignado.
4. `evaluar(ast, interpretacion, entorno)` — calcula si la fórmula es
   verdadera o falsa y por qué.

Si cualquiera de los tres primeros pasos falla, me detengo ahí mismo y
muestro los errores: nunca se llega a mostrar un valor de verdad con
una entrada incorrecta.

## Lenguaje (tarjeta 1)

Cada símbolo (constante, función o predicado) es una "ficha" con su
nombre y aridad. Las constantes son, por definición del contrato,
funciones de aridad 0 (por eso internamente viven en el mismo arreglo
`lenguaje.funciones`, solo que la interfaz las muestra en su propia
sección para que no se vean como "una función sin argumentos"). No se
permite repetir un nombre entre funciones y predicados, para que la
fórmula nunca sea ambigua sobre qué es cada símbolo.

## Interpretación (tarjeta 2)

- **Dominio:** cada elemento es una ficha con un dibujito navideño
  (sin emojis, son SVG dibujados a mano) que se asigna según la
  posición del elemento; si hay más elementos que dibujos, se repiten
  en el mismo orden.
- **Funciones y constantes:** se arma una tabla con todas las
  combinaciones posibles de argumentos (el producto cartesiano del
  dominio, según la aridad) y un `<select>` por fila. Si una fila no
  tiene valor elegido, se marca en rosado y al evaluar da
  `FUNCION_INCOMPLETA`.
- **Predicados:** las tuplas posibles se reparten en dos zonas,
  "disponibles" y "pertenecen". Se pueden mover arrastrando (HTML5
  drag and drop) o, para que cualquiera pueda usarlo sin mouse, con un
  clic o con Enter sobre la ficha (hace lo mismo que arrastrarla a la
  otra zona).
- Si se borra un elemento del dominio, se limpian automáticamente las
  tuplas y los valores de función que lo usaban, para no dejar datos
  inválidos sueltos.

**Decisión propia:** si el número de tuplas posibles de un predicado
pasa de 50 (dominio^aridad > 50), se muestra un aviso ("hay muchas
tuplas posibles...") pero no se bloquea nada; seguir mostrando todas
las tuplas es más simple y más honesto que paginar o esconder.

## Fórmula (tarjeta 3)

El campo de texto tiene una "capa espejo" exactamente del mismo
tamaño por debajo: cuando hay un error, esa capa dibuja un subrayado
rojo en la posición exacta que reportó el analizador, y el campo de
texto de encima sigue mostrando el texto normal (con fondo
transparente) para que el cursor y la selección se vean bien.

Los atajos de teclado (`~`, `!`, `&`, `|`, `->`, `A.`, `E.`) se
reemplazan por el símbolo real apenas se escriben, no solo antes de
enviar la fórmula. Esto es a propósito: si el reemplazo pasara
"por detrás" sin tocar lo que ve el usuario, la posición de un error
(que cuenta caracteres) no coincidiría entre lo que el usuario ve y lo
que detecta el analizador, y el subrayado quedaría desalineado.

El paréntesis `(` siempre se autocompleta a `()` con el cursor en
medio (igual al escribirlo que al usar el botón del teclado
simbólico), y escribir `)` justo antes de un `)` que ya existe solo
mueve el cursor en vez de duplicarlo.

## Entorno (tarjeta 4)

Solo aparece si la fórmula actual tiene variables libres (el campo
`libres` que devuelve `analizarFormula`). Por cada variable libre hay
un `<select>` con los elementos del dominio. Si falta elegir alguna,
`validarEntorno` responde `ENTORNO_FALTANTE` al evaluar.

## Resultado

Verdadero se muestra en amarillo con ✓, falso en rosado con ✕ (nunca
solo por color, siempre con el símbolo también, para quien no
distinga bien los colores). La razón que se muestra es la del nodo
raíz del árbol (`nodos[raiz].razon`), que ya viene en español simple
desde el motor.

## El motor mock (`mock/motor-mock.js`)

Es TEMPORAL: lo van a reemplazar las funciones reales de mis
compañeras. Mientras tanto, programé un parser y un evaluador de
verdad (no solo los 3 casos fijos) para poder probar cualquier fórmula
válida del lenguaje:

- **Precedencia:** ¬, ∀ y ∃ ligan más fuerte que ∧, que liga más
  fuerte que ∨, y → asocia a la derecha (estilo Huth & Ryan, como
  propone `docs/CONTRATO.md`).
- **Variable vs. constante:** un identificador que coincide con una
  función declarada en el lenguaje se trata como función (o constante
  si su aridad es 0); cualquier otro identificador en esa posición es
  una variable, esté o no en el dominio como nombre de elemento (son
  espacios distintos: un elemento del dominio se llama "a" nada más
  por casualidad, no amarra el símbolo "a" de la fórmula a ser una
  constante).
- **Nodo "decisivo" en los cuantificadores:** como el contrato señala
  que `nodos[id]` solo guarda un valor por nodo, pero el cuerpo de un
  `∀`/`∃` se evalúa una vez por cada elemento del dominio, el motor
  guarda el valor del **elemento decisivo** (el contraejemplo si el
  `∀` es falso, el testigo si el `∃` es verdadero) y, si no hay ninguno
  (`∀` verdadero o `∃` falso), el del primer elemento del dominio. Esto
  es justo la propuesta que quedó anotada como pendiente de confirmar
  en `docs/CONTRATO.md`.

## Pendiente para fases siguientes

- El árbol SVG, la guirnalda y las animaciones son la Fase 3: por
  ahora la columna derecha solo tiene un espacio reservado.
- Los archivos de fuente reales (Pinyon Script y Quicksand) todavía no
  están en `assets/fonts/`; mientras tanto se usa el respaldo
  (`cursive` / `sans-serif`) sin romper nada. Falta que Mar consiga los
  `.woff2` y los copie ahí con los nombres que ya espera
  `css/estilos.css` (ver `assets/fonts/LEEME.txt`).
