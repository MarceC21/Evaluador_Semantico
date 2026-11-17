/* validaciones.js: validar lenguaje, interpretación y entorno.

 * Regla del enunciado: una entrada incorrecta NUNCA recibe valor de verdad. */
import { ERR, PALABRAS_CLAVE } from './tipos.js';
import { crearError, fallo, esIdentificador, tieneProp, formatearLlamada } from './utils.js';

/*  Lenguaje  */
// Nombres no vacíos, sin duplicados, no reservados
// aridad entera
// (funciones >= 0, predicados >= 1).
function validarLenguaje(lenguaje) {
  if (!lenguaje || typeof lenguaje !== 'object' || Array.isArray(lenguaje)) {
    return fallo([crearError(ERR.SINTAXIS,
      'El lenguaje debe ser un objeto con las listas "funciones" y "predicados".', { donde: 'lenguaje' })]);
  }
  const errores = [];
  const vistos = new Set();

  const revisar = (lista, clave, minAridad, etiqueta) => {
    if (lista === undefined) return;
    if (!Array.isArray(lista)) {
      errores.push(crearError(ERR.SINTAXIS, `"${clave}" debe ser una lista.`, { donde: `lenguaje.${clave}` }));
      return;
    }
    lista.forEach((s, i) => {
      const donde = `lenguaje.${clave}[${i}]`;
      if (!s || typeof s !== 'object') {
        errores.push(crearError(ERR.SINTAXIS, `El ${etiqueta} #${i + 1} debe tener nombre y aridad.`, { donde }));
        return;
      }
      const { nombre, aridad } = s;
      if (typeof nombre !== 'string' || nombre.trim() === '') {
        errores.push(crearError(ERR.SINTAXIS, `El ${etiqueta} #${i + 1} no tiene nombre.`, { donde }));
      } else if (!esIdentificador(nombre)) {
        errores.push(crearError(ERR.SINTAXIS,
          `El nombre '${nombre}' no es válido: use solo letras, dígitos y guion bajo.`, { donde }));
      } else if (nombre.toLowerCase() in PALABRAS_CLAVE) {
        errores.push(crearError(ERR.NOMBRE_RESERVADO,
          `'${nombre}' es una palabra reservada (alias de un símbolo lógico) y no puede usarse como nombre.`, { donde }));
      } else if (vistos.has(nombre)) {
        errores.push(crearError(ERR.SINTAXIS,
          `El nombre '${nombre}' está repetido; no puede haber dos símbolos con el mismo nombre.`, { donde }));
      } else {
        vistos.add(nombre);
      }
      if (!Number.isInteger(aridad) || aridad < minAridad) {
        errores.push(crearError(ERR.SINTAXIS,
          `La aridad de '${nombre}' debe ser un entero >= ${minAridad}.`, { donde }));
      }
    });
  };

  revisar(lenguaje.funciones, 'funciones', 0, 'símbolo funcional');
  revisar(lenguaje.predicados, 'predicados', 1, 'predicado');
  return errores.length ? fallo(errores) : { ok: true };
}

/* Interpretación  */
function nombreAridad(n) {
  return n === 0 ? 'una constante' : n === 1 ? 'unaria' : n === 2 ? 'binaria' : n === 3 ? 'ternaria' : `de aridad ${n}`;
}

// Primeras `max` tuplas de D^aridad que no están en `vistos`
function faltantes(dom, aridad, vistos, max) {
  const res = [];
  const total = Math.pow(dom.length, aridad);
  for (let k = 0; k < total && res.length < max && k < 200000; k++) {
    const args = [];
    let r = k;
    for (let j = aridad - 1; j >= 0; j--) { args[j] = dom[r % dom.length]; r = Math.floor(r / dom.length); }
    if (!vistos.has(JSON.stringify(args))) res.push(args);
  }
  return res;
}

function validarInterpretacion(lenguaje, interpretacion) {
  const vl = validarLenguaje(lenguaje);
  if (!vl.ok) return vl;

  const errores = [];
  const advertencias = [];

  if (!interpretacion || typeof interpretacion !== 'object') {
    return fallo([crearError(ERR.DOMINIO_VACIO, 'No se ingresó una interpretación (falta el dominio).',
      { donde: 'interpretacion' })]);
  }

  // Dominio: finito, no vacío, sin repetidos
  const D = new Set();
  const dom = interpretacion.dominio;
  if (!Array.isArray(dom) || dom.length === 0) {
    errores.push(crearError(ERR.DOMINIO_VACIO, 'El dominio no puede ser vacío.', { donde: 'interpretacion.dominio' }));
  } else {
    dom.forEach((e, i) => {
      if (typeof e !== 'string' || e.trim() === '') {
        errores.push(crearError(ERR.DOMINIO_VACIO,
          `El elemento #${i + 1} del dominio está vacío o no es texto.`, { donde: 'interpretacion.dominio' }));
      } else if (D.has(e)) {
        errores.push(crearError(ERR.DOMINIO_VACIO,
          `El elemento '${e}' está repetido en el dominio.`, { donde: 'interpretacion.dominio' }));
      } else D.add(e);
    });
  }
  if (errores.length) return fallo(errores); // sin dominio válido no tiene sentido seguir
  const domLista = [...D];

  // Funciones: deben ser TOTALES (exactamente |D|^n entradas, valores dentro de D)
  const fs = interpretacion.funciones;
  for (const f of lenguaje.funciones || []) {
    const donde = `interpretacion.funciones.${f.nombre}`;
    const entradas = tieneProp(fs, f.nombre) ? fs[f.nombre] : undefined;
    if (!Array.isArray(entradas)) {
      errores.push(crearError(ERR.FUNCION_INCOMPLETA, `No se definió la interpretación de '${f.nombre}'.`, { donde }));
      continue;
    }
    const vistos = new Set();
    entradas.forEach((en, i) => {
      if (!en || !Array.isArray(en.args) || en.args.length !== f.aridad) {
        errores.push(crearError(ERR.FUNCION_INCOMPLETA,
          `La entrada #${i + 1} de '${f.nombre}' debe tener exactamente ${f.aridad} argumento(s).`, { donde }));
        return;
      }
      const mala = en.args.findIndex((a) => !D.has(a));
      if (mala !== -1) {
        errores.push(crearError(ERR.FUNCION_INCOMPLETA,
          `En '${formatearLlamada(f.nombre, en.args)}' el argumento '${en.args[mala]}' no pertenece al dominio.`, { donde }));
        return;
      }
      if (!D.has(en.valor)) {
        errores.push(crearError(ERR.FUNCION_INCOMPLETA,
          `${formatearLlamada(f.nombre, en.args)} = '${en.valor}', pero '${en.valor}' no pertenece al dominio.`, { donde }));
        return;
      }
      const clave = JSON.stringify(en.args);
      if (vistos.has(clave)) {
        errores.push(crearError(ERR.FUNCION_INCOMPLETA,
          `'${formatearLlamada(f.nombre, en.args)}' está definida más de una vez (una función da un solo valor).`, { donde }));
        return;
      }
      vistos.add(clave);
    });
    const total = Math.pow(domLista.length, f.aridad);
    if (vistos.size < total) {
      const faltan = faltantes(domLista, f.aridad, vistos, 3).map((a) => formatearLlamada(f.nombre, a));
      const mas = total - vistos.size > faltan.length ? ', ...' : '';
      errores.push(crearError(ERR.FUNCION_INCOMPLETA,
        f.aridad === 0
          ? `'${f.nombre}' es una constante y falta asignarle su valor.`
          : `${f.nombre} es ${nombreAridad(f.aridad)} y el dominio tiene ${domLista.length} elemento(s); falta ${faltan.join(', ')}${mas}.`,
        { donde }));
    }
  }

  // Predicados: relaciones NO vacías, tuplas de la longitud correcta y dentro de D
  const ps = interpretacion.predicados;
  for (const p of lenguaje.predicados || []) {
    const donde = `interpretacion.predicados.${p.nombre}`;
    const rel = tieneProp(ps, p.nombre) ? ps[p.nombre] : undefined;
    if (!Array.isArray(rel) || rel.length === 0) {
      errores.push(crearError(ERR.RELACION_VACIA,
        `La relación de '${p.nombre}' está vacía o no se definió; no se admiten relaciones vacías.`, { donde }));
      continue;
    }
    const vistas = new Set();
    rel.forEach((t, i) => {
      if (!Array.isArray(t) || t.length !== p.aridad) {
        errores.push(crearError(ERR.TUPLA_INVALIDA,
          `La tupla #${i + 1} de '${p.nombre}' debe tener exactamente ${p.aridad} elemento(s).`, { donde }));
        return;
      }
      const mala = t.findIndex((e) => !D.has(e));
      if (mala !== -1) {
        errores.push(crearError(ERR.TUPLA_INVALIDA,
          `La tupla (${t.join(', ')}) de '${p.nombre}' contiene '${t[mala]}', que no pertenece al dominio.`, { donde }));
        return;
      }
      const clave = JSON.stringify(t);
      if (vistas.has(clave)) {
        advertencias.push(`La tupla (${t.join(', ')}) de '${p.nombre}' está repetida; se cuenta una sola vez.`);
      }
      vistas.add(clave);
    });
  }

  // Símbolos definidos en la interpretación pero no declarados en el lenguaje: solo se avisa
  const declarados = new Set([...(lenguaje.funciones || []), ...(lenguaje.predicados || [])].map((s) => s.nombre));
  for (const bloque of [fs, ps]) {
    if (bloque && typeof bloque === 'object') {
      for (const k of Object.keys(bloque)) {
        if (!declarados.has(k)) advertencias.push(`La interpretación define '${k}', pero no está declarado en el lenguaje; se ignora.`);
      }
    }
  }

  return errores.length ? fallo(errores) : { ok: true, advertencias };
}

/* Entorno */
// Toda variable libre necesita un valor, y ese valor debe pertenecer a D
function validarEntorno(libres, interpretacion, entorno) {
  const errores = [];
  const advertencias = [];
  const D = new Set(interpretacion && Array.isArray(interpretacion.dominio) ? interpretacion.dominio : []);

  if (entorno !== undefined && entorno !== null && (typeof entorno !== 'object' || Array.isArray(entorno))) {
    return fallo([crearError(ERR.ENTORNO_INVALIDO, 'El entorno debe asignar un valor del dominio a cada variable libre.',
      { donde: 'entorno' })]);
  }
  const ent = entorno || {};
  const resultado = Object.create(null);

  for (const v of libres) {
    const val = tieneProp(ent, v) ? ent[v] : undefined;
    if (val === undefined || val === null || val === '') {
      errores.push(crearError(ERR.ENTORNO_FALTANTE,
        `La variable libre '${v}' no tiene valor en el entorno.`, { donde: `entorno.${v}` }));
    } else if (!D.has(val)) {
      errores.push(crearError(ERR.ENTORNO_INVALIDO,
        `El valor '${val}' asignado a '${v}' no pertenece al dominio.`, { donde: `entorno.${v}` }));
    } else {
      resultado[v] = val;
    }
  }
  for (const k of Object.keys(ent)) {
    if (!libres.includes(k)) advertencias.push(`La variable '${k}' del entorno no es libre en la fórmula; se ignora.`);
  }
  return errores.length ? fallo(errores) : { ok: true, entorno: resultado, advertencias };
}

export { validarLenguaje, validarInterpretacion, validarEntorno };
