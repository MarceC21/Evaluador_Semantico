import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { analizarFormula } from '../src/parser.js';
import { evaluar } from '../src/motor.js';

const window = {};
runInNewContext(readFileSync(new URL('../interfaz/js/arbol.js', import.meta.url), 'utf8'), { window });
const arbol = window.LN.arbol;
const lenguaje = {
  funciones: [{ nombre: 'f', aridad: 1 }, { nombre: 'c', aridad: 0 }],
  predicados: [{ nombre: 'R', aridad: 2 }, { nombre: 'S', aridad: 2 }, { nombre: 'P', aridad: 1 }]
};

function analizar(texto) {
  const resultado = analizarFormula(texto, lenguaje);
  assert.equal(resultado.ok, true, JSON.stringify(resultado));
  return resultado.ast;
}

test('el árbol descompone predicados y funciones hasta las variables sin duplicarlas', () => {
  const ast = analizar('R(x,y)→∃z(S(f(x),y))');
  const layout = arbol.calcularLayout(ast);
  const s = ast.der.cuerpo;
  const f = s.args[0];
  assert.equal(layout.info[s.id].texto, 'S');
  assert.deepEqual(Array.from(layout.info[s.id].hijosIds), [f.id, s.args[1].id]);
  assert.equal(layout.info[f.id].texto, 'f');
  assert.deepEqual(Array.from(layout.info[f.id].hijosIds), [f.args[0].id]);
  assert.deepEqual(Array.from(layout.hojasOrden, id => layout.info[id].texto), ['x', 'y', 'x', 'y']);
  assert.equal(Object.keys(layout.info).length, 9);
  assert.equal(layout.aristas.length, 8);
  assert.equal(layout.info[f.args[0].id].nivel, layout.info[f.id].nivel + 1);
  assert.ok(Array.from(layout.hojasOrden).every(id => layout.info[id].nodo.tipo === 'var'));
});

test('igualdad, funciones anidadas y constantes conservan su estructura', () => {
  const ast = analizar('f(f(x))=c ∧ P(y)');
  const layout = arbol.calcularLayout(ast);
  assert.equal(layout.info[ast.izq.id].texto, '=');
  assert.deepEqual(Array.from(layout.hojasOrden, id => layout.info[id].texto), ['x', 'c', 'y']);
  assert.equal(layout.info[ast.izq.izq.args[0].id].texto, 'f');
  assert.equal(layout.info[ast.izq.izq.args[0].args[0].id].texto, 'x');
});

test('las variables libres respetan los alcances y se consultan también en términos', () => {
  const ast = analizar('R(x,y) ∧ ∃x(S(f(x),y))');
  assert.deepEqual(Array.from(arbol.freeVars(ast)), ['x', 'y']);
  assert.deepEqual(Array.from(arbol.freeVars(ast.der)), ['y']);
  assert.deepEqual(Array.from(arbol.freeVars(ast.der.cuerpo.args[0])), ['x']);
  assert.deepEqual(Array.from(arbol.freeVars(analizar('f(x)=y'))), ['x', 'y']);
});

test('los ids de las fórmulas evaluadas siguen correspondiendo al árbol ampliado', () => {
  const ast = analizar('R(x,y)→∃z(S(f(x),y))');
  const layout = arbol.calcularLayout(ast);
  const resultado = evaluar(ast, {
    dominio: ['a'],
    funciones: { f: [{ args: ['a'], valor: 'a' }], c: [{ args: [], valor: 'a' }] },
    predicados: { R: [['a', 'a']], S: [['a', 'a']], P: [] }
  }, { x: 'a', y: 'a' });
  assert.equal(resultado.valor, true);
  assert.equal(resultado.raiz, ast.id);
  for (const id of resultado.orden) {
    assert.ok(layout.info[id]);
    assert.ok(!['func', 'var'].includes(layout.info[id].nodo.tipo));
  }
});
