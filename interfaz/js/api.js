// Puente entre la interfaz y el motor semántico.
//
// LN.USAR_MOCK controla de dónde vienen las 4 funciones del contrato
// (ver docs/CONTRATO.md). Con true se usa mock/motor-mock.js (temporal).
// Con false (Fase 4, ya activo) se usan las funciones reales de mis
// compañeras, que js/real.js importa de src/ y deja en LN.real.*.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;

  // --- ÚNICO INTERRUPTOR QUE HAY QUE CAMBIAR PARA INTEGRAR ---
  LN.USAR_MOCK = false;

  LN.api = {
    analizarFormula: function (texto, lenguaje) {
      if (LN.USAR_MOCK) return LN.mock.analizarFormula(texto, lenguaje);
      return LN.real.analizarFormula(texto, lenguaje);
    },
    validarInterpretacion: function (lenguaje, interpretacion) {
      if (LN.USAR_MOCK) return LN.mock.validarInterpretacion(lenguaje, interpretacion);
      return LN.real.validarInterpretacion(lenguaje, interpretacion);
    },
    validarEntorno: function (libres, interpretacion, entorno) {
      if (LN.USAR_MOCK) return LN.mock.validarEntorno(libres, interpretacion, entorno);
      return LN.real.validarEntorno(libres, interpretacion, entorno);
    },
    evaluar: function (ast, interpretacion, entorno) {
      if (LN.USAR_MOCK) return LN.mock.evaluar(ast, interpretacion, entorno);
      return LN.real.evaluar(ast, interpretacion, entorno);
    }
  };
})();
