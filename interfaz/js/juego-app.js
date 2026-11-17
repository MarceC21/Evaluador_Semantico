// Orquestador del modo juego (Fase 6): alterna entre la app normal y la
// pantalla de juego. El mapa de niveles todavía no existe (es el último
// checkpoint de la Fase 6), así que por ahora el botón "Modo juego" entra
// directo al Taller de Santa; cuando el mapa esté listo, pasará a ser él
// quien decida qué pantalla abrir.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;

  document.addEventListener("DOMContentLoaded", function () {
    var botonModoJuego = document.getElementById("boton-modo-juego");
    var botonVolver = document.getElementById("boton-volver-evaluador");
    var appNormal = document.querySelector("main.app");
    var menuEjemplos = document.getElementById("menu-ejemplos");
    var pantallaJuego = document.getElementById("pantalla-juego");
    var contenedorTaller = document.getElementById("juego-taller");

    if (!botonModoJuego || !pantallaJuego) return;

    var tallerControlador = null;

    function volverAlEvaluador() {
      pantallaJuego.classList.add("oculto");
      pantallaJuego.setAttribute("aria-hidden", "true");
      appNormal.classList.remove("oculto");
      menuEjemplos.classList.remove("oculto");
    }

    botonModoJuego.addEventListener("click", function () {
      appNormal.classList.add("oculto");
      menuEjemplos.classList.add("oculto");
      pantallaJuego.classList.remove("oculto");
      pantallaJuego.setAttribute("aria-hidden", "false");
      contenedorTaller.classList.remove("oculto");
      if (!tallerControlador) {
        tallerControlador = LN.juegoTaller.crear(contenedorTaller, { onTerminarNivel: volverAlEvaluador });
      }
    });

    botonVolver.addEventListener("click", volverAlEvaluador);
  });
})();
