# Contrato de datos (aprobado por el equipo)

Es el formato que todas respetamos para trabajar en paralelo. Si alguien necesita cambiarlo, avisa al grupo antes.

Símbolos permitidos: solo **¬ ∧ ∨ → ∀ ∃** y paréntesis. No hay ⊥, ⊤, ↔ ni igualdad por ahora. Las **constantes** son símbolos funcionales de aridad 0.

## Funciones y quién las entrega
| Función | Entrega |
|---|---|
| `LN.api.analizarFormula(texto, lenguaje)` | Integrante 1 |
| `LN.api.validarInterpretacion(lenguaje, interpretacion)` | Integrante 1 |
| `LN.api.validarEntorno(libres, interpretacion, entorno)` | Integrante 1 |
| `LN.api.evaluar(ast, interpretacion, entorno)` | Integrante 2 |

La interfaz las llama en este orden: `validarInterpretacion`, `analizarFormula`, `validarEntorno` y `evaluar`. Si alguna devuelve `ok:false`, se detiene y se muestran los errores.

La interfaz normaliza los atajos de teclado (`~`, `&`, `|`, `->`) a los símbolos ¬ ∧ ∨ → **antes** de enviar el texto. Por eso `posicion` es el índice (desde 0) del carácter dentro del texto ya normalizado.

## Entradas (las arma la interfaz)
```js
lenguaje = {
  funciones:  [{ nombre: "k", aridad: 0 }, { nombre: "f", aridad: 1 }],
  predicados: [{ nombre: "P", aridad: 1 }, { nombre: "Q", aridad: 1 }, { nombre: "R", aridad: 1 }]
}

interpretacion = {
  dominio: ["a", "b", "c"],
  funciones: {
    k: [{ args: [], valor: "a" }],
    f: [{ args: ["a"], valor: "b" }, { args: ["b"], valor: "c" }, { args: ["c"], valor: "a" }]
  },
  predicados: { P: [["a"], ["b"]], Q: [["a"]], R: [["b"]] }
}

entorno = { x: "a" }   // una entrada por variable libre
```

## Salida del parser
```js
{
  ok: true,
  libres: [],                       // variables libres de toda la fórmula
  ast: {
    id: 1, tipo: "paraTodo", variable: "x",
    cuerpo: {
      id: 2, tipo: "implica",
      izq: { id: 3, tipo: "pred", nombre: "P", args: [{ tipo: "var", nombre: "x" }] },
      der: {
        id: 4, tipo: "o",
        izq: { id: 5, tipo: "pred", nombre: "Q", args: [{ tipo: "var", nombre: "x" }] },
        der: { id: 6, tipo: "pred", nombre: "R", args: [{ tipo: "var", nombre: "x" }] }
      }
    }
  }
}
```
- Tipos de nodo de fórmula: `pred {nombre, args}`, `no {hijo}`, `y | o | implica {izq, der}` y `paraTodo | existe {variable, cuerpo}`.
- Términos (dentro de `args`): `var {nombre}` y `func {nombre, args}`.
- Cada nodo de fórmula tiene un `id` único.

## Errores (cualquier validación)
```js
{ ok: false, errores: [{ codigo: "ARIDAD", mensaje: "P necesita 1 argumento y recibió 2", posicion: 5 }] }
```
Códigos: `SINTAXIS`, `SIMBOLO_DESCONOCIDO`, `ARIDAD`, `DOMINIO_VACIO`, `TUPLA_INVALIDA`, `FUNCION_INCOMPLETA`, `RELACION_VACIA`, `ENTORNO_FALTANTE`, `ENTORNO_INVALIDO`.
`posicion` es opcional (solo aplica a errores de la fórmula). Si hay errores, **no se evalúa y no se muestra valor de verdad.**

## Salida del motor
```js
{
  ok: true,
  valor: true,
  raiz: 1,
  orden: [3, 5, 6, 4, 2, 1],        // hojas → raíz; sirve para la animación paso a paso
  nodos: {
    1: { valor: true, razon: "Se cumple para todo x del dominio: a, b y c.",
         entorno: {}, ramas: [{ elemento: "a", valor: true }, { elemento: "b", valor: true }, { elemento: "c", valor: true }],
         testigo: null, contraejemplo: null, comprobacion: "completa" },
    3: { valor: true, razon: "P(a) es verdadero porque (a) está en la relación P.",
         entorno: { x: "a" }, ramas: null, testigo: null, contraejemplo: null, comprobacion: null }
    // ...un objeto por cada id de nodo, siempre con los mismos 7 campos (los que no aplican van en null)
  }
}
```
- `∃` verdadero llena `testigo` (el elemento del dominio que lo cumple).
- `∀` falso llena `contraejemplo` (el elemento que lo rompe).
- `∀` verdadero o `∃` falso marca `comprobacion: "completa"` (se revisaron todos los elementos).
- `razon` va en español simple y la genera el motor.

---

## Aclaraciones pendientes de confirmar con el equipo
Estas cosas el contrato original no decía. Las dejo como **propuesta** para no bloquear mi trabajo. Hasta que el grupo responda, la interfaz asume lo de cada punto.

1. **Qué valor tiene un nodo dentro de un cuantificador.** Un nodo del cuerpo de `∀x` se evalúa una vez por cada elemento, pero `nodos[id]` guarda un solo valor. Propuesta: `nodos[id]` refleja el **elemento decisivo** (el contraejemplo en un ∀ falso, el testigo en un ∃ verdadero) y, si no hay ninguno, el **primer elemento del dominio**; su `entorno` dice cuál fue. Opcional y deseable: `ramas[i].nodos = { id: valor }` con el valor de cada subnodo por elemento, para poder mostrar el árbol con cualquier elemento.
2. **Precedencia y alcance** (para el parser). Propuesta estilo Huth & Ryan: `¬`, `∀` y `∃` ligan más fuerte; luego `∧`; luego `∨`; `→` asocia a la derecha. Entonces `∀x P(x) → Q(x)` se lee como `(∀x P(x)) → Q(x)`. Se recomienda mostrar la fórmula con paréntesis explícitos cuando haya duda.
3. **Cómo se distingue variable de constante.** Un identificador declarado como función de aridad 0 es constante; cualquier otro identificador en posición de término es variable. Las constantes se escriben sin paréntesis (`k`, no `k()`).
4. **Opcional:** en los nodos `pred`, un campo `argumentos` con los valores ya evaluados (por ejemplo `["b"]` para `P(f(a))`) ayuda a explicar la hoja en el globito del nodo.
