// Pantalla "Galletas de jengibre": el jugador decora las galletas para
// lograr el valor de verdad pedido antes de hornear.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;

  function crear(contenedor, opts) {
    opts = opts || {};
    var onTerminarNivel = opts.onTerminarNivel || function () {};

    var niveles = LN.juegoDatos.galletas;
    var indiceActual = 0;
    var intentos = 0;
    var controladorArbol = null;
    var interpretacionActual = null;

    function indiceDe(id) {
      for (var i = 0; i < niveles.length; i++) if (niveles[i].id === id) return i;
      return 0;
    }

    function abrirNivel(id) {
      indiceActual = indiceDe(id);
      intentos = 0;
      render();
    }

    function tieneDecoracion(predicado, elemento) {
      var tuplas = interpretacionActual.predicados[predicado] || [];
      return tuplas.some(function (t) { return t[0] === elemento; });
    }

    function alternarDecoracion(predicado, elemento) {
      var tuplas = interpretacionActual.predicados[predicado] || (interpretacionActual.predicados[predicado] = []);
      var indice = -1;
      for (var i = 0; i < tuplas.length; i++) if (tuplas[i][0] === elemento) { indice = i; break; }
      if (indice >= 0) tuplas.splice(indice, 1);
      else tuplas.push([elemento]);
    }

    function render() {
      contenedor.textContent = "";
      var nivel = niveles[indiceActual];
      // Copia editable: nunca se toca el estado inicial del nivel, así
      // "Siguiente" y reintentar desde cero siempre parten del mismo plato.
      interpretacionActual = LN.juegoComun.clonar(nivel.interpretacion);

      var titulo = document.createElement("h2");
      titulo.textContent = "Galletas de jengibre — Zona " + nivel.zona;
      contenedor.appendChild(titulo);

      // Plato de galletas: un botón-decoración por predicado y por galleta.
      var plato = document.createElement("div");
      plato.className = "juego-banda";
      var predicadosUnarios = (nivel.lenguaje.predicados || []).filter(function (p) { return p.aridad === 1; });

      nivel.interpretacion.dominio.forEach(function (elemento) {
        var ficha = document.createElement("div");
        ficha.className = "juego-juguete";
        var nombre = document.createElement("div");
        nombre.className = "juego-juguete__nombre";
        nombre.textContent = elemento;
        ficha.appendChild(nombre);

        var decoraciones = document.createElement("div");
        decoraciones.className = "juego-juguete__etiquetas";
        predicadosUnarios.forEach(function (p) {
          var boton = document.createElement("button");
          boton.type = "button";
          boton.className = "juego-decoracion";
          boton.textContent = p.nombre;
          var activa = tieneDecoracion(p.nombre, elemento);
          boton.setAttribute("aria-pressed", activa ? "true" : "false");
          boton.classList.toggle("juego-decoracion--activa", activa);
          boton.addEventListener("click", function () {
            alternarDecoracion(p.nombre, elemento);
            var ahoraActiva = tieneDecoracion(p.nombre, elemento);
            boton.setAttribute("aria-pressed", ahoraActiva ? "true" : "false");
            boton.classList.toggle("juego-decoracion--activa", ahoraActiva);
            ocultarResultado();
          });
          decoraciones.appendChild(boton);
        });
        ficha.appendChild(decoraciones);
        plato.appendChild(ficha);
      });
      contenedor.appendChild(plato);

      // Pedido: frase, fórmula e insignia del objetivo.
      var pedido = document.createElement("div");
      pedido.className = "juego-pedido";
      var frase = document.createElement("p");
      frase.className = "juego-pedido__frase";
      frase.textContent = "Pedido: " + nivel.frase;
      pedido.appendChild(frase);
      var formulaTxt = document.createElement("p");
      formulaTxt.className = "juego-pedido__formula";
      formulaTxt.textContent = nivel.formula;
      pedido.appendChild(formulaTxt);
      var insignia = document.createElement("p");
      insignia.className = "juego-objetivo";
      insignia.textContent = "Buscas: " + (nivel.objetivo ? "Verdadero" : "Falso");
      pedido.appendChild(insignia);
      contenedor.appendChild(pedido);

      var botonHornear = document.createElement("button");
      botonHornear.type = "button";
      botonHornear.className = "boton-evaluar";
      botonHornear.textContent = "Hornear";
      contenedor.appendChild(botonHornear);

      // El árbol se dibuja recién al hornear, para no adelantar nada.
      var zonaArbol = document.createElement("div");
      zonaArbol.className = "juego-zona-arbol oculto";
      var controles = document.createElement("div");
      controles.className = "controles-arbol";
      var grupoZoom = document.createElement("div");
      grupoZoom.className = "controles-arbol__grupo";
      grupoZoom.setAttribute("role", "group");
      grupoZoom.setAttribute("aria-label", "Zoom del árbol");
      var botonMenos = crearBotonZoom("−", "Alejar");
      var botonAjustar = crearBotonZoom("Ajustar", "Ajustar a la pantalla");
      var botonMas = crearBotonZoom("+", "Acercar");
      grupoZoom.appendChild(botonMenos);
      grupoZoom.appendChild(botonAjustar);
      grupoZoom.appendChild(botonMas);
      controles.appendChild(grupoZoom);
      zonaArbol.appendChild(controles);

      var lienzo = document.createElement("div");
      lienzo.className = "juego-arbol-lienzo";
      zonaArbol.appendChild(lienzo);
      contenedor.appendChild(zonaArbol);

      botonMenos.addEventListener("click", function () { if (controladorArbol) controladorArbol.zoomOut(); });
      botonMas.addEventListener("click", function () { if (controladorArbol) controladorArbol.zoomIn(); });
      botonAjustar.addEventListener("click", function () { if (controladorArbol) controladorArbol.ajustar(); });

      var zonaResultado = document.createElement("div");
      zonaResultado.className = "juego-zona-resultado oculto";
      contenedor.appendChild(zonaResultado);
      var resultadoUI = LN.ui.resultado.crear(zonaResultado);

      var botonSiguiente = document.createElement("button");
      botonSiguiente.type = "button";
      botonSiguiente.className = "boton-evaluar oculto";
      contenedor.appendChild(botonSiguiente);

      function ocultarResultado() {
        zonaArbol.classList.add("oculto");
        zonaResultado.classList.add("oculto");
        botonSiguiente.classList.add("oculto");
      }

      function hornear() {
        var caso = LN.juegoComun.evaluarCaso(nivel.lenguaje, interpretacionActual, nivel.formula, nivel.entorno || {});
        if (!caso.ok) {
          zonaArbol.classList.add("oculto");
          zonaResultado.classList.remove("oculto");
          resultadoUI.mostrarErrores(caso.errores);
          return;
        }

        zonaArbol.classList.remove("oculto");
        controladorArbol = LN.arbol.dibujar(lienzo, caso.ast, {});
        LN.animacion.crear(controladorArbol, caso.resultado, {}).verTodo();

        var acerto = caso.resultado.valor === nivel.objetivo;
        intentos++;

        zonaResultado.classList.remove("oculto");
        var razonFinal = (acerto ? "¡Lograste el objetivo! " : "Todavía no: salió " + (caso.resultado.valor ? "Verdadero" : "Falso") + ". ") +
          caso.resultado.nodos[caso.resultado.raiz].razon;
        resultadoUI.mostrarResultado(caso.resultado.valor, razonFinal);

        if (acerto) {
          var estrellas = intentos <= 1 ? 3 : intentos === 2 ? 2 : 1;
          LN.juegoProgreso.marcarCompletado("galletas", nivel.id, estrellas);
          botonSiguiente.classList.remove("oculto");
          botonSiguiente.textContent = (indiceActual < niveles.length - 1)
            ? "¡Galleta lista! Siguiente plato"
            : "¡Galleta lista! Terminar Galletas de jengibre";
        }
      }

      botonHornear.addEventListener("click", hornear);

      botonSiguiente.addEventListener("click", function () {
        if (indiceActual < niveles.length - 1) {
          indiceActual++;
          intentos = 0;
          render();
        } else {
          onTerminarNivel();
        }
      });
    }

    function crearBotonZoom(texto, etiqueta) {
      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "boton-zoom";
      boton.textContent = texto;
      boton.setAttribute("aria-label", etiqueta);
      return boton;
    }

    render();
    return { render: render, abrirNivel: abrirNivel };
  }

  LN.juegoGalletas = { crear: crear };
})();
