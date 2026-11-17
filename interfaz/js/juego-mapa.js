// Pantalla "Mapa de niveles": conecta los minijuegos, muestra las
// estrellas ganadas y desbloquea cada zona al terminar la anterior.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;

  var NS_SVG = "http://www.w3.org/2000/svg";

  function crearEstrella(llena) {
    var svg = document.createElementNS(NS_SVG, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    var polygon = document.createElementNS(NS_SVG, "polygon");
    polygon.setAttribute("points", "12,2 14.7,9 22,9.3 16.2,14 18.2,21.3 12,17.1 5.8,21.3 7.8,14 2,9.3 9.3,9");
    polygon.setAttribute("fill", llena ? "#F7D774" : "#EBDDE1");
    polygon.setAttribute("stroke", llena ? "#C9962B" : "#C9A6B0");
    polygon.setAttribute("stroke-width", "1");
    svg.appendChild(polygon);
    return svg;
  }

  function crearEstrellas(cantidad) {
    var contenedor = document.createElement("span");
    contenedor.className = "juego-mapa-estrellas";
    for (var i = 0; i < 3; i++) contenedor.appendChild(crearEstrella(i < cantidad));
    return contenedor;
  }

  function agruparPorZona(niveles) {
    var zonas = {};
    niveles.forEach(function (n) {
      zonas[n.zona] = zonas[n.zona] || [];
      zonas[n.zona].push(n);
    });
    return zonas;
  }

  function zonaCompleta(modo, nivelesZona) {
    return nivelesZona.every(function (n) { return LN.juegoProgreso.estaCompletado(modo, n.id); });
  }

  function crear(contenedor, opts) {
    opts = opts || {};
    var onJugar = opts.onJugar || function () {};

    function crearBotonNivel(modo, nivel, numero, desbloqueada) {
      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "juego-mapa-nivel" + (desbloqueada ? "" : " juego-mapa-nivel--bloqueado");
      var etiqueta = document.createElement("span");
      etiqueta.className = "juego-mapa-nivel__numero";
      etiqueta.textContent = numero;
      boton.appendChild(etiqueta);
      boton.appendChild(crearEstrellas(LN.juegoProgreso.estrellasDe(modo, nivel.id)));
      if (desbloqueada) {
        boton.addEventListener("click", function () { onJugar(modo, nivel.id); });
      } else {
        boton.disabled = true;
        boton.setAttribute("aria-label", "Nivel " + numero + ": bloqueado, termina la zona anterior primero");
      }
      return boton;
    }

    function crearTarjetaZona(modo, zonaNum, nivelesZona, desbloqueada, primerNumero) {
      var tarjeta = document.createElement("div");
      tarjeta.className = "juego-mapa-zona" + (desbloqueada ? "" : " juego-mapa-zona--bloqueada");
      var titulo = document.createElement("h4");
      titulo.textContent = "Zona " + zonaNum + (desbloqueada ? "" : " — bloqueada");
      tarjeta.appendChild(titulo);
      var fila = document.createElement("div");
      fila.className = "juego-mapa-niveles";
      nivelesZona.forEach(function (nivel, i) {
        fila.appendChild(crearBotonNivel(modo, nivel, primerNumero + i, desbloqueada));
      });
      tarjeta.appendChild(fila);
      return tarjeta;
    }

    function crearSeccionJuego(modo, nombre, niveles) {
      var seccion = document.createElement("div");
      seccion.className = "juego-mapa-seccion";
      var h3 = document.createElement("h3");
      h3.textContent = nombre;
      seccion.appendChild(h3);

      var zonas = agruparPorZona(niveles);
      var numerosZona = Object.keys(zonas).sort(function (a, b) { return a - b; });
      var completaHastaAqui = true;
      var contador = 1;
      numerosZona.forEach(function (zonaNum) {
        var nivelesZona = zonas[zonaNum];
        var desbloqueada = completaHastaAqui;
        seccion.appendChild(crearTarjetaZona(modo, zonaNum, nivelesZona, desbloqueada, contador));
        contador += nivelesZona.length;
        completaHastaAqui = completaHastaAqui && zonaCompleta(modo, nivelesZona);
      });

      return seccion;
    }

    function render() {
      contenedor.textContent = "";
      var titulo = document.createElement("h2");
      titulo.textContent = "Mapa de niveles";
      contenedor.appendChild(titulo);

      contenedor.appendChild(crearSeccionJuego("taller", "Taller de Santa", LN.juegoDatos.taller));
      contenedor.appendChild(crearSeccionJuego("galletas", "Galletas de jengibre", LN.juegoDatos.galletas));
    }

    render();
    return { render: render };
  }

  LN.juegoMapa = { crear: crear };
})();
