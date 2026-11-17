# Evaluador semántico de lógica de primer orden · MM3032

Entrega del Integrante 1: parser, validaciones y creación del árbol sintáctico.
La página permite probar estos módulos. El motor que calcula valores de verdad
y explica testigos o contraejemplos queda pendiente de implementación.

## Ejecutar la página

Desde la carpeta `Evaluador_Semantico`:

```bash
python3 -m http.server 8000
```

Abre http://localhost:8000. Detén el servidor con `Ctrl+C`.
Los módulos ES necesitan servirse por HTTP: no abras `index.html` con doble clic.
No hay dependencias que instalar ni paso de compilación.

1. Edita la fórmula y el lenguaje, o utiliza el ejemplo precargado.
2. Pulsa **Analizar fórmula y crear árbol** para comprobar solo la fórmula.
3. Pulsa **Validar todas las entradas** para comprobar también interpretación y entorno.
4. Inspecciona ids, posiciones, variables libres, ligadores y alcance en el árbol
   o en la salida JSON desplegable.

Los campos de lenguaje, interpretación y entorno utilizan JSON con comillas dobles.
El dominio utiliza etiquetas de texto no vacías: `"1"`, `"a"` o `"a b"`.
Un ejemplo abierto es `P(x) ∧ ∀x P(x)`, con entorno `{"x":"a"}`.
Una entrada incorrecta muestra errores y elimina cualquier resultado anterior.
La validación completa todavía no calcula verdadero/falso.

## Pruebas

Con Node.js:

```bash
node --test
```

`package.json` contiene únicamente `{"type":"module"}`, por lo que no hay
un script `npm test`. Usa el comando anterior.

## Estructura

```text
Evaluador_Semantico/
  index.html
  package.json
  README.md
  src/
    tipos.js
    utils.js
    tokenizador.js
    parser.js
    validaciones.js
    motor.js
    app.js
    arbol.js
  tests/
    parser.test.js
    motor.test.js
```


