// Punto de integración con el motor semántico

// Prepara entradas válidas
// Todavía no calcula valores de verdad ********

import { analizarFormula } from './parser.js';
import { validarInterpretacion, validarEntorno } from './validaciones.js';

export function prepararEvaluacion(texto, lenguaje, interpretacion, entorno) {
  const formula = analizarFormula(texto, lenguaje);
  if (!formula.ok) return { ...formula, etapa: 'fórmula' };

  const modelo = validarInterpretacion(lenguaje, interpretacion);
  if (!modelo.ok) return { ...modelo, etapa: 'interpretación' };

  const asignacion = validarEntorno(formula.libres, interpretacion, entorno);
  if (!asignacion.ok) return { ...asignacion, etapa: 'entorno' };

  return {
    ...formula,
    entorno: asignacion.entorno,
    advertencias: [...modelo.advertencias, ...asignacion.advertencias],
  };
}

function evaluarTermino(termino, interpretacion, entorno) {
  if (termino.tipo === "var") {
    return entorno[termino.nombre];
  }

  if (termino.tipo === "func") {
    const tabla = interpretacion.funciones[termino.nombre];

    const argumentos = termino.args.map((arg) =>
      evaluarTermino(arg, interpretacion, entorno)
    );

    const fila = tabla.find(
      (entrada) =>
        entrada.args.length === argumentos.length &&
        entrada.args.every(
          (valor, indice) => valor === argumentos[indice]
        )
    );

    return fila.valor;
  }

  throw new Error(`Tipo de término no soportado: ${termino.tipo}`);
}