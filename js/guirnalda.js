// Guirnalda: cable que rodea el árbol en zigzag, con bombillitas de
// colores que parpadean (ver docs/DISENO.md). También dibuja las dos
// guirnaldas cortas de fondo junto al título.

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

  var COLORES_BOMBILLA = ["#F06292", "#F7D774", "#7FD1B9", "#8EC5F0", "#C3A6F0", "#FF9E80"];

  // Dibuja un cable que pasa por "puntos" (curvas que cuelgan) y reparte
  // bombillitas cada ~22px de longitud sobre él.
  function dibujarCableConBombillas(grupo, puntos, colorCable, corrimiento) {
    if (puntos.length < 2) return;
    var d = "M" + puntos[0].x + "," + puntos[0].y + " ";
    for (var i = 0; i < puntos.length - 1; i++) {
      var p0 = puntos[i], p1 = puntos[i + 1];
      var mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2 + 35;
      d += "Q" + mx + "," + my + " " + p1.x + "," + p1.y + " ";
    }
    var cable = svgEl("path", { d: d.trim(), class: "guirnalda-cable", stroke: colorCable, fill: "none" });
    grupo.appendChild(cable);

    var longitud = 0;
    try { longitud = cable.getTotalLength(); } catch (e) { longitud = 0; }
    var PASO = 22;
    var n = Math.floor(longitud / PASO);
    for (var j = 1; j <= n; j++) {
      var punto = cable.getPointAtLength(j * PASO);
      var color = COLORES_BOMBILLA[(j + (corrimiento || 0)) % COLORES_BOMBILLA.length];
      var bombilla = svgEl("g", {
        class: "bombilla", transform: "translate(" + punto.x.toFixed(1) + "," + punto.y.toFixed(1) + ")",
        style: "animation-delay:" + ((j * 0.18) % 1.6).toFixed(2) + "s"
      });
      bombilla.appendChild(svgEl("rect", { x: -1.8, y: 0, width: 3.6, height: 4, fill: "#B8964A" }));
      bombilla.appendChild(svgEl("ellipse", { cx: 0, cy: 8.2, rx: 4, ry: 5.2, fill: color }));
      bombilla.appendChild(svgEl("ellipse", { cx: -1.3, cy: 6, rx: 1.2, ry: 0.8, fill: "#fff", opacity: "0.7" }));
      grupo.appendChild(bombilla);
    }
  }

  // Guirnalda principal: rodea la silueta del árbol de lado a lado,
  // alternando izquierda y derecha, sobresaliendo un poco del borde.
  function dibujarPrincipal(grupo, silueta) {
    var H = silueta.baseY - silueta.tip.y;
    var inicio = silueta.tip.y + H * 0.15;
    var fin = silueta.tip.y + H * 0.95;
    var pasoY = Math.max(45, Math.min(60, H * 0.14));

    var alturas = [];
    for (var y = inicio; y <= fin; y += pasoY) alturas.push(y);
    if (alturas.length < 2) alturas = [inicio, fin];

    function ladoX(y, lado) {
      var t = (y - silueta.tip.y) / H;
      var offset = silueta.baseHalfWidth * t;
      return lado === "izq" ? silueta.tip.x - offset - 6 : silueta.tip.x + offset + 6;
    }

    var puntos = alturas.map(function (y, i) {
      return { x: ladoX(y, i % 2 === 0 ? "izq" : "der"), y: y };
    });

    dibujarCableConBombillas(grupo, puntos, "#2F5A3A", 0);
  }

  // Guirnaldas de fondo: dos tramos cortos y fijos junto al título.
  function dibujarFondo(contenedorIzq, contenedorDer) {
    function tramo(contenedor, lado) {
      if (!contenedor) return;
      contenedor.textContent = "";
      var ancho = 170, alto = 56;
      var svg = svgEl("svg", { width: ancho, height: alto, viewBox: "0 0 " + ancho + " " + alto, "aria-hidden": "true" });
      contenedor.appendChild(svg); // ya en el documento antes de medir el cable
      var puntos = lado === "izq"
        ? [{ x: 8, y: 8 }, { x: ancho - 8, y: 34 }, { x: ancho * 0.42, y: 10 }]
        : [{ x: ancho - 8, y: 8 }, { x: 8, y: 34 }, { x: ancho * 0.58, y: 10 }];
      dibujarCableConBombillas(svg, puntos, "#C28CA0", lado === "izq" ? 0 : 3);
    }
    tramo(contenedorIzq, "izq");
    tramo(contenedorDer, "der");
  }

  LN.guirnalda = { dibujarPrincipal: dibujarPrincipal, dibujarFondo: dibujarFondo };
})();
