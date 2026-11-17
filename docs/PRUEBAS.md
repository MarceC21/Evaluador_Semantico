# Pruebas manuales — Fase 2 (interfaz base, con mock)

Abre `index.html` con doble clic. Todo lo de abajo se prueba con el
lenguaje e interpretación de ejemplo que ya viene cargada (constante
`k`, función `f`, predicados `P`, `Q`, `R`, dominio `a, b, c`) salvo
que se diga lo contrario.

## 1. Lenguaje

1. En "Constantes", escribe `m` y presiona **+ Agregar**. Debe
   aparecer una ficha `m (aridad 0)`. En "Interpretación" debe
   aparecer de inmediato una fila nueva `m` con un `<select>` vacío.
2. En "Funciones", intenta agregar un nombre repetido (por ejemplo
   `k`). Debe salir un mensaje de error y no debe duplicarse la ficha.
3. Quita la ficha `R (aridad 1)` con el botón `−`. Debe desaparecer de
   "Predicados" y también su bloque completo en "Interpretación". Si
   la fórmula actual usaba `R`, debe aparecer el error
   `SIMBOLO_DESCONOCIDO` al escribirla de nuevo.
4. Agrega un predicado `S` con aridad `2`. Debe aparecer en
   "Interpretación" con sus zonas de tuplas (ahora habrá más tuplas
   posibles porque la aridad es 2).

## 2. Interpretación

1. Escribe `d` en el campo del dominio y presiona Enter. Debe aparecer
   una ficha nueva con un dibujito distinto a los anteriores (se
   reciclan los 8 dibujos en orden si hay más elementos).
2. Intenta agregar `a` de nuevo (ya existe). Debe salir un mensaje de
   error y no debe duplicarse.
3. En la tabla de `f`, dejar una fila sin elegir valor y presionar
   Evaluar (con una fórmula válida que use `f`). Debe salir el error
   `FUNCION_INCOMPLETA` y nunca un valor de verdad.
4. Mueve con el **mouse** (arrastrar) una tupla de "Tuplas disponibles"
   de `P` a "Pertenecen a P". Debe pasar a la otra columna.
5. Repite el paso anterior pero con **teclado**: dale Tab hasta una
   ficha de tupla y presiona Enter. Debe moverse igual que al arrastrar.
6. Vacía por completo "Pertenecen a Q" (mueve su única tupla de vuelta
   a disponibles) y presiona Evaluar. Debe salir `RELACION_VACIA`.
7. Quita el elemento `b` del dominio. Las tuplas y valores de función
   que usaban `b` deben desaparecer solos (sin dejar basura).
8. Agrega un predicado de aridad 3 con un dominio de 4 elementos
   (4³ = 64 tuplas). Debe aparecer el aviso de "hay muchas tuplas
   posibles" pero la interfaz no debe trabarse ni bloquear nada.

## 3. Fórmula

1. Escribe `A.x P(x)` (atajo de ∀). Debe convertirse solo en `∀x P(x)`.
2. Escribe `~P(x) & Q(x)`. Debe convertirse en `¬P(x) ∧ Q(x)`.
3. Escribe `P(x) -> Q(x)`. Debe convertirse en `P(x) → Q(x)`.
4. Escribe un paréntesis `(` suelto: debe autocompletarse a `()` con
   el cursor en medio. Si ahora escribes `)` justo donde ya hay un
   `)`, el cursor debe saltarlo en vez de duplicarlo.
5. Usa los botones del teclado simbólico (¬ ∧ ∨ → ∀ ∃ x y z y los
   símbolos declarados) y confirma que cada uno inserta lo esperado
   en la posición del cursor.
6. Escribe `P(a,b)` (aridad incorrecta). Debe subrayarse en rojo la
   posición del error y aparecer el mensaje `[ARIDAD] ...` debajo. El
   botón Evaluar no debe mostrar ningún valor de verdad.
7. Escribe `Z(x)` (símbolo no declarado). Debe salir
   `[SIMBOLO_DESCONOCIDO] ...`.
8. Escribe una fórmula con un paréntesis sin cerrar, por ejemplo
   `∀x (P(x)`. Debe salir `[SINTAXIS] ...`.
9. Quita todos los predicados del lenguaje (tarjeta 1) con una fórmula
   ya escrita que los use: debe recalcularse el error en vivo sin que
   haga falta presionar Evaluar.

## 4. Entorno

1. Escribe `P(x)` (variable libre `x`, no está bajo ningún
   cuantificador). Debe aparecer la tarjeta 4 "Entorno" con un
   `<select>` para `x`.
2. Presiona Evaluar sin elegir un valor para `x`. Debe salir
   `[ENTORNO_FALTANTE] ...`.
3. Elige un valor del dominio para `x` y presiona Evaluar. Ya debe
   dar un resultado (Verdadero o Falso según si `x` está en `P`).
4. Escribe una fórmula sin variables libres (por ejemplo `∀x P(x)`).
   La tarjeta 4 debe desaparecer sola.

## 5. Resultado y razones

1. Carga el ejemplo "∀ verdadero" del menú de arriba. Debe mostrar
   **Verdadero** (fondo amarillo, ✓) y una razón que mencione que se
   cumple para todo elemento del dominio.
2. Carga el ejemplo "∃ verdadero con testigo". Debe mostrar
   **Verdadero** y la razón debe nombrar el testigo (`a`).
3. Carga el ejemplo "∀ falso con contraejemplo". Debe mostrar
   **Falso** (fondo rosado, ✕) y la razón debe nombrar el
   contraejemplo (`b`).
4. Prueba una fórmula con funciones anidadas, por ejemplo `P(f(k))`.
   Debe evaluarse igual que las demás (sin errores ni casos
   especiales): primero calcula `k`, luego `f(k)`, y evalúa `P` sobre
   ese resultado.

## 6. General

1. Reduce el ancho de la ventana del navegador (menos de 900px). Las
   dos columnas deben apilarse una encima de la otra sin romperse.
2. Colapsa y expande cada una de las 4 tarjetas con el mouse y con
   teclado (Tab + Enter en el encabezado). Debe abrir y cerrar sin
   perder lo que había adentro.
3. Navega toda la pantalla solo con teclado (Tab, Shift+Tab, Enter,
   flechas en los `<select>`). No debe quedar ningún control
   inalcanzable.
