// Orquestación de la interfaz: guarda el estado, conecta las tarjetas
// y llama a LN.api.* en el orden que marca docs/CONTRATO.md:
// validarInterpretacion -> analizarFormula -> validarEntorno -> evaluar.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;

  function clonar(obj) { return JSON.parse(JSON.stringify(obj)); }

  // --- Estado inicial (igual al primer caso de ejemplo, ver mock/casos/casos.js) ---
  var estado = {
    lenguaje: {
      funciones: [{ nombre: "k", aridad: 0 }, { nombre: "f", aridad: 1 }],
      predicados: [{ nombre: "P", aridad: 1 }, { nombre: "Q", aridad: 1 }, { nombre: "R", aridad: 1 }]
    },
    interpretacion: {
      dominio: ["a", "b", "c"],
      funciones: {
        k: [{ args: [], valor: "a" }],
        f: [{ args: ["a"], valor: "b" }, { args: ["b"], valor: "c" }, { args: ["c"], valor: "a" }]
      },
      predicados: { P: [["a"], ["b"], ["c"]], Q: [["a"]], R: [["b"]] }
    },
    formulaTexto: "",
    analisis: null,
    entorno: {}
  };

  // Mantiene interpretacion.funciones / interpretacion.predicados con
  // exactamente una clave por símbolo declarado en el lenguaje (agrega
  // las que falten vacías, quita las de símbolos ya borrados).
  function sincronizarInterpretacionConLenguaje() {
    var nuevasFunciones = {};
    estado.lenguaje.funciones.forEach(function (f) {
      nuevasFunciones[f.nombre] = estado.interpretacion.funciones[f.nombre] || [];
    });
    estado.interpretacion.funciones = nuevasFunciones;

    var nuevosPredicados = {};
    estado.lenguaje.predicados.forEach(function (p) {
      nuevosPredicados[p.nombre] = estado.interpretacion.predicados[p.nombre] || [];
    });
    estado.interpretacion.predicados = nuevosPredicados;
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Importante: estas referencias al DOM se obtienen ANTES de crear los
    // controladores, porque construir el de fórmula ya dispara un análisis
    // y una llamada a actualizarEntornoCard() y actualizarArbol() (que las necesitan).
    var tarjetaEntorno = document.getElementById("tarjeta-entorno");
    var cuerpoEntorno = document.getElementById("cuerpo-entorno");
    var resultadoUI = LN.ui.resultado.crear(document.getElementById("contenedor-resultado"));

    // --- Árbol navideño: referencias, estado y funciones (Fase 3) ---
    var tarjetaArbolEl = document.getElementById("contenedor-arbol");
    var lienzoArbol = document.getElementById("arbol-lienzo");
    var leyendaArbol = document.getElementById("leyenda-arbol");
    var controlesAnimacion = document.getElementById("controles-animacion");
    var controladorArbol = null;   // lo que devuelve LN.arbol.dibujar(...) para la fórmula actual
    var animacionActual = null;    // lo que devuelve LN.animacion.crear(...) tras Evaluar
    var globito = null;            // globito de explicación, se crea la primera vez que hace falta

    function crearGlobito() {
      if (globito) return globito;
      globito = document.createElement("div");
      globito.className = "globito-nodo oculto";
      globito.setAttribute("role", "dialog");
      globito.setAttribute("aria-label", "Detalle del nodo");
      var cerrar = document.createElement("button");
      cerrar.type = "button";
      cerrar.className = "globito-nodo__cerrar";
      cerrar.textContent = "×";
      cerrar.setAttribute("aria-label", "Cerrar detalle");
      cerrar.addEventListener("click", ocultarGlobito);
      globito.appendChild(cerrar);
      var cuerpo = document.createElement("div");
      cuerpo.className = "globito-nodo__cuerpo";
      globito.appendChild(cuerpo);
      tarjetaArbolEl.appendChild(globito);
      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && !globito.classList.contains("oculto")) ocultarGlobito();
      });
      return globito;
    }

    function ocultarGlobito() {
      if (globito) globito.classList.add("oculto");
    }

    // Muestra, junto al nodo, su valor, la razón, las variables libres de
    // esa subfórmula (calculadas aparte con LN.arbol.freeVars) con su valor
    // en el entorno, y -si es ∀ o ∃- las ramas por elemento del dominio con
    // el testigo o contraejemplo resaltado. Ver docs/DISENO.md.
    function mostrarGlobito(id) {
      if (!controladorArbol || !estado.ultimoResultado) return;
      var datoNodo = estado.ultimoResultado.nodos[id];
      if (!datoNodo) return;
      var astNodo = controladorArbol.nodoAst(id);
      var libres = LN.arbol.freeVars(astNodo);

      var g = crearGlobito();
      var cuerpo = g.querySelector(".globito-nodo__cuerpo");
      cuerpo.textContent = "";

      var valor = document.createElement("div");
      valor.className = "globito-nodo__valor " + (datoNodo.valor ? "globito-nodo__valor--verdadero" : "globito-nodo__valor--falso");
      valor.textContent = datoNodo.valor ? "✓ Verdadero" : "✕ Falso";
      cuerpo.appendChild(valor);

      var razon = document.createElement("p");
      razon.className = "globito-nodo__razon";
      razon.textContent = datoNodo.razon;
      cuerpo.appendChild(razon);

      if (libres.length > 0) {
        var entornoTxt = libres.map(function (v) {
          var val = (datoNodo.entorno && (v in datoNodo.entorno)) ? datoNodo.entorno[v] : "?";
          return v + " = " + val;
        }).join(", ");
        var entornoDiv = document.createElement("div");
        entornoDiv.className = "globito-nodo__entorno";
        entornoDiv.textContent = "Variables libres de esta parte: " + entornoTxt;
        cuerpo.appendChild(entornoDiv);
      }

      // El motor real deja "ramas" en [] (no en null) cuando el nodo no es
      // un cuantificador, así que se revisa también la longitud.
      if (datoNodo.ramas && datoNodo.ramas.length > 0) {
        var lista = document.createElement("ul");
        lista.className = "globito-nodo__ramas";
        datoNodo.ramas.forEach(function (r) {
          var li = document.createElement("li");
          var esTestigo = r.elemento === datoNodo.testigo;
          var esContraejemplo = r.elemento === datoNodo.contraejemplo;
          if (esTestigo || esContraejemplo) li.className = "decisiva";
          var etiqueta = document.createElement("span");
          etiqueta.textContent = r.elemento + (esTestigo ? " (testigo)" : esContraejemplo ? " (contraejemplo)" : "");
          var val = document.createElement("span");
          val.textContent = r.valor ? "✓" : "✕";
          li.appendChild(etiqueta);
          li.appendChild(val);
          lista.appendChild(li);
        });
        cuerpo.appendChild(lista);
      }

      g.classList.remove("oculto");
      g.style.visibility = "hidden";
      var pos = controladorArbol.posicionNodo(id, tarjetaArbolEl);
      if (pos) {
        var anchoGlobito = g.offsetWidth, altoGlobito = g.offsetHeight;
        var maxX = tarjetaArbolEl.clientWidth - anchoGlobito - 8;
        var left = Math.max(8, Math.min(pos.x - anchoGlobito / 2, maxX));
        var top = Math.max(8, pos.y - altoGlobito - 14);
        g.style.left = left + "px";
        g.style.top = top + "px";
      }
      g.style.visibility = "visible";
      g.querySelector(".globito-nodo__cerrar").focus();
    }

    function manejarClicNodo(id) {
      if (!estado.resultadoVigente || !estado.ultimoResultado) return;
      mostrarGlobito(id);
    }

    // Esconde la leyenda, los controles de animación y el globito, y apaga
    // los colores del árbol: se llama cada vez que algo pudo dejar
    // desactualizado al último resultado mostrado (cambia la fórmula, el
    // lenguaje, la interpretación o el entorno).
    function ocultarResultadoArbol() {
      if (animacionActual) { animacionActual.destruir(); animacionActual = null; }
      estado.resultadoVigente = false;
      leyendaArbol.classList.add("oculto");
      controlesAnimacion.classList.add("oculto");
      ocultarGlobito();
      if (controladorArbol) controladorArbol.resetearColores();
    }

    // Dibuja el árbol (gris, sin valores) a partir del análisis actual de
    // la fórmula. Si la fórmula no es válida, deja el último árbol válido
    // atenuado en vez de borrarlo (nunca se dibujan árboles a medias, ver
    // docs/DECISIONES.md). Se llama en cada tecla mientras se escribe.
    function actualizarArbol(analisis) {
      ocultarResultadoArbol();
      if (analisis && analisis.ok) {
        lienzoArbol.classList.remove("atenuado");
        controladorArbol = LN.arbol.dibujar(lienzoArbol, analisis.ast, { onClicNodo: manejarClicNodo });
      } else if (controladorArbol) {
        lienzoArbol.classList.add("atenuado");
      }
    }

    function mostrarResultadoEnArbol(resultado) {
      if (!controladorArbol) return;
      estado.resultadoVigente = true;
      animacionActual = LN.animacion.crear(controladorArbol, resultado, {
        onPaso: function (id) { if (id !== null) mostrarGlobito(id); else ocultarGlobito(); }
      });
      leyendaArbol.classList.remove("oculto");
      controlesAnimacion.classList.remove("oculto");
      animacionActual.verTodo();
    }

    document.getElementById("boton-zoom-menos").addEventListener("click", function () { if (controladorArbol) controladorArbol.zoomOut(); });
    document.getElementById("boton-zoom-mas").addEventListener("click", function () { if (controladorArbol) controladorArbol.zoomIn(); });
    document.getElementById("boton-zoom-ajustar").addEventListener("click", function () { if (controladorArbol) controladorArbol.ajustar(); });
    document.getElementById("boton-ver-todo").addEventListener("click", function () { if (animacionActual) animacionActual.verTodo(); });
    document.getElementById("boton-repetir").addEventListener("click", function () { if (animacionActual) animacionActual.repetir(); });
    document.getElementById("boton-paso-anterior").addEventListener("click", function () { if (animacionActual) animacionActual.anterior(); });
    document.getElementById("boton-paso-siguiente").addEventListener("click", function () { if (animacionActual) animacionActual.siguiente(); });

    // Nieve cayendo suave en la tarjeta del árbol (puramente decorativo).
    (function generarNieve() {
      var contenedorNieve = document.getElementById("arbol-nieve");
      for (var i = 0; i < 12; i++) {
        var copo = document.createElement("span");
        var tam = 2 + Math.random() * 1.5;
        copo.style.width = tam + "px";
        copo.style.height = tam + "px";
        copo.style.left = (Math.random() * 100) + "%";
        var duracion = 8 + Math.random() * 5;
        copo.style.animationDuration = duracion.toFixed(2) + "s";
        copo.style.animationDelay = "-" + (Math.random() * duracion).toFixed(2) + "s";
        contenedorNieve.appendChild(copo);
      }
    })();

    // Guirnaldas cortas de fondo junto al título (fijas, no dependen del árbol).
    if (LN.guirnalda) {
      LN.guirnalda.dibujarFondo(document.getElementById("guirnalda-fondo-izq"), document.getElementById("guirnalda-fondo-der"));
    }

    var controladorLenguaje = LN.ui.lenguaje.crear(document.getElementById("cuerpo-lenguaje"), estado, onLenguajeCambio);
    var controladorInterpretacion = LN.ui.interpretacion.crear(document.getElementById("cuerpo-interpretacion"), estado, onInterpretacionCambio);
    var controladorFormula = LN.ui.formula.crear(document.getElementById("cuerpo-formula"), estado, {
      onAnalisisCambio: onAnalisisCambio,
      onEvaluarClick: onEvaluarClick
    });

    function onLenguajeCambio() {
      controladorLenguaje.render(); // faltaba: por eso + y − no se veían hacer nada
      sincronizarInterpretacionConLenguaje();
      controladorInterpretacion.render();
      controladorFormula.render(); // reconstruye el teclado y reanaliza la fórmula
      resultadoUI.mostrarVacio();
    }

    function onInterpretacionCambio() {
      controladorInterpretacion.render();
      actualizarEntornoCard();
      resultadoUI.mostrarVacio();
      ocultarResultadoArbol();
    }

    function onAnalisisCambio(resultadoAnalisis) {
      actualizarEntornoCard();
      actualizarArbol(resultadoAnalisis);
    }

    // Construye (o esconde) la tarjeta 4, Entorno, según las variables
    // libres de la fórmula actual.
    function actualizarEntornoCard() {
      var libres = (estado.analisis && estado.analisis.ok) ? estado.analisis.libres : [];

      if (libres.length === 0) {
        tarjetaEntorno.classList.add("oculto");
        return;
      }
      tarjetaEntorno.classList.remove("oculto");
      cuerpoEntorno.textContent = "";

      var nuevoEntorno = {};
      libres.forEach(function (v) {
        var valorPrevio = estado.entorno[v];
        var valorValido = estado.interpretacion.dominio.indexOf(valorPrevio) !== -1 ? valorPrevio : "";
        nuevoEntorno[v] = valorValido;

        var fila = document.createElement("div");
        fila.className = "fila-entorno";
        var etiqueta = document.createElement("label");
        etiqueta.textContent = v + " =";
        etiqueta.setAttribute("for", "entorno-" + v);
        fila.appendChild(etiqueta);

        var select = document.createElement("select");
        select.id = "entorno-" + v;
        var opcionVacia = document.createElement("option");
        opcionVacia.value = "";
        opcionVacia.textContent = "— elegir del dominio —";
        select.appendChild(opcionVacia);
        estado.interpretacion.dominio.forEach(function (d) {
          var opt = document.createElement("option");
          opt.value = d; opt.textContent = d;
          if (d === valorValido) opt.selected = true;
          select.appendChild(opt);
        });
        select.addEventListener("change", function () {
          estado.entorno[v] = select.value;
          resultadoUI.mostrarVacio();
          ocultarResultadoArbol();
        });
        fila.appendChild(select);
        cuerpoEntorno.appendChild(fila);
      });
      estado.entorno = nuevoEntorno;
    }

    function onEvaluarClick() {
      var validacionInterpretacion = LN.api.validarInterpretacion(estado.lenguaje, estado.interpretacion);
      if (!validacionInterpretacion.ok) {
        resultadoUI.mostrarErrores(validacionInterpretacion.errores);
        ocultarResultadoArbol();
        return;
      }

      var analisis = LN.api.analizarFormula(estado.formulaTexto, estado.lenguaje);
      estado.analisis = analisis;
      actualizarArbol(analisis); // asegura que el árbol gris corresponda a esta fórmula
      if (!analisis.ok) {
        resultadoUI.mostrarErrores(analisis.errores);
        return;
      }

      actualizarEntornoCard();

      var validacionEntorno = LN.api.validarEntorno(analisis.libres, estado.interpretacion, estado.entorno);
      if (!validacionEntorno.ok) {
        resultadoUI.mostrarErrores(validacionEntorno.errores);
        return;
      }

      // El motor real de validarEntorno devuelve el entorno ya limpio
      // (solo las variables libres, validadas); el mock no trae ese
      // campo, así que en ese caso se usa el entorno tal cual.
      var entornoParaEvaluar = validacionEntorno.entorno || estado.entorno;
      var resultado = LN.api.evaluar(analisis.ast, estado.interpretacion, entornoParaEvaluar);
      estado.ultimoResultado = resultado;
      resultadoUI.mostrarResultado(resultado.valor, resultado.nodos[resultado.raiz].razon);
      mostrarResultadoEnArbol(resultado);
    }

    // --- Menú "Cargar ejemplo" ---
    var menuEjemplos = document.getElementById("menu-ejemplos");
    (LN.casos || []).forEach(function (caso) {
      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "boton-secundario";
      boton.textContent = caso.titulo;
      boton.title = caso.descripcion;
      boton.addEventListener("click", function () {
        estado.lenguaje = clonar(caso.lenguaje);
        estado.interpretacion = clonar(caso.interpretacion);
        estado.formulaTexto = caso.formula;
        estado.entorno = clonar(caso.entorno || {});
        sincronizarInterpretacionConLenguaje();
        controladorLenguaje.render();
        controladorInterpretacion.render();
        controladorFormula.render();
        actualizarEntornoCard();
        onEvaluarClick();
      });
      menuEjemplos.appendChild(boton);
    });

    // --- Colapsar / expandir tarjetas (funciona con clic y con teclado) ---
    document.querySelectorAll(".tarjeta__encabezado").forEach(function (encabezado) {
      encabezado.addEventListener("click", function () {
        var tarjeta = encabezado.closest(".tarjeta");
        var colapsada = tarjeta.getAttribute("data-colapsada") === "true";
        tarjeta.setAttribute("data-colapsada", colapsada ? "false" : "true");
        encabezado.setAttribute("aria-expanded", colapsada ? "true" : "false");
        var flecha = encabezado.querySelector(".tarjeta__colapsar");
        flecha.textContent = colapsada ? "▾" : "▸";
      });
    });

    sincronizarInterpretacionConLenguaje();
    actualizarEntornoCard();
  });
})();
