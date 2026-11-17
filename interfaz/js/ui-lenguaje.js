// Tarjeta 1: Lenguaje.
// Fichas con nombre y aridad para constantes, funciones y predicados,
// con botones + y - para agregar y quitar (ver docs/DECISIONES.md).

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;
  LN.ui = LN.ui || {};

  // Revisa que un nombre no esté repetido entre todos los símbolos
  // (funciones + predicados comparten el mismo "espacio de nombres"
  // para que la fórmula no sea ambigua).
  function nombreLibre(lenguaje, nombre) {
    var todos = lenguaje.funciones.concat(lenguaje.predicados);
    for (var i = 0; i < todos.length; i++) {
      if (todos[i].nombre === nombre) return false;
    }
    return true;
  }

  function crearSeccion(contenedor, titulo) {
    var h = document.createElement("div");
    h.className = "tarjeta__subtitulo";
    h.textContent = titulo;
    contenedor.appendChild(h);
    var lista = document.createElement("div");
    lista.className = "lista-fichas";
    contenedor.appendChild(lista);
    return lista;
  }

  function crearFichaSimbolo(nombre, aridad, alQuitar) {
    var ficha = document.createElement("span");
    ficha.className = "ficha";
    var texto = document.createElement("span");
    texto.textContent = nombre + " (aridad " + aridad + ")";
    ficha.appendChild(texto);
    var boton = document.createElement("button");
    boton.type = "button";
    boton.className = "ficha__quitar";
    boton.textContent = "−"; // signo menos
    boton.setAttribute("aria-label", "Quitar " + nombre);
    boton.addEventListener("click", alQuitar);
    ficha.appendChild(boton);
    return ficha;
  }

  function crearFilaAgregar(opciones) {
    // opciones: { etiqueta, placeholderNombre, pedirAridad, aridadMinima, alAgregar }
    var fila = document.createElement("div");
    fila.className = "fila-agregar";

    var inputNombre = document.createElement("input");
    inputNombre.type = "text";
    inputNombre.placeholder = opciones.placeholderNombre;
    inputNombre.setAttribute("aria-label", opciones.placeholderNombre);
    fila.appendChild(inputNombre);

    var inputAridad = null;
    if (opciones.pedirAridad) {
      inputAridad = document.createElement("input");
      inputAridad.type = "number";
      inputAridad.min = String(opciones.aridadMinima);
      inputAridad.value = String(opciones.aridadMinima);
      inputAridad.setAttribute("aria-label", "Aridad");
      fila.appendChild(inputAridad);
    }

    var boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-agregar";
    boton.textContent = "+ Agregar";
    fila.appendChild(boton);

    var mensaje = document.createElement("div");
    mensaje.className = "mensaje-error oculto";
    fila.appendChild(mensaje);

    function intentar() {
      var nombre = inputNombre.value.trim();
      mensaje.className = "mensaje-error oculto"; // por si el intento anterior quedó como aviso de éxito

      if (!nombre) {
        mensaje.textContent = "Escribe un nombre antes de presionar Agregar.";
        mensaje.classList.remove("oculto");
        return;
      }
      if (!/^[A-Za-zÁÉÍÓÚÑáéíóúñ][A-Za-z0-9ÁÉÍÓÚÑáéíóúñ_]*$/.test(nombre)) {
        mensaje.textContent = "«" + nombre + "» no es un nombre válido: debe empezar con una letra y no tener espacios ni símbolos.";
        mensaje.classList.remove("oculto");
        return;
      }
      var aridad = opciones.pedirAridad ? parseInt(inputAridad.value, 10) : 0;
      if (opciones.pedirAridad && (isNaN(aridad) || aridad < opciones.aridadMinima)) {
        mensaje.textContent = "La aridad de «" + nombre + "» debe ser un número entero de " + opciones.aridadMinima + " o más.";
        mensaje.classList.remove("oculto");
        return;
      }
      var error = opciones.alAgregar(nombre, aridad);
      if (error) {
        mensaje.textContent = error;
        mensaje.classList.remove("oculto");
        return;
      }

      // Confirmación clara de qué se agregó (en vez de dejar la fila en
      // silencio): se ve en un tono neutro, no de error.
      mensaje.textContent = "Se agregó " + opciones.etiqueta + " «" + nombre + "»" +
        (opciones.pedirAridad ? " (aridad " + aridad + ")" : "") + ".";
      mensaje.className = "aviso";

      inputNombre.value = "";
      if (inputAridad) inputAridad.value = String(opciones.aridadMinima);
      inputNombre.focus();
    }

    boton.addEventListener("click", intentar);
    inputNombre.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); intentar(); }
    });

    return fila;
  }

  function crear(contenedor, estado, onCambio) {
    function render() {
      contenedor.textContent = "";
      var lenguaje = estado.lenguaje;

      // --- Constantes (funciones de aridad 0) ---
      var listaConst = crearSeccion(contenedor, "Constantes");
      lenguaje.funciones.filter(function (f) { return f.aridad === 0; }).forEach(function (f) {
        listaConst.appendChild(crearFichaSimbolo(f.nombre, 0, function () {
          lenguaje.funciones = lenguaje.funciones.filter(function (x) { return x.nombre !== f.nombre; });
          onCambio();
        }));
      });
      contenedor.appendChild(crearFilaAgregar({
        etiqueta: "la constante",
        placeholderNombre: "Nueva constante (ej. k)",
        pedirAridad: false,
        alAgregar: function (nombre) {
          if (!nombreLibre(lenguaje, nombre)) return "Ya existe un símbolo llamado «" + nombre + "».";
          lenguaje.funciones.push({ nombre: nombre, aridad: 0 });
          onCambio();
          return null;
        }
      }));

      // --- Funciones (aridad 1 o más) ---
      var listaFunc = crearSeccion(contenedor, "Funciones");
      lenguaje.funciones.filter(function (f) { return f.aridad > 0; }).forEach(function (f) {
        listaFunc.appendChild(crearFichaSimbolo(f.nombre, f.aridad, function () {
          lenguaje.funciones = lenguaje.funciones.filter(function (x) { return x.nombre !== f.nombre; });
          onCambio();
        }));
      });
      contenedor.appendChild(crearFilaAgregar({
        etiqueta: "la función",
        placeholderNombre: "Nueva función (ej. f)",
        pedirAridad: true,
        aridadMinima: 1,
        alAgregar: function (nombre, aridad) {
          if (!nombreLibre(lenguaje, nombre)) return "Ya existe un símbolo llamado «" + nombre + "».";
          lenguaje.funciones.push({ nombre: nombre, aridad: aridad });
          onCambio();
          return null;
        }
      }));

      // --- Predicados ---
      var listaPred = crearSeccion(contenedor, "Predicados");
      lenguaje.predicados.forEach(function (p) {
        listaPred.appendChild(crearFichaSimbolo(p.nombre, p.aridad, function () {
          lenguaje.predicados = lenguaje.predicados.filter(function (x) { return x.nombre !== p.nombre; });
          onCambio();
        }));
      });
      contenedor.appendChild(crearFilaAgregar({
        etiqueta: "el predicado",
        placeholderNombre: "Nuevo predicado (ej. P)",
        pedirAridad: true,
        aridadMinima: 1,
        alAgregar: function (nombre, aridad) {
          if (!nombreLibre(lenguaje, nombre)) return "Ya existe un símbolo llamado «" + nombre + "».";
          lenguaje.predicados.push({ nombre: nombre, aridad: aridad });
          onCambio();
          return null;
        }
      }));
    }

    render();
    return { render: render };
  }

  LN.ui.lenguaje = { crear: crear };
})();
