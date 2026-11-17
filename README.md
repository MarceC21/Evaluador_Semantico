# Evaluador semántico de lógica de primer orden · MM3032

Interfaz Lógica Navideña conectada al parser, las validaciones y el motor
semántico real de `src/`. Calcula valores de verdad y explica testigos y
contraejemplos.

## Ejecutar la página

Desde la carpeta `Evaluador_Semantico`:

```bash
python3 -m http.server 8000
```

Abre http://localhost:8000: la página principal redirige a la interfaz de
**Lógica Navideña**, disponible también en http://localhost:8000/interfaz/.
Detén el servidor con `Ctrl+C`.

Sirve la carpeta `Evaluador_Semantico` completa, porque la interfaz importa
los módulos de `src/`. Los módulos ES necesitan HTTP: no abras `index.html`
con doble clic. No hay dependencias que instalar ni paso de compilación.
La lógica se ejecuta en el navegador; no requiere un servidor de backend aparte.

1. Carga un ejemplo o configura el lenguaje, la interpretación y la fórmula.
2. Completa el entorno si la fórmula tiene variables libres.
3. Pulsa **Evaluar** para ver el valor de verdad y explorar el árbol y sus explicaciones.

`interfaz/js/api.js` tiene `LN.USAR_MOCK = false`: utiliza las funciones
reales importadas por `interfaz/js/real.js`.

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
  interfaz/           # Interfaz principal: Lógica Navideña
    index.html
    js/
    css/
    assets/
    mock/
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


