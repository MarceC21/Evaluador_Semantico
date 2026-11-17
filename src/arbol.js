import { hijos, esCuantificador } from './utils.js';

// Se usa textContent para que los nombres ingresados nunca se interpreten como HTML.
export function dibujarArbol(ast, contenedor) {
  const documento = contenedor.ownerDocument;
  function dibujar(nodo) {
    const item = documento.createElement('li');
    const etiqueta = documento.createElement('span');
    const nombre = nodo.nombre ?? nodo.variable;
    let texto = `#${nodo.id} ${nodo.tipo}${nombre ? ` · ${nombre}` : ''}`;
    texto += ` · [${nodo.pos[0]}, ${nodo.pos[1]})`;
    if (nodo.tipo === 'var') texto += nodo.ligadaPor === null ? ' · libre' : ` · ligada por #${nodo.ligadaPor}`;
    if (esCuantificador(nodo)) texto += ` · alcance: ${nodo.alcance.map(id => `#${id}`).join(', ') || '∅'}`;
    etiqueta.textContent = texto;
    item.append(etiqueta);
    const descendientes = hijos(nodo);
    if (descendientes.length) {
      const lista = documento.createElement('ul');
      descendientes.forEach(hijo => lista.append(dibujar(hijo)));
      item.append(lista);
    }
    return item;
  }
  const lista = documento.createElement('ul');
  lista.append(dibujar(ast));
  contenedor.replaceChildren(lista);
}
