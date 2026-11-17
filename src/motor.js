import { analizarFormula } from './parser.js';
import { validarInterpretacion, validarEntorno } from './validaciones.js';


export function prepararEvaluacion(
  texto,
  lenguaje,
  interpretacion,
  entorno
) {
  const formula = analizarFormula(texto, lenguaje);

  if (!formula.ok) {
    return {
      ...formula,
      etapa: 'fórmula'
    };
  }

  const modelo = validarInterpretacion(
    lenguaje,
    interpretacion
  );

  if (!modelo.ok) {
    return {
      ...modelo,
      etapa: 'interpretación'
    };
  }

  const asignacion = validarEntorno(
    formula.libres,
    interpretacion,
    entorno
  );

  if (!asignacion.ok) {
    return {
      ...asignacion,
      etapa: 'entorno'
    };
  }

  return {
    ...formula,
    entorno: asignacion.entorno,
    advertencias: [
      ...modelo.advertencias,
      ...asignacion.advertencias
    ]
  };
}

function copiarEntorno(entorno) {
  return Object.assign(
    Object.create(null),
    entorno || {}
  );
}

function evaluarTermino(
  termino,
  interpretacion,
  entorno
) {
  if (termino.tipo === 'var') {
    return entorno[termino.nombre];
  }

  if (termino.tipo === 'func') {
    const tabla =
      interpretacion.funciones[termino.nombre];

    const argumentos = termino.args.map(
      (arg) =>
        evaluarTermino(
          arg,
          interpretacion,
          entorno
        )
    );

    const fila = tabla.find(
      (entrada) =>
        entrada.args.length === argumentos.length &&
        entrada.args.every(
          (valor, indice) =>
            valor === argumentos[indice]
        )
    );

    return fila.valor;
  }

  throw new Error(
    `Tipo de término no soportado: ${termino.tipo}`
  );
}


function evaluarPredicado(
  nodo,
  interpretacion,
  entorno
) {
  const relacion =
    interpretacion.predicados[nodo.nombre];

  const argumentos = nodo.args.map(
    (arg) =>
      evaluarTermino(
        arg,
        interpretacion,
        entorno
      )
  );

  return relacion.some(
    (tupla) =>
      tupla.length === argumentos.length &&
      tupla.every(
        (valor, indice) =>
          valor === argumentos[indice]
      )
  );
}

function evaluarIgualdad(
  nodo,
  interpretacion,
  entorno
) {
  const izquierda = evaluarTermino(
    nodo.izq,
    interpretacion,
    entorno
  );

  const derecha = evaluarTermino(
    nodo.der,
    interpretacion,
    entorno
  );

  return izquierda === derecha;
}

function registrarNodo(
  contexto,
  nodo,
  datos
) {
  contexto.nodos[nodo.id] = {
    valor: datos.valor,
    razon: datos.razon,

    entorno: copiarEntorno(
      datos.entorno
    ),

    ramas: datos.ramas ?? [],

    testigo:
      datos.testigo ?? null,

    contraejemplo:
      datos.contraejemplo ?? null,

    comprobacion:
      datos.comprobacion ?? null
  };

  // El nodo se agrega al orden solamente una vez.
  // Como registrarNodo se llama después de evaluar
  // a sus hijos, el orden queda de hojas a raíz.
  if (!contexto.vistos.has(nodo.id)) {
    contexto.vistos.add(nodo.id);
    contexto.orden.push(nodo.id);
  }

  return datos.valor;
}

// Evaluación recursiva del AST
function evaluarNodo(
  nodo,
  interpretacion,
  entorno,
  contexto
) {

  // Predicado
  if (nodo.tipo === 'pred') {
    const argumentos = nodo.args.map(
      (arg) =>
        evaluarTermino(
          arg,
          interpretacion,
          entorno
        )
    );

    const valor = evaluarPredicado(
      nodo,
      interpretacion,
      entorno
    );

    const razon = valor
      ? `${nodo.nombre}(${argumentos.join(', ')}) pertenece a la relación interpretada.`
      : `${nodo.nombre}(${argumentos.join(', ')}) no pertenece a la relación interpretada.`;

    return registrarNodo(
      contexto,
      nodo,
      {
        valor,
        razon,
        entorno
      }
    );
  }

  // Igualdad
  if (nodo.tipo === 'igual') {
    const izquierda = evaluarTermino(
      nodo.izq,
      interpretacion,
      entorno
    );

    const derecha = evaluarTermino(
      nodo.der,
      interpretacion,
      entorno
    );

    const valor = evaluarIgualdad(
      nodo,
      interpretacion,
      entorno
    );

    const razon = valor
      ? `Ambos términos representan '${izquierda}'.`
      : `Los términos representan elementos distintos: '${izquierda}' y '${derecha}'.`;

    return registrarNodo(
      contexto,
      nodo,
      {
        valor,
        razon,
        entorno
      }
    );
  }

  // Negación
  if (nodo.tipo === 'no') {
    const valorHijo = evaluarNodo(
      nodo.hijo,
      interpretacion,
      entorno,
      contexto
    );

    const valor = !valorHijo;

    const razon = valor
      ? 'La fórmula negada es falsa, por eso la negación es verdadera.'
      : 'La fórmula negada es verdadera, por eso la negación es falsa.';

    return registrarNodo(
      contexto,
      nodo,
      {
        valor,
        razon,
        entorno
      }
    );
  }

  // Conjunción
  if (nodo.tipo === 'y') {
    const izquierda = evaluarNodo(
      nodo.izq,
      interpretacion,
      entorno,
      contexto
    );

    const derecha = evaluarNodo(
      nodo.der,
      interpretacion,
      entorno,
      contexto
    );

    const valor =
      izquierda && derecha;

    const razon = valor
      ? 'Ambas partes de la conjunción son verdaderas.'
      : 'La conjunción es falsa porque al menos una de sus partes es falsa.';

    return registrarNodo(
      contexto,
      nodo,
      {
        valor,
        razon,
        entorno
      }
    );
  }

  // Disyunción
  if (nodo.tipo === 'o') {
    const izquierda = evaluarNodo(
      nodo.izq,
      interpretacion,
      entorno,
      contexto
    );

    const derecha = evaluarNodo(
      nodo.der,
      interpretacion,
      entorno,
      contexto
    );

    const valor =
      izquierda || derecha;

    const razon = valor
      ? 'La disyunción es verdadera porque al menos una de sus partes es verdadera.'
      : 'La disyunción es falsa porque sus dos partes son falsas.';

    return registrarNodo(
      contexto,
      nodo,
      {
        valor,
        razon,
        entorno
      }
    );
  }


  // Implicación
  if (nodo.tipo === 'implica') {
    const antecedente = evaluarNodo(
      nodo.izq,
      interpretacion,
      entorno,
      contexto
    );

    const consecuente = evaluarNodo(
      nodo.der,
      interpretacion,
      entorno,
      contexto
    );

    // A → B solo es falsa cuando
    // A es verdadera y B es falsa.
    const valor =
      !antecedente || consecuente;

    const razon = valor
      ? 'La implicación es verdadera: no ocurre el caso antecedente verdadero y consecuente falso.'
      : 'La implicación es falsa porque el antecedente es verdadero y el consecuente es falso.';

    return registrarNodo(
      contexto,
      nodo,
      {
        valor,
        razon,
        entorno
      }
    );
  }

  // Cuantificador universal
  if (nodo.tipo === 'paraTodo') {
    const ramas = [];

    let contraejemplo = null;

    for (
      const elemento
      of interpretacion.dominio
    ) {
      const entornoRama =
        copiarEntorno(entorno);

      entornoRama[nodo.variable] =
        elemento;

      const valorRama =
        evaluarNodo(
          nodo.cuerpo,
          interpretacion,
          entornoRama,
          contexto
        );

      ramas.push({
        elemento,
        valor: valorRama
      });

      if (
        !valorRama &&
        contraejemplo === null
      ) {
        contraejemplo = elemento;
      }
    }

    const valor = ramas.every(
      (rama) => rama.valor
    );

    const razon = valor
      ? 'La fórmula se cumple para todos los elementos del dominio.'
      : `La fórmula universal falla para '${contraejemplo}', que es un contraejemplo.`;

    return registrarNodo(
      contexto,
      nodo,
      {
        valor,
        razon,
        entorno,

        ramas,

        testigo: null,

        contraejemplo,

        comprobacion:
          valor
            ? 'completa'
            : null
      }
    );
  }

  // Cuantificador existencial
  if (nodo.tipo === 'existe') {
    const ramas = [];

    let testigo = null;

    for (
      const elemento
      of interpretacion.dominio
    ) {
      const entornoRama =
        copiarEntorno(entorno);

      entornoRama[nodo.variable] =
        elemento;

      const valorRama =
        evaluarNodo(
          nodo.cuerpo,
          interpretacion,
          entornoRama,
          contexto
        );

      ramas.push({
        elemento,
        valor: valorRama
      });

      if (
        valorRama &&
        testigo === null
      ) {
        testigo = elemento;
      }
    }

    const valor = ramas.some(
      (rama) => rama.valor
    );

    const razon = valor
      ? `La fórmula existencial es verdadera; '${testigo}' es un testigo.`
      : 'Se comprobó todo el dominio y ningún elemento satisface la fórmula.';

    return registrarNodo(
      contexto,
      nodo,
      {
        valor,
        razon,
        entorno,

        ramas,

        testigo,

        contraejemplo: null,

        comprobacion:
          valor
            ? null
            : 'completa'
      }
    );
  }

  throw new Error(
    `Tipo de nodo no soportado: ${nodo.tipo}`
  );
}

// Evaluación pública del AST
export function evaluar(
  ast,
  interpretacion,
  entorno = {}
) {
  const contexto = {
    nodos: Object.create(null),

    orden: [],

    vistos: new Set()
  };

  const valor = evaluarNodo(
    ast,
    interpretacion,
    copiarEntorno(entorno),
    contexto
  );

  return {
    ok: true,

    valor,

    raiz: ast.id,

    orden: contexto.orden,

    nodos: contexto.nodos
  };
}

export function evaluarFormula(
  texto,
  lenguaje,
  interpretacion,
  entorno = {}
) {
  const preparado = prepararEvaluacion(
    texto,
    lenguaje,
    interpretacion,
    entorno
  );

  // Si parser, interpretación o entorno fallan,
  // no existe valor de verdad.
  if (!preparado.ok) {
    return preparado;
  }

  const resultado = evaluar(
    preparado.ast,
    interpretacion,
    preparado.entorno
  );

  return {
    ...preparado,
    ...resultado
  };
}