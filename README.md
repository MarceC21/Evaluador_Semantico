# Lógica Navideña — interfaz

Evaluador semántico de lógica de primer orden para MM3032 (UVG). Esta
carpeta es HTML + CSS + JS puro: se abre con doble clic en `index.html`,
sin instalar nada ni necesitar internet.

## Cómo probar ahora mismo

Abre `index.html` en el navegador. Ya viene cargado con un lenguaje y
una interpretación de ejemplo (constante `k`, función `f`, predicados
`P`, `Q`, `R`, dominio `{a, b, c}`). Escribe una fórmula (por ejemplo
`∀x (P(x) → P(x))`) y presiona **Evaluar**, o usa el menú "Cargar
ejemplo" de arriba.

Ver `docs/PRUEBAS.md` para la lista completa de pruebas manuales.

## Cómo está organizado

```
index.html              Página única, sin build.
css/estilos.css         Paleta y layout (ver docs/DISENO.md).
js/api.js               Interruptor LN.USAR_MOCK + puente hacia el motor.
js/app.js               Estado global y orquestación de las tarjetas.
js/ui-lenguaje.js       Tarjeta 1: fichas de constantes/funciones/predicados.
js/ui-interpretacion.js Tarjeta 2: dominio, tabla de funciones, tuplas.
js/ui-formula.js        Tarjeta 3: campo de fórmula, teclado, errores.
js/ui-resultado.js      Resultado grande (Verdadero/Falso) y errores.
mock/motor-mock.js      TEMPORAL: parser + evaluador de prueba.
mock/casos/casos.js     3 casos para "Cargar ejemplo".
docs/                   CONTRATO.md, DISENO.md, DECISIONES.md, PRUEBAS.md, DEFENSA.md.
```

El árbol navideño (`js/arbol.js`, `js/guirnalda.js`, `js/animacion.js`)
todavía no existe: es la Fase 3. Por ahora la columna derecha solo
tiene un espacio reservado.

## Cómo integrar las funciones reales de mis compañeras

Todo el contrato de datos está en `docs/CONTRATO.md`. Para conectar las
funciones reales en vez del mock:

1. Mete los archivos de mis compañeras en la carpeta (por ejemplo
   `motor/` o como ellas prefieran) y que definan:
   - `LN.real.analizarFormula(texto, lenguaje)`
   - `LN.real.validarInterpretacion(lenguaje, interpretacion)`
   - `LN.real.validarEntorno(libres, interpretacion, entorno)`
   - `LN.real.evaluar(ast, interpretacion, entorno)`
     con exactamente la forma de entrada/salida de `docs/CONTRATO.md`.
2. Agrega sus `<script>` en `index.html` antes de `js/app.js`.
3. En `js/api.js` cambia:
   ```js
   LN.USAR_MOCK = false;
   ```
4. Ya no hace falta cargar `mock/motor-mock.js` (puedes dejarlo o
   quitar su `<script>`, da igual: con `USAR_MOCK = false` no se usa).
5. Prueba con fórmulas reales siguiendo `docs/PRUEBAS.md`.

## Motor mock (temporal)

`mock/motor-mock.js` es un parser y evaluador reales (no solo casos
fijos): sirve para probar cualquier fórmula válida del lenguaje mientras
el motor real no está listo. Tiene su propio comentario "TEMPORAL" al
inicio del archivo.
