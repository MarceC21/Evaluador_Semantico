// Alterna entre la app normal y la pantalla de juego. El Mapa de
// niveles es la pantalla de entrada; desde ahí se elige el minijuego y
// el nivel.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;

  document.addEventListener("DOMContentLoaded", function () {
    var botonModoJuego = document.getElementById("boton-modo-juego");
    var botonVolver = document.getElementById("boton-volver-evaluador");
    var botonIrMapa = document.getElementById("boton-ir-mapa");
    var appNormal = document.querySelector("main.app");
    var menuEjemplos = document.getElementById("menu-ejemplos");
    var pantallaJuego = document.getElementById("pantalla-juego");
    var contenedorMapa = document.getElementById("juego-mapa");
    var contenedorTaller = document.getElementById("juego-taller");
    var contenedorGalletas = document.getElementById("juego-galletas");

    if (!botonModoJuego || !pantallaJuego) return;

    var mapaControlador = null;
    var tallerControlador = null;
    var galletasControlador = null;

    function volverAlEvaluador() {
      pantallaJuego.classList.add("oculto");
      pantallaJuego.setAttribute("aria-hidden", "true");
      appNormal.classList.remove("oculto");
      menuEjemplos.classList.remove("oculto");
    }

    function ocultarPantallasJuego() {
      contenedorMapa.classList.add("oculto");
      contenedorTaller.classList.add("oculto");
      contenedorGalletas.classList.add("oculto");
    }

    // Terminar un minijuego (o volver desde él) regresa al mapa, no
    // directo al evaluador: así se puede elegir qué sigue.
    function mostrarMapa() {
      ocultarPantallasJuego();
      contenedorMapa.classList.remove("oculto");
      if (!mapaControlador) {
        mapaControlador = LN.juegoMapa.crear(contenedorMapa, { onJugar: entrarNivel });
      } else {
        mapaControlador.render();
      }
    }

    function mostrarTaller(nivelId) {
      ocultarPantallasJuego();
      contenedorTaller.classList.remove("oculto");
      if (!tallerControlador) {
        tallerControlador = LN.juegoTaller.crear(contenedorTaller, { onTerminarNivel: mostrarMapa });
      }
      if (nivelId) tallerControlador.abrirNivel(nivelId);
    }

    function mostrarGalletas(nivelId) {
      ocultarPantallasJuego();
      contenedorGalletas.classList.remove("oculto");
      if (!galletasControlador) {
        galletasControlador = LN.juegoGalletas.crear(contenedorGalletas, { onTerminarNivel: mostrarMapa });
      }
      if (nivelId) galletasControlador.abrirNivel(nivelId);
    }

    function entrarNivel(modo, nivelId) {
      if (modo === "taller") mostrarTaller(nivelId);
      else if (modo === "galletas") mostrarGalletas(nivelId);
    }

    botonModoJuego.addEventListener("click", function () {
      appNormal.classList.add("oculto");
      menuEjemplos.classList.add("oculto");
      pantallaJuego.classList.remove("oculto");
      pantallaJuego.setAttribute("aria-hidden", "false");
      mostrarMapa();
    });

    botonVolver.addEventListener("click", volverAlEvaluador);
    botonIrMapa.addEventListener("click", mostrarMapa);
  });
})();
