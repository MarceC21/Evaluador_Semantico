// Pantalla "Taller de Santa" (Fase 6, modo juego): llega un pedido (una
// frase en español + su fórmula) y el jugador decide Verdadero o Falso
// ANTES de ver el árbol. Al decidir, el árbol real se dibuja y se
// enciende en cascada (reutilizando js/arbol.js y js/animacion.js tal
// cual, sin tocarlos) y se compara la elección contra el motor real.
// Ver docs/DEFENSA.md.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;

  function crear(contenedor, opts) {
    opts = opts || {};
    var onTerminarNivel = opts.onTerminarNivel || function () {};

    var niveles = LN.juegoDatos.taller;
    var indiceActual = 0;
    var intentos = 0;
    var controladorArbol = null;

    function indiceDe(id) {
      for (var i = 0; i < niveles.length; i++) if (niveles[i].id === id) return i;
      return 0;
    }

    function abrirNivel(id) {
      indiceActual = indiceDe(id);
      intentos = 0;
      render();
    }

    function render() {
      contenedor.textContent = "";
      var nivel = niveles[indiceActual];

      var titulo = document.createElement("h2");
      titulo.textContent = "Taller de Santa — Zona " + nivel.zona;
      contenedor.appendChild(titulo);

      // --- Banda de juguetes: cada elemento del dominio con sus etiquetas
      // (los predicados unarios que cumple), como contexto del pedido. ---
      var banda = document.createElement("div");
      banda.className = "juego-banda";
      nivel.interpretacion.dominio.forEach(function (elemento) {
        var ficha = document.createElement("div");
        ficha.className = "juego-juguete";
        var nombre = document.createElement("div");
        nombre.className = "juego-juguete__nombre";
        nombre.textContent = elemento;
        ficha.appendChild(nombre);

        var etiquetas = document.createElement("div");
        etiquetas.className = "juego-juguete__etiquetas";
        (nivel.lenguaje.predicados || []).forEach(function (p) {
          if (p.aridad !== 1) return;
          var tuplas = nivel.interpretacion.predicados[p.nombre] || [];
          var tiene = tuplas.some(function (t) { return t[0] === elemento; });
          if (!tiene) return;
          var etiqueta = document.createElement("span");
          etiqueta.className = "juego-etiqueta";
          etiqueta.textContent = p.nombre;
          etiquetas.appendChild(etiqueta);
        });
        ficha.appendChild(etiquetas);
        banda.appendChild(ficha);
      });
      contenedor.appendChild(banda);

      // --- Pedido: frase en español + fórmula en símbolos ---
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
      contenedor.appendChild(pedido);

      // --- Decisión del jugador ---
      var decision = document.createElement("div");
      decision.className = "juego-decision";
      var botonV = document.createElement("button");
      botonV.type = "button";
      botonV.className = "juego-boton-decision juego-boton-decision--verdadero";
      botonV.textContent = "Verdadero — al trineo";
      var botonF = document.createElement("button");
      botonF.type = "button";
      botonF.className = "juego-boton-decision juego-boton-decision--falso";
      botonF.textContent = "Falso — a revisión";
      decision.appendChild(botonV);
      decision.appendChild(botonF);
      contenedor.appendChild(decision);

      // --- Árbol (se dibuja recién al decidir, para no adelantar nada) ---
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

      // --- Resultado (veredicto + razón del motor real) ---
      var zonaResultado = document.createElement("div");
      zonaResultado.className = "juego-zona-resultado oculto";
      contenedor.appendChild(zonaResultado);
      var resultadoUI = LN.ui.resultado.crear(zonaResultado);

      var botonSiguiente = document.createElement("button");
      botonSiguiente.type = "button";
      botonSiguiente.className = "boton-evaluar oculto";
      contenedor.appendChild(botonSiguiente);

      function decidir(eleccion) {
        botonV.disabled = true;
        botonF.disabled = true;

        var caso = LN.juegoComun.evaluarCaso(nivel.lenguaje, nivel.interpretacion, nivel.formula, nivel.entorno || {});
        if (!caso.ok) {
          // No debería pasar (los niveles se verificaron contra el motor
          // real antes de escribirlos), pero si pasa, se avisa en vez de
          // fallar en silencio.
          zonaResultado.classList.remove("oculto");
          resultadoUI.mostrarErrores(caso.errores);
          return;
        }

        zonaArbol.classList.remove("oculto");
        controladorArbol = LN.arbol.dibujar(lienzo, caso.ast, {});
        LN.animacion.crear(controladorArbol, caso.resultado, {}).verTodo();

        var acerto = eleccion === caso.resultado.valor;
        intentos++;

        zonaResultado.classList.remove("oculto");
        var razonFinal = (acerto ? "¡Correcto! " : "Era " + (caso.resultado.valor ? "Verdadero" : "Falso") + ". ") +
          caso.resultado.nodos[caso.resultado.raiz].razon;
        resultadoUI.mostrarResultado(caso.resultado.valor, razonFinal);

        if (acerto) {
          var estrellas = intentos <= 1 ? 3 : intentos === 2 ? 2 : 1;
          LN.juegoProgreso.marcarCompletado("taller", nivel.id, estrellas);
          botonSiguiente.classList.remove("oculto");
          botonSiguiente.textContent = (indiceActual < niveles.length - 1)
            ? "¡Ganaste un regalo! Siguiente pedido"
            : "¡Ganaste un regalo! Terminar Taller de Santa";
        } else {
          botonV.disabled = false;
          botonF.disabled = false;
        }
      }

      botonV.addEventListener("click", function () { decidir(true); });
      botonF.addEventListener("click", function () { decidir(false); });

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

  LN.juegoTaller = { crear: crear };
})();
