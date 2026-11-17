// Tarjeta 3: Fórmula.
// Campo de texto + capa espejo (para subrayar errores) + teclado
// simbólico + atajos de teclado + autocompletar paréntesis.
// Ver docs/DECISIONES.md y docs/CONTRATO.md.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;
  LN.ui = LN.ui || {};

  // Atajos de teclado -> símbolo. Se normalizan EN VIVO (apenas se
  // escriben) para que la posición de los errores que reporta el
  // analizador siempre corresponda al texto que el usuario ve.
  var ATAJOS = [
    { patron: /~|!/, reemplazo: "¬" },
    { patron: /&/, reemplazo: "∧" },
    { patron: /\|/, reemplazo: "∨" },
    { patron: /->/, reemplazo: "→" },
    { patron: /A\./, reemplazo: "∀" },
    { patron: /E\./, reemplazo: "∃" }
  ];

  function normalizarAtajos(texto, cursor) {
    var cambiado = true;
    while (cambiado) {
      cambiado = false;
      for (var i = 0; i < ATAJOS.length; i++) {
        var m = ATAJOS[i].patron.exec(texto);
        if (m) {
          var idx = m.index, len = m[0].length, rep = ATAJOS[i].reemplazo;
          texto = texto.slice(0, idx) + rep + texto.slice(idx + len);
          if (idx + len <= cursor) cursor -= (len - rep.length);
          else if (idx < cursor) cursor = idx + rep.length;
          cambiado = true;
        }
      }
    }
    return { texto: texto, cursor: cursor };
  }

  function crear(contenedor, estado, callbacks) {
    // callbacks: { onAnalisisCambio(resultado), onEvaluarClick() }

    var teclado = document.createElement("div");
    teclado.className = "teclado-simbolico";
    contenedor.appendChild(teclado);

    var envoltura = document.createElement("div");
    envoltura.className = "campo-formula-envoltura";
    var capaEspejo = document.createElement("div");
    capaEspejo.className = "capa-espejo";
    capaEspejo.setAttribute("aria-hidden", "true");
    var campo = document.createElement("textarea");
    campo.className = "campo-formula";
    campo.setAttribute("aria-label", "Fórmula de primer orden");
    campo.spellcheck = false;
    envoltura.appendChild(capaEspejo);
    envoltura.appendChild(campo);
    contenedor.appendChild(envoltura);

    var mensajeError = document.createElement("div");
    mensajeError.className = "mensaje-error oculto";
    mensajeError.setAttribute("role", "alert");
    contenedor.appendChild(mensajeError);

    var botonEvaluar = document.createElement("button");
    botonEvaluar.type = "button";
    botonEvaluar.className = "boton-evaluar";
    botonEvaluar.textContent = "Evaluar";
    botonEvaluar.addEventListener("click", function () { callbacks.onEvaluarClick(); });
    contenedor.appendChild(botonEvaluar);

    function insertarTexto(texto, cursorRelativo) {
      var inicio = campo.selectionStart, fin = campo.selectionEnd;
      var valor = campo.value;
      campo.value = valor.slice(0, inicio) + texto + valor.slice(fin);
      var nuevoCursor = inicio + (typeof cursorRelativo === "number" ? cursorRelativo : texto.length);
      campo.focus();
      campo.setSelectionRange(nuevoCursor, nuevoCursor);
      manejarCambio();
    }

    function insertarAperturaParen() {
      insertarTexto("()", 1);
    }

    function manejarCierreParen(ev) {
      var pos = campo.selectionStart;
      if (campo.selectionStart === campo.selectionEnd && campo.value[pos] === ")") {
        ev.preventDefault();
        campo.setSelectionRange(pos + 1, pos + 1);
      }
      // si no hay un ")" justo después, se deja el comportamiento normal
    }

    campo.addEventListener("keydown", function (ev) {
      if (ev.key === "(") {
        ev.preventDefault();
        insertarAperturaParen();
      } else if (ev.key === ")") {
        manejarCierreParen(ev);
      }
    });

    campo.addEventListener("input", manejarCambio);

    function construirCapaEspejo(texto, posicionError) {
      capaEspejo.textContent = "";
      if (typeof posicionError !== "number") {
        capaEspejo.textContent = texto;
        return;
      }
      var antes = texto.slice(0, posicionError);
      var caracter = texto[posicionError];
      var despues = texto.slice(posicionError + (caracter ? 1 : 0));
      if (antes) capaEspejo.appendChild(document.createTextNode(antes));
      var mark = document.createElement("mark");
      mark.className = "error";
      mark.textContent = caracter || " ";
      capaEspejo.appendChild(mark);
      if (despues) capaEspejo.appendChild(document.createTextNode(despues));
    }

    function manejarCambio() {
      var cursor = campo.selectionStart;
      var normalizado = normalizarAtajos(campo.value, cursor);
      if (normalizado.texto !== campo.value) {
        campo.value = normalizado.texto;
        campo.setSelectionRange(normalizado.cursor, normalizado.cursor);
      }
      estado.formulaTexto = campo.value;

      var resultado = LN.api.analizarFormula(campo.value, estado.lenguaje);
      estado.analisis = resultado;

      if (resultado.ok) {
        construirCapaEspejo(campo.value, undefined);
        mensajeError.classList.add("oculto");
        mensajeError.textContent = "";
      } else if (campo.value.trim() === "") {
        // Campo todavía vacío: no es un error que haya que mostrarle
        // al usuario apenas abre la página, solo al intentar Evaluar.
        construirCapaEspejo(campo.value, undefined);
        mensajeError.classList.add("oculto");
        mensajeError.textContent = "";
      } else {
        var primerError = resultado.errores[0];
        construirCapaEspejo(campo.value, primerError.posicion);
        mensajeError.textContent = "[" + primerError.codigo + "] " + primerError.mensaje;
        mensajeError.classList.remove("oculto");
      }

      callbacks.onAnalisisCambio(resultado);
    }

    function crearTecla(etiqueta, aria, alHacerClic, claseExtra) {
      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "tecla" + (claseExtra ? " " + claseExtra : "");
      boton.textContent = etiqueta;
      boton.setAttribute("aria-label", aria);
      boton.addEventListener("click", alHacerClic);
      return boton;
    }

    function renderTeclado() {
      teclado.textContent = "";
      teclado.appendChild(crearTecla("¬", "Negación", function () { insertarTexto("¬"); }));
      teclado.appendChild(crearTecla("∧", "Conjunción", function () { insertarTexto("∧"); }));
      teclado.appendChild(crearTecla("∨", "Disyunción", function () { insertarTexto("∨"); }));
      teclado.appendChild(crearTecla("→", "Implicación", function () { insertarTexto("→"); }));
      teclado.appendChild(crearTecla("∀", "Para todo", function () { insertarTexto("∀"); }));
      teclado.appendChild(crearTecla("∃", "Existe", function () { insertarTexto("∃"); }));
      teclado.appendChild(crearTecla("(", "Paréntesis que abre", function () { insertarAperturaParen(); }));
      teclado.appendChild(crearTecla(")", "Paréntesis que cierra", function () { insertarTexto(")"); }));

      ["x", "y", "z"].forEach(function (v) {
        teclado.appendChild(crearTecla(v, "Variable " + v, function () { insertarTexto(v); }, "tecla--texto"));
      });

      estado.lenguaje.funciones.concat(estado.lenguaje.predicados).forEach(function (s) {
        var texto = s.aridad > 0 ? s.nombre + "()" : s.nombre;
        var cursorRel = s.aridad > 0 ? s.nombre.length + 1 : texto.length;
        teclado.appendChild(crearTecla(s.nombre, "Símbolo " + s.nombre, function () {
          insertarTexto(texto, cursorRel);
        }, "tecla--texto"));
      });
    }

    function render() {
      renderTeclado();
      campo.value = estado.formulaTexto || "";
      manejarCambio();
    }

    render();
    return { render: render };
  }

  LN.ui.formula = { crear: crear };
})();
