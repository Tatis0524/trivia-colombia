# Trivia Colombia

Juego web de preguntas y respuestas sobre Colombia (geografía, historia, cultura y tradiciones, deportes, ciencia y naturaleza). Se ejecuta completamente en el navegador, sin servidor ni inicio de sesión.

**Proyecto académico** — Universidad de Santander (UDES) · Desarrollo Full Stack · Docente: Carlos Carrascal.

**Integrantes:** Tatiana Espinosa Rojas · María Catalina Coronel Díaz

## Destacados

- **150 preguntas originales** repartidas en 5 categorías (Geografía, Historia, Cultura, Deportes y Naturaleza) × 3 niveles de dificultad (Fácil, Medio, Difícil), más la opción **Todas** que mezcla las cinco categorías.
- **Partida completa**: sorteo aleatorio de 10 preguntas sin repetir, opciones mezcladas, temporizador de 20 s por pregunta y barra de progreso.
- **Sistema de puntuación con recompensa por rapidez y racha**, multiplicado por la dificultad (hasta 4.300 puntos en Difícil).
- **Dos comodines por partida**: 50/50 (elimina dos opciones incorrectas) y +10 s (suma tiempo), con penalización de −30 puntos por uso.
- **8 pantallas navegables** con enlaces profundos por hash (`index.html#ranking`), para revisar cada vista sin jugar una partida completa.
- **Ranking y estadísticas persistentes** en `localStorage`: top 10 por puntaje, partidas jugadas, porcentaje de aciertos, récord personal y mejor categoría.
- **Revisión de preguntas falladas** en Resultado: enunciado, respuesta correcta, tu respuesta y explicación de cada error.
- **Sonidos** de acierto, error, racha y cuenta regresiva final, con interruptor on/off en Configuración.
- **27 preguntas con fotografía** de Wikimedia Commons (licencia abierta, atribución visible en [`docs/recursos-visuales.md`](docs/recursos-visuales.md)); si una imagen no carga, se muestra el ícono de la categoría.
- **Accesible y responsive**: HTML semántico, navegación por teclado, mensajes `aria-live` para lectores de pantalla y diseño mobile-first desde 360 px.

## Tecnologías

HTML5 · CSS3 (variables, Flexbox, Grid, media queries) · JavaScript ES6+ (vanilla) · localStorage. Sin frameworks, sin build ni backend.

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
│   ├── app.js              ENTRADA y NAVEGACIÓN: arranca la app y conecta los módulos
│   └── sonido.js           SONIDOS: reproduce los efectos y respeta el ajuste de sonido
├── assets/
│   ├── img/                Ilustración de Inicio, escudo, favicon e íconos de categorías
│   └── sonido/             Efectos de sonido (botones, acierto, error, racha, cuenta regresiva)
└── docs/                   Diseño de referencia y registro de recursos visuales
```

| Archivo | Hace | No hace |
|---|---|---|
| `preguntas.js` | Define `CATEGORIAS`, `DIFICULTADES` y `PREGUNTAS` | Filtrar, mezclar o validar |
| `almacenamiento.js` | Lee/escribe (validando y deduplicando) ranking, estadísticas y preferencias | Calcular puntajes o tocar el DOM |
| `juego.js` | Reglas, estado, temporizador, puntaje, comodines | Tocar el DOM o localStorage |
| `ui.js` | Pintar pregunta, opciones, resultado, ranking, mensajes | Decidir la pantalla o calcular el juego |
| `app.js` | `irA(pantalla)`, eventos, orden de arranque | Reglas del juego o dibujo dinámico |
| `sonido.js` | Reproducir efectos según el momento del juego | Reglas del juego o dibujo dinámico |

Orden de carga (por dependencias): `preguntas` → `almacenamiento` → `juego` → `ui` → `app` → `sonido`.

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

Cada pantalla tiene enlace directo por hash (`index.html#juego`, `index.html#ranking`…), incluso con una partida en curso.

## Funcionalidades

### Juego

- **Partida**: 10 preguntas aleatorias sin repetir dentro de la categoría y dificultad elegidas, opciones mezcladas y selección de imágenes de apoyo cuando las hay.
- **Temporizador**: 20 s por pregunta con barra visual; al agotarse cuenta como error. El reloj se pausa al cambiar de pantalla y se reanuda al volver.
- **Validación**: tras responder se resaltan la opción correcta e incorrecta, se bloquean las demás y aparece la explicación; solo se registra una respuesta por pregunta.
- **Racha**: aciertos consecutivos dan puntos extra (al 3.º, 6.º y 9.º seguido); un error o el tiempo agotado la reinician.

### Puntaje

1. Acierto: **100** + rapidez (**+5 por segundo restante**, tope +100) + racha (**+50** en los hitos).
2. La suma se **multiplica** por la dificultad: Fácil ×1, Medio ×1,5, Difícil ×2.
3. Error o tiempo agotado: 0 puntos.
4. Cada comodín descuenta **−30 puntos fijos**; el total nunca baja de 0.
5. Máximo teórico por partida: Fácil **2.150** · Medio **3.225** · Difícil **4.300**.

### Comodines

| Comodín | Efecto | Uso |
|---|---|---|
| **50/50** | Elimina dos opciones incorrectas | 1 por partida, −30 puntos |
| **+10 s** | Suma 10 segundos al temporizador | 1 por partida, −30 puntos |

### Sonidos

`js/sonido.js` reproduce los audios de `assets/sonido/` y respeta el interruptor **Sonido** de Configuración (si está apagado no suena nada). Si un archivo falta o el navegador lo bloquea, el juego sigue sin sonido y sin errores.

| Momento | Archivo |
|---|---|
| Clic en un botón principal | `botones.mp3` |
| Respuesta correcta | `rtacorrecta.mp3` |
| Respuesta incorrecta o tiempo agotado | `rtaincorrecta.mp3` |
| Acierto que completa racha de 3 | `racha.mp3` |
| Últimos 5 segundos de cada pregunta | `cuentaregresiva.mp3` |

### Persistencia (`localStorage`)

- **Ranking** (`trivia_ranking`): top 10 por puntaje con desempate por fecha; solo se guardan partidas terminadas y validadas, sin duplicados.
- **Estadísticas** (`trivia_stats`): partidas jugadas, aciertos con porcentaje, récord personal y categoría con mejor desempeño.
- **Preferencias** (`trivia_preferencias`): sonido y tema (claro/oscuro), que sobreviven a la recarga.
- **Borrar ranking** elimina ranking y estadísticas (con confirmación) y conserva las preferencias.
- Lecturas y escrituras van en `try/catch`: con almacenamiento bloqueado o datos corruptos la app sigue funcionando con listas vacías y valores por defecto.

### Accesibilidad y diseño

- HTML semántico con enlace "Saltar al contenido", foco visible y navegación por teclado en todas las pantallas.
- Mensajes `aria-live` para aciertos, errores y validaciones de formulario.
- Modo claro/oscuro con vista previa en Configuración.
- Diseño **mobile-first** desde 360 px, con ajustes en tableta (≥768 px) y escritorio (≥1024 px).
