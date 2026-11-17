# Interfaz de "Lógica Navideña" (MM3032 Lógica Matemática, UVG)

## Quién soy y qué hacemos
Soy Mar, integrante 3 de un equipo de 3. Construimos un **evaluador semántico**: una aplicación gráfica que dice si una fórmula de primer orden es verdadera o falsa en una interpretación finita (estilo Huth & Ryan).

La meta del equipo es el **boleto de oro**. Los proyectos se votan, así que importan el impacto visual, la claridad, la facilidad de uso y la cantidad de funcionalidad. El código no se califica.

## Mi parte
Interfaz gráfica, árbol visual, integración y aportes creativos (20 pts).
- Integrante 1: parser, variables libres y validaciones.
- Integrante 2: motor semántico, testigos y contraejemplos.

Ellas todavía no terminan, así que trabajo con **datos de ejemplo (mock)** que respetan el contrato. Al final se cambia un solo interruptor para conectar sus funciones reales.

## Cómo quiero que trabajes
- **Ya tomé las decisiones de diseño** (están en `docs/DECISIONES.md`). No me las vuelvas a preguntar. Pregúntame **solo** si algo te bloquea o es realmente ambiguo, en **una sola ronda corta** antes de empezar. Lo demás decídelo con el criterio de la rúbrica (claridad, facilidad y funcionalidad) y anótalo en `docs/DEFENSA.md`.
- La idea es mía y tú aportas la estructura. En lo visual, respeta `docs/DISENO.md`.
- Todo texto visible para el usuario va en **español**, con explicaciones simples, claras y naturales.
- Trabaja por fases y confirma conmigo al terminar cada una. Dime qué probar y cómo.
- Cambios pequeños y claros. Comenta el código en español, porque tengo defensa individual y puedo ser preguntada sobre cualquier parte.
- Trabaja solo dentro de `interfaz/`. No edites archivos de mis compañeras. Si algo requiere tocar su código o el repo base, pregúntame primero.

## Tecnología
- HTML + CSS + JavaScript puro, sin frameworks ni build. Debe abrirse con doble clic en `index.html`.
- `<script>` normales (no módulos ES) y un espacio de nombres global `window.LN`.
- Debe funcionar **sin internet** (la defensa puede ser en un salón sin red). Las fuentes van en `assets/fonts/` con `@font-face` y fallback. Si no puedes descargarlas, pídemelas.
- Todo texto que venga del usuario (nombres de símbolos, fórmula) se inserta con `textContent`, nunca con `innerHTML`.
- Accesibilidad: uso con teclado, `aria-label` en botones de solo ícono, contraste suficiente y respeto a `prefers-reduced-motion`.
- Pensado para **proyector**: texto de interfaz de 16 px o más y elementos grandes.

## Qué pide la rúbrica (resumen)
Requisitos obligatorios, 80 pts: evaluación semántica y justificación (30), análisis sintáctico (10), interfaz gráfica (10) y defensa individual (30).

La interfaz debe permitir:
1. Lenguaje configurable: nombres y aridades de símbolos funcionales y predicados.
2. Interpretación: dominio finito **no vacío**, una función total por cada símbolo funcional n-ario y una relación por cada predicado n-ario. **No se admiten funciones ni relaciones vacías.**
3. Fórmulas abiertas y cerradas, identificando las variables libres y pidiendo un entorno que las fije en el dominio.
4. Ingreso gráfico del lenguaje, la interpretación, las fórmulas y los entornos. Botones para ¬ ∧ ∨ → ∀ ∃ ) ( y también edición con teclado.
5. Resultado: **Verdadero** o **Falso** con las razones decisivas. Testigo para un ∃ verdadero, contraejemplo para un ∀ falso, y comprobación completa para un ∀ verdadero o un ∃ falso.
6. Validación de errores de sintaxis, símbolos, aridades, dominio, tuplas y asignaciones faltantes o inválidas. **Una entrada incorrecta nunca recibe valor de verdad.**

Aportes creativos, 20 pts: creatividad y originalidad (5), valor del aporte (6), calidad de implementación (6) y justificación y defensa (3). Cada aporte debe estar **implementado, probado y justificado**.

Por eso mantén dos archivos vivos:
- `docs/PRUEBAS.md`: lista de pruebas manuales por funcionalidad (qué hacer y qué debe pasar).
- `docs/DEFENSA.md`: explicación simple de cómo funciona cada parte y por qué existe cada aporte creativo, incluyendo la lógica detrás (entorno, semántica de ∀ y ∃, testigo y contraejemplo).

## Contrato de datos y diseño
@docs/CONTRATO.md
@docs/DISENO.md
@docs/DECISIONES.md

## Git
- Haz **commits pequeños** con mensajes en español, cada vez que termine una parte que funcione.
- **No pongas coautor.** Ningún `Co-Authored-By`, ninguna línea "Generated with Claude Code" ni enlace a sesiones, ni en commits ni en descripciones. El commit va solo a mi nombre.
- **No hagas `git push`** (ni `git push --force`, ni abras pull requests). El push lo hago yo manualmente.
- Si no encuentras un repositorio git, avísame. No ejecutes `git init` por tu cuenta.

## Fases (sin fechas)
1. Contrato aprobado por el equipo (ya está).
2. **Interfaz base:** lenguaje, interpretación, fórmula con teclado simbólico, entorno, resultado y errores, con datos mock.
3. **Árbol navideño:** dibujo del AST, guirnalda, animación en cascada, paso a paso y clic en nodo.
4. Integración con las funciones reales y pruebas con fórmulas reales.
5. Extras: ejemplos temáticos y modo "arma tu árbol" (arrastrar piezas).
6. Modo juego (primero Taller de Santa, luego galletas de jengibre y por último el mapa de niveles) y pulido final.

Aportes creativos, en orden de prioridad: árbol que se arma solo mientras escribo, clic en nodo, evaluación animada y paso a paso, ejemplos temáticos, "arma tu árbol" y modo juego.

## Estructura de archivos sugerida
```
interfaz/
  index.html
  css/estilos.css
  js/api.js            # interruptor LN.USAR_MOCK y puente a las funciones reales
  js/app.js
  js/ui-lenguaje.js
  js/ui-interpretacion.js
  js/ui-formula.js     # campo de texto + teclado simbólico + atajos
  js/ui-resultado.js
  js/arbol.js          # layout y dibujo SVG
  js/guirnalda.js
  js/animacion.js
  mock/                # casos de ejemplo que respetan el contrato
  assets/fonts/
  docs/                # CONTRATO.md, DISENO.md, PRUEBAS.md, DEFENSA.md
  README.md            # cómo cambiar USAR_MOCK a false e integrar
```
