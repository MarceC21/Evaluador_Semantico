# Lógica Navideña: evaluador semántico (MM3032)

## Cómo abrirlo
Descargar el repositorio y abrir `index.html` con doble clic. No necesita servidor ni instalación.
Los archivos son scripts clásicos que cuelgan del objeto global `Logica`.

Orden de carga en el HTML (importa):
```html
<script src="src/tipos.js"></script>
<script src="src/utils.js"></script>
<script src="src/tokenizador.js"></script>
<script src="src/validaciones.js"></script>
<script src="src/parser.js"></script>
```
Después de cargarlos están disponibles: `Logica.analizarFormula`, `Logica.validarInterpretacion`, `Logica.validarEntorno`.

## Pruebas (solo para el equipo; requiere Node.js)
    node --test
