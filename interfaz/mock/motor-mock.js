// TEMPORAL: lo reemplazan las funciones reales de mis compañeras.
// Este archivo implementa un parser y un evaluador semántico MÍNIMOS pero
// FUNCIONALES, para poder probar la interfaz con cualquier fórmula válida,
// y no solo con casos fijos.
//
// Implementa las 4 funciones del contrato:
//   LN.api.analizarFormula(texto, lenguaje)
//   LN.api.validarInterpretacion(lenguaje, interpretacion)
//   LN.api.validarEntorno(libres, interpretacion, entorno)
//   LN.api.evaluar(ast, interpretacion, entorno)

(function () {
  "use strict";

  window.LN = window.LN || {};
  var LN = window.LN;
  LN.mock = LN.mock || {};

  // ----------------------------------------------------------------------
  // Utilidades generales
  // ----------------------------------------------------------------------

  // Crea un objeto de error con la forma del contrato.
  function err(codigo, mensaje, posicion) {
    var e = { codigo: codigo, mensaje: mensaje };
    if (typeof posicion === "number") e.posicion = posicion;
    return e;
  }

  function salidaError(lista) {
    return { ok: false, errores: lista };
  }

  // Busca un símbolo declarado (función o predicado) por nombre.
  function buscarSimbolo(lista, nombre) {
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].nombre === nombre) return lista[i];
    }
    return null;
  }

  // ----------------------------------------------------------------------
  // Tokenizador
  // ----------------------------------------------------------------------
  // Produce tokens con su posición (índice de carácter) en el texto ya
  // normalizado por la interfaz (los atajos ~ & | -> ya se convirtieron
  // a ¬ ∧ ∨ → antes de llegar aquí).

  var TIPOS = {
    NO: "NO", Y: "Y", O: "O", IMPLICA: "IMPLICA",
    PARATODO: "PARATODO", EXISTE: "EXISTE",
    LPAREN: "LPAREN", RPAREN: "RPAREN", COMA: "COMA",
    IDENT: "IDENT", EOF: "EOF"
  };

  var SIMBOLO_A_TIPO = {
    "¬": TIPOS.NO, "∧": TIPOS.Y, "∨": TIPOS.O, "→": TIPOS.IMPLICA,
    "∀": TIPOS.PARATODO, "∃": TIPOS.EXISTE,
    "(": TIPOS.LPAREN, ")": TIPOS.RPAREN, ",": TIPOS.COMA
  };

  function tokenizar(texto) {
    var tokens = [];
    var i = 0;
    var n = texto.length;
    while (i < n) {
      var c = texto[i];
      if (c === " " || c === "\t" || c === "\n" || c === "\r") {
        i++;
        continue;
      }
      if (SIMBOLO_A_TIPO[c]) {
        tokens.push({ tipo: SIMBOLO_A_TIPO[c], valor: c, pos: i });
        i++;
        continue;
      }
      if (/[A-Za-zÁÉÍÓÚÑáéíóúñ_]/.test(c)) {
        var inicio = i;
        var j = i;
        while (j < n && /[A-Za-z0-9ÁÉÍÓÚÑáéíóúñ_]/.test(texto[j])) j++;
        tokens.push({ tipo: TIPOS.IDENT, valor: texto.slice(inicio, j), pos: inicio });
        i = j;
        continue;
      }
      // Carácter no reconocido: error de sintaxis con su posición.
      throw { codigo: "SINTAXIS", mensaje: "El carácter «" + c + "» no es válido aquí.", posicion: i };
    }
    tokens.push({ tipo: TIPOS.EOF, valor: "", pos: n });
    return tokens;
  }

  // ----------------------------------------------------------------------
  // Parser (descenso recursivo) con precedencia estilo Huth & Ryan:
  // ¬, ∀, ∃ ligan más fuerte; luego ∧; luego ∨; → asocia a la derecha.
  // ----------------------------------------------------------------------

  function Parser(tokens, lenguaje) {
    this.tokens = tokens;
    this.pos = 0;
    this.lenguaje = lenguaje;
    this.siguienteId = 1;
    this.libres = {}; // conjunto de nombres de variables libres encontradas
    this.pilaLigadas = []; // variables ligadas en el ámbito actual (pila de nombres)
  }

  Parser.prototype.actual = function () { return this.tokens[this.pos]; };

  Parser.prototype.avanzar = function () {
    var t = this.tokens[this.pos];
    this.pos++;
    return t;
  };

  Parser.prototype.esperar = function (tipo, mensajeSiFalta) {
    var t = this.actual();
    if (t.tipo !== tipo) {
      throw { codigo: "SINTAXIS", mensaje: mensajeSiFalta, posicion: t.pos };
    }
    return this.avanzar();
  };

  Parser.prototype.nuevoId = function () { return this.siguienteId++; };

  Parser.prototype.estaLigada = function (nombre) {
    return this.pilaLigadas.indexOf(nombre) !== -1;
  };

  // formula := implica
  Parser.prototype.parseFormula = function () {
    var nodo = this.parseImplica();
    if (this.actual().tipo !== TIPOS.EOF) {
      var t = this.actual();
      throw { codigo: "SINTAXIS", mensaje: "Sobra texto después de la fórmula.", posicion: t.pos };
    }
    return nodo;
  };

  // implica := or ('→' implica)?   (asocia a la derecha)
  Parser.prototype.parseImplica = function () {
    var izq = this.parseOr();
    if (this.actual().tipo === TIPOS.IMPLICA) {
      this.avanzar();
      var der = this.parseImplica();
      return { id: this.nuevoId(), tipo: "implica", izq: izq, der: der };
    }
    return izq;
  };

  // or := and ('∨' and)*
  Parser.prototype.parseOr = function () {
    var nodo = this.parseAnd();
    while (this.actual().tipo === TIPOS.O) {
      this.avanzar();
      var der = this.parseAnd();
      nodo = { id: this.nuevoId(), tipo: "o", izq: nodo, der: der };
    }
    return nodo;
  };

  // and := unary ('∧' unary)*
  Parser.prototype.parseAnd = function () {
    var nodo = this.parseUnary();
    while (this.actual().tipo === TIPOS.Y) {
      this.avanzar();
      var der = this.parseUnary();
      nodo = { id: this.nuevoId(), tipo: "y", izq: nodo, der: der };
    }
    return nodo;
  };

  // unary := '¬' unary | ('∀'|'∃') IDENT unary | primary
  Parser.prototype.parseUnary = function () {
    var t = this.actual();
    if (t.tipo === TIPOS.NO) {
      this.avanzar();
      var hijo = this.parseUnary();
      return { id: this.nuevoId(), tipo: "no", hijo: hijo };
    }
    if (t.tipo === TIPOS.PARATODO || t.tipo === TIPOS.EXISTE) {
      this.avanzar();
      var vt = this.esperar(TIPOS.IDENT, "Después de ∀ o ∃ se espera el nombre de una variable.");
      var variable = vt.valor;
      var id = this.nuevoId();
      this.pilaLigadas.push(variable);
      var cuerpo = this.parseUnary();
      this.pilaLigadas.pop();
      var tipoNodo = t.tipo === TIPOS.PARATODO ? "paraTodo" : "existe";
      return { id: id, tipo: tipoNodo, variable: variable, cuerpo: cuerpo };
    }
    return this.parsePrimary();
  };

  // primary := '(' implica ')' | predicado
  Parser.prototype.parsePrimary = function () {
    var t = this.actual();
    if (t.tipo === TIPOS.LPAREN) {
      this.avanzar();
      var nodo = this.parseImplica();
      this.esperar(TIPOS.RPAREN, "Falta un paréntesis que cierre «)».");
      return nodo;
    }
    if (t.tipo === TIPOS.IDENT) {
      return this.parsePredicado();
    }
    throw { codigo: "SINTAXIS", mensaje: "Se esperaba una fórmula (un predicado, ¬, ∀, ∃ o un paréntesis).", posicion: t.pos };
  };

  // predicado := IDENT ('(' lista-de-terminos ')')?
  Parser.prototype.parsePredicado = function () {
    var t = this.avanzar(); // IDENT
    var nombre = t.valor;
    var decl = buscarSimbolo(this.lenguaje.predicados, nombre);
    if (!decl) {
      throw { codigo: "SIMBOLO_DESCONOCIDO", mensaje: "«" + nombre + "» no está declarado como predicado.", posicion: t.pos };
    }
    var args = [];
    if (this.actual().tipo === TIPOS.LPAREN) {
      this.avanzar();
      args = this.parseListaTerminos();
      this.esperar(TIPOS.RPAREN, "Falta un paréntesis que cierre la lista de argumentos de «" + nombre + "».");
    }
    if (args.length !== decl.aridad) {
      throw {
        codigo: "ARIDAD",
        mensaje: "«" + nombre + "» necesita " + decl.aridad + " argumento(s) y recibió " + args.length + ".",
        posicion: t.pos
      };
    }
    return { id: this.nuevoId(), tipo: "pred", nombre: nombre, args: args };
  };

  Parser.prototype.parseListaTerminos = function () {
    var lista = [];
    if (this.actual().tipo === TIPOS.RPAREN) return lista; // lista vacía (aridad 0 con paréntesis)
    lista.push(this.parseTermino());
    while (this.actual().tipo === TIPOS.COMA) {
      this.avanzar();
      lista.push(this.parseTermino());
    }
    return lista;
  };

  // termino := IDENT ('(' lista-de-terminos ')')?
  // Si el identificador es una función declarada -> nodo "func".
  // Si no está declarado -> se trata como variable.
  Parser.prototype.parseTermino = function () {
    var t = this.esperar(TIPOS.IDENT, "Se esperaba un término (una variable o una función).");
    var nombre = t.valor;
    var decl = buscarSimbolo(this.lenguaje.funciones, nombre);
    if (!decl) {
      // Variable: si no está ligada por ningún cuantificador externo, es libre.
      if (!this.estaLigada(nombre)) this.libres[nombre] = true;
      return { tipo: "var", nombre: nombre };
    }
    var args = [];
    if (this.actual().tipo === TIPOS.LPAREN) {
      this.avanzar();
      args = this.parseListaTerminos();
      this.esperar(TIPOS.RPAREN, "Falta un paréntesis que cierre los argumentos de «" + nombre + "».");
    }
    if (args.length !== decl.aridad) {
      throw {
        codigo: "ARIDAD",
        mensaje: "«" + nombre + "» necesita " + decl.aridad + " argumento(s) y recibió " + args.length + ".",
        posicion: t.pos
      };
    }
    return { tipo: "func", nombre: nombre, args: args };
  };

  // ----------------------------------------------------------------------
  // analizarFormula(texto, lenguaje)
  // ----------------------------------------------------------------------

  function analizarFormula(texto, lenguaje) {
    if (typeof texto !== "string" || texto.trim() === "") {
      return salidaError([err("SINTAXIS", "Escribe una fórmula antes de evaluar.", 0)]);
    }
    try {
      var tokens = tokenizar(texto);
      var parser = new Parser(tokens, lenguaje);
      var ast = parser.parseFormula();
      var libres = Object.keys(parser.libres);
      return { ok: true, libres: libres, ast: ast };
    } catch (e) {
      if (e && e.codigo) return salidaError([err(e.codigo, e.mensaje, e.posicion)]);
      // Error inesperado: no debe tumbar la interfaz, se reporta como sintaxis.
      return salidaError([err("SINTAXIS", "No se pudo interpretar la fórmula.", 0)]);
    }
  }

  // ----------------------------------------------------------------------
  // validarInterpretacion(lenguaje, interpretacion)
  // ----------------------------------------------------------------------

  // Genera todas las combinaciones (tuplas) de tamaño "aridad" con elementos
  // del dominio, en el mismo orden en que se declararon.
  function productoCartesiano(dominio, aridad) {
    if (aridad === 0) return [[]];
    var resultado = [[]];
    for (var k = 0; k < aridad; k++) {
      var siguiente = [];
      for (var i = 0; i < resultado.length; i++) {
        for (var j = 0; j < dominio.length; j++) {
          siguiente.push(resultado[i].concat([dominio[j]]));
        }
      }
      resultado = siguiente;
    }
    return resultado;
  }

  function tuplasIguales(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function validarInterpretacion(lenguaje, interpretacion) {
    var errores = [];
    var dominio = (interpretacion && interpretacion.dominio) || [];

    if (!Array.isArray(dominio) || dominio.length === 0) {
      return salidaError([err("DOMINIO_VACIO", "El dominio no puede estar vacío: agrega al menos un elemento.")]);
    }

    // --- Funciones y constantes ---
    var funcs = lenguaje.funciones || [];
    for (var fi = 0; fi < funcs.length; fi++) {
      var fdecl = funcs[fi];
      var filas = (interpretacion.funciones && interpretacion.funciones[fdecl.nombre]) || [];
      var combinaciones = productoCartesiano(dominio, fdecl.aridad);

      for (var r = 0; r < filas.length; r++) {
        var fila = filas[r];
        var argsInvalidos = fila.args.length !== fdecl.aridad ||
          fila.args.some(function (a) { return dominio.indexOf(a) === -1; });
        var valorInvalido = dominio.indexOf(fila.valor) === -1;
        if (argsInvalidos || valorInvalido) {
          errores.push(err("TUPLA_INVALIDA", "La fila " + JSON.stringify(fila.args) + " = " + fila.valor + " de «" + fdecl.nombre + "» no es válida en el dominio actual."));
        }
      }

      // Toda combinación de argumentos debe tener una fila con valor válido.
      for (var ci = 0; ci < combinaciones.length; ci++) {
        var combo = combinaciones[ci];
        var filaEncontrada = null;
        for (var r2 = 0; r2 < filas.length; r2++) {
          if (tuplasIguales(filas[r2].args, combo)) { filaEncontrada = filas[r2]; break; }
        }
        if (!filaEncontrada || dominio.indexOf(filaEncontrada.valor) === -1) {
          errores.push(err("FUNCION_INCOMPLETA", "A «" + fdecl.nombre + "(" + combo.join(", ") + ")» le falta un valor del dominio."));
        }
      }
    }

    // --- Predicados ---
    var preds = lenguaje.predicados || [];
    for (var pi = 0; pi < preds.length; pi++) {
      var pdecl = preds[pi];
      var tuplas = (interpretacion.predicados && interpretacion.predicados[pdecl.nombre]) || [];

      if (tuplas.length === 0) {
        errores.push(err("RELACION_VACIA", "La relación «" + pdecl.nombre + "» no puede quedar vacía: agrega al menos una tupla."));
        continue;
      }

      for (var ti = 0; ti < tuplas.length; ti++) {
        var tup = tuplas[ti];
        var malFormada = !Array.isArray(tup) || tup.length !== pdecl.aridad ||
          tup.some(function (a) { return dominio.indexOf(a) === -1; });
        if (malFormada) {
          errores.push(err("TUPLA_INVALIDA", "La tupla " + JSON.stringify(tup) + " de «" + pdecl.nombre + "» no es válida en el dominio actual."));
        }
      }
    }

    if (errores.length > 0) return salidaError(errores);
    return { ok: true };
  }

  // ----------------------------------------------------------------------
  // validarEntorno(libres, interpretacion, entorno)
  // ----------------------------------------------------------------------

  function validarEntorno(libres, interpretacion, entorno) {
    var errores = [];
    var dominio = (interpretacion && interpretacion.dominio) || [];
    entorno = entorno || {};

    for (var i = 0; i < libres.length; i++) {
      var v = libres[i];
      if (!(v in entorno) || entorno[v] === "" || entorno[v] == null) {
        errores.push(err("ENTORNO_FALTANTE", "Falta asignar un valor del dominio a la variable libre «" + v + "»."));
        continue;
      }
      if (dominio.indexOf(entorno[v]) === -1) {
        errores.push(err("ENTORNO_INVALIDO", "El valor asignado a «" + v + "» no pertenece al dominio."));
      }
    }

    if (errores.length > 0) return salidaError(errores);
    return { ok: true };
  }

  // ----------------------------------------------------------------------
  // evaluar(ast, interpretacion, entorno)
  // ----------------------------------------------------------------------

  // Recorre el AST una sola vez para obtener el orden hojas -> raíz,
  // independiente de cuántas veces se evalúe cada nodo con distintos
  // elementos del dominio (eso se decide aparte, ver abajo).
  function construirOrden(nodo, lista) {
    if (!nodo) return;
    switch (nodo.tipo) {
      case "no":
        construirOrden(nodo.hijo, lista);
        break;
      case "y": case "o": case "implica":
        construirOrden(nodo.izq, lista);
        construirOrden(nodo.der, lista);
        break;
      case "paraTodo": case "existe":
        construirOrden(nodo.cuerpo, lista);
        break;
      // "pred" es hoja, no tiene hijos de fórmula.
    }
    lista.push(nodo.id);
  }

  function evalTermino(term, entorno, interpretacion) {
    if (term.tipo === "var") return entorno[term.nombre];
    // term.tipo === "func"
    var valoresArgs = term.args.map(function (a) { return evalTermino(a, entorno, interpretacion); });
    var filas = (interpretacion.funciones && interpretacion.funciones[term.nombre]) || [];
    for (var i = 0; i < filas.length; i++) {
      if (tuplasIguales(filas[i].args, valoresArgs)) return filas[i].valor;
    }
    return undefined; // no debería pasar si la interpretación ya fue validada
  }

  function listaBonita(elementos) {
    if (elementos.length === 0) return "";
    if (elementos.length === 1) return elementos[0];
    return elementos.slice(0, -1).join(", ") + " y " + elementos[elementos.length - 1];
  }

  // Evalúa un nodo de fórmula bajo un entorno dado. Devuelve el valor
  // booleano y va guardando en "nodos" la explicación de cada id visitado.
  // Para los cuantificadores, guarda en "nodos" solo los valores del
  // "elemento decisivo" (contraejemplo o testigo) y, si no hay ninguno,
  // los del primer elemento del dominio.
  function evalNodo(nodo, entorno, interpretacion, nodos) {
    var dominio = interpretacion.dominio;

    switch (nodo.tipo) {
      case "pred": {
        var valores = nodo.args.map(function (a) { return evalTermino(a, entorno, interpretacion); });
        var tuplas = (interpretacion.predicados && interpretacion.predicados[nodo.nombre]) || [];
        var pertenece = tuplas.some(function (t) { return tuplasIguales(t, valores); });
        var textoArgs = valores.length ? "(" + valores.join(", ") + ")" : "";
        var razon = nodo.nombre + textoArgs + " es " + (pertenece ? "verdadero" : "falso") +
          " porque " + (valores.length ? "(" + valores.join(", ") + ")" : "esta proposición") +
          (pertenece ? " está en la relación " : " no está en la relación ") + nodo.nombre + ".";
        nodos[nodo.id] = {
          valor: pertenece, razon: razon, entorno: Object.assign({}, entorno),
          ramas: null, testigo: null, contraejemplo: null, comprobacion: null
        };
        return pertenece;
      }

      case "no": {
        var v = evalNodo(nodo.hijo, entorno, interpretacion, nodos);
        var valor = !v;
        nodos[nodo.id] = {
          valor: valor,
          razon: "¬ es " + (valor ? "verdadero" : "falso") + " porque la subfórmula es " + (v ? "verdadera" : "falsa") + ".",
          entorno: Object.assign({}, entorno),
          ramas: null, testigo: null, contraejemplo: null, comprobacion: null
        };
        return valor;
      }

      case "y": {
        var i1 = evalNodo(nodo.izq, entorno, interpretacion, nodos);
        var i2 = evalNodo(nodo.der, entorno, interpretacion, nodos);
        var valorY = i1 && i2;
        var razonY;
        if (valorY) razonY = "∧ es verdadero porque las dos partes son verdaderas.";
        else if (!i1 && !i2) razonY = "∧ es falso porque las dos partes son falsas.";
        else razonY = "∧ es falso porque la parte " + (!i1 ? "izquierda" : "derecha") + " es falsa.";
        nodos[nodo.id] = { valor: valorY, razon: razonY, entorno: Object.assign({}, entorno), ramas: null, testigo: null, contraejemplo: null, comprobacion: null };
        return valorY;
      }

      case "o": {
        var o1 = evalNodo(nodo.izq, entorno, interpretacion, nodos);
        var o2 = evalNodo(nodo.der, entorno, interpretacion, nodos);
        var valorO = o1 || o2;
        var razonO;
        if (!valorO) razonO = "∨ es falso porque las dos partes son falsas.";
        else if (o1 && o2) razonO = "∨ es verdadero porque las dos partes son verdaderas.";
        else razonO = "∨ es verdadero porque la parte " + (o1 ? "izquierda" : "derecha") + " es verdadera.";
        nodos[nodo.id] = { valor: valorO, razon: razonO, entorno: Object.assign({}, entorno), ramas: null, testigo: null, contraejemplo: null, comprobacion: null };
        return valorO;
      }

      case "implica": {
        var a = evalNodo(nodo.izq, entorno, interpretacion, nodos);
        var b = evalNodo(nodo.der, entorno, interpretacion, nodos);
        var valorImp = (!a) || b;
        var razonImp;
        if (!a) razonImp = "→ es verdadero porque el antecedente es falso.";
        else if (b) razonImp = "→ es verdadero porque el consecuente es verdadero.";
        else razonImp = "→ es falso porque el antecedente es verdadero y el consecuente es falso.";
        nodos[nodo.id] = { valor: valorImp, razon: razonImp, entorno: Object.assign({}, entorno), ramas: null, testigo: null, contraejemplo: null, comprobacion: null };
        return valorImp;
      }

      case "paraTodo": case "existe": {
        var esParaTodo = nodo.tipo === "paraTodo";
        var ramas = [];
        var elementoDecisivo = null;
        var nodosPorElemento = {};

        for (var di = 0; di < dominio.length; di++) {
          var elemento = dominio[di];
          var entornoHijo = Object.assign({}, entorno);
          entornoHijo[nodo.variable] = elemento;
          var nodosIter = {};
          var valorCuerpo = evalNodo(nodo.cuerpo, entornoHijo, interpretacion, nodosIter);
          ramas.push({ elemento: elemento, valor: valorCuerpo });
          nodosPorElemento[elemento] = nodosIter;

          if (elementoDecisivo === null) {
            if (esParaTodo && !valorCuerpo) elementoDecisivo = elemento;
            if (!esParaTodo && valorCuerpo) elementoDecisivo = elemento;
          }
        }

        var valorFinal = esParaTodo ? ramas.every(function (r) { return r.valor; })
                                     : ramas.some(function (r) { return r.valor; });

        // Si no hubo elemento decisivo, se muestra el primero del dominio.
        var elementoParaMostrar = elementoDecisivo !== null ? elementoDecisivo : dominio[0];
        Object.assign(nodos, nodosPorElemento[elementoParaMostrar]);

        var testigo = (!esParaTodo && valorFinal) ? elementoDecisivo : null;
        var contraejemplo = (esParaTodo && !valorFinal) ? elementoDecisivo : null;
        var comprobacion = ((esParaTodo && valorFinal) || (!esParaTodo && !valorFinal)) ? "completa" : null;

        var cuantificadorTexto = esParaTodo ? "∀" : "∃";
        var razonCuant;
        if (esParaTodo && valorFinal) {
          razonCuant = "Se cumple para todo " + nodo.variable + " del dominio: " + listaBonita(dominio) + ".";
        } else if (esParaTodo && !valorFinal) {
          razonCuant = "No se cumple para " + nodo.variable + " = " + contraejemplo + ": ahí la fórmula interna es falsa. Contraejemplo: " + contraejemplo + ".";
        } else if (!esParaTodo && valorFinal) {
          razonCuant = "Existe " + nodo.variable + " = " + testigo + " que cumple la fórmula. Testigo: " + testigo + ".";
        } else {
          razonCuant = "No existe ningún " + nodo.variable + " del dominio que cumpla la fórmula. Se revisó todo el dominio: " + listaBonita(dominio) + ".";
        }

        nodos[nodo.id] = {
          valor: valorFinal, razon: razonCuant, entorno: Object.assign({}, entorno),
          ramas: ramas, testigo: testigo, contraejemplo: contraejemplo, comprobacion: comprobacion
        };
        return valorFinal;
      }
    }
  }

  function evaluar(ast, interpretacion, entorno) {
    var orden = [];
    construirOrden(ast, orden);
    var nodos = {};
    var valor = evalNodo(ast, entorno || {}, interpretacion, nodos);
    return { ok: true, valor: valor, raiz: ast.id, orden: orden, nodos: nodos };
  }

  // ----------------------------------------------------------------------
  // Registro en LN.mock (lo usa js/api.js cuando LN.USAR_MOCK es true)
  // ----------------------------------------------------------------------

  LN.mock.analizarFormula = analizarFormula;
  LN.mock.validarInterpretacion = validarInterpretacion;
  LN.mock.validarEntorno = validarEntorno;
  LN.mock.evaluar = evaluar;
})();
