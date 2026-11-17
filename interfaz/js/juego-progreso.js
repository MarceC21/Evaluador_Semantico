// Progreso del modo juego, guardado en localStorage. Envuelto en
// try/catch: si no está disponible, el juego sigue funcionando pero
// sin recordar nada entre recargas.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;

  var CLAVE = "ln.juego.progreso";
  var datos = { taller: {}, galletas: {} };

  function cargar() {
    try {
      var guardado = window.localStorage.getItem(CLAVE);
      if (guardado) datos = JSON.parse(guardado);
    } catch (e) { /* sin storage: se sigue solo en memoria */ }
    datos.taller = datos.taller || {};
    datos.galletas = datos.galletas || {};
    return datos;
  }

  function guardar() {
    try { window.localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* ídem */ }
  }

  // Un reintento peor no empeora el progreso ya guardado.
  function marcarCompletado(modo, nivelId, estrellas) {
    var actual = datos[modo][nivelId];
    if (!actual || estrellas > actual.estrellas) {
      datos[modo][nivelId] = { completado: true, estrellas: estrellas };
      guardar();
    }
  }

  function estrellasDe(modo, nivelId) {
    var r = datos[modo][nivelId];
    return r ? r.estrellas : 0;
  }

  function estaCompletado(modo, nivelId) {
    return !!(datos[modo][nivelId] && datos[modo][nivelId].completado);
  }

  function reiniciar() {
    datos = { taller: {}, galletas: {} };
    guardar();
  }

  cargar();

  LN.juegoProgreso = {
    cargar: cargar,
    guardar: guardar,
    marcarCompletado: marcarCompletado,
    estrellasDe: estrellasDe,
    estaCompletado: estaCompletado,
    reiniciar: reiniciar
  };
})();
