# Trivia Colombia — Notas de maquetación (mockups de alta fidelidad, 1440 px)

Fuente: `docs/diseno/mockup-alta-fidelidad-*.png` (exportaciones del Word "Diseño Baja y Alta Fidelidad").
Estas notas son la referencia que usó la etapa 2 (maquetación HTML/CSS).

## Global

### Encabezado (alto ~98 px, fondo coral #FF6B6B, borde inferior 1 px sutil)
- Interior max-width 1312 px (64 px de margen lateral a 1440 px).
- Izquierda: logo (cuadrado azul #173B72, radio 12 px, 44×44, "TC" en blanco) + "Trivia Colombia"
  (Poppins bold 20 px) y, debajo, "UN PAÍS MIL DESCUBRIMIENTOS" (mayúsculas 10 px, tracking amplio).
- Nav centrada: Inicio · Jugar · Instrucciones · Ranking (15 px). Activo: semibold + subrayado azul 3 px.
- Derecha: botón blanco 44×44 (radio 12 px) con engranaje → Configuración.
- Elemento activo por pantalla: Inicio→Inicio; Instrucciones→Instrucciones;
  Configuración de partida, Juego, Retroalimentación y Resultado→Jugar; Ranking→Ranking.

### Pie (fondo coral, sin tarjeta, 13 px)
- Izq. "Aprender también es jugar. • Hecho con curiosidad por Colombia."
- Der. "Trivia Colombia · 2026".

### Contenedores y cabecera de pantalla
- Contenido principal: max-width 1120 px centrado (160 px de margen a 1440 px).
- Cabecera (todas menos Inicio): etiqueta en mayúsculas 12 px bold → H1 Poppins bold 40 px →
  subtítulo Inter 17 px. Home: H1 de 56 px.

### Componentes
- Tarjeta: #FFFDF7, radio 20 px, padding 24–28 px, sombra muy suave.
- Mini-tarjeta de dato: #EEF2F9 (o verde #E7F6EE / rojo #FDECEC), radio 12 px, padding 16 px.
- Botón primario: amarillo #FFD166 + texto azul, radio 12 px, alto 48–56 px, ícono lineal.
- Botón secundario: blanco #FFFDF7 + texto azul.
- Píldora/chip: radio completo, fondo #EEF2F9, texto 12–13 px semibold.

## 1. Inicio — "¿Cuánto sabes de Colombia?"
- Izquierda: píldora "Descubre. Juega. Aprende." (ícono destello) → H1 (2 líneas) → subtítulo
  "De los Andes al Caribe, cada pregunta te acerca a nuestro país. ¡Acepta el reto!" →
  tarjeta blanca con label "¿Cómo te llamas?", campo de 48 px (ícono persona, texto "Valentina")
  y ayuda "Este nombre aparecerá en el ranking." → botón amarillo "▶ Jugar" a todo el ancho →
  fila de 2 botones blancos "Instrucciones" y "Ranking" → botón de texto "⚙ Configuración".
- Derecha: tarjeta con ilustración (radio 20 px), píldora "Colombia, qué maravilla" arriba-izq. y
  tarjeta blanca abajo: "Tu próxima aventura es aprender." + "Historia, paisajes y tradiciones
  que merecen una pregunta más."
- Abajo, sobre el coral: línea divisoria + "10 preguntas" (izq.), "20 s por pregunta" (centro),
  "6 categorías" (der.).

## 2. Instrucciones — "Así se juega"
- 3 tarjetas: cuadrado #EEF2F9 44×44 con ícono + título 19 px + texto 15 px:
  1. "10 preguntas por partida" — "Elige una categoría o juega con Todas para explorar un poco de cada tema."
  2. "4 opciones, una correcta" — "Selecciona una sola respuesta. Al elegir, verás la solución y su explicación."
  3. "20 segundos por pregunta" — "El tiempo se reinicia en cada pregunta, en todas las dificultades. Si se agota, sumas 0 puntos."
- 2 tarjetas:
  - "Cada acierto cuenta": mini-tarjeta verde "+100 / Respuesta correcta" + mini-tarjeta azul
    "0 / Error o sin respuesta"; "Sin bonos de velocidad ni penalizaciones. Tu puntaje máximo es
    1.000 puntos: 10 aciertos × 100."; negrita "Ejemplo: 8 aciertos = 800 puntos = 80 %."
  - "Una ayudita extra": "Comodín 50/50 — Elimina dos opciones incorrectas."; "+10 segundos —
    Añade 10 segundos al tiempo restante."; "Cada comodín se puede usar una vez por partida.
    Usarlos no resta puntos."
- Botones: "← Volver" (blanco) y "▶ Comenzar" (amarillo), 50/50.

## 3. Configuración de partida — "¿Qué vamos a descubrir?"
- Cabecera: "PREPARA TU RETO" · "{Jugador}, elige tu tema y el nivel de la partida."
- Columna principal (~815 px):
  - "Categoría" + ayuda dinámica ("Todas está seleccionada. Tendrás preguntas de todos los temas.").
  - Rejilla 3×2 de tarjetas-opción (radio 12, borde 1 px): ícono, nombre (15 px semibold) y
    descriptor (13 px). Seleccionada: fondo #EEF2F9, borde 2 px azul y círculo con check.
    · Todas — "Un viaje por todo el país" · Geografía — "Regiones, ríos y ciudades"
    · Historia — "Los hechos que nos unen" · Cultura y Tradiciones — "Fiestas, sabores y raíces"
    · Deportes — "Talento que hace historia" · Ciencia y Naturaleza — "Vida, ingenio y diversidad"
  - "Dificultad": control segmentado de 3 (alto 48 px); activo = azul sólido + check.
  - Ayuda dinámica: "Medio: un reto para mentes curiosas. Siempre tienes 20 segundos por pregunta."
- Columna lateral (~280 px):
  - Tarjeta: ícono trofeo · "Tu mejor puntaje" · "900 pts" (40 px) · chip "Geografía · Medio".
  - Tarjeta "Tu partida": "{Categoría}" · "Nivel {Dificultad}" · "10 preguntas · Hasta 1.000 pts" ·
    botón amarillo "▶ Comenzar" · "Los comodines están incluidos."

## 4. Juego — "¡Vamos, {Jugador}!"
- Cabecera con 2 marcadores a la derecha (tarjetas blancas): estrella + "300 / Puntos" y
  cronómetro + "16 s / Tiempo restante".
- Tarjeta principal: fila con chip "{Categoría}" (ícono) y "4 de 10"; barra de 10 segmentos
  (los respondidos en azul, el resto #E6EAF1); enunciado (Poppins bold ~30 px);
  "Selecciona una respuesta antes de que termine el tiempo."; rejilla 2×2 de opciones-botón
  (letra en cuadrado #EEF2F9 + texto).
- Lateral: tarjeta "Tus comodines" ("Una ayuda de cada tipo, sin perder puntos.") con 2 botones
  amarillos "50/50" y "+10 segundos" y sus notas ("1 disponible · Quita 2 opciones" /
  "1 disponible · Tiempo extra"); tarjeta-blanca-boton "Salir"; nota "Si sales, esta partida no se guardará."

## 5. Retroalimentación — "Cada pregunta enseña algo"
- Cabecera: "{Jugador} · Pregunta 4 de 10" · "Revisa tu elección y descubre la respuesta correcta."
- Tarjeta principal: chips "{Categoría}" y "{Dificultad}"; barra de progreso; enunciado; opciones en
  1 columna con estados: correcta (verde: badge verde, "Respuesta correcta", check), elegida
  incorrecta (rojo: badge rojo, "Tu elección · Incorrecta", x) y el resto normal.
- Lateral:
  - Tarjeta roja: x + "Tu respuesta es incorrecta" · "Elegiste {opción}." · "+0 puntos" (30 px) ·
    "No se restan puntos. ¡Sigue aprendiendo!"
  - Tarjeta verde: check + "La correcta: {opción}" · explicación.
  - Tarjeta blanca: "{puntos} puntos acumulados" · "{n} aciertos de {m} preguntas respondidas." ·
    botón amarillo "→ Siguiente pregunta".

## 6. Resultado — "¡Muy bien, {Jugador}!"
- Cabecera: "PARTIDA COMPLETADA" · "Hoy conoces un poco más de Colombia. Ese es el mejor premio."
- Tarjeta principal (centrada): badge trofeo · "TU PUNTAJE" · puntaje (64 px) · "de 1.000 puntos
  posibles" · chip "{Categoría} · {Dificultad}" · 3 mini-tarjetas ("8 / 10 Aciertos",
  "80 % Porcentaje", "02:38 Tiempo total") · "Tu recorrido" con 10 chips ✓/✗ ·
  "{n} aciertos × 100 puntos · {m} errores × 0 puntos".
- Lateral: tarjeta con destello, "¡Tu curiosidad te lleva lejos!" y "{N} descubrimientos para
  celebrar y {n} oportunidades para seguir aprendiendo. ¿Vamos por el siguiente reto?";
  tarjeta con chip verde "Partida guardada", "Puesto {n} en el ranking", "{fecha} · {Jugador}",
  "Tu récord sigue siendo {puntaje} puntos."
- Botones: "Jugar de nuevo" (amarillo), "Ranking", "Inicio".

## 7. Ranking — "Ranking Colombia"
- Cabecera: "LA CURIOSIDAD TIENE SU PODIO" · "Las 10 partidas locales más recientes, ordenadas por puntaje."
- "Tu recorrido, {Jugador}" + 4 tarjetas: "12 Partidas jugadas" · "78 Aciertos de 120 · 65 %" ·
  "900 Récord personal · pts" · "Geografía Tu mejor categoría".
- Tarjeta con tabla: título "Mentes que brillan" + "Nivel {Dificultad} · Actualizado hoy";
  columnas Pos. | Jugador | Puntaje | Categoría | Fecha. Podio 1-3 con fondo #EEF2F9 e ícono de
  medalla; fila propia con fondo rojo claro y borde rojo. Nota al pie: "En caso de empate, la
  partida más antigua aparece primero. Los datos se guardan en este dispositivo."
- Botones: "← Volver" y "Borrar ranking" (texto/icono rojo); nota "Borrar el ranking también
  elimina tus estadísticas locales."

## 8. Configuración — "Configuración"
- Cabecera: "A TU MANERA" · "Pequeños ajustes para disfrutar cada descubrimiento."
- Columna principal: tarjeta "🔊 Sonido" con descripción, estado ("Activado / Efectos del juego")
  e interruptor; tarjeta "🎨 Tema" con 2 tarjetas-opción de vista previa (Claro: fondo coral con
  tarjeta blanca; Oscuro: fondo azul con barra clara) + ícono sol/luna + check/círculo vacío y
  "Seleccionado / No seleccionado".
- Lateral: tarjeta "Tu espacio de juego" con panel coral interior ("Trivia Colombia", tarjeta blanca
  "Un país por descubrir / Tu próxima pregunta te espera." y botón amarillo "▶ Jugar"), chip verde
  "Preferencias guardadas" y "Sonido activado y tema claro. Los ajustes se conservan en este dispositivo."
- Botón amarillo "⌂ Inicio" a todo el ancho.

## Diferencias / decisiones registradas
1. **Puntuación**: el mockup fija +100 por acierto, sin bonos ni penalización, máximo 1.000 puntos
   (contradice el Word §6.1). Se implementa el mockup.
2. Los textos dinámicos de ayuda (categoría y dificultad) solo están definidos para "Todas" y
   "Medio" en el mockup; el resto se deriva de la misma plantilla.
3. La frase "Elegiste Cartagena, capital de Bolívar." añade un dato que no existe en el modelo de
   datos (§13); se muestra "Elegiste {opción}."
4. Variantes de texto no definidas en el mockup (resultado con 0 aciertos, retroalimentación
   correcta, "Ver resultado" en la última pregunta) son provisionales.
5. La ilustración de Inicio y el panel de Configuración son imágenes de Figma: por ahora hay un
   marcador de posición en `assets/img/`.

## Correcciones tras la comparación visual (etapa 2)

Comparadas las 8 pantallas a 1440 px con los mockups (Chrome headless). Corregido:

1. **Pantalla 3**: Dificultad pasó a ser un control segmentado en fila dentro de la misma tarjeta
   que Categoría (antes: tarjeta aparte, botones apilados).
2. **Pantalla 3**: tarjetas de categoría con el ícono arriba y el check de selección abajo a la
   izquierda (antes: ícono junto al nombre y check a la derecha).
3. **Pantalla 3**: "Tu mejor puntaje" con cifra grande (añadida la clase `.cifra`).
4. **Pantalla 3**: el subtítulo ya no muestra la coma inicial cuando no hay nombre (deep-link).
5. **Pantalla 5**: las tarjetas laterales de estado/explicación/avance quedan ocultas en el estado
   vacío y aparecen al responder (antes aparecían vacías).
6. **Pantalla 7**: con 0 partidas la tarjeta de aciertos muestra "Aciertos totales" en vez de
   "Aciertos de 0 · 0 %".

Pantallas 1, 2, 4, 6 y 8: sin diferencias estructurales relevantes (la 4 y la 6 muestran estados
vacíos por diseño hasta la etapa 3).
