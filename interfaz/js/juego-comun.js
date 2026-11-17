// Único helper de orquestación que comparten las pantallas del modo
// juego (Fase 6): repite, sin tocar el DOM, el mismo encadenado que usa
// onEvaluarClick() en js/app.js, en el orden de docs/CONTRATO.md:
// validarInterpretacion -> analizarFormula -> validarEntorno -> evaluar.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;

  function clonar(obj) { return JSON.parse(JSON.stringify(obj)); }

  function evaluarCaso(lenguaje, interpretacion, formulaTexto, entorno) {
    var vi = LN.api.validarInterpretacion(lenguaje, interpretacion);
    if (!vi.ok) return { ok: false, errores: vi.errores };

    var an = LN.api.analizarFormula(formulaTexto, lenguaje);
    if (!an.ok) return { ok: false, errores: an.errores };

    var ve = LN.api.validarEntorno(an.libres, interpretacion, entorno || {});
    if (!ve.ok) return { ok: false, errores: ve.errores };

    // El motor real devuelve el entorno ya depurado; el mock no trae ese
    // campo (ver js/app.js, onEvaluarClick).
    var entornoFinal = ve.entorno || entorno || {};
    var resultado = LN.api.evaluar(an.ast, interpretacion, entornoFinal);
    return { ok: true, ast: an.ast, resultado: resultado };
  }

  LN.juegoComun = { evaluarCaso: evaluarCaso, clonar: clonar };
})();
