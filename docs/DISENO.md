# Guía visual: "Lógica Navideña" (árbol de Navidad coquette)

Es el estilo aprobado en el demo. La idea: el árbol sintáctico (raíz arriba, hojas abajo, como en Huth & Ryan) tiene forma de arbolito navideño.

## Paleta
| Uso | Color |
|---|---|
| Fondo de tarjeta | `#FCE7EE` con borde dorado fino `#E3C27A`, esquinas redondeadas |
| Título | `#9C4A63` |
| Subtítulo | `#B77A8C` |
| Texto | `#5A2E3A` (café rosado) |
| Texto secundario | `#7A5560` |
| Nodo verdadero | relleno `#F7D774`, borde `#C9962B` |
| Nodo falso | relleno `#F08CA4`, borde `#C2476A` |
| Nodo sin evaluar | `#EBDDE1` |
| Árbol (3 tonos de verde salvia) | `#9FC5A0`, `#B3D4B3`, `#C6E1C4` |
| Aristas | `#FFF3E8` |
| Casquillo de esferas y bombillitas | `#B8964A` |
| Tronco | `#B08968` |
| Cable de guirnalda principal | `#2F5A3A` |
| Cable de guirnalda de fondo | `#C28CA0` |
| Bombillitas | `#F06292` `#F7D774` `#7FD1B9` `#8EC5F0` `#C3A6F0` `#FF9E80` |

Verdadero y falso **no dependen solo del color**: agrega ✓ en los nodos verdaderos y ✕ en los falsos, y deja una leyenda ("Verdadero" / "Falso").

## Tipografía
- **Pinyon Script** (cursiva): solo el título "Lógica Navideña", unos 32 px.
- **Quicksand** 400 y 500: todo lo demás. El subtítulo "EVALUADOR SEMÁNTICO" va en 12 px con `letter-spacing: 1px`.
- Texto de interfaz de 16 px o más (se verá en proyector).
- Las fuentes van locales en `assets/fonts/` con `@font-face` y fallback (`cursive` y `sans-serif`).

## Nodos (esferas y luces)
Cada nodo es un grupo SVG centrado en (0,0):
- Base apagada: círculo de radio 20 (22 en hojas) con relleno `#EBDDE1`.
- Capa encendida (`.lit`): halo del mismo color con radio +9 y opacidad .35; círculo principal con relleno y borde de 1.5 px; reflejo, una elipse blanca (rx 6, ry 3.5, opacidad .6) rotada -30° en la esquina superior izquierda.
- Casquillo: rectángulo de 8×6 px (rx 1.5) arriba del círculo, color `#B8964A`.
- Texto centrado con `dominant-baseline="central"`. El radio crece con el texto (por ejemplo `r = max(20, anchoTexto/2 + 10)`).
- Conectivos y cuantificadores son esferas con su símbolo. Las hojas (predicados) son luces con su texto, por ejemplo `P(x)` o `R(x, f(y))`.

## Silueta y estrella
- El árbol sintáctico se coloca con layout de árbol: hojas repartidas parejo, cada padre centrado sobre sus hijos y una separación vertical de unos 64 px por nivel.
- La silueta es un triángulo de **tres capas** de verde salvia calculado desde el tamaño real del árbol: punta unos 45 px arriba de la raíz, base unos 45 px debajo de las hojas, ancho que cubre todos los nodos con margen. Las capas interiores son copias más pequeñas y claras.
- Estrella dorada de 5 puntas (`#F7D774`, borde `#C9962B`) en la punta, con un titileo suave (escala 1 a 1.15). Se enciende al final de la cascada.
- Tronco `#B08968` de unos 36×24 px bajo la silueta.

## Guirnalda (importante)
Un cable verde oscuro que **rodea el árbol en zigzag de lado a lado**, pasando por encima de la silueta verde y **por detrás de los nodos**.
- Se calcula a partir de la silueta: alturas cada ~45 a 60 px entre el 15 % y el 95 % de la altura. En cada altura el cable va de un borde al otro, alternando izquierda y derecha, y sobresale ~6 px del borde para dar sensación de envolver.
- Cada tramo es una curva cuadrática (`Q`) con el punto de control unos 35 px más abajo del punto medio, para que el cable **cuelgue**.
- Sobre el cable cuelgan **bombillitas de colores** cada ~22 px, ubicadas con `getPointAtLength`: casquillo dorado de 3.6×4 px, bulbo elíptico (rx 4, ry 5.2) unos 8 px bajo el cable, y un brillito blanco pequeño. Los colores rotan en el orden de la paleta.
- Las bombillitas parpadean suave (opacidad de .5 a 1, ciclos de 1.6 s con retrasos escalonados).
- **Guirnalda de fondo:** dos tramos cortos en las esquinas superiores, a los lados del título, con cable `#C28CA0` y las mismas bombillitas.
- Como el árbol puede ser grande o chico según la fórmula, la guirnalda debe recalcularse cada vez que cambia el árbol.

## Fondo
Tarjeta rosa con borde dorado y **nieve cayendo suave**: unos 12 círculos blancos de 2 a 3 px con duraciones de 8 a 13 s, con retrasos negativos para que no empiecen todos juntos.

## Animación
- **Ver todo:** las luces se encienden en cascada siguiendo `orden` (hojas a raíz), con aparición de 0.6 s y unos 0.4 s entre nodos. La estrella se enciende al final.
- **Paso a paso:** botones "Anterior" y "Siguiente" que iluminan un nodo a la vez, mostrando su explicación.
- Botón **"Repetir animación"**.
- Solo se animan `transform` y `opacity`. Con `prefers-reduced-motion` no hay animaciones y todo aparece ya encendido.

## Clic en un nodo (globito)
Debe mostrar: (a) el valor con ✓ o ✕, (b) la explicación en lenguaje simple desde `razon`, (c) las variables libres de esa subfórmula (se calculan en la interfaz con una función `freeVars` sobre el AST) y el entorno, (d) en ∀ y ∃, las ramas por elemento del dominio con el testigo o contraejemplo resaltado. Debe poder usarse con teclado (Tab y Enter) y verse bien en proyector.

## Árbol que se arma solo
Mientras se escribe, si la fórmula es válida, el árbol crece en vivo con los nodos en gris (sin valores todavía). Para fórmulas grandes, el árbol se ajusta a la pantalla con zoom y desplazamiento.
