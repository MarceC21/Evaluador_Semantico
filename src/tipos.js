/* tipos.js: constantes compartidas del contrato */


// Tipos de nodo del AST (contrato del equipo)
const NODO = Object.freeze({
  PRED: 'pred', IGUAL: 'igual', NO: 'no', Y: 'y', O: 'o', IMPLICA: 'implica',
  PARA_TODO: 'paraTodo', EXISTE: 'existe',
  VAR: 'var', FUNC: 'func', // términos (una constante es func con args:[])
});

// Códigos de error
const ERR = Object.freeze({
  SINTAXIS: 'SINTAXIS',
  SIMBOLO_DESCONOCIDO: 'SIMBOLO_DESCONOCIDO',
  ARIDAD: 'ARIDAD',
  DOMINIO_VACIO: 'DOMINIO_VACIO',
  TUPLA_INVALIDA: 'TUPLA_INVALIDA',
  FUNCION_INCOMPLETA: 'FUNCION_INCOMPLETA',
  RELACION_VACIA: 'RELACION_VACIA',
  ENTORNO_FALTANTE: 'ENTORNO_FALTANTE',
  ENTORNO_INVALIDO: 'ENTORNO_INVALIDO',
  NOMBRE_RESERVADO: 'NOMBRE_RESERVADO',
});

// Tipos de token
const TOKEN = Object.freeze({
  LPAREN: 'LPAREN', RPAREN: 'RPAREN', COMA: 'COMA', PUNTO: 'PUNTO',
  NO: 'NO', Y: 'Y', O: 'O', IMPLICA: 'IMPLICA', IGUAL: 'IGUAL',
  PARATODO: 'PARATODO', EXISTE: 'EXISTE', ID: 'ID', EOF: 'EOF',
  NODEF: 'NODEF', // conectivos que NO existen en el lenguaje (↔, ≠, ...)
});

// Alias en forma de palabra (equivalencias de símbolos)
// Se comparan en minúsculas y como palabra completa. Son palabras reservadas.
const PALABRAS_CLAVE = Object.freeze(Object.assign(Object.create(null), {
  and: TOKEN.Y, or: TOKEN.O, not: TOKEN.NO, no: TOKEN.NO, implies: TOKEN.IMPLICA,
  forall: TOKEN.PARATODO, paratodo: TOKEN.PARATODO, para_todo: TOKEN.PARATODO,
  exists: TOKEN.EXISTE, existe: TOKEN.EXISTE,
}));

export { NODO, ERR, TOKEN, PALABRAS_CLAVE };
