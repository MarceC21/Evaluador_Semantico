# Decisiones de diseño (ya tomadas, no las vuelvas a preguntar)

Mar respondió o delegó estas decisiones con un criterio: **que se vea ordenado y que cumpla la rúbrica**. Si algo no está aquí y no bloquea el trabajo, decide tú siguiendo ese criterio y déjalo anotado en `docs/DEFENSA.md`.

## Estructura de la pantalla
- **Una sola página, sin pantalla de inicio.** Se entra directo a la aplicación.
- **Encabezado:** "Lógica Navideña" como título (Pinyon Script) y, en pequeño debajo, "EVALUADOR SEMÁNTICO" y una línea más chica "MM3032 · Lógica Matemática".
- **Dos columnas** en pantallas anchas (proyector). Si la ventana es angosta, las columnas se apilan.
  - **Izquierda (aprox. 40 %):** tarjetas numeradas y ordenadas: 1 Lenguaje, 2 Interpretación, 3 Fórmula (con teclado simbólico y botón Evaluar) y 4 Entorno (solo aparece si hay variables libres). Cada tarjeta se puede colapsar.
  - **Derecha (aprox. 60 %):** el **árbol navideño siempre visible**, fijo mientras se desplaza la columna izquierda. Debajo del árbol van el resultado grande (Verdadero o Falso) y la explicación.
- Menú pequeño "Cargar ejemplo" con los casos mock.

## Árbol
- **Crece en vivo mientras se escribe la fórmula**, con los nodos en gris (sin valor todavía).
- Solo se dibuja cuando la fórmula es válida. Mientras esté incompleta o con error, se queda el último árbol válido atenuado (opacidad .4). **Nunca se dibujan árboles a medias.**
- Al presionar Evaluar, las luces se encienden en cascada.
- Cada hoja muestra ✓ o ✕ además del color.
- Velocidad de la cascada **fija** (sin deslizador). Botón "Repetir animación".
- En "Paso a paso", el globito de explicación **aparece solo** en el nodo actual.
- Zoom con botones **+**, **−** y "Ajustar", y desplazamiento arrastrando. Sin zoom de rueda.

## Lenguaje (fichas con botones, para evitar programación defensiva)
- **Fichas** con botones **+** y **−** para agregar y quitar símbolos. Cada ficha muestra nombre y aridad.
- Tres secciones: **Constantes** (aridad 0 por dentro), **Funciones** (aridad 1 o más) y **Predicados**.
- **Símbolos de ejemplo ya cargados:** constante `k`, función `f` (aridad 1), predicados `P` (1), `Q` (1) y `R` (2).

## Interpretación
- **Dominio:** campo de texto donde cada elemento se agrega con Enter o coma y se convierte en **ficha** con una ✕ para quitarla. Los nombres son únicos. Ejemplo precargado: `a`, `b`, `c`.
- A cada elemento se le asigna automáticamente un **dibujito navideño en SVG** (estrella, regalo, campana, bastón de caramelo, esfera, copo de nieve, arbolito, calcetín), **además del nombre**. **Sin emojis.** Los dibujitos se reutilizan en orden si hay más elementos que dibujos.
- **Relaciones (predicados):** dos zonas, "Tuplas disponibles" y "Pertenecen a P". Las tuplas son **fichas arrastrables** que pasan de una zona a otra. Para accesibilidad, un clic o Enter también las mueve. Si D^n es muy grande, avisar con un mensaje, sin bloquear.
- **Funciones y constantes:** **tabla** con una fila por cada combinación de argumentos y un **menú desplegable** en la columna "valor". Todas las filas se muestran. Una constante es una sola fila.
- Si se quita un elemento del dominio, se limpian las tuplas y valores que lo usaban.

## Fórmula
- Campo de texto con **teclado simbólico siempre visible** debajo: ¬ ∧ ∨ → ∀ ∃ ( ), botones para `x`, `y`, `z` y un botón por cada símbolo declarado.
- **Autocompletar paréntesis:** al escribir `(` se inserta `()` con el cursor en medio, y escribir `)` sobre un `)` existente lo salta.
- Atajos: `~` o `!` por ¬, `&` por ∧, `|` por ∨, `->` por →, y opcionalmente `A.` por ∀ y `E.` por ∃.
- **Errores:** la posición del error se subraya en rojo dentro de la fórmula (capa espejo bajo el campo) y **debajo** aparece un mensaje en rojo, claro y amable, con el código. Nunca se muestra valor de verdad con errores.

## Mock funcional (solo para desarrollo)
Con `LN.USAR_MOCK = true`, `mock/` debe incluir un **motor de prueba mínimo y funcional** (`mock/motor-mock.js`) con un parser y un evaluador simples que implementen las 4 funciones del contrato, para poder probar **cualquier fórmula** y no solo casos fijos. Debe decir arriba, en un comentario, "TEMPORAL: lo reemplazan las funciones reales de mis compañeras". Además, `mock/casos/` con 3 ejemplos listos para el menú "Cargar ejemplo": un ∀ verdadero, un ∃ verdadero con testigo y un ∀ falso con contraejemplo.

## Lo demás
Lo que no esté aquí lo decide Claude Code con el criterio de la rúbrica: claridad, facilidad y funcionalidad, en ese orden, sin complicar el código de más.
