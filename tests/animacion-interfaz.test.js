import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { analizarFormula } from '../src/parser.js';
import { evaluar } from '../src/motor.js';

function preparar(texto = 'R(x,y)→∃z(S(f(x),y))', menosMovimiento = false) {
  const lenguaje = {
    funciones: [{ nombre: 'f', aridad: 1 }, { nombre: 'c', aridad: 0 }],
    predicados: [{ nombre: 'R', aridad: 2 }, { nombre: 'S', aridad: 2 }]
  };
  const analisis = analizarFormula(texto, lenguaje);
  assert.equal(analisis.ok, true);
  const resultado = evaluar(analisis.ast, {
    dominio: ['a', 'b'],
    funciones: {
      f: [{ args: ['a'], valor: 'b' }, { args: ['b'], valor: 'a' }],
      c: [{ args: [], valor: 'a' }]
    },
    predicados: { R: [['a', 'a']], S: [] }
  }, { x: 'a', y: 'a' });
  const window = { matchMedia: () => ({ matches: menosMovimiento }) };
  const pendientes = new Map();
  let siguienteId = 0;
  const contexto = {
    window,
    setTimeout: fn => { pendientes.set(++siguienteId, fn); return siguienteId; },
    clearTimeout: id => pendientes.delete(id)
  };
  for (const archivo of ['arbol', 'animacion']) {
    runInNewContext(readFileSync(new URL(`../interfaz/js/${archivo}.js`, import.meta.url), 'utf8'), contexto);
  }
  const layout = window.LN.arbol.calcularLayout(analisis.ast);
  const colores = new Map();
  const visitados = [];
  let estrella = false;
  const handle = {
    layout,
    pintarNodo: (id, valor) => {
      assert.ok(!['var', 'func'].includes(layout.info[id].nodo.tipo));
      colores.set(id, valor);
    },
    pintarTermino: (id, encendido) => {
      assert.ok(['var', 'func'].includes(layout.info[id].nodo.tipo));
      colores.set(id, encendido ? 'término' : null);
    },
    resaltar: id => visitados.push(id),
    quitarResaltados() {},
    encenderEstrella: () => { estrella = true; },
    apagarEstrella: () => { estrella = false; }
  };
  const copiaResultado = JSON.stringify(resultado);
  const animacion = window.LN.animacion.crear(handle, resultado);
  function comprobarCompleto() {
    assert.equal(colores.size, Object.keys(layout.info).length);
    assert.ok([...colores.values()].every(valor => valor !== null));
    assert.equal(estrella, true);
    assert.equal(JSON.stringify(resultado), copiaResultado);
    for (const id of resultado.orden) assert.equal(colores.get(id), resultado.nodos[id].valor);
  }
  return {
    animacion, layout, colores, visitados, pendientes, comprobarCompleto,
    ejecutarTemporizadores() {
      for (const [id, fn] of pendientes) { pendientes.delete(id); fn(); }
    }
  };
}

test('paso a paso ilumina todos los nodos una vez, con hijos antes que padres', () => {
  const p = preparar();
  const cantidad = Object.keys(p.layout.info).length;
  for (let i = 0; i < cantidad; i++) p.animacion.siguiente();
  p.comprobarCompleto();
  assert.equal(p.visitados.length, cantidad);
  assert.equal(new Set(p.visitados).size, cantidad);
  for (const { de, a } of p.layout.aristas) {
    assert.ok(p.visitados.indexOf(a) < p.visitados.indexOf(de));
  }
  for (let i = 0; i < cantidad; i++) p.animacion.anterior();
  assert.equal(p.animacion.estaAlInicio(), true);
  assert.ok([...p.colores.values()].every(valor => valor === null));
});

test('ver todo y repetir abarcan todo el árbol y permiten cancelar los temporizadores', () => {
  const p = preparar('f(f(x))=c');
  p.animacion.verTodo();
  assert.equal(p.pendientes.size, Object.keys(p.layout.info).length);
  p.ejecutarTemporizadores();
  p.comprobarCompleto();
  p.animacion.repetir();
  assert.ok([...p.colores.values()].every(valor => valor === null));
  p.ejecutarTemporizadores();
  p.comprobarCompleto();
  p.animacion.repetir();
  p.animacion.destruir();
  assert.equal(p.pendientes.size, 0);
});

test('con movimiento reducido todos los nodos se iluminan sin temporizadores', () => {
  const p = preparar('∀x(R(x,c))', true);
  p.animacion.verTodo();
  p.comprobarCompleto();
  assert.equal(p.pendientes.size, 0);
});
