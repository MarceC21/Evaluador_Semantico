<div align="center">

# 🎄 LÓGICA NAVIDEÑA

### Evaluador Semántico de Lógica de Primer Orden

**JavaScript · Lógica Matemática · AST · Deducción Semántica**

Evaluador interactivo de fórmulas de **lógica de primer orden** sobre interpretaciones finitas, con análisis sintáctico, evaluación semántica y visualización del AST como un árbol navideño animado.

<br>

![JavaScript](https://img.shields.io/badge/JAVASCRIPT-LANGUAGE-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000)
![First Order Logic](https://img.shields.io/badge/FIRST%20ORDER-LOGIC-C2476A?style=for-the-badge)
![Parser](https://img.shields.io/badge/PARSER-AST-9C4A63?style=for-the-badge)
![Semantic Engine](https://img.shields.io/badge/SEMANTIC-ENGINE-2F5A3A?style=for-the-badge)
![SVG](https://img.shields.io/badge/SVG-VISUALIZATION-E3C27A?style=for-the-badge&logo=svg&logoColor=000)

![Quantifiers](https://img.shields.io/badge/∀%20∃-QUANTIFIERS-B77A8C?style=for-the-badge)
![Witness](https://img.shields.io/badge/∃-WITNESS-F7D774?style=for-the-badge)
![Counterexample](https://img.shields.io/badge/∀-COUNTEREXAMPLE-F08CA4?style=for-the-badge)
![Tests](https://img.shields.io/badge/TESTS-61%20PASSING-00C853?style=for-the-badge)

<br>

**Universidad del Valle de Guatemala · MM3032 Lógica Matemática · 2026**

</div>

---

## ✨ Acerca del proyecto

**Lógica Navideña** es una aplicación web interactiva para analizar y evaluar fórmulas de lógica de primer orden en interpretaciones finitas.

El usuario puede definir su propio lenguaje, construir una interpretación, escribir una fórmula y determinar si esta es **verdadera o falsa**.

Además de obtener el valor de verdad, la aplicación muestra el proceso de evaluación mediante un **árbol sintáctico navideño interactivo**, permitiendo explorar cómo se obtiene el resultado de cada subfórmula.

El proyecto integra tres componentes principales:

```text
Fórmula
   │
   ▼
┌───────────────┐
│ Parser + AST  │
└───────┬───────┘
        │
        ▼
┌───────────────────┐
│ Motor semántico   │
└─────────┬─────────┘
          │
          ▼
┌─────────────────────────┐
│ Árbol visual interactivo│
└─────────────────────────┘
```

---

## 🎯 Funcionalidades

### 🧩 Lenguaje configurable

La aplicación permite declarar dinámicamente:

- Constantes como símbolos funcionales de aridad `0`.
- Funciones de cualquier aridad válida.
- Predicados con su correspondiente aridad.

Por ejemplo:

```text
Constante: k
Función:   f / 1
Predicado: P / 1
Predicado: R / 2
```

---

### 🌎 Interpretaciones finitas

El usuario puede construir una interpretación definiendo un dominio finito:

```text
D = {a, b, c}
```

y posteriormente asignar el significado de cada símbolo.

Por ejemplo:

```text
k = a

f(a) = b
f(b) = c
f(c) = a

P = {a, c}

R = {(a,b)}
```

La aplicación genera automáticamente las combinaciones necesarias para funciones y predicados según su aridad.

---

## ✍️ Fórmulas de primer orden

El evaluador soporta:

| Símbolo | Operación |
|:---:|---|
| `¬` | Negación |
| `∧` | Conjunción |
| `∨` | Disyunción |
| `→` | Implicación |
| `∀` | Cuantificador universal |
| `∃` | Cuantificador existencial |
| `=` | Igualdad |
| `( )` | Agrupación |

También se admiten diferentes formas de escritura desde el teclado, incluyendo alias como:

```text
not
and
or
forall
exists
->
```

La precedencia utilizada es:

```text
¬  >  ∀ / ∃  >  ∧  >  ∨  >  →
```

La implicación asocia hacia la derecha.

---

## 🧠 Parser y AST

La fórmula ingresada es procesada mediante un **parser descendente recursivo**.

El parser:

- Tokeniza la expresión.
- Comprueba la sintaxis.
- Valida símbolos y aridades.
- Construye el AST.
- Asigna identificadores únicos a los nodos.
- Detecta variables libres y ligadas.
- Determina el alcance de los cuantificadores.
- Respeta el sombreado de variables producido por cuantificadores anidados.

Ejemplo:

```text
∀x (P(x) → Q(x))
```

produce conceptualmente:

```text
        ∀x
         │
         →
       /   \
    P(x)   Q(x)
```

---

## ⚙️ Motor semántico

El motor evalúa recursivamente el AST utilizando la interpretación y el entorno definidos por el usuario.

Puede evaluar:

```text
Variables
Constantes
Funciones
Predicados
Igualdad

¬
∧
∨
→

∀
∃
```

La evaluación produce un contrato estructurado con información como:

```js
{
  ok: true,
  valor: true,
  raiz: 1,
  orden: [...],
  nodos: {
    1: {
      valor: true,
      razon: "...",
      entorno: {...},
      ramas: [...],
      testigo: null,
      contraejemplo: null,
      comprobacion: "completa"
    }
  }
}
```

---

## 🔍 Testigos y contraejemplos

La aplicación no se limita a indicar **Verdadero** o **Falso**.

### `∃` verdadero

Cuando:

```text
∃x P(x)
```

es verdadero, el motor identifica un **testigo**:

```text
✓ Verdadero

Testigo: a
```

---

### `∀` falso

Cuando:

```text
∀x P(x)
```

es falso, identifica un **contraejemplo**:

```text
✕ Falso

Contraejemplo: b
```

---

### Comprobación completa

También registra cuándo fue necesario recorrer todo el dominio:

- `∀` verdadero → comprobación completa.
- `∃` falso → comprobación completa.

---

## 🎄 Árbol semántico navideño

Una de las características principales del proyecto es la representación visual del AST como un **árbol de Navidad interactivo**.

Los nodos representan las subfórmulas y se iluminan de acuerdo con su valor semántico.

### Estados

```text
🟡 Verdadero
🔴 Falso
⚪ Sin evaluar
```

El árbol incluye:

- Esferas para conectivos y cuantificadores.
- Nodos adaptables para predicados.
- Silueta de árbol navideño.
- Estrella animada.
- Guirnalda de luces.
- Nieve.
- Zoom y desplazamiento.
- Animación de evaluación.

---

## 💡 Exploración de nodos

Cada nodo del árbol puede inspeccionarse.

Al seleccionarlo se muestra:

- Valor de verdad.
- Explicación de la evaluación.
- Entorno utilizado.
- Variables libres de la subfórmula.
- Ramas evaluadas para cuantificadores.
- Testigo.
- Contraejemplo.
- Comprobación completa.

Para un universal verdadero, por ejemplo:

```text
✓ Verdadero

La fórmula se cumple para todos
los elementos del dominio.

a    ✓
b    ✓
c    ✓
```

---

## 🎬 Modos de animación

La evaluación puede visualizarse de diferentes maneras.

### Ver todo

Los nodos se iluminan automáticamente siguiendo el orden:

```text
hojas → subfórmulas → raíz
```

### Paso a paso

Permite recorrer manualmente la evaluación:

```text
◀ Anterior          Siguiente ▶
```

Esto permite observar cómo el valor de verdad final se construye desde las fórmulas atómicas hasta la fórmula completa.

---

## 🎁 Ejemplos incluidos

La interfaz incluye ejemplos precargados para demostrar diferentes comportamientos:

```text
∀ verdadero
∃ verdadero con testigo
∀ falso con contraejemplo
```

Estos ejemplos modifican automáticamente el lenguaje, la interpretación y la fórmula para mostrar cada caso.

---

## 🚀 Ejecución

El proyecto utiliza módulos ES, por lo que debe ejecutarse mediante un servidor HTTP local.

Desde la raíz:

```bash
python3 -m http.server 8000
```

Luego abre:

```text
http://localhost:8000/interfaz/
```

---

## 🧪 Pruebas

Las pruebas automáticas pueden ejecutarse con:

```bash
node --test
```

---

## 🧱 Arquitectura

```text
                    ┌─────────────────┐
                    │     Usuario     │
                    └────────┬────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │      Interfaz UI      │
                 │ Lenguaje · Modelo · φ │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ Parser + Validaciones │
                 └───────────┬───────────┘
                             │ AST
                             ▼
                 ┌───────────────────────┐
                 │   Motor semántico     │
                 │   ⊨ Verdadero/Falso  │
                 └───────────┬───────────┘
                             │
                    valor + explicación
                             │
                             ▼
                 ┌───────────────────────┐
                 │ Árbol SVG interactivo │
                 │  🎄 ✨ 💡 ⭐ ❄️       │
                 └───────────────────────┘
```

---

## 📚 Contexto académico

**Universidad del Valle de Guatemala**  
**Curso:** MM3032 — Lógica Matemática  
**Año:** 2026

El proyecto aplica conceptos de:

- Lenguajes de primer orden.
- Sintaxis de lógica de predicados.
- Variables libres y ligadas.
- Interpretaciones.
- Entornos.
- Semántica de lógica de primer orden.
- Cuantificadores universales y existenciales.
- Árboles sintácticos.

---

## Integrantes

- **Mariana Castañeda** — [marianacastanedar](https://github.com/marianacastanedar)
- **Marcela Castillo** — [MarceC21](http://github.com/MarceC21)
- **Ruth de León** — [Anaru03](https://github.com/Anaru03)

---

<div align="center">

### 🎄 Del símbolo al árbol, del árbol a la verdad.

**Lógica Navideña · MM3032 · 2026**

`¬` · `∧` · `∨` · `→` · `∀` · `∃`

</div>
