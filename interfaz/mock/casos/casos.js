// Casos de ejemplo para el menú "Cargar ejemplo".
// Cada caso trae su propio lenguaje e interpretación para que se vea
// completo al cargarlo, más la fórmula y (si aplica) un entorno de ejemplo.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;

  var lenguajeBase = {
    funciones: [{ nombre: "k", aridad: 0 }, { nombre: "f", aridad: 1 }],
    predicados: [{ nombre: "P", aridad: 1 }, { nombre: "Q", aridad: 1 }, { nombre: "R", aridad: 1 }]
  };

  var interpretacionBase = {
    dominio: ["a", "b", "c"],
    funciones: {
      k: [{ args: [], valor: "a" }],
      f: [{ args: ["a"], valor: "b" }, { args: ["b"], valor: "c" }, { args: ["c"], valor: "a" }]
    },
    predicados: {
      P: [["a"], ["b"], ["c"]],
      Q: [["a"]],
      R: [["b"]]
    }
  };

  LN.casos = [
    {
      id: "paratodo-verdadero",
      titulo: "∀ verdadero",
      descripcion: "Todo elemento del dominio cumple P(x) → P(x).",
      lenguaje: lenguajeBase,
      interpretacion: interpretacionBase,
      formula: "∀x (P(x) → P(x))",
      entorno: {}
    },
    {
      id: "existe-testigo",
      titulo: "∃ verdadero con testigo",
      descripcion: "Hay un elemento (a) que cumple Q(x); ese es el testigo.",
      lenguaje: lenguajeBase,
      interpretacion: interpretacionBase,
      formula: "∃x Q(x)",
      entorno: {}
    },
    {
      id: "paratodo-contraejemplo",
      titulo: "∀ falso con contraejemplo",
      descripcion: "No todo elemento cumple Q(x); b es el contraejemplo.",
      lenguaje: lenguajeBase,
      interpretacion: interpretacionBase,
      formula: "∀x Q(x)",
      entorno: {}
    }
  ];
})();
