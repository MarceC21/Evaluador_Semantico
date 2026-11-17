// Tarjeta 3, modo "Arma tu árbol": constructor visual de la fórmula por
// piezas (arrastrables, y también accesible por clic/Enter sin mouse).
// No tiene su propio motor: cuando el árbol que se arma queda completo
// (sin espacios vacíos), genera el texto equivalente con paréntesis
// explícitos y se lo entrega a ui-formula.js, que lo mete en el campo
// de texto real y sigue el mismo camino de siempre (analizarFormula,
// árbol de la derecha, errores, etc.).

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;
  LN.ui = LN.ui || {};

  var VARIABLES = ["x", "y", "z"];

  // --- Serialización: de árbol de piezas a texto de fórmula ---
  // Los conectivos binarios siempre se envuelven en paréntesis (aquí y
  // al mostrarlos en el lienzo), así la fórmula nunca es ambigua sin
  // importar en qué nivel de anidamiento estén.

  function serializarTermino(t) {
    if (t.tipo === "var") return t.nombre;
    return t.args.length > 0 ? t.nombre + "(" + t.args.map(serializarTermino).join(", ") + ")" : t.nombre;
  }

  function serializarFormula(nodo) {
    switch (nodo.tipo) {
      case "no": return "¬" + serializarFormula(nodo.hijo);
      case "y": return "(" + serializarFormula(nodo.izq) + " ∧ " + serializarFormula(nodo.der) + ")";
      case "o": return "(" + serializarFormula(nodo.izq) + " ∨ " + serializarFormula(nodo.der) + ")";
      case "implica": return "(" + serializarFormula(nodo.izq) + " → " + serializarFormula(nodo.der) + ")";
      case "paraTodo": return "∀" + nodo.variable + " " + serializarFormula(nodo.cuerpo);
      case "existe": return "∃" + nodo.variable + " " + serializarFormula(nodo.cuerpo);
      case "pred": return nodo.nombre + "(" + nodo.args.map(serializarTermino).join(", ") + ")";
    }
  }

  // --- Completitud: ningún espacio vacío en todo el árbol ---

  function terminoCompleto(t) {
    if (t === null) return false;
    return t.tipo === "var" || t.args.every(terminoCompleto);
  }

  function formulaCompleta(nodo) {
    if (nodo === null) return false;
    switch (nodo.tipo) {
      case "no": return formulaCompleta(nodo.hijo);
      case "y": case "o": case "implica": return formulaCompleta(nodo.izq) && formulaCompleta(nodo.der);
      case "paraTodo": case "existe": return formulaCompleta(nodo.cuerpo);
      case "pred": return nodo.args.every(terminoCompleto);
    }
  }

  // --- Limpieza cuando cambia el lenguaje (tarjeta 1) ---
  // Si se quita o cambia la aridad de un símbolo que ya estaba puesto en
  // el árbol, ese nodo (y lo que tuviera debajo) vuelve a ser un espacio
  // vacío, igual que se limpian tuplas/valores en la Interpretación.

  function limpiarTerminoPorLenguaje(t, lenguaje) {
    if (t === null) return null;
    if (t.tipo === "var") return t;
    var def = lenguaje.funciones.filter(function (f) { return f.nombre === t.nombre; })[0];
    if (!def || def.aridad !== t.args.length) return null;
    t.args = t.args.map(function (a) { return limpiarTerminoPorLenguaje(a, lenguaje); });
    return t;
  }

  function limpiarFormulaPorLenguaje(nodo, lenguaje) {
    if (nodo === null) return null;
    switch (nodo.tipo) {
      case "no":
        nodo.hijo = limpiarFormulaPorLenguaje(nodo.hijo, lenguaje);
        return nodo;
      case "y": case "o": case "implica":
        nodo.izq = limpiarFormulaPorLenguaje(nodo.izq, lenguaje);
        nodo.der = limpiarFormulaPorLenguaje(nodo.der, lenguaje);
        return nodo;
      case "paraTodo": case "existe":
        nodo.cuerpo = limpiarFormulaPorLenguaje(nodo.cuerpo, lenguaje);
        return nodo;
      case "pred":
        var def = lenguaje.predicados.filter(function (p) { return p.nombre === nodo.nombre; })[0];
        if (!def || def.aridad !== nodo.args.length) return null;
        nodo.args = nodo.args.map(function (a) { return limpiarTerminoPorLenguaje(a, lenguaje); });
        return nodo;
    }
  }

  function crear(contenedor, estado, callbacks) {
    // callbacks: { onCambio(textoONull) } — solo se llama cuando el
    // propio usuario modifica el árbol de piezas (nunca solo porque se
    // volvió a dibujar por un cambio de lenguaje), para no pisar la
    // fórmula real mientras se está usando el modo "Escribir".
    var raiz = null;
    var piezasPaleta = [];     // { boton, tipoSlot } de la paleta actual, para activar/atenuar
    var seleccion = null;      // { setNodo, tipoSlot, boton } del espacio vacío elegido por clic

    function obtenerPiezas() {
      var piezas = [
        { id: "no", tipoSlot: "formula", etiqueta: "¬", fabricar: function () { return { tipo: "no", hijo: null }; } },
        { id: "y", tipoSlot: "formula", etiqueta: "∧", fabricar: function () { return { tipo: "y", izq: null, der: null }; } },
        { id: "o", tipoSlot: "formula", etiqueta: "∨", fabricar: function () { return { tipo: "o", izq: null, der: null }; } },
        { id: "implica", tipoSlot: "formula", etiqueta: "→", fabricar: function () { return { tipo: "implica", izq: null, der: null }; } },
        { id: "paraTodo", tipoSlot: "formula", etiqueta: "∀", fabricar: function () { return { tipo: "paraTodo", variable: "x", cuerpo: null }; } },
        { id: "existe", tipoSlot: "formula", etiqueta: "∃", fabricar: function () { return { tipo: "existe", variable: "x", cuerpo: null }; } }
      ];
      VARIABLES.forEach(function (v) {
        piezas.push({ id: "var-" + v, tipoSlot: "termino", etiqueta: v, fabricar: function () { return { tipo: "var", nombre: v }; } });
      });
      estado.lenguaje.funciones.forEach(function (f) {
        piezas.push({
          id: "func-" + f.nombre, tipoSlot: "termino",
          etiqueta: f.nombre + (f.aridad > 0 ? "(" + Array(f.aridad).fill("·").join(",") + ")" : ""),
          fabricar: function () { return { tipo: "func", nombre: f.nombre, args: new Array(f.aridad).fill(null) }; }
        });
      });
      estado.lenguaje.predicados.forEach(function (p) {
        piezas.push({
          id: "pred-" + p.nombre, tipoSlot: "formula",
          etiqueta: p.nombre + "(" + Array(p.aridad).fill("·").join(",") + ")",
          fabricar: function () { return { tipo: "pred", nombre: p.nombre, args: new Array(p.aridad).fill(null) }; }
        });
      });
      return piezas;
    }

    function buscarPieza(id) {
      return obtenerPiezas().filter(function (p) { return p.id === id; })[0];
    }

    function notificar() {
      callbacks.onCambio(raiz !== null && formulaCompleta(raiz) ? serializarFormula(raiz) : null);
    }

    // Se llama cada vez que EL USUARIO cambia algo en el árbol de piezas
    // (poner, quitar, o cambiar la variable ligada de un cuantificador).
    function onArbolCambio() {
      construirDOM();
      notificar();
    }

    function textoSimbolo(txt) {
      var span = document.createElement("span");
      span.className = "pieza-nodo__simbolo";
      span.textContent = txt;
      return span;
    }

    function crearBotonQuitar(alQuitar) {
      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "pieza-nodo__quitar";
      boton.textContent = "×";
      boton.setAttribute("aria-label", "Quitar esta pieza");
      boton.addEventListener("click", function (ev) { ev.stopPropagation(); alQuitar(); });
      return boton;
    }

    function actualizarPaleta() {
      piezasPaleta.forEach(function (pp) {
        var activa = !seleccion || seleccion.tipoSlot === pp.tipoSlot;
        pp.boton.disabled = !activa;
        pp.boton.classList.toggle("pieza-paleta--atenuada", !activa);
      });
    }

    function limpiarSeleccion() {
      if (seleccion) seleccion.boton.classList.remove("pieza-slot--seleccionada");
      seleccion = null;
      actualizarPaleta();
    }

    function crearSlotVacio(setNodo, tipoSlot) {
      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "pieza-slot";
      boton.textContent = "+";
      boton.setAttribute("aria-label", tipoSlot === "formula" ? "Espacio vacío de la fórmula" : "Espacio vacío de un término");

      boton.addEventListener("click", function () {
        if (seleccion && seleccion.boton === boton) {
          limpiarSeleccion();
          return;
        }
        limpiarSeleccion();
        seleccion = { setNodo: setNodo, tipoSlot: tipoSlot, boton: boton };
        boton.classList.add("pieza-slot--seleccionada");
        actualizarPaleta();
      });
      boton.addEventListener("dragover", function (ev) { ev.preventDefault(); boton.classList.add("pieza-slot--sobre"); });
      boton.addEventListener("dragleave", function () { boton.classList.remove("pieza-slot--sobre"); });
      boton.addEventListener("drop", function (ev) {
        ev.preventDefault();
        boton.classList.remove("pieza-slot--sobre");
        try {
          var datos = JSON.parse(ev.dataTransfer.getData("text/plain"));
          if (datos.tipoSlot === tipoSlot) {
            var pieza = buscarPieza(datos.id);
            if (pieza) setNodo(pieza.fabricar());
          }
        } catch (e) { /* dato de arrastre inválido: se ignora */ }
      });
      return boton;
    }

    function crearSelectorVariable(nodo) {
      var select = document.createElement("select");
      select.className = "constructor-variable";
      select.setAttribute("aria-label", "Variable ligada por el cuantificador");
      VARIABLES.forEach(function (v) {
        var opt = document.createElement("option");
        opt.value = v; opt.textContent = v;
        if (v === nodo.variable) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("click", function (ev) { ev.stopPropagation(); });
      select.addEventListener("change", function () {
        nodo.variable = select.value;
        onArbolCambio();
      });
      return select;
    }

    function renderTerminoNodo(nodo, setNodo) {
      if (nodo === null) return crearSlotVacio(setNodo, "termino");
      var caja = document.createElement("span");
      caja.className = "pieza-nodo pieza-nodo--termino";
      caja.appendChild(textoSimbolo(nodo.nombre));
      if (nodo.tipo === "func" && nodo.args.length > 0) {
        caja.appendChild(document.createTextNode("("));
        nodo.args.forEach(function (arg, i) {
          if (i > 0) caja.appendChild(document.createTextNode(", "));
          caja.appendChild(renderTerminoNodo(arg, function (n) { nodo.args[i] = n; onArbolCambio(); }));
        });
        caja.appendChild(document.createTextNode(")"));
      }
      caja.appendChild(crearBotonQuitar(function () { setNodo(null); }));
      return caja;
    }

    function renderFormulaNodo(nodo, setNodo) {
      if (nodo === null) return crearSlotVacio(setNodo, "formula");
      var caja = document.createElement("span");
      caja.className = "pieza-nodo";
      switch (nodo.tipo) {
        case "no":
          caja.appendChild(textoSimbolo("¬"));
          caja.appendChild(renderFormulaNodo(nodo.hijo, function (n) { nodo.hijo = n; onArbolCambio(); }));
          break;
        case "y": case "o": case "implica":
          var simbolo = { y: "∧", o: "∨", implica: "→" }[nodo.tipo];
          caja.appendChild(document.createTextNode("("));
          caja.appendChild(renderFormulaNodo(nodo.izq, function (n) { nodo.izq = n; onArbolCambio(); }));
          caja.appendChild(textoSimbolo(simbolo));
          caja.appendChild(renderFormulaNodo(nodo.der, function (n) { nodo.der = n; onArbolCambio(); }));
          caja.appendChild(document.createTextNode(")"));
          break;
        case "paraTodo": case "existe":
          caja.appendChild(textoSimbolo(nodo.tipo === "paraTodo" ? "∀" : "∃"));
          caja.appendChild(crearSelectorVariable(nodo));
          caja.appendChild(renderFormulaNodo(nodo.cuerpo, function (n) { nodo.cuerpo = n; onArbolCambio(); }));
          break;
        case "pred":
          caja.appendChild(textoSimbolo(nodo.nombre));
          caja.appendChild(document.createTextNode("("));
          nodo.args.forEach(function (arg, i) {
            if (i > 0) caja.appendChild(document.createTextNode(", "));
            caja.appendChild(renderTerminoNodo(arg, function (n) { nodo.args[i] = n; onArbolCambio(); }));
          });
          caja.appendChild(document.createTextNode(")"));
          break;
      }
      caja.appendChild(crearBotonQuitar(function () { setNodo(null); }));
      return caja;
    }

    function construirPaleta() {
      var piezas = obtenerPiezas();
      piezasPaleta = [];
      var paleta = document.createElement("div");
      paleta.className = "constructor-paleta";

      function grupo(etiqueta, lista) {
        if (lista.length === 0) return;
        var cont = document.createElement("div");
        cont.className = "constructor-paleta__grupo";
        var tit = document.createElement("span");
        tit.className = "constructor-paleta__etiqueta";
        tit.textContent = etiqueta;
        cont.appendChild(tit);
        lista.forEach(function (pieza) {
          var boton = document.createElement("button");
          boton.type = "button";
          boton.className = "pieza-paleta";
          boton.textContent = pieza.etiqueta;
          boton.draggable = true;
          boton.setAttribute("aria-label", "Pieza " + pieza.etiqueta);
          boton.addEventListener("dragstart", function (ev) {
            ev.dataTransfer.setData("text/plain", JSON.stringify({ id: pieza.id, tipoSlot: pieza.tipoSlot }));
          });
          boton.addEventListener("click", function () {
            if (!seleccion || seleccion.tipoSlot !== pieza.tipoSlot) return;
            var setNodo = seleccion.setNodo;
            limpiarSeleccion();
            setNodo(pieza.fabricar());
          });
          piezasPaleta.push({ boton: boton, tipoSlot: pieza.tipoSlot });
          cont.appendChild(boton);
        });
        paleta.appendChild(cont);
      }

      grupo("Conectivos", piezas.filter(function (p) { return ["no", "y", "o", "implica"].indexOf(p.id) !== -1; }));
      grupo("Cuantificadores", piezas.filter(function (p) { return p.id === "paraTodo" || p.id === "existe"; }));
      grupo("Variables", piezas.filter(function (p) { return p.id.indexOf("var-") === 0; }));
      grupo("Constantes y funciones", piezas.filter(function (p) { return p.id.indexOf("func-") === 0; }));
      grupo("Predicados", piezas.filter(function (p) { return p.id.indexOf("pred-") === 0; }));

      actualizarPaleta();
      return paleta;
    }

    function construirDOM() {
      contenedor.textContent = "";
      seleccion = null;

      var ayuda = document.createElement("p");
      ayuda.className = "constructor-ayuda";
      ayuda.textContent = "Arrastra una pieza al árbol, o haz clic en un espacio vacío (+) y luego en una pieza.";
      contenedor.appendChild(ayuda);

      contenedor.appendChild(construirPaleta());

      var lienzo = document.createElement("div");
      lienzo.className = "constructor-lienzo";
      lienzo.appendChild(renderFormulaNodo(raiz, function (n) { raiz = n; onArbolCambio(); }));
      contenedor.appendChild(lienzo);

      var botonVaciar = document.createElement("button");
      botonVaciar.type = "button";
      botonVaciar.className = "boton-secundario";
      botonVaciar.textContent = "Vaciar árbol";
      botonVaciar.addEventListener("click", function () { raiz = null; onArbolCambio(); });
      contenedor.appendChild(botonVaciar);
    }

    // Se llama al crear el constructor y cada vez que cambia el lenguaje
    // (tarjeta 1): solo refresca la paleta y limpia piezas que ya no
    // existen, sin avisarle a nadie (no debe pisar la fórmula real
    // mientras el modo activo es "Escribir").
    function render() {
      raiz = limpiarFormulaPorLenguaje(raiz, estado.lenguaje);
      construirDOM();
    }

    render();
    return { render: render };
  }

  LN.ui.constructorFormula = { crear: crear };
})();
