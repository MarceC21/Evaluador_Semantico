// Puente hacia las funciones reales de mis compañeras (Fase 4).
//
// Sus archivos (src/parser.js, src/validaciones.js, src/motor.js, en la
// raíz del repo, fuera de interfaz/) usan módulos ES (import/export), así
// que este archivo también es un módulo (por eso en index.html se carga
// con <script type="module">). Es el ÚNICO lugar que sabe que su código
// existe: nunca se toca ni se copia nada de src/, solo se importa.
//
// Por ser módulo, el navegador no deja abrir index.html con doble clic
// (bloquea los import por CORS): hay que servir la carpeta con un
// servidor local, por ejemplo:
//   python3 -m http.server
// (ver README.md). Sigue sin necesitar internet: el servidor es local.

import { analizarFormula } from "../../src/parser.js";
import { validarInterpretacion, validarEntorno } from "../../src/validaciones.js";
import { evaluar } from "../../src/motor.js";

window.LN = window.LN || {};
window.LN.real = {
  analizarFormula: analizarFormula,
  validarInterpretacion: validarInterpretacion,
  validarEntorno: validarEntorno,
  evaluar: evaluar
};
