// Niveles del modo juego: cada uno trae su propio lenguaje e
// interpretación, igual que mock/casos/casos.js.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;
  LN.juegoDatos = LN.juegoDatos || {};

  // Zona 1: predicados y conectivos. Zona 2: ∃/∀. Zona 3: cuantificadores
  // anidados y funciones.
  LN.juegoDatos.taller = [
    {
      id: "t1", zona: 1,
      lenguaje: { funciones: [{ nombre: "k", aridad: 0 }], predicados: [{ nombre: "Madera", aridad: 1 }, { nombre: "Electrico", aridad: 1 }] },
      interpretacion: {
        dominio: ["oso", "tren", "trompo"],
        funciones: { k: [{ args: [], valor: "oso" }] },
        predicados: { Madera: [["oso"], ["trompo"]], Electrico: [["tren"]] }
      },
      formula: "Madera(k) ∧ Electrico(k)",
      entorno: {},
      frase: "El juguete k es de madera y es eléctrico."
    },
    {
      id: "t2", zona: 1,
      lenguaje: { funciones: [{ nombre: "k", aridad: 0 }], predicados: [{ nombre: "Madera", aridad: 1 }, { nombre: "Grande", aridad: 1 }] },
      interpretacion: {
        dominio: ["oso", "tren", "trompo"],
        funciones: { k: [{ args: [], valor: "tren" }] },
        predicados: { Madera: [["oso"], ["trompo"]], Grande: [["tren"], ["oso"]] }
      },
      formula: "Madera(k) → Grande(k)",
      entorno: {},
      frase: "Si el juguete k es de madera, entonces es grande."
    },
    {
      id: "t3", zona: 2,
      lenguaje: { predicados: [{ nombre: "Madera", aridad: 1 }, { nombre: "Electrico", aridad: 1 }] },
      interpretacion: {
        dominio: ["oso", "tren", "trompo", "robot"],
        funciones: {},
        predicados: { Madera: [["oso"], ["trompo"], ["robot"]], Electrico: [["robot"], ["tren"]] }
      },
      formula: "∃x (Madera(x) ∧ Electrico(x))",
      entorno: {},
      frase: "Algún juguete de la banda es de madera y eléctrico."
    },
    {
      id: "t4", zona: 2,
      lenguaje: { predicados: [{ nombre: "Madera", aridad: 1 }, { nombre: "Grande", aridad: 1 }] },
      interpretacion: {
        dominio: ["oso", "tren", "trompo", "robot"],
        funciones: {},
        predicados: { Madera: [["oso"], ["trompo"], ["robot"]], Grande: [["oso"], ["robot"]] }
      },
      formula: "∀x (Madera(x) → Grande(x))",
      entorno: {},
      frase: "Todo juguete de madera de la banda es grande."
    },
    {
      id: "t5", zona: 3,
      lenguaje: { predicados: [{ nombre: "Combina", aridad: 2 }] },
      interpretacion: {
        dominio: ["oso", "tren", "trompo"],
        funciones: {},
        predicados: { Combina: [["oso", "tren"], ["tren", "trompo"], ["trompo", "oso"]] }
      },
      formula: "∀x ∃y Combina(x, y)",
      entorno: {},
      frase: "Todo juguete combina con algún otro juguete de la banda."
    },
    {
      id: "t6", zona: 3,
      lenguaje: { funciones: [{ nombre: "ParejaDe", aridad: 1 }], predicados: [{ nombre: "Combina", aridad: 2 }] },
      interpretacion: {
        dominio: ["oso", "tren", "trompo"],
        funciones: { ParejaDe: [{ args: ["oso"], valor: "tren" }, { args: ["tren"], valor: "trompo" }, { args: ["trompo"], valor: "oso" }] },
        predicados: { Combina: [["oso", "tren"], ["trompo", "oso"]] }
      },
      formula: "∀x Combina(x, ParejaDe(x))",
      entorno: {},
      frase: "Todo juguete combina con la pareja que le asignó Santa."
    }
  ];

  // Galletas de jengibre: el jugador decora las galletas (toca predicados
  // unarios) para que la fórmula fija dé el valor de `objetivo`.
  LN.juegoDatos.galletas = [
    {
      id: "g1", zona: 1,
      lenguaje: { predicados: [{ nombre: "Botones", aridad: 1 }, { nombre: "Gorro", aridad: 1 }] },
      interpretacion: {
        dominio: ["Galleta 1", "Galleta 2"],
        funciones: {},
        predicados: { Botones: [["Galleta 2"]], Gorro: [["Galleta 2"]] }
      },
      formula: "Botones(x) ∧ Gorro(x)",
      entorno: { x: "Galleta 1" },
      objetivo: true,
      frase: "Decora la Galleta 1 para que tenga botones y gorro a la vez."
    },
    {
      id: "g2", zona: 1,
      lenguaje: { predicados: [{ nombre: "Botones", aridad: 1 }, { nombre: "Glaseado", aridad: 1 }] },
      interpretacion: {
        dominio: ["Galleta 1", "Galleta 2"],
        funciones: {},
        predicados: { Botones: [["Galleta 2"]], Glaseado: [["Galleta 1"], ["Galleta 2"]] }
      },
      formula: "Botones(x) → Glaseado(x)",
      entorno: { x: "Galleta 1" },
      objetivo: false,
      frase: "Decora la Galleta 1 para armar un contraejemplo: que tenga botones pero no tenga glaseado."
    },
    {
      id: "g3", zona: 2,
      lenguaje: { predicados: [{ nombre: "Botones", aridad: 1 }, { nombre: "Gorro", aridad: 1 }] },
      interpretacion: {
        dominio: ["Galleta 1", "Galleta 2", "Galleta 3", "Galleta 4"],
        funciones: {},
        predicados: { Botones: [["Galleta 1"], ["Galleta 3"]], Gorro: [["Galleta 2"]] }
      },
      formula: "∃x (Botones(x) ∧ Gorro(x))",
      entorno: {},
      objetivo: true,
      frase: "Decora el plato para que alguna galleta tenga botones y gorro a la vez."
    },
    {
      id: "g4", zona: 2,
      lenguaje: { predicados: [{ nombre: "Botones", aridad: 1 }, { nombre: "Gorro", aridad: 1 }] },
      interpretacion: {
        dominio: ["Galleta 1", "Galleta 2", "Galleta 3", "Galleta 4"],
        funciones: {},
        predicados: {
          Botones: [["Galleta 1"], ["Galleta 2"], ["Galleta 3"], ["Galleta 4"]],
          Gorro: [["Galleta 1"], ["Galleta 2"], ["Galleta 3"], ["Galleta 4"]]
        }
      },
      formula: "∀x (Botones(x) → Gorro(x))",
      entorno: {},
      objetivo: false,
      frase: "Decora el plato para armar un contraejemplo: una galleta con botones pero sin gorro."
    },
    {
      id: "g5", zona: 3,
      lenguaje: { predicados: [{ nombre: "Botones", aridad: 1 }, { nombre: "Gorro", aridad: 1 }, { nombre: "Lazo", aridad: 1 }] },
      interpretacion: {
        dominio: ["Galleta 1", "Galleta 2", "Galleta 3"],
        funciones: {},
        predicados: { Botones: [["Galleta 1"]], Gorro: [["Galleta 2"]], Lazo: [["Galleta 3"]] }
      },
      formula: "∀x ∃y (Botones(x) → (Gorro(y) ∧ Lazo(y)))",
      entorno: {},
      objetivo: true,
      frase: "Decora el plato para que, si alguna galleta tiene botones, en el plato haya también una galleta con gorro y lazo a la vez."
    },
    {
      id: "g6", zona: 3,
      lenguaje: { predicados: [{ nombre: "Botones", aridad: 1 }, { nombre: "Lazo", aridad: 1 }] },
      interpretacion: {
        dominio: ["Galleta 1", "Galleta 2", "Galleta 3"],
        funciones: {},
        predicados: { Botones: [["Galleta 1"]], Lazo: [["Galleta 1"], ["Galleta 2"], ["Galleta 3"]] }
      },
      formula: "∃x ∀y (Botones(x) ∧ Lazo(y))",
      entorno: {},
      objetivo: false,
      frase: "Decora el plato para armar un contraejemplo: una galleta con botones mientras no todas tienen lazo."
    }
  ];
})();
