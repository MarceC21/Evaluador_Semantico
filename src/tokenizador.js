/* tokenizador.js: convierte el texto en tokens, aceptando alias de teclado.
 * Cada token guarda su posición en el texto ORIGINAL (para los errores). */
import { TOKEN as T, ERR, PALABRAS_CLAVE } from './tipos.js';
import { crearError, fallo } from './utils.js';

// Símbolos (se prueba primero el más largo: '-->' antes que '->', '||' antes que '|').
const SIMBOLOS = [
  // conectivos que NO existen en el lenguaje: se rechazan con mensaje claro
  ['<=>', T.NODEF], ['<->', T.NODEF], ['↔', T.NODEF], ['⇔', T.NODEF], ['≠', T.NODEF], ['!=', T.NODEF],
  // →
  ['-->', T.IMPLICA], ['->', T.IMPLICA], ['=>', T.IMPLICA], ['→', T.IMPLICA], ['⇒', T.IMPLICA],
  // ∧
  ['&&', T.Y], ['&', T.Y], ['/\\', T.Y], ['^', T.Y], ['∧', T.Y],
  // ∨
  ['||', T.O], ['|', T.O], ['\\/', T.O], ['∨', T.O],
  // ¬
  ['¬', T.NO], ['~', T.NO], ['!', T.NO],
  // cuantificadores
  ['∀', T.PARATODO], ['∃', T.EXISTE],
  // igualdad
  ['==', T.IGUAL], ['=', T.IGUAL],
  // puntuación (el '.' o ':' después de ∀x es opcional)
  ['(', T.LPAREN], [')', T.RPAREN], [',', T.COMA], ['.', T.PUNTO], [':', T.PUNTO],
].sort((a, b) => b[0].length - a[0].length);

// Comandos 
const BARRA = Object.assign(Object.create(null), {
  neg: T.NO, lnot: T.NO,
  wedge: T.Y, land: T.Y,
  vee: T.O, lor: T.O,
  to: T.IMPLICA, rightarrow: T.IMPLICA, implies: T.IMPLICA,
  forall: T.PARATODO, exists: T.EXISTE,
  iff: T.NODEF, leftrightarrow: T.NODEF, neq: T.NODEF, ne: T.NODEF,
});

// NFKC carácter por carácter (ej. '＝' -> '='), sin cambiar la longitud del texto,
// para que las posiciones sigan apuntando al texto original.
function normalizarCaracter(ch) {
  const n = ch.normalize('NFKC');
  return n.length === 1 ? n : ch;
}

function coincide(c, i, txt) {
  for (let k = 0; k < txt.length; k++) if (c[i + k] !== txt[k]) return false;
  return true;
}

function errorNoDefinido(txt, pos) {
  return fallo([crearError(ERR.SINTAXIS,
    `El conectivo '${txt}' no está definido en este lenguaje (solo existen ¬, ∧, ∨, →, ∀, ∃ y =).`,
    { posicion: pos })]);
}

function tokenizar(texto) {
  const c = [];
  for (let i = 0; i < texto.length; i++) c.push(normalizarCaracter(texto[i]));
  const n = c.length;
  const tokens = [];
  let i = 0;

  while (i < n) {
    const ch = c[i];
    if (/\s/.test(ch)) { i++; continue; }

    // 1. símbolos
    let hallado = null;
    for (const par of SIMBOLOS) {
      if (par[0].length <= n - i && coincide(c, i, par[0])) { hallado = par; break; }
    }
    if (hallado) {
      const [txt, tipo] = hallado;
      if (tipo === T.NODEF) return errorNoDefinido(txt, i);
      tokens.push({ tipo, texto: texto.slice(i, i + txt.length), inicio: i, fin: i + txt.length });
      i += txt.length;
      continue;
    }

    // 2. comandos con barra invertida
    if (ch === '\\') {
      let j = i + 1;
      while (j < n && /[A-Za-z]/.test(c[j])) j++;
      const palabra = c.slice(i + 1, j).join('').toLowerCase();
      if (j > i + 1 && palabra in BARRA) {
        const tipo = BARRA[palabra];
        if (tipo === T.NODEF) return errorNoDefinido(texto.slice(i, j), i);
        tokens.push({ tipo, texto: texto.slice(i, j), inicio: i, fin: j });
        i = j;
        continue;
      }
      return fallo([crearError(ERR.SINTAXIS,
        `Comando desconocido '${texto.slice(i, Math.max(j, i + 1))}'.`, { posicion: i })]);
    }

    // 3. identificadores y palabras clave (palabra completa: 'notable' no se parte en 'not'+'able')
    if (/[\p{L}\p{N}_]/u.test(ch)) {
      let j = i;
      while (j < n && /[\p{L}\p{N}_]/u.test(c[j])) j++;
      const palabra = c.slice(i, j).join('');
      const clave = palabra.toLowerCase();
      if (clave in PALABRAS_CLAVE) {
        tokens.push({ tipo: PALABRAS_CLAVE[clave], texto: texto.slice(i, j), inicio: i, fin: j });
      } else {
        tokens.push({ tipo: T.ID, texto: palabra, inicio: i, fin: j });
      }
      i = j;
      continue;
    }

    return fallo([crearError(ERR.SINTAXIS,
      `Carácter no reconocido '${texto[i]}'.`, { posicion: i })]);
  }

  tokens.push({ tipo: T.EOF, texto: '', inicio: n, fin: n });
  return { ok: true, tokens };
}

export { tokenizar };
