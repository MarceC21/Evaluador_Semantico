// Resultado: muestra Verdadero/Falso en grande con la razón, o los
// errores de validación cuando algo no se pudo evaluar.
// "Una entrada incorrecta nunca recibe valor de verdad" (ver CLAUDE.md).

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;
  LN.ui = LN.ui || {};

  function crear(contenedor) {
    function limpiar() { contenedor.textContent = ""; }

    function mostrarVacio() {
      limpiar();
      var p = document.createElement("p");
      p.className = "tarjeta-resultado__razon";
      p.textContent = "Completa el lenguaje, la interpretación y la fórmula, y presiona Evaluar.";
      contenedor.appendChild(p);
    }

    function mostrarErrores(errores) {
      limpiar();
      var envoltura = document.createElement("div");
      envoltura.className = "tarjeta-resultado__errores";
      errores.forEach(function (e) {
        var div = document.createElement("div");
        div.className = "mensaje-error";
        div.setAttribute("role", "alert");
        div.textContent = "[" + e.codigo + "] " + e.mensaje;
        envoltura.appendChild(div);
      });
      contenedor.appendChild(envoltura);
    }

    function mostrarResultado(valor, razon) {
      limpiar();
      var insignia = document.createElement("div");
      insignia.className = "tarjeta-resultado__valor " +
        (valor ? "tarjeta-resultado__valor--verdadero" : "tarjeta-resultado__valor--falso");
      insignia.textContent = (valor ? "✓ Verdadero" : "✕ Falso");
      contenedor.appendChild(insignia);

      var p = document.createElement("p");
      p.className = "tarjeta-resultado__razon";
      p.textContent = razon;
      contenedor.appendChild(p);
    }

    mostrarVacio();
    return { mostrarVacio: mostrarVacio, mostrarErrores: mostrarErrores, mostrarResultado: mostrarResultado };
  }

  LN.ui.resultado = { crear: crear };
})();
