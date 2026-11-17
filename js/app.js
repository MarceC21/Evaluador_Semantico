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
    // y una llamada a actualizarEntornoCard() (que las necesita).
    var tarjetaEntorno = document.getElementById("tarjeta-entorno");
    var cuerpoEntorno = document.getElementById("cuerpo-entorno");
    var resultadoUI = LN.ui.resultado.crear(document.getElementById("contenedor-resultado"));

    var controladorLenguaje = LN.ui.lenguaje.crear(document.getElementById("cuerpo-lenguaje"), estado, onLenguajeCambio);
    var controladorInterpretacion = LN.ui.interpretacion.crear(document.getElementById("cuerpo-interpretacion"), estado, onInterpretacionCambio);
    var controladorFormula = LN.ui.formula.crear(document.getElementById("cuerpo-formula"), estado, {
      onAnalisisCambio: onAnalisisCambio,
      onEvaluarClick: onEvaluarClick
    });

    function onLenguajeCambio() {
      sincronizarInterpretacionConLenguaje();
      controladorInterpretacion.render();
      controladorFormula.render(); // reconstruye el teclado y reanaliza la fórmula
      resultadoUI.mostrarVacio();
    }

    function onInterpretacionCambio() {
      controladorInterpretacion.render();
      actualizarEntornoCard();
      resultadoUI.mostrarVacio();
    }

    function onAnalisisCambio(resultadoAnalisis) {
      actualizarEntornoCard();
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
        return;
      }

      var analisis = LN.api.analizarFormula(estado.formulaTexto, estado.lenguaje);
      estado.analisis = analisis;
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

      var resultado = LN.api.evaluar(analisis.ast, estado.interpretacion, estado.entorno);
      estado.ultimoResultado = resultado;
      resultadoUI.mostrarResultado(resultado.valor, resultado.nodos[resultado.raiz].razon);
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
