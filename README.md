# Trivia Colombia

Juego web de preguntas y respuestas sobre Colombia (geografía, historia, cultura y tradiciones, deportes, ciencia y naturaleza). Se ejecuta completamente en el navegador, sin servidor ni inicio de sesión.

**Proyecto académico** — Universidad de Santander (UDES) · Desarrollo Full Stack · Docente: Carlos Carrascal.

**Integrantes:** Tatiana Espinosa Rojas · María Catalina Coronel Díaz

## Tecnologías

HTML5 · CSS3 (variables, Flexbox, Grid, media queries) · JavaScript ES6+ (vanilla) · localStorage. Sin frameworks ni backend.

## Cómo ejecutarlo

1. Abre la carpeta `trivia-colombia/` en Visual Studio Code.
2. Instala la extensión **Live Server**.
3. Clic derecho sobre `index.html` → **Open with Live Server**.

Los scripts son clásicos (sin módulos ES), así que también funciona abriendo `index.html` directamente, aunque se recomienda Live Server.

## Estructura

```
trivia-colombia/
├── index.html              Estructura semántica y contenedores de las 8 pantallas
├── css/
│   ├── styles.css          Variables (colores, tipografía, espaciado) y componentes base
│   └── responsive.css      Media queries (tableta ≥768 px y escritorio ≥1024 px)
├── js/
│   ├── preguntas.js        DATOS: categorías, dificultades y banco de 150 preguntas
│   ├── almacenamiento.js   localStorage: ranking, estadísticas y preferencias
│   ├── juego.js            LÓGICA: estado, selección, temporizador, puntaje, comodines
│   ├── ui.js               RENDERIZADO: dibuja los datos en el DOM
│   └── app.js              ENTRADA y NAVEGACIÓN: arranca la app y conecta los módulos
├── assets/img/             Ilustración de Inicio, escudo, favicon e íconos de categorías
└── docs/                   Diseño de referencia y registro de recursos visuales
```

| Archivo | Hace | No hace |
|---|---|---|
| `preguntas.js` | Define `CATEGORIAS`, `DIFICULTADES` y `PREGUNTAS` | Filtrar, mezclar o validar |
| `almacenamiento.js` | Lee/escribe (validando y deduplicando) ranking, estadísticas y preferencias | Calcular puntajes o tocar el DOM |
| `juego.js` | Reglas, estado, temporizador, puntaje, comodines | Tocar el DOM o localStorage |
| `ui.js` | Pintar pregunta, opciones, resultado, ranking, mensajes | Decidir la pantalla o calcular el juego |
| `app.js` | `irA(pantalla)`, eventos, orden de arranque | Reglas del juego o dibujo dinámico |

Orden de carga (por dependencias): `preguntas` → `almacenamiento` → `juego` → `ui` → `app`.

## Pantallas (8)

| # | Pantalla | `data-pantalla` | Contenido |
|---|---|---|---|
| 1 | Inicio | `inicio` | Nombre del jugador, Jugar, Instrucciones, Ranking, Configuración |
| 2 | Instrucciones | `instrucciones` | Reglas, puntuación, comodines |
| 3 | Configuración de partida | `configuracion-partida` | Categorías (5 + Todas), dificultad, mejor puntaje |
| 4 | Juego | `juego` | Enunciado, 4 opciones, temporizador, progreso n/10, puntaje, comodines |
| 5 | Retroalimentación | `retroalimentacion` | Correcta/incorrecta, explicación, Siguiente pregunta |
| 6 | Resultado | `resultado` | Puntaje, aciertos, tiempo total, posición, revisión de falladas |
| 7 | Ranking y estadísticas | `ranking` | Top 10, estadísticas del jugador, borrar |
| 8 | Configuración general | `configuracion` | Sonido on/off, tema claro/oscuro |

## Funcionalidades

- **Partida**: 10 preguntas aleatorias sin repetir, opciones mezcladas, temporizador de 20 s por pregunta y barra de progreso.
- **Puntaje**: 100 por acierto + rapidez (+5 por segundo restante, tope +100) + racha (+50 al 3.º, 6.º y 9.º acierto seguido); la suma se multiplica por la dificultad (Fácil ×1, Medio ×1,5, Difícil ×2). Error o tiempo agotado: 0 puntos y se pierde la racha.
- **Comodines**: 50/50 y +10 s, uno de cada uno por partida, con −30 puntos fijos por uso.
- **Resultado**: resumen de la partida, posición en el ranking y revisión de las preguntas falladas con la respuesta correcta y su explicación.
- **Persistencia** (`localStorage`): ranking top 10 por puntaje, estadísticas y preferencias (sonido y tema). Solo se guardan partidas terminadas y validadas.
- **Imágenes de apoyo**: 27 preguntas incluyen una foto de Wikimedia Commons con licencia abierta, con atribución visible; si una imagen no carga, se muestra el ícono de la categoría. Detalle y licencias en [`docs/recursos-visuales.md`](docs/recursos-visuales.md).
- **Accesible y responsive**: HTML semántico, navegación por teclado, mensajes `aria-live` y diseño mobile-first desde 360 px.
