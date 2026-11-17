// Tarjeta 2: Interpretación.
// Dominio con fichas y dibujitos navideños, tabla de funciones/constantes
// con <select>, y predicados con tuplas arrastrables (y accesibles por
// clic o Enter). Ver docs/DECISIONES.md.

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;
  LN.ui = LN.ui || {};

  var NS_SVG = "http://www.w3.org/2000/svg";

  function nodoSVG(tag, attrs) {
    var el = document.createElementNS(NS_SVG, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // Ocho dibujitos navideños simples y sin emojis, uno por elemento del
  // dominio (se reciclan en orden si hay más elementos que dibujos).
  var DIBUJOS = [
    function estrella() {
      var svg = nodoSVG("svg", { viewBox: "0 0 24 24" });
      svg.appendChild(nodoSVG("polygon", {
        points: "12,2 14.7,9 22,9.3 16.2,14 18.2,21.3 12,17.1 5.8,21.3 7.8,14 2,9.3 9.3,9",
        fill: "#F7D774", stroke: "#C9962B", "stroke-width": "1"
      }));
      return svg;
    },
    function regalo() {
      var svg = nodoSVG("svg", { viewBox: "0 0 24 24" });
      svg.appendChild(nodoSVG("rect", { x: 3, y: 9, width: 18, height: 12, fill: "#F08CA4", stroke: "#C2476A", "stroke-width": "1" }));
      svg.appendChild(nodoSVG("rect", { x: 3, y: 9, width: 18, height: 4, fill: "#F7D774" }));
      svg.appendChild(nodoSVG("rect", { x: 10.5, y: 9, width: 3, height: 12, fill: "#F7D774" }));
      return svg;
    },
    function campana() {
      var svg = nodoSVG("svg", { viewBox: "0 0 24 24" });
      svg.appendChild(nodoSVG("path", { d: "M12 3 C8 3 6 7 6 11 C6 15 4 16 4 17 L20 17 C20 16 18 15 18 11 C18 7 16 3 12 3 Z", fill: "#F7D774", stroke: "#C9962B", "stroke-width": "1" }));
      svg.appendChild(nodoSVG("circle", { cx: 12, cy: 19.5, r: 1.6, fill: "#C9962B" }));
      return svg;
    },
    function baston() {
      var svg = nodoSVG("svg", { viewBox: "0 0 24 24" });
      svg.appendChild(nodoSVG("path", { d: "M16 4 C16 2 13 2 13 4 L13 17 C13 19.5 10.5 19.5 10.5 21.5", fill: "none", stroke: "#C2476A", "stroke-width": "3", "stroke-linecap": "round" }));
      svg.appendChild(nodoSVG("path", { d: "M16 4 C16 2 13 2 13 4 L13 17 C13 19.5 10.5 19.5 10.5 21.5", fill: "none", stroke: "#fff", "stroke-width": "3", "stroke-linecap": "round", "stroke-dasharray": "2.5 2.5" }));
      return svg;
    },
    function esfera() {
      var svg = nodoSVG("svg", { viewBox: "0 0 24 24" });
      svg.appendChild(nodoSVG("rect", { x: 10.5, y: 2, width: 3, height: 3, fill: "#B8964A" }));
      svg.appendChild(nodoSVG("circle", { cx: 12, cy: 14, r: 8, fill: "#8EC5F0", stroke: "#5A8FBF", "stroke-width": "1" }));
      svg.appendChild(nodoSVG("ellipse", { cx: 9, cy: 11, rx: 2.5, ry: 1.4, fill: "#fff", opacity: "0.6" }));
      return svg;
    },
    function copo() {
      var svg = nodoSVG("svg", { viewBox: "0 0 24 24" });
      [0, 60, 120].forEach(function (ang) {
        svg.appendChild(nodoSVG("line", { x1: 12, y1: 3, x2: 12, y2: 21, stroke: "#8EC5F0", "stroke-width": "1.6", transform: "rotate(" + ang + " 12 12)" }));
      });
      return svg;
    },
    function arbolito() {
      var svg = nodoSVG("svg", { viewBox: "0 0 24 24" });
      svg.appendChild(nodoSVG("polygon", { points: "12,2 17,10 7,10", fill: "#9FC5A0", stroke: "#6E9A70", "stroke-width": "0.6" }));
      svg.appendChild(nodoSVG("polygon", { points: "12,7 19,16 5,16", fill: "#B3D4B3", stroke: "#6E9A70", "stroke-width": "0.6" }));
      svg.appendChild(nodoSVG("rect", { x: 10.5, y: 16, width: 3, height: 4, fill: "#B08968" }));
      return svg;
    },
    function calcetin() {
      var svg = nodoSVG("svg", { viewBox: "0 0 24 24" });
      svg.appendChild(nodoSVG("path", { d: "M8 3 L15 3 L15 13 C15 13 20 13 20 18 C20 20.5 17.5 21 15 21 L10 21 C7 21 5 19 5 16 L5 3 Z", fill: "#C2476A", stroke: "#9C3A54", "stroke-width": "1" }));
      svg.appendChild(nodoSVG("rect", { x: 7, y: 2, width: 9, height: 3, fill: "#fff" }));
      return svg;
    }
  ];

  function crearDibujo(indice) {
    return DIBUJOS[indice % DIBUJOS.length]();
  }

  function productoCartesiano(dominio, aridad) {
    if (aridad === 0) return [[]];
    var resultado = [[]];
    for (var k = 0; k < aridad; k++) {
      var siguiente = [];
      resultado.forEach(function (base) {
        dominio.forEach(function (d) { siguiente.push(base.concat([d])); });
      });
      resultado = siguiente;
    }
    return resultado;
  }

  function claveTupla(tupla) { return JSON.stringify(tupla); }

  function limpiarPorDominio(lenguaje, interpretacion) {
    var dominio = interpretacion.dominio;
    // Funciones y constantes: se quitan filas que usan un elemento ya borrado.
    lenguaje.funciones.forEach(function (f) {
      var filas = interpretacion.funciones[f.nombre] || [];
      interpretacion.funciones[f.nombre] = filas.filter(function (fila) {
        return fila.args.every(function (a) { return dominio.indexOf(a) !== -1; }) &&
          dominio.indexOf(fila.valor) !== -1;
      });
    });
    // Predicados: se quitan tuplas que usan un elemento ya borrado.
    lenguaje.predicados.forEach(function (p) {
      var tuplas = interpretacion.predicados[p.nombre] || [];
      interpretacion.predicados[p.nombre] = tuplas.filter(function (t) {
        return t.every(function (a) { return dominio.indexOf(a) !== -1; });
      });
    });
  }

  function crear(contenedor, estado, onCambio) {
    function render() {
      contenedor.textContent = "";
      var lenguaje = estado.lenguaje;
      var interpretacion = estado.interpretacion;

      // --- Dominio ---
      var subDominio = document.createElement("div");
      subDominio.className = "tarjeta__subtitulo";
      subDominio.textContent = "Dominio";
      contenedor.appendChild(subDominio);

      var listaDominio = document.createElement("div");
      listaDominio.className = "lista-fichas";
      interpretacion.dominio.forEach(function (elemento, indice) {
        var ficha = document.createElement("span");
        ficha.className = "ficha-dominio";
        ficha.appendChild(crearDibujo(indice));
        var nombre = document.createElement("span");
        nombre.className = "ficha-dominio__nombre";
        nombre.textContent = elemento;
        ficha.appendChild(nombre);
        var quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "ficha-dominio__quitar";
        quitar.textContent = "×";
        quitar.setAttribute("aria-label", "Quitar " + elemento + " del dominio");
        quitar.addEventListener("click", function () {
          interpretacion.dominio = interpretacion.dominio.filter(function (d) { return d !== elemento; });
          limpiarPorDominio(lenguaje, interpretacion);
          onCambio();
        });
        ficha.appendChild(quitar);
        listaDominio.appendChild(ficha);
      });
      contenedor.appendChild(listaDominio);

      var filaAgregarDominio = document.createElement("div");
      filaAgregarDominio.className = "fila-agregar";
      var inputDominio = document.createElement("input");
      inputDominio.type = "text";
      inputDominio.placeholder = "Nuevo elemento (Enter o coma para agregar)";
      inputDominio.setAttribute("aria-label", "Nuevo elemento del dominio");
      var mensajeDominio = document.createElement("div");
      mensajeDominio.className = "mensaje-error oculto";

      function agregarElemento(nombre) {
        nombre = nombre.trim();
        if (!nombre) return;
        if (interpretacion.dominio.indexOf(nombre) !== -1) {
          mensajeDominio.textContent = "«" + nombre + "» ya está en el dominio.";
          mensajeDominio.classList.remove("oculto");
          return;
        }
        mensajeDominio.classList.add("oculto");
        interpretacion.dominio.push(nombre);
        onCambio();
      }

      inputDominio.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === ",") {
          ev.preventDefault();
          agregarElemento(inputDominio.value.replace(",", ""));
          inputDominio.value = "";
        }
      });
      filaAgregarDominio.appendChild(inputDominio);
      var botonAgregarDominio = document.createElement("button");
      botonAgregarDominio.type = "button";
      botonAgregarDominio.className = "boton-agregar";
      botonAgregarDominio.textContent = "+ Agregar";
      botonAgregarDominio.addEventListener("click", function () {
        agregarElemento(inputDominio.value);
        inputDominio.value = "";
      });
      filaAgregarDominio.appendChild(botonAgregarDominio);
      filaAgregarDominio.appendChild(mensajeDominio);
      contenedor.appendChild(filaAgregarDominio);

      if (interpretacion.dominio.length === 0) {
        var avisoVacio = document.createElement("div");
        avisoVacio.className = "mensaje-error";
        avisoVacio.textContent = "El dominio no puede quedar vacío: agrega al menos un elemento.";
        contenedor.appendChild(avisoVacio);
      }

      // --- Funciones y constantes: tabla con select ---
      if (lenguaje.funciones.length > 0) {
        var subFunc = document.createElement("div");
        subFunc.className = "tarjeta__subtitulo";
        subFunc.textContent = "Funciones y constantes";
        contenedor.appendChild(subFunc);

        lenguaje.funciones.forEach(function (f) {
          var tabla = document.createElement("table");
          tabla.className = "tabla-funciones";
          var encabezado = document.createElement("caption");
          encabezado.style.textAlign = "left";
          encabezado.style.fontWeight = "500";
          encabezado.textContent = f.nombre + (f.aridad === 0 ? " (constante)" : "(" + Array(f.aridad).fill("·").join(", ") + ")");
          tabla.appendChild(encabezado);

          var thead = document.createElement("tr");
          var thArgs = document.createElement("th");
          thArgs.textContent = f.aridad === 0 ? "—" : "Argumentos";
          thead.appendChild(thArgs);
          var thValor = document.createElement("th");
          thValor.textContent = "Valor";
          thead.appendChild(thValor);
          tabla.appendChild(thead);

          var combinaciones = productoCartesiano(interpretacion.dominio, f.aridad);
          var filasGuardadas = interpretacion.funciones[f.nombre] || [];

          combinaciones.forEach(function (combo) {
            var filaExistente = filasGuardadas.filter(function (fl) { return claveTupla(fl.args) === claveTupla(combo); })[0];
            var tr = document.createElement("tr");
            var tdArgs = document.createElement("td");
            tdArgs.textContent = combo.length ? f.nombre + "(" + combo.join(", ") + ")" : f.nombre;
            tr.appendChild(tdArgs);

            var tdValor = document.createElement("td");
            var select = document.createElement("select");
            select.setAttribute("aria-label", "Valor de " + tdArgs.textContent);
            var opcionVacia = document.createElement("option");
            opcionVacia.value = "";
            opcionVacia.textContent = "— elegir —";
            select.appendChild(opcionVacia);
            interpretacion.dominio.forEach(function (d) {
              var opt = document.createElement("option");
              opt.value = d; opt.textContent = d;
              if (filaExistente && filaExistente.valor === d) opt.selected = true;
              select.appendChild(opt);
            });
            if (!filaExistente) { select.classList.add("incompleto"); opcionVacia.selected = true; }
            select.addEventListener("change", function () {
              var filas = interpretacion.funciones[f.nombre] || [];
              filas = filas.filter(function (fl) { return claveTupla(fl.args) !== claveTupla(combo); });
              if (select.value !== "") filas.push({ args: combo, valor: select.value });
              interpretacion.funciones[f.nombre] = filas;
              onCambio();
            });
            tdValor.appendChild(select);
            tr.appendChild(tdValor);
            tabla.appendChild(tr);
          });

          contenedor.appendChild(tabla);
        });
      }

      // --- Predicados: tuplas arrastrables ---
      if (lenguaje.predicados.length > 0) {
        var subPred = document.createElement("div");
        subPred.className = "tarjeta__subtitulo";
        subPred.textContent = "Predicados (relaciones)";
        contenedor.appendChild(subPred);

        lenguaje.predicados.forEach(function (p) {
          var bloque = document.createElement("div");
          bloque.className = "predicado-bloque";

          var titulo = document.createElement("div");
          titulo.style.fontWeight = "500";
          titulo.textContent = p.nombre;
          bloque.appendChild(titulo);

          var combinaciones = productoCartesiano(interpretacion.dominio, p.aridad);
          if (combinaciones.length > 50) {
            var aviso = document.createElement("div");
            aviso.className = "aviso";
            aviso.textContent = "Hay " + combinaciones.length + " tuplas posibles para " + p.nombre + ". Se muestran todas, puede tardar un poco en cargar.";
            bloque.appendChild(aviso);
          }

          var pertenecen = interpretacion.predicados[p.nombre] || [];
          var clavesPertenecen = pertenecen.map(claveTupla);

          var zonas = document.createElement("div");
          zonas.className = "zonas-tuplas";

          function moverTupla(combo, aPertenece) {
            var lista = interpretacion.predicados[p.nombre] || [];
            var clave = claveTupla(combo);
            lista = lista.filter(function (t) { return claveTupla(t) !== clave; });
            if (aPertenece) lista.push(combo);
            interpretacion.predicados[p.nombre] = lista;
            onCambio();
          }

          function crearZona(etiqueta, tuplas, aPertenece) {
            var zona = document.createElement("div");
            zona.className = "zona-tuplas";
            zona.setAttribute("data-predicado", p.nombre);

            var tit = document.createElement("div");
            tit.className = "zona-tuplas__titulo";
            tit.textContent = etiqueta;
            zona.appendChild(tit);

            tuplas.forEach(function (combo) {
              var chip = document.createElement("span");
              chip.className = "ficha-tupla";
              chip.textContent = combo.length ? "(" + combo.join(", ") + ")" : "(este predicado no tiene argumentos)";
              chip.draggable = true;
              chip.tabIndex = 0;
              chip.setAttribute("role", "button");
              chip.setAttribute("aria-label", (combo.length ? "(" + combo.join(", ") + ")" : p.nombre) +
                (aPertenece ? ", pertenece a " + p.nombre + ". Presiona Enter para quitarla." : ", no pertenece a " + p.nombre + ". Presiona Enter para agregarla."));
              chip.addEventListener("dragstart", function (ev) {
                ev.dataTransfer.setData("text/plain", JSON.stringify({ predicado: p.nombre, combo: combo }));
              });
              chip.addEventListener("click", function () { moverTupla(combo, !aPertenece); });
              chip.addEventListener("keydown", function (ev) {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  moverTupla(combo, !aPertenece);
                }
              });
              zona.appendChild(chip);
            });

            zona.addEventListener("dragover", function (ev) { ev.preventDefault(); zona.classList.add("sobre-arrastre"); });
            zona.addEventListener("dragleave", function () { zona.classList.remove("sobre-arrastre"); });
            zona.addEventListener("drop", function (ev) {
              ev.preventDefault();
              zona.classList.remove("sobre-arrastre");
              try {
                var datos = JSON.parse(ev.dataTransfer.getData("text/plain"));
                if (datos.predicado === p.nombre) moverTupla(datos.combo, aPertenece);
              } catch (e) { /* dato de arrastre inválido: se ignora */ }
            });

            return zona;
          }

          var disponibles = combinaciones.filter(function (c) { return clavesPertenecen.indexOf(claveTupla(c)) === -1; });
          zonas.appendChild(crearZona("Tuplas disponibles", disponibles, false));
          zonas.appendChild(crearZona("Pertenecen a " + p.nombre, pertenecen, true));
          bloque.appendChild(zonas);

          if (pertenecen.length === 0) {
            var avisoVacia = document.createElement("div");
            avisoVacia.className = "mensaje-error";
            avisoVacia.textContent = "«" + p.nombre + "» no puede quedar sin tuplas: mueve al menos una a «Pertenecen a " + p.nombre + "».";
            bloque.appendChild(avisoVacia);
          }

          contenedor.appendChild(bloque);
        });
      }
    }

    render();
    return { render: render };
  }

  LN.ui.interpretacion = { crear: crear };
})();
