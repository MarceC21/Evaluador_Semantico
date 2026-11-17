import { analizarFormula, formatear } from './parser.js';
import { prepararEvaluacion, evaluarFormula} from './motor.js';
import { dibujarArbol } from './arbol.js';

const $ = id => document.getElementById(id);
const ejemplo = {
  lenguaje: {
    funciones: [{ nombre: 'f', aridad: 1 }, { nombre: 'c', aridad: 0 }],
    predicados: [{ nombre: 'P', aridad: 1 }, { nombre: 'R', aridad: 2 }],
  },
  interpretacion: {
    dominio: ['a', 'b', 'c'],
    funciones: {
      f: [{ args: ['a'], valor: 'b' }, { args: ['b'], valor: 'c' }, { args: ['c'], valor: 'a' }],
      c: [{ args: [], valor: 'a' }],
    },
    predicados: { P: [['a'], ['c']], R: [['a', 'b']] },
  },
  entorno: {},
};

function limpiarSalida() {
  $('estado').textContent = '';
  $('estado').className = '';
  $('lectura').textContent = '';
  $('variables').textContent = '';
  $('errores').replaceChildren();
  $('arbol').replaceChildren();
  $('json').textContent = '';
}

function leerJSON(id, nombre) {
  try {
    return JSON.parse($(id).value);
  } catch {
    throw new Error(`${nombre}: JSON inválido. Revisa comillas dobles, comas y llaves.`);
  }
}

function mostrar(resultado, completa) {
  $('json').textContent = JSON.stringify(resultado, null, 2);
  if (!resultado.ok) {
    $('estado').className = 'error';
    $('estado').textContent = `Entrada inválida${resultado.etapa ? `: ${resultado.etapa}` : ''}.`;
    for (const error of resultado.errores) {
      const item = document.createElement('li');
      const donde = error.posicion !== undefined ? `posición ${error.posicion}` : error.donde;
      item.textContent = `${error.codigo}${donde ? ` (${donde})` : ''}: ${error.mensaje}`;
      $('errores').append(item);
    }
    return;
  }
  $('estado').className = 'exito';
  $('estado').textContent = completa ? 'Fórmula, interpretación y entorno válidos. Evaluación semántica pendiente.' : 'Fórmula válida. Interpretación y entorno sin comprobar.';
  $('lectura').textContent = formatear(resultado.ast);
  $('variables').textContent = `Libres: ${resultado.libres.join(', ') || 'ninguna'} · Ligadas: ${resultado.ligadas.join(', ') || 'ninguna'}`;
  for (const aviso of resultado.advertencias ?? []) {
    const item = document.createElement('li');
    item.textContent = `Advertencia: ${aviso}`;
    $('errores').append(item);
  }
  dibujarArbol(resultado.ast, $('arbol'));
}

function analizar(completa) {
  limpiarSalida();
  try {
    const lenguaje = leerJSON('lenguaje', 'Lenguaje');
    const texto = $('formula').value;
    const resultado = completa
      ? prepararEvaluacion(texto, lenguaje, leerJSON('interpretacion', 'Interpretación'), leerJSON('entorno', 'Entorno'))
      : analizarFormula(texto, lenguaje);
    mostrar(resultado, completa);
  } catch (error) {
    // También se borra cualquier árbol anterior si una entrada excede la pila.
    limpiarSalida();
    $('estado').className = 'error';
    $('estado').textContent = error instanceof RangeError ? 'La entrada excede la complejidad que admite esta versión.' : error.message;
  }
}

function evaluarSemantica() {
  limpiarSalida();

  try {
    const lenguaje = leerJSON(
      'lenguaje',
      'Lenguaje'
    );

    const interpretacion = leerJSON(
      'interpretacion',
      'Interpretación'
    );

    const entorno = leerJSON(
      'entorno',
      'Entorno'
    );

    const texto = $('formula').value;

    const resultado = evaluarFormula(
      texto,
      lenguaje,
      interpretacion,
      entorno
    );

    mostrarEvaluacion(resultado);
  } catch (error) {
    limpiarSalida();

    $('estado').className = 'error';

    $('estado').textContent =
      error instanceof RangeError
        ? 'La entrada excede la complejidad que admite esta versión.'
        : error.message;
  }
}

function mostrarEvaluacion(resultado) {
  $('json').textContent =
    JSON.stringify(resultado, null, 2);

  if (!resultado.ok) {
    $('estado').className = 'error';

    $('estado').textContent =
      `Entrada inválida${
        resultado.etapa
          ? `: ${resultado.etapa}`
          : ''
      }.`;

    for (const error of resultado.errores) {
      const item =
        document.createElement('li');

      const donde =
        error.posicion !== undefined
          ? `posición ${error.posicion}`
          : error.donde;

      item.textContent =
        `${error.codigo}${
          donde ? ` (${donde})` : ''
        }: ${error.mensaje}`;

      $('errores').append(item);
    }

    return;
  }

  $('estado').className =
    resultado.valor
      ? 'exito'
      : 'error';

  $('estado').textContent =
    resultado.valor
      ? 'Verdadero ✓'
      : 'Falso ✕';

  $('lectura').textContent =
    formatear(resultado.ast);

  $('variables').textContent =
    `Libres: ${
      resultado.libres.join(', ') || 'ninguna'
    } · Ligadas: ${
      resultado.ligadas.join(', ') || 'ninguna'
    }`;

  dibujarArbol(
    resultado.ast,
    $('arbol')
  );
}

$('analizar').addEventListener('click', () => analizar(false));
$('validar').addEventListener('click', () => analizar(true));
$('evaluar').addEventListener('click', evaluarSemantica);
$('ejemplo').addEventListener('click', cargarEjemplo);
for (const boton of document.querySelectorAll('[data-simbolo]')) {
  boton.addEventListener('click', () => {
    const campo = $('formula');
    campo.setRangeText(boton.dataset.simbolo, campo.selectionStart, campo.selectionEnd, 'end');
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    campo.focus();
  });
}
// Evita presentar como vigentes los resultados correspondientes a otra entrada.
for (const id of ['formula', 'lenguaje', 'interpretacion', 'entorno']) {
  $(id).addEventListener('input', limpiarSalida);
}

function cargarEjemplo() {
  for (const id of ['lenguaje', 'interpretacion', 'entorno']) $(id).value = JSON.stringify(ejemplo[id], null, 2);
  $('formula').value = '∀x (P(x) → R(x, f(x)))';
  analizar(false);
}

cargarEjemplo();
