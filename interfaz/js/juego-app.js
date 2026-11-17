// Alterna entre la app normal y la pantalla de juego. El mapa de niveles
// todavía no existe, así que el botón "Modo juego" entra directo al
// Taller de Santa.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;

  document.addEventListener("DOMContentLoaded", function () {
    var botonModoJuego = document.getElementById("boton-modo-juego");
    var botonVolver = document.getElementById("boton-volver-evaluador");
    var botonIrTaller = document.getElementById("boton-ir-taller");
    var botonIrGalletas = document.getElementById("boton-ir-galletas");
    var appNormal = document.querySelector("main.app");
    var menuEjemplos = document.getElementById("menu-ejemplos");
    var pantallaJuego = document.getElementById("pantalla-juego");
    var contenedorTaller = document.getElementById("juego-taller");
    var contenedorGalletas = document.getElementById("juego-galletas");

    if (!botonModoJuego || !pantallaJuego) return;

    var tallerControlador = null;
    var galletasControlador = null;

    function volverAlEvaluador() {
      pantallaJuego.classList.add("oculto");
      pantallaJuego.setAttribute("aria-hidden", "true");
      appNormal.classList.remove("oculto");
      menuEjemplos.classList.remove("oculto");
    }

    // Puente provisional entre los dos minijuegos, mientras no exista el
    // mapa de niveles.
    function mostrarTaller() {
      contenedorGalletas.classList.add("oculto");
      contenedorTaller.classList.remove("oculto");
      if (!tallerControlador) {
        tallerControlador = LN.juegoTaller.crear(contenedorTaller, { onTerminarNivel: volverAlEvaluador });
      }
    }

    function mostrarGalletas() {
      contenedorTaller.classList.add("oculto");
      contenedorGalletas.classList.remove("oculto");
      if (!galletasControlador) {
        galletasControlador = LN.juegoGalletas.crear(contenedorGalletas, { onTerminarNivel: volverAlEvaluador });
      }
    }

    botonModoJuego.addEventListener("click", function () {
      appNormal.classList.add("oculto");
      menuEjemplos.classList.add("oculto");
      pantallaJuego.classList.remove("oculto");
      pantallaJuego.setAttribute("aria-hidden", "false");
      mostrarTaller();
    });

    botonVolver.addEventListener("click", volverAlEvaluador);
    botonIrTaller.addEventListener("click", mostrarTaller);
    botonIrGalletas.addEventListener("click", mostrarGalletas);
  });
})();
