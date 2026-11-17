// Progreso del modo juego (Fase 6), guardado en localStorage. Primer uso
// de almacenamiento persistente del proyecto: envuelto en try/catch
// porque algunos equipos (examen, proyector) podrían tenerlo deshabilitado;
// si falla, el juego sigue funcionando, solo que sin recordar nada entre
// recargas de la página.

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

  // Solo sube la marca si las estrellas nuevas son mejores que las que
  // ya tenía (un reintento peor no empeora el progreso guardado).
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
