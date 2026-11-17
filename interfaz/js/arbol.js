// Árbol navideño: calcula el layout del AST (raíz arriba, hojas abajo,
// estilo Huth & Ryan) y dibuja la escena SVG completa: silueta de pino
// en 3 capas, tronco, estrella, guirnalda (ver js/guirnalda.js), aristas
// y nodos como esferas/luces. También da zoom con botones y
// desplazamiento arrastrando. Ver docs/DISENO.md.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;

  var NS_SVG = "http://www.w3.org/2000/svg";

  function svgEl(tag, attrs) {
    var el = document.createElementNS(NS_SVG, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // --- Texto que se ve dentro de cada nodo -------------------------------

  function textoNodo(nodo) {
    switch (nodo.tipo) {
      case "pred": case "func": case "var": return nodo.nombre;
      case "igual": return "=";
      case "no": return "¬";
      case "y": return "∧";
      case "o": return "∨";
      case "implica": return "→";
      case "paraTodo": return "∀" + nodo.variable;
      case "existe": return "∃" + nodo.variable;
      default: return "?";
    }
  }

  // --- Variables libres de una subfórmula (para el globito del nodo) ----
  // Se calculan aparte en la interfaz, recorriendo solo esa subfórmula
  // (ver docs/DISENO.md, "Clic en un nodo").

  function freeVars(nodo) {
    var acum = new Set();
    (function recorrer(n, ligadas) {
      if (n.tipo === "var") {
        if (!ligadas.has(n.nombre)) acum.add(n.nombre);
        return;
      }
      if (n.tipo === "paraTodo" || n.tipo === "existe") {
        ligadas = new Set(ligadas);
        ligadas.add(n.variable);
      }
      hijosDe(n).forEach(function (h) { recorrer(h, ligadas); });
    })(nodo, new Set());
    return Array.from(acum);
  }

  // --- Layout del árbol ---------------------------------------------------

  function hijosDe(nodo) {
    switch (nodo.tipo) {
      case "pred": case "func": return nodo.args;
      case "no": return [nodo.hijo];
      case "igual": case "y": case "o": case "implica": return [nodo.izq, nodo.der];
      case "paraTodo": case "existe": return [nodo.cuerpo];
      default: return []; // Las variables son hojas; también los símbolos de aridad cero.
    }
  }

  var SEP_Y = 74, TOP_PAD = 76, MARGEN_X = 60, ANCHO_CAR = 9;

  function calcularLayout(ast) {
    var info = {};
    var hojasOrden = [];
    var maxNivel = 0;

    function recolectar(nodo, nivel) {
      maxNivel = Math.max(maxNivel, nivel);
      var hijos = hijosDe(nodo);
      var esHoja = hijos.length === 0;
      var texto = textoNodo(nodo);
      var radio = Math.max(esHoja ? 22 : 20, (texto.length * ANCHO_CAR) / 2 + 10);
      info[nodo.id] = {
        nodo: nodo, texto: texto, esHoja: esHoja, radio: radio, nivel: nivel,
        hijosIds: hijos.map(function (h) { return h.id; })
      };
      hijos.forEach(function (h) { recolectar(h, nivel + 1); });
      if (esHoja) hojasOrden.push(nodo.id);
    }
    recolectar(ast, 0);

    var maxRadioHoja = hojasOrden.reduce(function (m, id) { return Math.max(m, info[id].radio); }, 22);
    var sepX = Math.max(110, maxRadioHoja * 2 + 30);

    hojasOrden.forEach(function (id, i) { info[id].x = MARGEN_X + i * sepX; });

    function asignarX(nodo) {
      var it = info[nodo.id];
      if (it.esHoja) return it.x;
      var xs = hijosDe(nodo).map(asignarX);
      it.x = xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;
      return it.x;
    }
    asignarX(ast);

    Object.keys(info).forEach(function (id) { info[id].y = TOP_PAD + info[id].nivel * SEP_Y; });

    var anchoHojas = hojasOrden.length > 1 ? (hojasOrden.length - 1) * sepX : 0;
    var ancho = anchoHojas + 2 * MARGEN_X;

    var aristas = [];
    Object.keys(info).forEach(function (id) {
      info[id].hijosIds.forEach(function (hid) { aristas.push({ de: Number(id), a: hid }); });
    });

    return { info: info, ancho: ancho, raizId: ast.id, hojasOrden: hojasOrden, aristas: aristas, topPad: TOP_PAD, maxNivel: maxNivel, sepY: SEP_Y };
  }

  function siluetaDesdeLayout(layout) {
    var tip = { x: layout.ancho / 2, y: layout.topPad - 45 };
    var baseY = layout.topPad + layout.maxNivel * layout.sepY + 45;
    var baseHalfWidth = Math.max(70, layout.ancho / 2 - 10);
    return { tip: tip, baseY: baseY, baseHalfWidth: baseHalfWidth };
  }

  function construirEstrella(silueta) {
    var cx = silueta.tip.x, cy = silueta.tip.y;
    var rExt = 14, rInt = 6;
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var ang = (Math.PI / 5) * i - Math.PI / 2;
      var r = i % 2 === 0 ? rExt : rInt;
      pts.push((cx + r * Math.cos(ang)).toFixed(1) + "," + (cy + r * Math.sin(ang)).toFixed(1));
    }
    return svgEl("polygon", { points: pts.join(" "), class: "arbol-estrella" });
  }

  // --- Dibujo completo ------------------------------------------------------

  function dibujar(contenedor, ast, opts) {
    opts = opts || {};
    var layout = calcularLayout(ast);
    var silueta = siluetaDesdeLayout(layout);
    var anchoTotal = layout.ancho;
    var altoTotal = silueta.baseY + 24 + 10;

    // El contenedor (la tarjeta del árbol) es el mismo en cada tecla que se
    // escribe; si ya tenía los eventos de arrastre de un dibujo anterior,
    // se quitan antes de poner los nuevos (si no, se acumularían).
    if (contenedor._lnEventos) {
      var previos = contenedor._lnEventos;
      contenedor.removeEventListener("pointerdown", previos.down);
      contenedor.removeEventListener("pointermove", previos.move);
      contenedor.removeEventListener("pointerup", previos.up);
      contenedor.removeEventListener("pointercancel", previos.up);
    }

    contenedor.textContent = "";

    var svg = svgEl("svg", {
      width: anchoTotal, height: altoTotal,
      class: "arbol-svg", role: "img",
      "aria-label": "Árbol sintáctico de la fórmula"
    });

    // Silueta: 3 capas de verde salvia, de la más oscura/grande a la más clara/chica.
    var gSilueta = svgEl("g", { class: "arbol-silueta" });
    var colores = ["#9FC5A0", "#B3D4B3", "#C6E1C4"];
    [1, 0.82, 0.64].forEach(function (s, i) {
      var baseYesc = silueta.tip.y + (silueta.baseY - silueta.tip.y) * s;
      var hw = silueta.baseHalfWidth * s;
      gSilueta.appendChild(svgEl("polygon", {
        points: silueta.tip.x + "," + silueta.tip.y + " " + (silueta.tip.x - hw) + "," + baseYesc + " " + (silueta.tip.x + hw) + "," + baseYesc,
        fill: colores[i]
      }));
    });
    svg.appendChild(gSilueta);

    svg.appendChild(svgEl("rect", {
      x: silueta.tip.x - 18, y: silueta.baseY, width: 36, height: 24, rx: 3,
      fill: "#B08968", class: "arbol-tronco"
    }));

    var gGuirnalda = svgEl("g", { class: "arbol-guirnalda" });
    svg.appendChild(gGuirnalda);

    var gAristas = svgEl("g", { class: "arbol-aristas" });
    layout.aristas.forEach(function (ar) {
      var a = layout.info[ar.de], b = layout.info[ar.a];
      gAristas.appendChild(svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "arista" }));
    });
    svg.appendChild(gAristas);

    var gNodos = svgEl("g", { class: "arbol-nodos" });
    var nodosElementos = {};
    Object.keys(layout.info).forEach(function (idStr) {
      var id = Number(idStr);
      var it = layout.info[id];
      var esTermino = it.nodo.tipo === "var" || it.nodo.tipo === "func";
      var g = svgEl("g", {
        class: "nodo nodo--sin-evaluar", transform: "translate(" + it.x + "," + it.y + ")",
        tabindex: "0", role: "button",
        "aria-label": "Nodo " + it.texto + (esTermino ? ", término." : ", sin evaluar todavía.")
      });
      var halo = svgEl("circle", { r: it.radio + 9, class: "nodo__halo" });
      var cuerpo = svgEl("circle", { r: it.radio, class: "nodo__cuerpo" });
      var reflejo = svgEl("ellipse", {
        rx: 6, ry: 3.5, cx: -it.radio * 0.3, cy: -it.radio * 0.4,
        class: "nodo__reflejo", transform: "rotate(-30)"
      });
      var casquillo = svgEl("rect", { x: -4, y: -it.radio - 6, width: 8, height: 6, rx: 1.5, class: "nodo__casquillo" });
      var texto = svgEl("text", { x: 0, y: 1, class: "nodo__texto", "dominant-baseline": "central", "text-anchor": "middle" });
      texto.textContent = it.texto;
      var marca = svgEl("text", { x: it.radio * 0.6, y: -it.radio * 0.6, class: "nodo__marca", "text-anchor": "middle" });

      g.appendChild(halo);
      g.appendChild(cuerpo);
      g.appendChild(reflejo);
      g.appendChild(casquillo);
      g.appendChild(texto);
      g.appendChild(marca);

      g.addEventListener("click", function () { if (opts.onClicNodo) opts.onClicNodo(id); });
      g.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); if (opts.onClicNodo) opts.onClicNodo(id); }
      });

      gNodos.appendChild(g);
      nodosElementos[id] = { grupo: g, marca: marca, info: it };
    });
    svg.appendChild(gNodos);

    var estrella = construirEstrella(silueta);
    svg.appendChild(estrella);

    var zoomCapa = document.createElement("div");
    zoomCapa.className = "arbol-zoom-capa";
    zoomCapa.appendChild(svg);
    contenedor.appendChild(zoomCapa);

    // La guirnalda se dibuja recién ahora que el SVG ya está en el
    // documento: getTotalLength/getPointAtLength (para repartir las
    // bombillitas sobre el cable) son más confiables con el nodo ya
    // insertado, en vez de calcularlo sobre un SVG todavía "suelto".
    if (LN.guirnalda) LN.guirnalda.dibujarPrincipal(gGuirnalda, silueta);

    // --- Pintar valores (gris / verdadero / falso) -------------------------

    function pintarTermino(id, encendido) {
      var nel = nodosElementos[id];
      if (!nel) return;
      nel.grupo.classList.remove("nodo--sin-evaluar", "nodo--termino-iluminado");
      nel.grupo.classList.add(encendido ? "nodo--termino-iluminado" : "nodo--sin-evaluar");
      nel.marca.textContent = "";
      nel.grupo.setAttribute("aria-label", "Nodo " + nel.info.texto + ", término" +
        (encendido ? " iluminado" : "") + ". Presiona Enter para ver el detalle.");
    }

    function pintarNodo(id, valor) {
      var nel = nodosElementos[id];
      if (!nel) return;
      if (nel.info.nodo.tipo === "var" || nel.info.nodo.tipo === "func") {
        pintarTermino(id, valor !== null && typeof valor !== "undefined");
        return;
      }
      nel.grupo.classList.remove("nodo--sin-evaluar", "nodo--verdadero", "nodo--falso");
      var estadoTxt;
      if (valor === null || typeof valor === "undefined") {
        nel.grupo.classList.add("nodo--sin-evaluar");
        nel.marca.textContent = "";
        estadoTxt = nel.info.nodo.tipo === "var" || nel.info.nodo.tipo === "func" ? "término" : "sin evaluar todavía";
      } else {
        nel.grupo.classList.add(valor ? "nodo--verdadero" : "nodo--falso");
        nel.marca.textContent = valor ? "✓" : "✕";
        estadoTxt = valor ? "verdadero" : "falso";
      }
      nel.grupo.setAttribute("aria-label", "Nodo " + nel.info.texto + ", " + estadoTxt + ". Presiona Enter para ver el detalle.");
    }

    function resetearColores() {
      Object.keys(nodosElementos).forEach(function (id) { pintarNodo(Number(id), null); });
    }

    function quitarResaltados() {
      Object.keys(nodosElementos).forEach(function (id) { nodosElementos[id].grupo.classList.remove("nodo--actual"); });
    }

    function resaltar(id) {
      quitarResaltados();
      var nel = nodosElementos[id];
      if (nel) nel.grupo.classList.add("nodo--actual");
    }

    // --- Zoom y desplazamiento (arrastrando), sin rueda --------------------

    var z = 1, tx = 0, ty = 0;
    function aplicarTransform() {
      zoomCapa.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + z + ")";
    }
    function cambiarZoom(nuevo) {
      nuevo = Math.max(0.3, Math.min(3, nuevo));
      var vpW = contenedor.clientWidth || anchoTotal, vpH = contenedor.clientHeight || altoTotal;
      var cx = (vpW / 2 - tx) / z, cy = (vpH / 2 - ty) / z;
      z = nuevo;
      tx = vpW / 2 - cx * z;
      ty = vpH / 2 - cy * z;
      aplicarTransform();
    }
    function ajustar() {
      var vpW = contenedor.clientWidth || anchoTotal, vpH = contenedor.clientHeight || altoTotal;
      var escala = Math.min(vpW / anchoTotal, vpH / altoTotal);
      z = Math.max(0.35, Math.min(1.4, escala));
      tx = Math.max(0, (vpW - anchoTotal * z) / 2);
      ty = Math.max(0, (vpH - altoTotal * z) / 2);
      aplicarTransform();
    }

    // "listo" = el puntero está abajo, pero todavía no se movió lo
    // suficiente para contar como arrastre. Importante: NO se llama a
    // setPointerCapture hasta que el movimiento pasa el umbral, porque
    // capturar el puntero desde el primer pixel redirige también el
    // clic (y el Enter por teclado no se ve afectado, pero un clic
    // normal en un nodo nunca llegaba a abrir el globito: se lo
    // quedaba el contenedor). Así, un clic corto sigue siendo un clic.
    var UMBRAL_ARRASTRE = 4;
    var listo = false, arrastrando = false, ultimoX = 0, ultimoY = 0;
    contenedor.style.cursor = "grab";
    function iniciarArrastre(ev) {
      listo = true; arrastrando = false;
      ultimoX = ev.clientX; ultimoY = ev.clientY;
    }
    function moverArrastre(ev) {
      if (!listo) return;
      var dx = ev.clientX - ultimoX, dy = ev.clientY - ultimoY;
      if (!arrastrando) {
        if (Math.abs(dx) < UMBRAL_ARRASTRE && Math.abs(dy) < UMBRAL_ARRASTRE) return;
        arrastrando = true;
        contenedor.style.cursor = "grabbing";
        try { contenedor.setPointerCapture(ev.pointerId); } catch (e) { /* no disponible */ }
      }
      tx += dx; ty += dy;
      ultimoX = ev.clientX; ultimoY = ev.clientY;
      aplicarTransform();
    }
    function soltarArrastre(ev) {
      listo = false;
      if (arrastrando) {
        arrastrando = false;
        contenedor.style.cursor = "grab";
        try { contenedor.releasePointerCapture(ev.pointerId); } catch (e) { /* no disponible */ }
      }
    }
    contenedor.addEventListener("pointerdown", iniciarArrastre);
    contenedor.addEventListener("pointermove", moverArrastre);
    contenedor.addEventListener("pointerup", soltarArrastre);
    contenedor.addEventListener("pointercancel", soltarArrastre);
    contenedor._lnEventos = { down: iniciarArrastre, move: moverArrastre, up: soltarArrastre };

    ajustar();

    return {
      layout: layout,
      pintarNodo: pintarNodo,
      pintarTermino: pintarTermino,
      resetearColores: resetearColores,
      resaltar: resaltar,
      quitarResaltados: quitarResaltados,
      encenderEstrella: function () { estrella.classList.add("encendida"); },
      apagarEstrella: function () { estrella.classList.remove("encendida"); },
      nodoAst: function (id) { return layout.info[id].nodo; },
      grupoNodo: function (id) { return nodosElementos[id] && nodosElementos[id].grupo; },
      posicionNodo: function (id, relativoA) {
        var nel = nodosElementos[id];
        if (!nel) return null;
        var r1 = nel.grupo.getBoundingClientRect();
        var r2 = relativoA.getBoundingClientRect();
        return { x: r1.left + r1.width / 2 - r2.left, y: r1.top - r2.top, ancho: r1.width, alto: r1.height };
      },
      zoomIn: function () { cambiarZoom(z * 1.25); },
      zoomOut: function () { cambiarZoom(z / 1.25); },
      ajustar: ajustar
    };
  }

  LN.arbol = { dibujar: dibujar, freeVars: freeVars, textoNodo: textoNodo, calcularLayout: calcularLayout };
})();
