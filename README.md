# Trivia Colombia

Juego web de preguntas y respuestas sobre Colombia (geografía, historia, cultura y tradiciones, deportes, ciencia y naturaleza). Se ejecuta completamente en el navegador, sin servidor ni inicio de sesión.

Proyecto académico — Universidad de Santander (UDES) · Desarrollo Full Stack · Docente: Carlos Carrascal · Parcial basado en proyecto.

**Estudiante:** `[PENDIENTE: nombre del estudiante]`

> **Estado actual: etapa 3 — juego completo y verificado.** Las 8 pantallas están maquetadas (HTML semántico, CSS con variables de la guía de estilos, navegación funcional y enlaces profundos por hash, por ejemplo `index.html#ranking`) y conectadas al banco de 150 preguntas y al motor de juego: partida completa con temporizador, comodines, puntuación, retroalimentación, resultado y ranking en `localStorage`. La integración está verificada con pruebas automatizadas (ver **Verificación de la integración** más abajo). Quedan pendientes de la etapa 4 los sonidos, el tema oscuro y la revisión de preguntas falladas en Resultado.

## Enlaces de entrega

| Entregable | Enlace |
|---|---|
| Diseño en Figma (permiso de visualización para el docente) | `[PENDIENTE: enlace de Figma]` |
| Repositorio en GitHub (público) | `[PENDIENTE: enlace del repositorio]` |
| Despliegue en Vercel | `[PENDIENTE: URL pública de Vercel]` |
| Video explicativo (máx. 5 min, con cámara) | `[PENDIENTE: enlace del video]` |

## Tecnologías

HTML5 · CSS3 (variables, Flexbox, Grid, media queries) · JavaScript ES6+ (vanilla) · localStorage · Git/GitHub · Vercel. Sin frameworks ni backend.

## Cómo ejecutarlo localmente

1. Abre la carpeta `trivia-colombia/` en Visual Studio Code.
2. Instala la extensión **Live Server**.
3. Clic derecho sobre `index.html` → **Open with Live Server**.

Los scripts son clásicos (sin módulos ES), por lo que también funciona abriendo `index.html` directamente, aunque se recomienda Live Server.

## Estructura y responsabilidades

```
trivia-colombia/
├── index.html              Estructura semántica y contenedores de las 8 pantallas
├── css/
│   ├── styles.css          Variables (colores, tipografía, espaciado) y componentes base. Mobile-first
│   └── responsive.css      Media queries (tableta ≥768 px y escritorio ≥1024 px)
├── js/
│   ├── preguntas.js        DATOS: categorías, dificultades y banco de preguntas
│   ├── almacenamiento.js   localStorage: ranking, estadísticas y preferencias
│   ├── juego.js            LÓGICA: estado, selección, temporizador, respuestas, comodines, puntaje
│   ├── ui.js               RENDERIZADO: dibuja datos en los contenedores del DOM
│   └── app.js              ENTRADA y NAVEGACIÓN: arranca la app y conecta los módulos
├── assets/
│   ├── img/                Logo e íconos de categorías
│   └── sonidos/            Efectos de acierto y error
├── tests/                  Pruebas de Node (banco, motor, persistencia y recorrido E2E en navegador)
├── docs/diseno/            Exportaciones (PDF/PNG) del diseño de Figma
└── README.md
```

| Archivo | Hace | No hace |
|---|---|---|
| `preguntas.js` | Define `CATEGORIAS`, `DIFICULTADES` y `PREGUNTAS` | Filtrar, mezclar o validar |
| `almacenamiento.js` | Lee/escribe (validando y deduplicando) `trivia_ranking`, `trivia_stats` y preferencias | Calcular puntajes o tocar el DOM |
| `juego.js` | Reglas, estado, temporizador, puntaje, comodines | Tocar el DOM o localStorage |
| `ui.js` | Pintar pregunta, opciones, resultado, ranking, mensajes | Decidir la pantalla o calcular el juego |
| `app.js` | `irA(pantalla)`, eventos, orden de arranque | Reglas del juego o dibujo dinámico |

Orden de carga de los scripts (por dependencias): `preguntas` → `almacenamiento` → `juego` → `ui` → `app`.

## Pantallas (8, según los diseños de baja y alta fidelidad)

| # | Pantalla | `data-pantalla` | Elementos principales |
|---|---|---|---|
| 1 | Inicio | `inicio` | Nombre del jugador, Jugar, Instrucciones, Ranking, Configuración |
| 2 | Instrucciones | `instrucciones` | Reglas, puntuación, comodines |
| 3 | Configuración de partida | `configuracion-partida` | Categorías (5 + Todas), dificultad, mejor puntaje |
| 4 | Juego | `juego` | Enunciado, 4 opciones, temporizador, progreso n/10, puntaje, comodines |
| 5 | Retroalimentación | `retroalimentacion` | Correcta/incorrecta, explicación, Siguiente pregunta |
| 6 | Resultado | `resultado` | Puntaje, aciertos, tiempo total, posición, Jugar de nuevo / Ranking |
| 7 | Ranking y estadísticas | `ranking` | Top 10, estadísticas del jugador, Borrar ranking |
| 8 | Configuración general | `configuracion` | Sonido on/off, tema claro/oscuro |

## Componentes reutilizables

- **Encabezado** (marca + navegación + acceso a configuración) y **pie** — persistentes.
- **Botón**: primario, secundario y de icono; estados normal, hover, activo, foco, deshabilitado, correcto, incorrecto.
- **Tarjeta**: superficie base de casi todos los bloques.
- **Campo de texto** con etiqueta, ayuda y mensaje de error.
- **Tarjeta de dato** (valor + etiqueta): puntaje, tiempo, aciertos, estadísticas.
- **Opción seleccionable** (radio-card): categoría, dificultad y tema.
- **Botón de respuesta**: normal, correcta, incorrecta, bloqueada, eliminada por 50/50.
- **Barra de progreso** y **temporizador**.
- **Botón de comodín** (con contador de uso).
- **Panel de explicación**.
- **Tabla de ranking** (se adapta a tarjetas en móvil).
- **Interruptor** (sonido).
- **Mensaje accesible** (`aria-live`) para aciertos, errores y validaciones.

## Funcionalidades requeridas

| Módulo | Funcionalidad | Requisitos |
|---|---|---|
| Inicio | Nombre obligatorio y navegación | RF-01, RF-14 |
| Configuración de partida | Categoría, dificultad, mejor puntaje de la combinación | RF-02 |
| Juego | 10 preguntas aleatorias sin repetir; opciones mezcladas | RF-03, RF-04 |
| Juego | Temporizador de 20 s; progreso n/10 | RF-05, RF-10 |
| Juego | Validar, explicar y bloquear opciones tras responder | RF-06, RF-07 |
| Juego | Puntaje y racha | RF-08 |
| Juego | Comodines 50/50 y +10 s (uno de cada uno por partida) | RF-09 |
| Resultado | Resumen, posición en el ranking, revisión de falladas | RF-11 |
| Ranking | Guardar en localStorage; top 10 de mayor a menor; borrar | RF-12, RF-13 |
| Estadísticas | Partidas, % de aciertos, mejor puntaje, mejor categoría | RF-12 |
| Configuración | Sonido y tema claro/oscuro, guardados en localStorage | — |
| Transversal | Responsive desde 360 px, accesible, fiel al diseño | RNF-01, 03, 05, 06 |

## Decisiones de diseño

1. **Sistema de puntuación (resuelta — cambió en la etapa 3).** En la etapa 2 se había usado la versión del mockup (+100 plano, máximo 1.000). Por solicitud de la estudiante, el motor aplica ahora el **Word §6.1**. Orden de aplicación (también documentado en la cabecera de `js/juego.js`):
   1. Acierto: **100** + rapidez (**+5 por segundo restante, tope +100**) + racha (**+50** al 3.º, 6.º y 9.º acierto seguido).
   2. Esa suma se **multiplica** por la dificultad (Fácil ×1, Medio ×1,5, Difícil ×2) y se redondea al entero más cercano (el .5 sube).
   3. Error o tiempo agotado: 0 puntos y la racha vuelve a 0.
   4. **Comodín: −30 puntos fijos por uso, sin multiplicar**, descontados del total acumulado. El puntaje mostrado nunca baja de 0 (`max(0, ganados − penalizaciones)`).
   5. Máximo teórico (10 aciertos con ≥ 20 s restantes y sin comodines): Fácil 2.150 · Medio 3.225 · Difícil 4.300.
   Se ajustaron los textos que dejaban de ser ciertos (Instrucciones, "Tus comodines", tarjeta "Tu partida", retroalimentación y desglose del resultado). Interpretación propia, a confirmar con el docente: la racha da +50 cada 3 aciertos seguidos (no solo una vez) y el multiplicador también afecta a rapidez y racha.
2. **Enlaces profundos (resuelta).** Cada pantalla tiene un enlace por hash (`#inicio`, `#juego`, `#ranking`…) para poder revisar las 8 pantallas sin jugar una partida completa.
3. **Pantallas sin partida (resuelta).** Juego, Retroalimentación y Resultado muestran su estado vacío cuando no hay una partida en curso o terminada (por ejemplo, al abrir `#juego` directamente).
4. **Recursos visuales (resuelta salvo las fotos).** La ilustración de Inicio es ahora una pieza original (`assets/img/hero-colombia.svg`, sustituible por la exportación de Figma con el mismo nombre) y hay favicon. Los 6 iconos de categoría ya existían en el sprite. Las preguntas admiten una foto opcional (`imagenUrl`, `fuenteImagenUrl`, `imagenAlt`, `imagenAutor`, `imagenLicencia`) con crédito, carga diferida y ocultación limpia si falla; **todavía no hay fotos en el banco** porque no se pudieron verificar desde el entorno de desarrollo. Detalle, reglas y procedimiento en `docs/recursos-visuales.md`; atribuciones en `ATRIBUCIONES.md`.
5. **Textos dinámicos (parcialmente pendientes).** El mockup define los textos de "Todas" y "Medio"; las pistas de Fácil/Difícil y algunas variantes de resultado/retroalimentación son plantillas provisionales (marcadas en `docs/diseno/notas-mockups.md`).
6. **Tema oscuro.** No existe mockup; los valores en `styles.css` son provisionales.
7. **Tamaño del banco de preguntas (para la etapa 3).** El Word indica "al menos 50 preguntas" (§2.2 y §13) y también "mínimo 30 por categoría" (§6.2), es decir, 150 como mínimo.
8. **Contenido del ranking (para la etapa 3).** El Word pide el top 10 por puntaje; el mockup dice "las 10 partidas más recientes, ordenadas por puntaje". `almacenamiento.js` implementa top 10 por puntaje con desempate por fecha.

## Plan de etapas

- [x] Etapa 1 — Estructura inicial.
- [x] Etapa 2 — Maquetación HTML/CSS de las 8 pantallas (este commit).
- [x] Etapa 3 — Banco de 150 preguntas y motor del juego (`js/juego.js`) conectado a `ui.js`.
- [x] Etapa 4 — Persistencia completa (`js/almacenamiento.js`: validación, deduplicado, estadísticas y preferencias, con pruebas) y revisión de preguntas falladas en Resultado. Quedan de la etapa 4: sonidos y revisión del tema oscuro.
- [ ] Etapa 5 — Pruebas, ajustes frente al diseño, despliegue en Vercel y video.

## Verificación de la maquetación (etapa 2)

- Las 8 pantallas se compararon con `docs/diseno/mockup-alta-01..08.jpg` a 1440 px (capturas con Chrome headless). Diferencias corregidas durante la etapa: control de dificultad en fila, tarjetas de categoría con ícono superior, unificación de categoría + dificultad en una tarjeta, cifra grande de mejor puntaje y ocultamiento de tarjetas vacías en Retroalimentación.
- `node --check` sin errores en los 5 archivos JS.
- El ranking con datos de ejemplo renderiza correctamente (estadísticas, tabla y resaltado del jugador).

## Motor del juego (etapa 3)

- `Juego.iniciarPartida(categoria, dificultad, jugador)`, `obtenerPreguntas`, `mezclar` (Fisher-Yates), `iniciarTemporizador`, `detenerTemporizador`, `responder`, `usarComodin`, `avanzarPregunta` y `finalizarPartida`. Además `validarNombre`, `calcularPuntos`, `puntajeMaximo` y `cancelarPartida` (botón Salir).
- `app.js` solo orquesta: pide al motor, pinta con `ui.js` y guarda ranking/estadísticas con `almacenamiento.js` al terminar la décima pregunta.
- Reglas de control: una sola respuesta por pregunta (la segunda se ignora), un solo temporizador a la vez, el reloj solo corre en la pantalla de juego (cambiar de pantalla lo pausa, volver lo reanuda, Salir y cancelar el diálogo también), cada comodín una vez por partida.
- "Todas" elige 10 preguntas al azar del nivel entre las cinco categorías (no se garantiza el mismo número por categoría).
- Se corrigió un error de la etapa 2: el mensaje de error bajo el campo del nombre no aparecía (id distinto en `ui.js` e `index.html`).

## Verificación de la integración (etapa 3)

Partida completa probada de principio a fin con `node tests/e2e-navegador.js` (la suite actual tiene 90 comprobaciones, 0 fallos): inicio y validación del nombre → configuración de categoría y dificultad → las 10 preguntas con temporizador, progreso y selección → estados correcto/incorrecto con explicación → comodines 50/50 y +10 s → pantalla de resultado → ranking y estadísticas → jugar de nuevo y salir sin guardar. Cubre además doble clic en "Siguiente", triple clic en una opción (una sola respuesta registrada), tiempo agotado, enlaces profundos con partida en curso, foco de teclado al cambiar de pantalla y que el reloj se pausa al salir de la pantalla de juego.

**Errores encontrados y corregidos durante la etapa 3:**

1. **Los scripts de prueba no estaban donde los buscaba `README.md` y sus propias cabeceras.** `motor-juego.test.js` estaba en la raíz y `validar-preguntas.js` dentro de `js/`, pero ambos resuelven `__dirname/../js/...` (pensados para `tests/`), así que `node motor-juego.test.js` fallaba con `ENOENT` buscando `Desktop\js\preguntas.js`. Corregido moviéndolos a `tests/` (reubicación, sin tocar su código): ambos pasan (58 pruebas y 13 comprobaciones).
2. **El README apuntaba a `tests/e2e-navegador.py`, un archivo inexistente** que además exigía Playwright y un servidor manual. Sustituido por `tests/e2e-navegador.js` (Node puro, sin dependencias, sirve y juega la partida solo).
3. **El estado del README seguía en etapa 2** pese a estar completada la etapa 3; actualizado (junto con el plan de etapas: comodines, ranking y estadísticas ya están probados).

No se hallaron fallos de integración entre `app.js`, `juego.js`, `ui.js` e `index.html`: los ids referenciados existen, los scripts cargan en el orden correcto (con `defer`) y las clases de estado (`opcion--correcta/incorrecta/fuera`, `retro-tarjeta--*`, `progreso__segmento--*`) están definidas. El puntaje final del recorrido coincide con el cálculo manual según el Word §6.1: 185 + 200 + 200 + 200 + 250 (el último con +50 de racha al tercer acierto seguido) − 60 de comodines = **975 pts**, idéntico al mostrado por la interfaz y guardado en el ranking.

## Persistencia local (etapa 4)

`js/almacenamiento.js` guarda en `localStorage` (sin servidor ni base de datos externa) el ranking (`trivia_ranking`), las estadísticas (`trivia_stats`) y las preferencias (`trivia_preferencias`). Garantías:

- **Solo partidas terminadas:** `guardarEnRanking` valida los cinco campos (nombre, puntaje, categoría, dificultad y fecha); un registro incompleto o inválido se rechaza (`null`) y no modifica lo ya guardado. Además, en la app, `Juego.finalizarPartida()` devuelve `null` hasta que se responden las 10 preguntas, así que una partida cancelada nunca se guarda (probado en el E2E, paso 15).
- **Sin duplicados:** la misma partida —idéntica en los cinco campos— no se escribe dos veces: repetir el guardado (doble clic, recarga, cambio de pantalla) devuelve la posición existente sin duplicar filas. `actualizarEstadisticas` deduplica por `fecha`, así que el contador de partidas no se infla.
- **Datos saneados al leer:** entradas corruptas, incompletas o duplicadas se descartan, los textos se normalizan y el orden es consistente (puntaje ↓, fecha ↑, nombre ↑). El ranking nunca supera las 10 posiciones (RF-13) y leer nunca escribe.
- **Errores de acceso:** cada lectura/escritura va en `try/catch`; con el almacenamiento bloqueado (modo privado) o con JSON inválido devuelve listas vacías, estadísticas en cero y preferencias por defecto, sin lanzar excepciones.
- **Preferencias:** `sonido` y `tema` se normalizan al leer y al escribir, solo se exponen esas dos claves y sobreviven a la recarga. `guardarPreferencias` combina con lo guardado (acepta actualizar un solo campo sin perder el otro).
- **Borrado:** `borrarRanking()` elimina `trivia_ranking` y `trivia_stats` (el mockup advierte que también borra las estadísticas) y conserva las preferencias. La confirmación (`window.confirm`) vive en `App.borrarRanking()`, en la capa de interfaz.
- **Estadísticas:** partidas jugadas, aciertos/total con porcentaje, récord personal (`mejorPuntaje`) y categoría con mejor desempeño, que es lo que `ui.js` pinta en la pantalla de Ranking. El mejor puntaje por categoría y dificultad de la configuración consulta `mejoresCombinaciones`, que no depende del top 10: sigue respondiendo correctamente aunque la partida que sumó ese puntaje ya no esté entre las 10 mejores (con respaldo al ranking para datos antiguos).

**Cambios coordinados con app.js / ui.js / juego.js** (para las integrantes):

- `actualizarEstadisticas(partida)` acepta además de `aciertos`, `totalPreguntas`, `puntaje` y `categoria` los campos `dificultad`, `jugador` y `fecha` (opcionales y retrocompatibles). `app.js` ahora los pasa: `fecha` deduplica dobles guardados y `jugador` + `dificultad` alimentan `mejoresCombinaciones`.
- `obtenerEstadisticas()` devuelve además dos campos calculados que **no** se persisten: `porcentaje` (redondeo entero) y `mejorCategoria` (id de la categoría; el nombre visible lo resuelve `ui.js` con `UI.categoria`). `ui.js` puede seguir calculándolos a partir de `aciertos`, `totalPreguntas` y `mejoresPuntajes` con fórmulas idénticas: no hubo que tocarlo.
- `guardarEnRanking(partida)` ahora devuelve `null` cuando el registro es inválido (antes guardaba lo que llegara). La firma y el significado de `null` en `app.js` ("no entró al top 10 o no se pudo guardar") no cambian.
- No cambió ninguna firma de `juego.js` ni `ui.js`, y el formato de cada resultado guardado sigue siendo el del enunciado: nombre del jugador, puntaje, categoría, dificultad y fecha. No se guarda nada remoto ni datos personales adicionales.

## Pantallas completadas (etapa 4)

- **Resultado**: además del puntaje, aciertos, porcentaje y tiempo total del mockup, el mensaje de cabecera varía con el desempeño (`UI.mensajeDesempeno`) y la nueva sección "Revisa tus preguntas falladas" lista, para cada error, el enunciado, la respuesta correcta, la opción elegida —o "Sin respuesta" si se agotó el tiempo— y la explicación (datos de `resumen.falladas` + banco `PREGUNTAS`; la tarjeta se oculta sola con partida perfecta). Botones: jugar de nuevo, ranking e inicio.
- **Ranking y estadísticas**: top 10 con posición, nombre, puntaje, categoría y fecha; podio 1-3 con fondo e ícono de medalla y fila propia resaltada; 4 tarjetas de estadísticas (partidas jugadas, aciertos + porcentaje, récord personal y mejor categoría); borrar con confirmación (también las estadísticas, según el mockup); estado vacío con acceso a configurar una partida.
- **Configuración**: interruptor de sonido, tema claro/oscuro con vista previa, resumen de preferencias y navegación de vuelta al inicio. Ambas preferencias persisten: probado con recarga en `tests/almacenamiento.test.js` y sin recarga en el paso 16 del E2E.

Los textos y estilos nuevos (variantes del mensaje de resultado y componentes `.fallada*`) están registrados en `docs/diseno/notas-mockups.md`, decisiones 6 y 7. No se introdujeron datos de ejemplo: todas las pantallas leen el motor y `js/almacenamiento.js`.

## Pruebas

```bash
node tests/validar-preguntas.js    # banco: 150 preguntas, 30 por categoría, 10 por categoría × dificultad, ids únicos…
node tests/motor-juego.test.js     # motor: puntaje, selección, temporizador (reloj falso), bloqueo de respuestas (58 pruebas)
node tests/almacenamiento.test.js  # persistencia: guardar/leer, orden y top 10, duplicados, borrar, estadísticas y preferencias (34 pruebas)
node tests/e2e-navegador.js        # recorrido completo: genera __e2e.html, lo sirve y lo juega en Chrome headless (90 comprobaciones)
```

Pruebas de imágenes (opcionales; necesitan Python con Playwright, y la segunda necesita internet):

```bash
python3 -m http.server 5180 & python3 tests/e2e-imagenes.py   # interfaz de imágenes con red simulada: carga, fallo, lentitud, crédito, móvil (25 comprobaciones)
node tests/verificar-imagenes.js                               # con internet: comprueba URLs, autor y licencia de cada foto contra Commons
node tests/verificar-imagenes.js --sugerir "File:Nombre.jpg"   # imprime los campos listos para pegar en una pregunta
```

Los cuatro terminan con código de salida `0` cuando todo pasa. El E2E no necesita servidor aparte ni dependencias: usa el Chrome (o Edge) instalado, con tiempo virtual para que los 20 s de cada pregunta duren milisegundos reales. Si el navegador está en otra ruta, se indica con `CHROME_PATH="C:\ruta\chrome.exe" node tests/e2e-navegador.js`. Con `--captura=docs/capturas/resultado-final.png` hace una segunda pasada que se detiene en la pantalla de Resultado y guarda la captura.

## Sonidos

`js/sonido.js` reproduce los audios de `assets/sonido/` y respeta el interruptor **Sonido** de Ajustes (si está apagado no suena nada y se corta lo que esté sonando). Si un archivo falta o el navegador lo bloquea, el juego sigue sin sonido y sin errores.

| Momento | Archivo |
|---|---|
| Clic en un botón principal | `botones.mp3` |
| Respuesta correcta | `rtacorrecta.mp3` |
| Respuesta incorrecta o tiempo agotado | `rtaincorrecta.mp3` |
| Acierto que completa una racha de 3 (3.º, 6.º y 9.º seguidos) | `racha.mp3` |
| Últimos 5 segundos de cada pregunta | `cuentaregresiva.mp3` |

La cuenta regresiva se adapta al archivo: si dura más de 2,5 s se reproduce completa al llegar a sus últimos segundos; si es un "tic" corto, suena una vez por segundo entre 5 y 1. El comodín +10 s la corta si aleja el tiempo. Volúmenes y rutas se ajustan en `Sonido.EFECTOS`. Los audios deben tener licencia que permita su uso; se registran en `ATRIBUCIONES.md`.

## Pendientes

- Añadir y verificar las fotografías de preguntas con internet (`docs/recursos-visuales.md`, sección 3) y registrarlas en `ATRIBUCIONES.md`.
- Opcional: sustituir la ilustración de Inicio por la exportación de Figma (mismo nombre de archivo).
- Definir textos de pista de Fácil y Difícil.
- Etapa 4: sonidos y revisión del tema oscuro; revisión de las preguntas falladas en Resultado.
- Completar los enlaces de entrega en la tabla superior.

## Capturas de pantalla

- Resultado de una partida completa (975 pts, 5/10 aciertos, puesto 1): `docs/capturas/resultado-final.png` — se genera con `node tests/e2e-navegador.js --captura`.
- Diseño de referencia de las 8 pantallas: `docs/diseno/mockup-alta-01..08.jpg`.

## Comandos útiles

```bash
# Sintaxis de los scripts
node --check js/app.js

# Vista previa local (o Live Server en VS Code)
python -m http.server 5173
# Captura de una pantalla a 1440 px con Chrome headless
chrome --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=4000 --window-size=1440,1100 --screenshot=salida.png "http://127.0.0.1:5173/index.html#ranking"
```