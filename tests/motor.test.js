import test from 'node:test';
import assert from 'node:assert/strict';
import { prepararEvaluacion, evaluar } from '../src/motor.js';

const lenguaje = {
  funciones: [
    { nombre: 'c', aridad: 0 },
    { nombre: 'f', aridad: 1 }
  ],
  predicados: [
    { nombre: 'P', aridad: 1 }
  ]
};

const interpretacion = {
  dominio: ['a', 'b'],
  funciones: {},
  predicados: {
    P: [['a']]
  }
};

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

  assert.equal(
    prepararEvaluacion(
      'P(x)',
      lenguaje,
      interpretacion,
      { x: 'a' }
    ).ok,
    true
  );
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
  assert.equal(r.entorno.__proto__, 'a');
  assert.equal(
    JSON.stringify(r.entorno),
    '{"__proto__":"a"}'
  );
});

test('Conserva advertencias de interpretación y entorno', () => {
  const modelo = {
    ...interpretacion,
    predicados: {
      P: [['a']],
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