import test from 'node:test';
import assert from 'node:assert/strict';
import { prepararEvaluacion, evaluar, evaluarFormula } from '../src/motor.js';

const lenguaje = {
  funciones: [
    { nombre: 'c', aridad: 0 },
    { nombre: 'f', aridad: 1 }
  ],
  predicados: [
    { nombre: 'P', aridad: 1 },
    { nombre: 'R', aridad: 2 }
  ]
};

const interpretacion = {
  dominio: ['a', 'b'],

  funciones: {
    c: [
      {
        args: [],
        valor: 'a'
      }
    ],

    f: [
      {
        args: ['a'],
        valor: 'b'
      },
      {
        args: ['b'],
        valor: 'a'
      }
    ]
  },

  predicados: {
    P: [
      ['a']
    ],

    R: [
      ['a', 'b'],
      ['b', 'a']
    ]
  }
};


// --------------------------------------------------
// Preparación y validaciones
// --------------------------------------------------

test('Prepara una fórmula cerrada sin calcular un valor de verdad', () => {
  const r = prepararEvaluacion(
    '∀x P(x)',
    lenguaje,
    interpretacion,
    {}
  );

  assert.equal(r.ok, true);
  assert.deepEqual(r.libres, []);
  assert.equal(r.ast.cuerpo.args[0].ligadaPor, r.ast.id);
  assert.equal('valor' in r, false);
});


test('Una fórmula inválida detiene la preparación', () => {
  const r = prepararEvaluacion(
    'P(x) ∧',
    lenguaje,
    interpretacion,
    {}
  );

  assert.equal(r.ok, false);
  assert.equal(r.etapa, 'fórmula');
  assert.equal('ast' in r, false);
});


test('Una interpretación inválida no entrega un AST preparado', () => {
  const r = prepararEvaluacion(
    '∀x P(x)',
    lenguaje,
    {
      ...interpretacion,
      dominio: []
    },
    {}
  );

  assert.equal(r.ok, false);
  assert.equal(r.etapa, 'interpretación');
  assert.equal('ast' in r, false);
});


test('Una fórmula abierta exige entorno con valores dentro del dominio', () => {
  for (const [entorno, codigo] of [
    [{}, 'ENTORNO_FALTANTE'],
    [{ x: 'z' }, 'ENTORNO_INVALIDO']
  ]) {
    const r = prepararEvaluacion(
      'P(x)',
      lenguaje,
      interpretacion,
      entorno
    );

    assert.equal(r.ok, false);
    assert.equal(r.etapa, 'entorno');
    assert.equal(r.errores[0].codigo, codigo);
    assert.equal('ast' in r, false);
  }

  const valido = prepararEvaluacion(
    'P(x)',
    lenguaje,
    interpretacion,
    { x: 'a' }
  );

  assert.equal(valido.ok, true);
});


test('Conserva una asignación propia para __proto__', () => {
  const r = prepararEvaluacion(
    'P(__proto__)',
    lenguaje,
    interpretacion,
    JSON.parse('{"__proto__":"a"}')
  );

  assert.equal(r.ok, true);

  assert.equal(
    Object.hasOwn(r.entorno, '__proto__'),
    true
  );

  assert.equal(
    r.entorno.__proto__,
    'a'
  );

  assert.equal(
    JSON.stringify(r.entorno),
    '{"__proto__":"a"}'
  );
});


test('Conserva advertencias de interpretación y entorno', () => {
  const modelo = {
    ...interpretacion,

    predicados: {
      ...interpretacion.predicados,
      Extra: [['a']]
    }
  };

  const r = prepararEvaluacion(
    'P(x)',
    lenguaje,
    modelo,
    {
      x: 'a',
      y: 'a'
    }
  );

  assert.equal(r.ok, true);
  assert.equal(r.advertencias.length, 2);
});


// --------------------------------------------------
// Evaluación de predicados
// --------------------------------------------------

test('Evalúa un predicado verdadero', () => {
  const preparado = prepararEvaluacion(
    'P(x)',
    lenguaje,
    interpretacion,
    { x: 'a' }
  );

  assert.equal(preparado.ok, true);

  const resultado = evaluar(
    preparado.ast,
    interpretacion,
    preparado.entorno
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, true);
});


test('Evalúa un predicado falso', () => {
  const preparado = prepararEvaluacion(
    'P(x)',
    lenguaje,
    interpretacion,
    { x: 'b' }
  );

  assert.equal(preparado.ok, true);

  const resultado = evaluar(
    preparado.ast,
    interpretacion,
    preparado.entorno
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, false);
});


test('Evalúa un predicado con una función', () => {
  const preparado = prepararEvaluacion(
    'P(f(x))',
    lenguaje,
    interpretacion,
    { x: 'a' }
  );

  assert.equal(preparado.ok, true);

  const resultado = evaluar(
    preparado.ast,
    interpretacion,
    preparado.entorno
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, false);
});


test('Evalúa un predicado binario', () => {
  const preparado = prepararEvaluacion(
    'R(x, f(x))',
    lenguaje,
    interpretacion,
    { x: 'a' }
  );

  assert.equal(preparado.ok, true);

  const resultado = evaluar(
    preparado.ast,
    interpretacion,
    preparado.entorno
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, true);
});


// --------------------------------------------------
// Evaluación de igualdad
// --------------------------------------------------

test('Evalúa una igualdad verdadera', () => {
  const preparado = prepararEvaluacion(
    'f(x) = c',
    lenguaje,
    interpretacion,
    { x: 'b' }
  );

  assert.equal(preparado.ok, true);

  const resultado = evaluar(
    preparado.ast,
    interpretacion,
    preparado.entorno
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, true);
});


test('Evalúa una igualdad falsa', () => {
  const preparado = prepararEvaluacion(
    'f(x) = c',
    lenguaje,
    interpretacion,
    { x: 'a' }
  );

  assert.equal(preparado.ok, true);

  const resultado = evaluar(
    preparado.ast,
    interpretacion,
    preparado.entorno
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, false);
});

test('Evalúa una negación verdadera', () => {
  const preparado = prepararEvaluacion(
    '¬P(x)',
    lenguaje,
    interpretacion,
    { x: 'b' }
  );

  assert.equal(preparado.ok, true);

  const resultado = evaluar(
    preparado.ast,
    interpretacion,
    preparado.entorno
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, true);
});

test('Evalúa una negación falsa', () => {
  const preparado = prepararEvaluacion(
    '¬P(x)',
    lenguaje,
    interpretacion,
    { x: 'a' }
  );

  assert.equal(preparado.ok, true);

  const resultado = evaluar(
    preparado.ast,
    interpretacion,
    preparado.entorno
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, false);
});

// --------------------------------------------------
// Evaluación de conectivos
// --------------------------------------------------

test('Evalúa una conjunción verdadera', () => {
  const resultado = evaluarFormula(
    'P(x) ∧ R(x, f(x))',
    lenguaje,
    interpretacion,
    { x: 'a' }
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, true);
});


test('Evalúa una conjunción falsa', () => {
  const resultado = evaluarFormula(
    'P(x) ∧ P(f(x))',
    lenguaje,
    interpretacion,
    { x: 'a' }
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, false);
});


test('Evalúa una disyunción verdadera', () => {
  const resultado = evaluarFormula(
    'P(x) ∨ P(f(x))',
    lenguaje,
    interpretacion,
    { x: 'a' }
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, true);
});


test('Evalúa una implicación falsa', () => {
  const resultado = evaluarFormula(
    'P(x) → P(f(x))',
    lenguaje,
    interpretacion,
    { x: 'a' }
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, false);
});


test('Evalúa una implicación verdadera', () => {
  const resultado = evaluarFormula(
    'P(x) → P(f(x))',
    lenguaje,
    interpretacion,
    { x: 'b' }
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, true);
});


// --------------------------------------------------
// Evaluación de cuantificadores
// --------------------------------------------------

test('Universal falso guarda contraejemplo', () => {
  const resultado = evaluarFormula(
    '∀x P(x)',
    lenguaje,
    interpretacion,
    {}
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, false);

  const raiz =
    resultado.nodos[resultado.raiz];

  assert.equal(
    raiz.contraejemplo,
    'b'
  );

  assert.deepEqual(
    raiz.ramas,
    [
      {
        elemento: 'a',
        valor: true
      },
      {
        elemento: 'b',
        valor: false
      }
    ]
  );
});


test('Universal verdadero marca comprobación completa', () => {
  const resultado = evaluarFormula(
    '∀x R(x, f(x))',
    lenguaje,
    interpretacion,
    {}
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, true);

  const raiz =
    resultado.nodos[resultado.raiz];

  assert.equal(
    raiz.contraejemplo,
    null
  );

  assert.equal(
    raiz.comprobacion,
    'completa'
  );
});


test('Existencial verdadero guarda testigo', () => {
  const resultado = evaluarFormula(
    '∃x P(x)',
    lenguaje,
    interpretacion,
    {}
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, true);

  const raiz =
    resultado.nodos[resultado.raiz];

  assert.equal(
    raiz.testigo,
    'a'
  );
});


test('Existencial falso marca comprobación completa', () => {
  const resultado = evaluarFormula(
    '∃x (P(x) ∧ P(f(x)))',
    lenguaje,
    interpretacion,
    {}
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, false);

  const raiz =
    resultado.nodos[resultado.raiz];

  assert.equal(
    raiz.testigo,
    null
  );

  assert.equal(
    raiz.comprobacion,
    'completa'
  );

  assert.deepEqual(
    raiz.ramas,
    [
      {
        elemento: 'a',
        valor: false
      },
      {
        elemento: 'b',
        valor: false
      }
    ]
  );
});


// --------------------------------------------------
// Cuantificadores anidados
// --------------------------------------------------

test('Respeta cuantificadores anidados', () => {
  const resultado = evaluarFormula(
    '∀x ∃x P(x)',
    lenguaje,
    interpretacion,
    {}
  );

  assert.equal(resultado.ok, true);
  assert.equal(resultado.valor, true);
});


// --------------------------------------------------
// Contrato final del motor
// --------------------------------------------------

test('Devuelve el contrato completo del motor', () => {
  const resultado = evaluarFormula(
    'P(x) → P(f(x))',
    lenguaje,
    interpretacion,
    { x: 'a' }
  );

  assert.equal(resultado.ok, true);

  assert.equal(
    resultado.valor,
    false
  );

  assert.equal(
    resultado.raiz,
    resultado.ast.id
  );

  assert.equal(
    Array.isArray(resultado.orden),
    true
  );

  assert.equal(
    resultado.orden.at(-1),
    resultado.raiz
  );

  assert.ok(
    resultado.nodos[resultado.raiz]
  );

  assert.equal(
    typeof resultado.nodos[
      resultado.raiz
    ].razon,
    'string'
  );
});

test('Una entrada inválida nunca recibe valor de verdad', () => {
  const resultado = evaluarFormula(
    'P(x) ∧',
    lenguaje,
    interpretacion,
    {}
  );

  assert.equal(
    resultado.ok,
    false
  );

  assert.equal(
    'valor' in resultado,
    false
  );

  assert.equal(
    'ast' in resultado,
    false
  );
});