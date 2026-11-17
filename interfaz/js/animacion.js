// Controla la cascada de iluminación del árbol ya evaluado: "Ver todo"
// (automático, hojas -> raíz), "Repetir animación" y "Paso a paso"
// (Anterior / Siguiente, un nodo a la vez). Ver docs/DISENO.md.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;

  function prefiereMenosMovimiento() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // handleArbol: lo que devuelve LN.arbol.dibujar(...)
  // resultado: lo que devuelve LN.api.evaluar(...) (tiene "orden" y "nodos")
  // callbacks: { onPaso(idNodoActual) } se llama cada vez que cambia el paso actual.
  function crear(handleArbol, resultado, callbacks) {
    callbacks = callbacks || {};
    var orden = resultado.orden;
    var indice = -1;
    var temporizadores = [];

    function limpiarTemporizadores() {
      temporizadores.forEach(function (t) { clearTimeout(t); });
      temporizadores = [];
    }

    // "avisar" solo es true cuando el paso lo pide una persona (Anterior/
    // Siguiente): ahí sí tiene sentido mostrar el globito automáticamente
    // (ver docs/DECISIONES.md). En la cascada automática de "Ver todo" no
    // se muestra, porque robaría el foco del teclado cada 0.4 s.
    function pintarHasta(nuevoIndice, avisar) {
      indice = nuevoIndice;
      orden.forEach(function (id, i) {
        if (i <= indice) handleArbol.pintarNodo(id, resultado.nodos[id].valor);
        else handleArbol.pintarNodo(id, null);
      });
      if (indice >= 0) handleArbol.resaltar(orden[indice]);
      else handleArbol.quitarResaltados();
      if (indice >= orden.length - 1) handleArbol.encenderEstrella();
      else handleArbol.apagarEstrella();
      if (avisar && callbacks.onPaso) callbacks.onPaso(indice >= 0 ? orden[indice] : null);
    }

    function verTodo() {
      limpiarTemporizadores();
      if (callbacks.onPaso) callbacks.onPaso(null); // cierra un globito que haya quedado abierto
      if (prefiereMenosMovimiento()) { pintarHasta(orden.length - 1, false); return; }
      pintarHasta(-1, false);
      orden.forEach(function (id, i) {
        temporizadores.push(setTimeout(function () { pintarHasta(i, false); }, 400 * (i + 1)));
      });
    }

    function siguiente() {
      limpiarTemporizadores();
      if (indice < orden.length - 1) pintarHasta(indice + 1, true);
    }

    function anterior() {
      limpiarTemporizadores();
      if (indice > -1) pintarHasta(indice - 1, true);
    }

    return {
      verTodo: verTodo,
      repetir: verTodo,
      siguiente: siguiente,
      anterior: anterior,
      estaAlFinal: function () { return indice >= orden.length - 1; },
      estaAlInicio: function () { return indice <= -1; },
      destruir: limpiarTemporizadores
    };
  }

  LN.animacion = { crear: crear };
})();
