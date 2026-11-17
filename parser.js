/* parser.js: analizador sintáctico descendente recursivo (equivale a parser_gramatica.py).
 *
 * Gramática (precedencia de mayor a menor, como Huth & Ryan: ¬, ∀x/∃x, ∧, ∨, →):
 *   implica  ::= o ( '→' implica )?          (→ asocia a la derecha)
 *   o        ::= y ( '∨' y )*                (asocia a la izquierda)
 *   y        ::= unario ( '∧' unario )*      (asocia a la izquierda)
 *   unario   ::= '¬' unario | ('∀'|'∃') VAR unario | primario
 *   primario ::= '(' implica ')' | atomica
 *   atomica  ::= P '(' términos ')'  |  término '=' término
 *   término  ::= VAR | CONSTANTE | f '(' términos ')'
 *
 * Por eso ∀x P(x) → Q(x) se lee (∀x P(x)) → Q(x): el cuantificador abarca solo P(x).
 */
(function (g) {
  'use strict';
  if (typeof require === 'function' && typeof module !== 'undefined') {
    ['tipos', 'utils', 'tokenizador', 'validaciones'].forEach((m) => require(`./${m}.js`));
  }
  const L = g.Logica;
  const { NODO, ERR, TOKEN: T } = L.tipos;
  const { crearError, fallo, hijos, esCuantificador, plural } = L.utils;

  function analizarFormula(texto, lenguaje) {
    const vl = L.validaciones.validarLenguaje(lenguaje);
    if (!vl.ok) return vl;
    if (typeof texto !== 'string' || texto.trim() === '') {
      return fallo([crearError(ERR.SINTAXIS, 'La fórmula está vacía.', { posicion: 0 })]);
    }
    const tk = L.tokenizador.tokenizar(texto);
    if (!tk.ok) return tk;
    const tokens = tk.tokens;

    // tabla de símbolos declarados
    const simbolos = new Map();
    (lenguaje.funciones || []).forEach((f) => simbolos.set(f.nombre, { clase: 'func', aridad: f.aridad }));
    (lenguaje.predicados || []).forEach((p) => simbolos.set(p.nombre, { clase: 'pred', aridad: p.aridad }));

    const errores = []; // errores de símbolo/aridad: se acumulan y el análisis continúa
    let i = 0;

    const peek = () => tokens[i];
    const siguiente = () => tokens[i++];
    const ultimoFin = () => tokens[i - 1].fin;
    const registrar = (codigo, mensaje, posicion) => errores.push(crearError(codigo, mensaje, { posicion }));
    const detener = (mensaje, posicion) => { throw { __err: crearError(ERR.SINTAXIS, mensaje, { posicion }) }; };
    const inesperado = (tok, esperaba) => {
      if (tok.tipo === T.EOF) detener(`La fórmula termina inesperadamente: se esperaba ${esperaba}.`, tok.inicio);
      detener(`Símbolo inesperado '${tok.texto}': se esperaba ${esperaba}.`, tok.inicio);
    };

    /* ----- términos ----- */
    function parseArgs() {
      const abre = siguiente(); // '('
      const args = [];
      if (peek().tipo === T.RPAREN) { siguiente(); return args; }
      for (;;) {
        args.push(parseTermino());
        const t = peek();
        if (t.tipo === T.COMA) { siguiente(); continue; }
        if (t.tipo === T.RPAREN) { siguiente(); return args; }
        if (t.tipo === T.EOF) detener(`Falta cerrar el paréntesis abierto en la posición ${abre.inicio}.`, abre.inicio);
        inesperado(t, "',' o ')'");
      }
    }

    function parseTermino() {
      const t = peek();
      if (t.tipo !== T.ID) inesperado(t, 'un término (variable, constante o función)');
      const s = simbolos.get(t.texto);
      if (s && s.clase === 'pred') {
        detener(`'${t.texto}' es un predicado, no un término: no puede usarse como argumento ni dentro de una igualdad.`, t.inicio);
      }
      siguiente();
      if (!s) {
        if (peek().tipo === T.LPAREN) {
          registrar(ERR.SIMBOLO_DESCONOCIDO, `El símbolo '${t.texto}' no está declarado en el lenguaje.`, t.inicio);
          const args = parseArgs();
          return { id: 0, tipo: NODO.FUNC, nombre: t.texto, pos: [t.inicio, ultimoFin()], args };
        }
        // identificador no declarado y sin paréntesis: variable individual
        return { id: 0, tipo: NODO.VAR, nombre: t.texto, pos: [t.inicio, t.fin], ligadaPor: null };
      }
      const args = peek().tipo === T.LPAREN ? parseArgs() : [];
      if (args.length !== s.aridad) {
        registrar(ERR.ARIDAD,
          `La función '${t.texto}' tiene aridad ${s.aridad} pero recibió ${plural(args.length, 'argumento', 'argumentos')}.`, t.inicio);
      }
      return { id: 0, tipo: NODO.FUNC, nombre: t.texto, pos: [t.inicio, ultimoFin()], args };
    }

    /* ----- fórmulas atómicas ----- */
    function parseIgualdadCon(izq, inicio) {
      const e = peek();
      if (e.tipo !== T.IGUAL) inesperado(e, "'=' (un término por sí solo no es una fórmula)");
      siguiente();
      const der = parseTermino();
      return { id: 0, tipo: NODO.IGUAL, pos: [inicio, ultimoFin()], izq, der };
    }

    function parseAtomica() {
      const t = peek();
      const s = simbolos.get(t.texto);

      if (s && s.clase === 'pred') {
        siguiente();
        const args = peek().tipo === T.LPAREN ? parseArgs() : [];
        if (args.length !== s.aridad) {
          registrar(ERR.ARIDAD,
            `El predicado '${t.texto}' tiene aridad ${s.aridad} pero recibió ${plural(args.length, 'argumento', 'argumentos')}.`, t.inicio);
        }
        const nodo = { id: 0, tipo: NODO.PRED, nombre: t.texto, pos: [t.inicio, ultimoFin()], args };
        if (peek().tipo === T.IGUAL) {
          detener("'=' relaciona términos, no fórmulas: no se puede igualar un predicado.", peek().inicio);
        }
        return nodo;
      }

      // símbolo desconocido seguido de '(': puede ser predicado o función (si luego viene '=')
      if (!s && tokens[i + 1] && tokens[i + 1].tipo === T.LPAREN) {
        siguiente();
        registrar(ERR.SIMBOLO_DESCONOCIDO, `El símbolo '${t.texto}' no está declarado en el lenguaje.`, t.inicio);
        const args = parseArgs();
        if (peek().tipo === T.IGUAL) {
          const izq = { id: 0, tipo: NODO.FUNC, nombre: t.texto, pos: [t.inicio, ultimoFin()], args };
          return parseIgualdadCon(izq, t.inicio);
        }
        return { id: 0, tipo: NODO.PRED, nombre: t.texto, pos: [t.inicio, ultimoFin()], args };
      }

      const izq = parseTermino();
      return parseIgualdadCon(izq, t.inicio);
    }

    /* ----- fórmulas compuestas ----- */
    function parsePrimario() {
      const t = peek();
      if (t.tipo === T.LPAREN) {
        siguiente();
        const f = parseImplica();
        const c = peek();
        if (c.tipo !== T.RPAREN) {
          if (c.tipo === T.EOF) detener(`Falta cerrar el paréntesis abierto en la posición ${t.inicio}.`, t.inicio);
          inesperado(c, "')'");
        }
        siguiente();
        return f; // los paréntesis que envuelven no forman parte del nodo
      }
      if (t.tipo === T.ID) return parseAtomica();
      return inesperado(t, 'una fórmula');
    }

    function parseUnario() {
      const t = peek();
      if (t.tipo === T.NO) {
        siguiente();
        const hijo = parseUnario();
        return { id: 0, tipo: NODO.NO, pos: [t.inicio, ultimoFin()], hijo };
      }
      if (t.tipo === T.PARATODO || t.tipo === T.EXISTE) {
        siguiente();
        const v = peek();
        if (v.tipo !== T.ID) inesperado(v, 'una variable después del cuantificador');
        const s = simbolos.get(v.texto);
        if (s) {
          detener(`'${v.texto}' es ${s.clase === 'pred' ? 'un predicado' : 'una constante o función'}: ` +
            'un cuantificador solo se aplica a variables individuales (lógica de primer orden).', v.inicio);
        }
        siguiente();
        if (peek().tipo === T.PUNTO) siguiente(); // '∀x.' o '∀x:' opcional
        const cuerpo = parseUnario();
        return {
          id: 0, tipo: t.tipo === T.PARATODO ? NODO.PARA_TODO : NODO.EXISTE,
          variable: v.texto, pos: [t.inicio, ultimoFin()], alcance: [], cuerpo,
        };
      }
      return parsePrimario();
    }

    function binarioIzq(tipoToken, tipoNodo, siguienteNivel) {
      return () => {
        const inicio = peek().inicio;
        let izq = siguienteNivel();
        while (peek().tipo === tipoToken) {
          siguiente();
          const der = siguienteNivel();
          izq = { id: 0, tipo: tipoNodo, pos: [inicio, ultimoFin()], izq, der };
        }
        return izq;
      };
    }
    const parseY = binarioIzq(T.Y, NODO.Y, parseUnario);
    const parseO = binarioIzq(T.O, NODO.O, parseY);

    function parseImplica() {
      const inicio = peek().inicio;
      const izq = parseO();
      if (peek().tipo === T.IMPLICA) {
        siguiente();
        const der = parseImplica(); // asociatividad a la derecha
        return { id: 0, tipo: NODO.IMPLICA, pos: [inicio, ultimoFin()], izq, der };
      }
      return izq;
    }

    /* ----- análisis completo ----- */
    let ast;
    try {
      ast = parseImplica();
      if (peek().tipo !== T.EOF) inesperado(peek(), 'un conectivo o el final de la fórmula');
    } catch (e) {
      if (e && e.__err) {
        errores.push(e.__err);
        errores.sort((a, b) => a.posicion - b.posicion);
        return fallo(errores);
      }
      throw e;
    }
    if (errores.length) return fallo(errores.sort((a, b) => a.posicion - b.posicion));

    const { libres, ligadas } = anotar(ast);
    return { ok: true, libres, ligadas, ast };
  }

  /* ---------- ids, ligaduras y alcance ---------- */

  // Ids del subárbol del cuerpo que el cuantificador liga de verdad:
  // se omiten los subárboles que reintroducen la misma variable (el más interno manda).
  function recolectarAlcance(nodo, variable, acc) {
    if (esCuantificador(nodo) && nodo.variable === variable) return acc;
    acc.push(nodo.id);
    hijos(nodo).forEach((h) => recolectarAlcance(h, variable, acc));
    return acc;
  }

  // Recorrido en preorden: asigna ids, ligadaPor y alcance; calcula libres y ligadas.
  function anotar(raiz) {
    let sig = 1;
    const libres = [];
    const ligadas = [];

    function visitar(n, env) {
      n.id = sig++;
      if (n.tipo === NODO.VAR) {
        if (env.has(n.nombre)) {
          n.ligadaPor = env.get(n.nombre);
          if (!ligadas.includes(n.nombre)) ligadas.push(n.nombre);
        } else {
          n.ligadaPor = null;
          if (!libres.includes(n.nombre)) libres.push(n.nombre);
        }
        return;
      }
      let envHijos = env;
      if (esCuantificador(n)) {
        envHijos = new Map(env);
        envHijos.set(n.variable, n.id);
      }
      hijos(n).forEach((h) => visitar(h, envHijos));
      if (esCuantificador(n)) n.alcance = recolectarAlcance(n.cuerpo, n.variable, []);
    }

    visitar(raiz, new Map());
    return { libres, ligadas };
  }

  /* ---------- funciones de apoyo (teoría de la lámina 8) ---------- */
  function ocurrencias(ast, libre) {
    const res = [];
    (function rec(n) {
      if (n.tipo === NODO.VAR && (n.ligadaPor === null) === libre) res.push(n);
      hijos(n).forEach(rec);
    })(ast);
    return res;
  }
  function variablesLibres(ast) { return [...new Set(ocurrencias(ast, true).map((v) => v.nombre))]; }
  function variablesLigadas(ast) { return [...new Set(ocurrencias(ast, false).map((v) => v.nombre))]; }
  function alcance(nodo) { return esCuantificador(nodo) ? nodo.alcance : []; }

  // Fórmula completamente parentizada: sirve para ver cómo se agrupó (precedencia) y en las pruebas.
  function formatear(n) {
    switch (n.tipo) {
      case NODO.VAR: return n.nombre;
      case NODO.FUNC: return n.args.length ? `${n.nombre}(${n.args.map(formatear).join(', ')})` : n.nombre;
      case NODO.PRED: return `${n.nombre}(${n.args.map(formatear).join(', ')})`;
      case NODO.IGUAL: return `${formatear(n.izq)} = ${formatear(n.der)}`;
      case NODO.NO: return `¬${formatear(n.hijo)}`;
      case NODO.Y: return `(${formatear(n.izq)} ∧ ${formatear(n.der)})`;
      case NODO.O: return `(${formatear(n.izq)} ∨ ${formatear(n.der)})`;
      case NODO.IMPLICA: return `(${formatear(n.izq)} → ${formatear(n.der)})`;
      case NODO.PARA_TODO: return `(∀${n.variable} ${formatear(n.cuerpo)})`;
      case NODO.EXISTE: return `(∃${n.variable} ${formatear(n.cuerpo)})`;
      default: return '?';
    }
  }

  L.parser = { analizarFormula, variablesLibres, variablesLigadas, alcance, formatear };
  // API del contrato (las tres funciones del Integrante 1)
  L.analizarFormula = analizarFormula;
  L.validarInterpretacion = L.validaciones.validarInterpretacion;
  L.validarEntorno = L.validaciones.validarEntorno;
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
})(typeof window !== 'undefined' ? window : globalThis);
