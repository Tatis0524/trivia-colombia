/* ==========================================================================
   juego.js — LÓGICA de la partida
   Responsabilidad ÚNICA: estado de la partida, selección de preguntas,
   temporizador, validación de respuestas, comodines, racha y puntaje.
   NO toca el DOM (eso es ui.js) y NO usa localStorage (eso es almacenamiento.js).
   Si necesita avisar a la interfaz, lo hará mediante callbacks que le entregue app.js.
   ========================================================================== */

/* Reglas que coinciden en el Word y en el diseño.
   El sistema de PUNTUACIÓN no se define aquí todavía: hay una decisión abierta (ver README). */
const REGLAS = {
  preguntasPorPartida: 10,
  tiempoPorPregunta: 20,     // segundos
  tiempoExtra: 10,           // segundos que suma el comodín
  opcionesPorPregunta: 4
};

const Juego = {
  /** Estado de la partida (estructura definida en el Word, §13). Se crea en iniciarPartida(). */
  estado: null,

  /** Reinicia el estado, selecciona las preguntas y deja lista la primera. */
  iniciarPartida(jugador, categoria, dificultad) { throw new Error('Juego.iniciarPartida: pendiente de implementar'); },

  /** Filtra PREGUNTAS por categoría/dificultad, las mezcla y devuelve REGLAS.preguntasPorPartida. */
  obtenerPreguntas(categoria, dificultad) { throw new Error('Juego.obtenerPreguntas: pendiente de implementar'); },

  /** Fisher-Yates. Única función de mezcla del proyecto (también para las opciones). */
  mezclar(arreglo) { throw new Error('Juego.mezclar: pendiente de implementar'); },

  iniciarTemporizador() { throw new Error('Juego.iniciarTemporizador: pendiente de implementar'); },

  detenerTemporizador() { throw new Error('Juego.detenerTemporizador: pendiente de implementar'); },

  /** Valida la respuesta, calcula puntos y actualiza racha. Recibe null si se agotó el tiempo. */
  responder(indiceOpcion) { throw new Error('Juego.responder: pendiente de implementar'); },

  /** tipo: 'cincuenta' | 'tiempo'. Cada uno se usa una vez por partida. */
  usarComodin(tipo) { throw new Error('Juego.usarComodin: pendiente de implementar'); },

  /** Avanza a la siguiente pregunta; devuelve false si la partida terminó. */
  siguientePregunta() { throw new Error('Juego.siguientePregunta: pendiente de implementar'); },

  /** Objeto resumen de la partida (puntaje, aciertos, tiempo total, falladas) para ui.js y almacenamiento.js. */
  finalizarPartida() { throw new Error('Juego.finalizarPartida: pendiente de implementar'); }
};
