# Trivia Colombia

Juego web de preguntas y respuestas sobre Colombia (geografía, historia, cultura y tradiciones, deportes, ciencia y naturaleza). Se ejecuta completamente en el navegador, sin servidor ni inicio de sesión.

Proyecto académico — Universidad de Santander (UDES) · Desarrollo Full Stack · Docente: Carlos Carrascal · Parcial basado en proyecto.

**Estudiante:** `[PENDIENTE: nombre del estudiante]`

> **Estado actual: etapa 2 — maquetación completa.** Las 8 pantallas de escritorio están maquetadas con HTML semántico, CSS con variables de la guía de estilos y navegación funcional (incluidos enlaces profundos por hash, por ejemplo `index.html#ranking`). La lógica del juego y el banco de preguntas **llegan en la etapa 3**; mientras tanto, las pantallas 4, 5 y 6 muestran estados vacíos con acciones definidas.

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
├── docs/diseno/            Exportaciones (PDF/PNG) del diseño de Figma
└── README.md
```

| Archivo | Hace | No hace |
|---|---|---|
| `preguntas.js` | Define `CATEGORIAS`, `DIFICULTADES` y `PREGUNTAS` | Filtrar, mezclar o validar |
| `almacenamiento.js` | Lee/escribe `trivia_ranking`, `trivia_stats` y preferencias | Calcular puntajes o tocar el DOM |
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

1. **Sistema de puntuación (resuelta).** Se implementa la versión de los mockups: +100 por acierto, sin bonificaciones ni penalización, máximo 1.000 puntos (10 × 100). Difiere del Word §6.1, que incluía bono por tiempo restante, bono por racha, penalización por comodín y multiplicador por dificultad.
2. **Enlaces profundos (resuelta).** Cada pantalla tiene un enlace por hash (`#inicio`, `#juego`, `#ranking`…) para poder revisar las 8 pantallas sin jugar una partida completa.
3. **Pantallas sin motor (resuelta).** Juego, Retroalimentación y Resultado muestran estados vacíos con acción definida hasta que la etapa 3 conecte el motor.
4. **Ilustración de Inicio (pendiente).** `assets/img/hero-colombia.svg` es un marcador de posición; falta exportar el asset desde Figma.
5. **Textos dinámicos (parcialmente pendientes).** El mockup define los textos de "Todas" y "Medio"; las pistas de Fácil/Difícil y algunas variantes de resultado/retroalimentación son plantillas provisionales (marcadas en `docs/diseno/notas-mockups.md`).
6. **Tema oscuro.** No existe mockup; los valores en `styles.css` son provisionales.
7. **Tamaño del banco de preguntas (para la etapa 3).** El Word indica "al menos 50 preguntas" (§2.2 y §13) y también "mínimo 30 por categoría" (§6.2), es decir, 150 como mínimo.
8. **Contenido del ranking (para la etapa 3).** El Word pide el top 10 por puntaje; el mockup dice "las 10 partidas más recientes, ordenadas por puntaje". `almacenamiento.js` implementa top 10 por puntaje con desempate por fecha.

## Plan de etapas

- [x] Etapa 1 — Estructura inicial.
- [x] Etapa 2 — Maquetación HTML/CSS de las 8 pantallas (este commit).
- [ ] Etapa 3 — Lógica del juego y banco de preguntas.
- [ ] Etapa 4 — Comodines, ranking, estadísticas, sonidos y tema oscuro.
- [ ] Etapa 5 — Pruebas, ajustes frente al diseño, despliegue en Vercel y video.

## Verificación de la maquetación (etapa 2)

- Las 8 pantallas se compararon con `docs/diseno/mockup-alta-01..08.jpg` a 1440 px (capturas con Chrome headless). Diferencias corregidas durante la etapa: control de dificultad en fila, tarjetas de categoría con ícono superior, unificación de categoría + dificultad en una tarjeta, cifra grande de mejor puntaje y ocultamiento de tarjetas vacías en Retroalimentación.
- `node --check` sin errores en los 5 archivos JS.
- El ranking con datos de ejemplo renderiza correctamente (estadísticas, tabla y resaltado del jugador).

## Pendientes para la etapa 3

- Exportar la ilustración de Inicio desde Figma a `assets/img/hero-colombia.svg`.
- Definir textos de pista de Fácil y Difícil.
- Definir variantes de textos de Resultado (0 aciertos, récord) y Retroalimentación (respuesta correcta).
- Completar los enlaces de entrega en la tabla superior.

## Capturas de pantalla

`[PENDIENTE: capturas del juego terminado]`

## Comandos útiles

```bash
# Sintaxis de los scripts
node --check js/app.js

# Vista previa local (o Live Server en VS Code)
python -m http.server 5173
# Captura de una pantalla a 1440 px con Chrome headless
chrome --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=4000 --window-size=1440,1100 --screenshot=salida.png "http://127.0.0.1:5173/index.html#ranking"
```
