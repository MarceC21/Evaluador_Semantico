# Progreso del proyecto — bitácora

Resumen de qué está listo, qué falta y qué decidí por mi cuenta, para
retomar el trabajo sin tener que releer toda la conversación. Se
actualiza al final de cada fase o cuando pasa algo importante.

## Estado del repositorio

- Repo git local en `interfaz/` (la carpeta ES la raíz del repo),
  remoto `origin` → `https://github.com/MarceC21/Evaluador_Semantico.git`.
- Trabajo en la rama **`interfaz-mar`**, para no chocar con lo que suba
  mi compañera a `main`. No se ha hecho ningún push ni merge todavía.
- `origin/main` ya tiene el trabajo de la compañera del parser (ver
  sección "Lo que entregó la compañera 1" más abajo). Las dos ramas
  **no comparten historia** (`git merge-base` no encuentra ancestro
  común), porque inicié el repo local vacío antes de traer lo del
  equipo. La fusión se resuelve en la Fase 4, no antes.
- `CLAUDE.md` y todo `docs/*.md` (incluido este archivo) están en
  `.gitignore`: viven en mi disco pero no se suben al repo compartido.
  Solo `README.md` se sube. Esto fue un pedido explícito de Mar.

## Fase 2 (interfaz base) — TERMINADA

Archivos: `index.html`, `css/estilos.css`,
`js/{api,app,ui-lenguaje,ui-interpretacion,ui-formula,ui-resultado}.js`,
`mock/motor-mock.js`, `mock/casos/casos.js`, `assets/fonts/LEEME.txt`,
`README.md`.

Funciona con datos mock (`LN.USAR_MOCK = true` en `js/api.js`):

- **Lenguaje:** fichas de constantes/funciones/predicados con botones
  + / −. Precargado `k`, `f(1)`, `P(1)`, `Q(1)`, `R(2)`.
- **Interpretación:** dominio como fichas con dibujito SVG navideño
  (sin emojis), tabla con `<select>` para funciones/constantes
  (producto cartesiano completo), tuplas arrastrables entre
  "disponibles" y "pertenecen" (también con clic/Enter por
  accesibilidad). Al quitar un elemento del dominio se limpian tuplas
  y valores que lo usaban.
- **Fórmula:** campo + capa espejo para subrayar errores, teclado
  simbólico siempre visible, atajos (`~ ! & | -> A. E.`) normalizados
  en vivo, autocompletar paréntesis.
- **Entorno:** tarjeta que solo aparece si hay variables libres.
- **Resultado:** Verdadero/Falso grande con ✓/✕ y la razón del nodo
  raíz. Nunca se muestra valor de verdad si algo falló antes.
- **Orden de llamada:** `validarInterpretacion → analizarFormula →
  validarEntorno → evaluar`, deteniéndose en el primer `ok:false`.
- `mock/motor-mock.js` es un parser + evaluador **reales** (no solo
  los 3 casos fijos): sirve para probar cualquier fórmula válida del
  lenguaje del contrato mientras el motor real no está listo.
- Columna derecha: por ahora solo tiene un espacio reservado para el
  árbol (eso es Fase 3).

Decisiones propias quedaron anotadas con detalle en `docs/DEFENSA.md`;
las más importantes:

- Aviso (sin bloquear) si un predicado tiene más de 50 tuplas posibles
  (`dominio^aridad > 50`).
- Los atajos de teclado se reemplazan letra por letra, no solo al
  evaluar, para que la posición de un error siempre coincida con lo
  que el usuario ve en pantalla.
- Funciones y predicados comparten un solo espacio de nombres (no se
  pueden repetir nombres entre ellos).
- Aridad mínima 1 para agregar funciones/predicados nuevos desde la
  interfaz; aridad 0 solo existe como "constante".
- En los cuantificadores, `nodos[id]` guarda el elemento decisivo
  (contraejemplo o testigo) o, si no hay, el primer elemento del
  dominio — es la propuesta que quedó pendiente de confirmar en
  `docs/CONTRATO.md`.

Pendiente, no bloqueante: faltan los archivos reales de fuente
(Pinyon Script, Quicksand) en `assets/fonts/`; mientras tanto se usa
el respaldo `cursive`/`sans-serif` sin romper nada.

## Lo que entregó la compañera 1 (parser) — revisado, no integrado

Vive en `origin/main` (raíz del repo, fuera de `interfaz/`):
`tokenizador.js`, `parser.js`, `validaciones.js`, `motor.js`,
`tipos.js`, `utils.js`, `arbol.js`, más su propio `index.html` y
`src/app.js` de **prueba** (para ver JSON/árbol mientras desarrolla,
no es la app final) y `tests/*.test.js`.

Confirmé revisando el código real (no solo su reporte):

- Parser descendente recursivo correcto, con la misma precedencia
  Huth & Ryan que ya usa mi mock (`¬`, `∀/∃` > `∧` > `∨`, `→` asocia a
  la derecha).
- `motor.js` → `prepararEvaluacion()` solo junta las 3 validaciones y
  devuelve el AST listo; el `evaluar()` real (testigo, contraejemplo,
  comprobación completa) todavía no existe. Lo hace la compañera 2.
- Su salida agrega campos **extra** sobre el contrato original, que no
  rompen nada pero hay que decidir si la interfaz los usa: `ligadas`,
  `pos:[inicio,fin)` por nodo, `alcance` por cuantificador, `ligadaPor`
  por variable, nodo `igual` (para `=`), código de error
  `NOMBRE_RESERVADO`, y `donde` en vez de `posicion` en errores de
  interpretación/entorno. `pos`/`alcance`/`ligadaPor` son justo lo que
  pide `DISENO.md` para resaltar nodos en el árbol — conviene
  aprovecharlos en la Fase 3/4.

### Dos pendientes para la Fase 4 (integración), anotados pero sin tocar su código

1. **Módulos ES:** su código usa `import`/`export`
   (`package.json: {"type":"module"}`), lo que choca con la regla de
   abrir `index.html` con doble clic sin servidor. Ella misma lo
   señaló y pidió que le avisen antes de cambiar su código — decisión
   de equipo, no mía.
2. **Mismo nivel de raíz:** su `index.html`/`README.md` de prueba
   están en la raíz del repo, igual que los míos (porque mi rama tiene
   `interfaz/` como raíz). Al fusionar las ramas va a haber conflicto
   de rutas en esos archivos — se resuelve en la Fase 4.

## Próximo paso

Fase 3: árbol navideño (SVG, guirnalda, animación en cascada, paso a
paso, clic en nodo), siguiendo `docs/DISENO.md`. Pendiente de
confirmación de Mar para empezar.
