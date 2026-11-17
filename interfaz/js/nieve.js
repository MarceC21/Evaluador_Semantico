// Nieve cayendo suave como fondo de toda la página (decorativo). Si el
// usuario prefiere menos movimiento, no se genera ningún copo.

(function () {
  "use strict";

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var contenedor = document.getElementById("nieve-fondo");
  if (!contenedor) return;

  var CANTIDAD = 40;
  for (var i = 0; i < CANTIDAD; i++) {
    var copo = document.createElement("span");
    var tam = 2 + Math.random() * 2;
    copo.style.width = tam + "px";
    copo.style.height = tam + "px";
    copo.style.left = (Math.random() * 100) + "%";
    var duracion = 8 + Math.random() * 6;
    copo.style.animationDuration = duracion.toFixed(2) + "s";
    copo.style.animationDelay = "-" + (Math.random() * duracion).toFixed(2) + "s";
    contenedor.appendChild(copo);
  }
})();
