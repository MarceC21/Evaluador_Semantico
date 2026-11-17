/* utils.js: funciones auxiliares (equivale a utils_gramatica.py). */
(function (g) {
  'use strict';
  if (typeof require === 'function' && typeof module !== 'undefined') require('./tipos.js');
  const L = g.Logica;
  const { NODO } = L.tipos;

  function crearError(codigo, mensaje, extra) {
    return Object.assign({ codigo, mensaje }, extra || {});
  }

  function fallo(errores) {
    return { ok: false, errores };
  }

  // Nombres de símbolos: letras, dígitos y guion bajo (acepta acentos y griego).
  function esIdentificador(s) {
    return typeof s === 'string' && /^[\p{L}\p{N}_]+$/u.test(s);
  }

  function tieneProp(obj, clave) {
    return obj !== null && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, clave);
  }

  function plural(n, singular, pluralTxt) {
    return `${n} ${n === 1 ? singular : pluralTxt}`;
  }

  // Hijos de un nodo, en orden de izquierda a derecha.
  function hijos(n) {
    switch (n.tipo) {
      case NODO.PRED:
      case NODO.FUNC: return n.args;
      case NODO.IGUAL:
      case NODO.Y:
      case NODO.O:
      case NODO.IMPLICA: return [n.izq, n.der];
      case NODO.NO: return [n.hijo];
      case NODO.PARA_TODO:
      case NODO.EXISTE: return [n.cuerpo];
      default: return [];
    }
  }

  function esCuantificador(n) {
    return n.tipo === NODO.PARA_TODO || n.tipo === NODO.EXISTE;
  }

  // f(a, b) o solo el nombre si es constante
  function formatearLlamada(nombre, args) {
    return args.length ? `${nombre}(${args.join(', ')})` : nombre;
  }

  L.utils = { crearError, fallo, esIdentificador, tieneProp, plural, hijos, esCuantificador, formatearLlamada };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
})(typeof window !== 'undefined' ? window : globalThis);
