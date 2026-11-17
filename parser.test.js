// Pruebas del Integrante 1. Ejecutar con:  node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/parser.js');
const { analizarFormula, validarInterpretacion, validarEntorno } = L;
const { variablesLibres, variablesLigadas, formatear } = L.parser;

const lenguaje = {
  funciones: [{ nombre: 'f', aridad: 1 }, { nombre: 'c', aridad: 0 }],
  predicados: [{ nombre: 'P', aridad: 1 }, { nombre: 'R', aridad: 2 }],
};
const interp = () => ({
  dominio: ['a', 'b', 'c'],
  funciones: {
    f: [{ args: ['a'], valor: 'b' }, { args: ['b'], valor: 'c' }, { args: ['c'], valor: 'a' }],
    c: [{ args: [], valor: 'a' }],
  },
  predicados: { P: [['a'], ['c']], R: [['a', 'b']] },
});
const v = (id, nombre, pos, ligadaPor) => ({ id, tipo: 'var', nombre, pos, ligadaPor });

/* ---------- Ejemplos del contrato ---------- */
test('Ejemplo 1: ∀x (P(x) → R(x, f(x)))', () => {
  const r = analizarFormula('∀x (P(x) → R(x, f(x)))', lenguaje);
  assert.deepEqual(r, {
    ok: true, libres: [], ligadas: ['x'],
    ast: { id: 1, tipo: 'paraTodo', variable: 'x', pos: [0, 22], alcance: [2, 3, 4, 5, 6, 7, 8],
      cuerpo: { id: 2, tipo: 'implica', pos: [4, 21],
        izq: { id: 3, tipo: 'pred', nombre: 'P', pos: [4, 8], args: [v(4, 'x', [6, 7], 1)] },
        der: { id: 5, tipo: 'pred', nombre: 'R', pos: [11, 21], args: [
          v(6, 'x', [13, 14], 1),
          { id: 7, tipo: 'func', nombre: 'f', pos: [16, 20], args: [v(8, 'x', [18, 19], 1)] }] } } },
  });
});

test('Ejemplo 2: variable libre y ligada a la vez', () => {
  const r = analizarFormula('P(x) ∧ ∀x P(x)', lenguaje);
  assert.deepEqual(r, {
    ok: true, libres: ['x'], ligadas: ['x'],
    ast: { id: 1, tipo: 'y', pos: [0, 14],
      izq: { id: 2, tipo: 'pred', nombre: 'P', pos: [0, 4], args: [v(3, 'x', [2, 3], null)] },
      der: { id: 4, tipo: 'paraTodo', variable: 'x', pos: [7, 14], alcance: [5, 6],
        cuerpo: { id: 5, tipo: 'pred', nombre: 'P', pos: [10, 14], args: [v(6, 'x', [12, 13], 4)] } } },
  });
});

test('Ejemplo 3A: ∀x P(x) → ∃x P(x) = (∀x P(x)) → (∃x P(x))', () => {
  const r = analizarFormula('∀x P(x) → ∃x P(x)', lenguaje);
  assert.equal(formatear(r.ast), '((∀x P(x)) → (∃x P(x)))');
  assert.deepEqual(r.ast.izq.alcance, [3, 4]);
  assert.deepEqual(r.ast.der.alcance, [6, 7]);
  assert.deepEqual(r.libres, []);
});

test('Ejemplo 3B: el cuantificador más interno manda', () => {
  const r = analizarFormula('∀x (P(x) → ∃x P(x))', lenguaje);
  assert.deepEqual(r, {
    ok: true, libres: [], ligadas: ['x'],
    ast: { id: 1, tipo: 'paraTodo', variable: 'x', pos: [0, 19], alcance: [2, 3, 4],
      cuerpo: { id: 2, tipo: 'implica', pos: [4, 18],
        izq: { id: 3, tipo: 'pred', nombre: 'P', pos: [4, 8], args: [v(4, 'x', [6, 7], 1)] },
        der: { id: 5, tipo: 'existe', variable: 'x', pos: [11, 18], alcance: [6, 7],
          cuerpo: { id: 6, tipo: 'pred', nombre: 'P', pos: [14, 18], args: [v(7, 'x', [16, 17], 5)] } } } },
  });
});

test('Ejemplo 4: igualdad y constante', () => {
  const r = analizarFormula('f(c) = c', lenguaje);
  assert.deepEqual(r, {
    ok: true, libres: [], ligadas: [],
    ast: { id: 1, tipo: 'igual', pos: [0, 8],
      izq: { id: 2, tipo: 'func', nombre: 'f', pos: [0, 4], args: [{ id: 3, tipo: 'func', nombre: 'c', pos: [2, 3], args: [] }] },
      der: { id: 4, tipo: 'func', nombre: 'c', pos: [7, 8], args: [] } },
  });
  assert.equal(analizarFormula('f(c()) = c()', lenguaje).ok, true); // c() también vale
});

/* ---------- Ejemplo 5: errores ---------- */
const casosError = [
  ['P(x, y)', 'ARIDAD', 0],
  ['P(f)', 'ARIDAD', 2],
  ['Q(x)', 'SIMBOLO_DESCONOCIDO', 0],
  ['∀P(a)', 'SINTAXIS', 1],
  ['∀c P(c)', 'SINTAXIS', 1],
  ['∀x', 'SINTAXIS', 2],
  ['P(x) ∧', 'SINTAXIS', 6],
  ['(P(x)', 'SINTAXIS', 0],
  ['P(x) = P(y)', 'SINTAXIS', 5],
  ['P(x) ↔ P(y)', 'SINTAXIS', 5],
  ['P(x))', 'SINTAXIS', 4],
  ['P(x) P(y)', 'SINTAXIS', 5],
  ['x', 'SINTAXIS', 1],
  ['P(x) # P(y)', 'SINTAXIS', 5],
  ['', 'SINTAXIS', 0],
];
for (const [texto, codigo, posicion] of casosError) {
  test(`Error: "${texto}" -> ${codigo} @${posicion}`, () => {
    const r = analizarFormula(texto, lenguaje);
    assert.equal(r.ok, false);
    assert.equal(r.errores[0].codigo, codigo);
    assert.equal(r.errores[0].posicion, posicion);
    assert.ok(r.errores[0].mensaje.length > 0);
    assert.equal(r.ast, undefined); // sin AST => sin valor de verdad
  });
}

test('Los errores de símbolo y aridad se acumulan', () => {
  const r = analizarFormula('Q(x) ∧ P(x, y)', lenguaje);
  assert.deepEqual(r.errores.map((e) => e.codigo), ['SIMBOLO_DESCONOCIDO', 'ARIDAD']);
});

/* ---------- Precedencia y asociatividad ---------- */
test('Precedencia: ¬, cuantificadores, ∧, ∨, →', () => {
  const f = (t) => formatear(analizarFormula(t, lenguaje).ast);
  assert.equal(f('P(x) → P(y) → P(z)'), '(P(x) → (P(y) → P(z)))');
  assert.equal(f('P(x) ∨ P(y) ∧ P(z)'), '(P(x) ∨ (P(y) ∧ P(z)))');
  assert.equal(f('P(x) ∧ P(y) ∧ P(z)'), '((P(x) ∧ P(y)) ∧ P(z))');
  assert.equal(f('¬∀x P(x)'), '¬(∀x P(x))');
  assert.equal(f('¬P(x) ∧ P(y)'), '(¬P(x) ∧ P(y))');
  assert.equal(f('∃x ∀y R(x,y)'), '(∃x (∀y R(x, y)))');
  assert.equal(f('∀x P(x) ∧ P(y)'), '((∀x P(x)) ∧ P(y))');
});

/* ---------- Alias de teclado ---------- */
test('Alias de teclado equivalen a los símbolos', () => {
  const ref = formatear(analizarFormula('(∀x P(x) ∧ ¬R(x, y)) → ∃z P(z)', lenguaje).ast);
  const alias = [
    '(forall x P(x) and not R(x, y)) -> exists z P(z)',
    '(\\forall x P(x) \\wedge \\neg R(x, y)) \\to \\exists z P(z)',
    '(∀x. P(x) & ~R(x, y)) => ∃z: P(z)',
    '(FORALL x P(x) && !R(x,y)) --> existe z P(z)',
    '(paratodo x P(x) /\\ no R(x,y)) ⇒ ∃z P(z)',
  ];
  for (const t of alias) {
    const r = analizarFormula(t, lenguaje);
    assert.equal(r.ok, true, t);
    assert.equal(formatear(r.ast), ref, t);
  }
  assert.equal(formatear(analizarFormula('P(a) | P(b) or P(c) \\/ P(d)', lenguaje).ast), '(((P(a) ∨ P(b)) ∨ P(c)) ∨ P(d))');
  assert.equal(analizarFormula('f(c) == c', lenguaje).ok, true);
});

test('Palabras clave solo como palabra completa', () => {
  const lg = { funciones: [], predicados: [{ nombre: 'notable', aridad: 1 }, { nombre: 'andes', aridad: 1 }] };
  assert.equal(analizarFormula('notable(x) and andes(y)', lg).ok, true);
});

test('Posiciones se refieren al texto original aunque haya alias', () => {
  const r = analizarFormula('forall x  Q(x)', lenguaje);
  assert.equal(r.errores[0].posicion, 10);
});

/* ---------- Variables libres y ligadas (lámina 8) ---------- */
test('Ejercicio 1 de la lámina 8', () => {
  const lg = { funciones: [], predicados: [{ nombre: 'P', aridad: 2 }, { nombre: 'Q', aridad: 2 }] };
  const r = analizarFormula('∃x (P(y,z) ∧ ∀y (¬Q(y,x) ∨ P(y,z)))', lg);
  assert.deepEqual(r.libres, ['y', 'z']);
  assert.deepEqual(r.ligadas, ['y', 'x']);
  assert.deepEqual(variablesLibres(r.ast), ['y', 'z']);
  assert.deepEqual(variablesLigadas(r.ast), ['y', 'x']);
  // el ∃x abarca P(y,z) pero no hay x en él; el ∀y interno liga y en su cuerpo
  const existe = r.ast;
  const paraTodo = existe.cuerpo.der;
  assert.equal(paraTodo.tipo, 'paraTodo');
  assert.ok(existe.alcance.includes(paraTodo.id)); // ∃x sí abarca el ∀y (x distinta de y)
});

test('Ejemplo de la lámina 8: ∀x ((P(x) ∧ Q(x)) → ¬P(x) ∨ Q(y)) deja y libre', () => {
  const lg = { funciones: [], predicados: [{ nombre: 'P', aridad: 1 }, { nombre: 'Q', aridad: 1 }] };
  const r = analizarFormula('∀x ((P(x) ∧ Q(x)) → ¬P(x) ∨ Q(y))', lg);
  assert.deepEqual(r.libres, ['y']);
  assert.deepEqual(r.ligadas, ['x']);
});

/* ---------- Lenguaje ---------- */
test('Validación del lenguaje', () => {
  const codigos = (lg) => analizarFormula('P(x)', lg).errores.map((e) => e.codigo);
  assert.deepEqual(codigos({ funciones: [{ nombre: 'f', aridad: 1 }, { nombre: 'f', aridad: 2 }], predicados: [{ nombre: 'P', aridad: 1 }] }), ['SINTAXIS']);
  assert.deepEqual(codigos({ funciones: [{ nombre: 'P', aridad: 1 }], predicados: [{ nombre: 'P', aridad: 1 }] }), ['SINTAXIS']);
  assert.deepEqual(codigos({ funciones: [], predicados: [{ nombre: 'and', aridad: 1 }] }), ['NOMBRE_RESERVADO']);
  assert.deepEqual(codigos({ funciones: [], predicados: [{ nombre: 'P', aridad: 0 }] }), ['SINTAXIS']); // predicado aridad >= 1
  assert.deepEqual(codigos({ funciones: [{ nombre: 'f', aridad: -1 }], predicados: [] }), ['SINTAXIS']);
  assert.deepEqual(codigos({ funciones: [{ nombre: '', aridad: 1 }], predicados: [] }), ['SINTAXIS']);
  assert.deepEqual(codigos(null), ['SINTAXIS']);
});

/* ---------- Interpretación (Ejemplo 6) ---------- */
test('Interpretación válida', () => {
  assert.equal(validarInterpretacion(lenguaje, interp()).ok, true);
});

function codigosInterp(mod) {
  const i = interp(); mod(i);
  const r = validarInterpretacion(lenguaje, i);
  return r.ok ? [] : r.errores.map((e) => e.codigo);
}
test('Interpretación: errores', () => {
  assert.deepEqual(codigosInterp((i) => { i.dominio = []; }), ['DOMINIO_VACIO']);
  assert.deepEqual(codigosInterp((i) => { i.dominio = ['a', 'a', 'b']; }), ['DOMINIO_VACIO']);
  assert.deepEqual(codigosInterp((i) => { i.funciones.f.pop(); }), ['FUNCION_INCOMPLETA']);
  assert.deepEqual(codigosInterp((i) => { i.funciones.f[0].valor = 'z'; }), ['FUNCION_INCOMPLETA', 'FUNCION_INCOMPLETA']);
  assert.deepEqual(codigosInterp((i) => { i.funciones.f.push({ args: ['a'], valor: 'a' }); }), ['FUNCION_INCOMPLETA']); // repetida
  assert.deepEqual(codigosInterp((i) => { delete i.funciones.c; }), ['FUNCION_INCOMPLETA']);
  assert.deepEqual(codigosInterp((i) => { i.predicados.R = []; }), ['RELACION_VACIA']);
  assert.deepEqual(codigosInterp((i) => { delete i.predicados.P; }), ['RELACION_VACIA']);
  assert.deepEqual(codigosInterp((i) => { i.predicados.R = [['a', 'z']]; }), ['TUPLA_INVALIDA']);
  assert.deepEqual(codigosInterp((i) => { i.predicados.R = [['a']]; }), ['TUPLA_INVALIDA']);
});
test('Mensaje de función incompleta', () => {
  const i = interp(); i.funciones.f.pop();
  const r = validarInterpretacion(lenguaje, i);
  assert.equal(r.errores[0].mensaje, 'f es unaria y el dominio tiene 3 elemento(s); falta f(c).');
  assert.equal(r.errores[0].donde, 'interpretacion.funciones.f');
});
test('Funciones de aridad 2 deben tener |D|² entradas', () => {
  const lg = { funciones: [{ nombre: 'g', aridad: 2 }], predicados: [{ nombre: 'P', aridad: 1 }] };
  const dom = ['0', '1'];
  const total = [];
  for (const x of dom) for (const y of dom) total.push({ args: [x, y], valor: '0' });
  const ok = { dominio: dom, funciones: { g: total }, predicados: { P: [['0']] } };
  assert.equal(validarInterpretacion(lg, ok).ok, true);
  const mal = { ...ok, funciones: { g: total.slice(0, 3) } };
  assert.equal(validarInterpretacion(lg, mal).errores[0].codigo, 'FUNCION_INCOMPLETA');
});
test('Interpretación con símbolos extra solo avisa', () => {
  const i = interp(); i.predicados.Z = [['a']];
  const r = validarInterpretacion(lenguaje, i);
  assert.equal(r.ok, true);
  assert.equal(r.advertencias.length, 1);
});

/* ---------- Entorno ---------- */
test('Entorno', () => {
  const i = interp();
  assert.deepEqual(validarEntorno(['x'], i, { x: 'a' }), { ok: true, entorno: { x: 'a' }, advertencias: [] });
  assert.equal(validarEntorno(['x'], i, {}).errores[0].codigo, 'ENTORNO_FALTANTE');
  assert.equal(validarEntorno(['x'], i, { x: 'z' }).errores[0].codigo, 'ENTORNO_INVALIDO');
  assert.equal(validarEntorno(['x'], i, undefined).errores[0].codigo, 'ENTORNO_FALTANTE');
  assert.equal(validarEntorno([], i, {}).ok, true);
  assert.equal(validarEntorno(['x', 'y'], i, { x: 'a' }).errores.length, 1);
  assert.equal(validarEntorno(['x'], i, { x: 'a', w: 'b' }).advertencias.length, 1);
});

/* ---------- Ejercicios de la lámina 7 ---------- */
test('Ejercicio 4 de la lámina 7', () => {
  const lg = { funciones: [{ nombre: 'm', aridad: 0 }, { nombre: 'f', aridad: 1 }],
    predicados: [{ nombre: 'S', aridad: 2 }, { nombre: 'B', aridad: 2 }] };
  const ok = ['S(m, x)', 'B(m, f(m))', 'B(x, y) → ∃z S(z, y)', 'S(x, y) → S(y, f(f(x)))'];
  const mal = [['f(m)', 'SINTAXIS'], ['B(B(m, x), y)', 'SINTAXIS'], ['S(B(m), z)', 'SINTAXIS'], ['B(x) → B(B(x))', 'SINTAXIS']];
  ok.forEach((t) => assert.equal(analizarFormula(t, lg).ok, true, t));
  mal.forEach(([t]) => assert.equal(analizarFormula(t, lg).ok, false, t));
});
