/* ==========================================================================
   almacenamiento.js — Persistencia en localStorage
   Responsabilidad ÚNICA: leer y escribir ranking, estadísticas y preferencias.
   NO calcula puntajes, NO toca el DOM y NO conoce las reglas del juego.
   Todo acceso a localStorage debe ir en try/catch (puede estar bloqueado).
   ========================================================================== */

const Almacenamiento = {
  CLAVES: {
    ranking: 'trivia_ranking',            // definida en el Word (§13)
    estadisticas: 'trivia_stats',         // definida en el Word (§13)
    preferencias: 'trivia_preferencias'   // nombre propuesto: sonido y tema (confirmar)
  },

  /** @returns {Array<{nombre, puntaje, categoria, dificultad, fecha}>} top 10 ordenado de mayor a menor. */
  obtenerRanking() { throw new Error('Almacenamiento.obtenerRanking: pendiente de implementar'); },

  /** Agrega la partida, ordena, conserva el top 10 y devuelve la posición obtenida (o null). */
  guardarEnRanking(partida) { throw new Error('Almacenamiento.guardarEnRanking: pendiente de implementar'); },

  borrarRanking() { throw new Error('Almacenamiento.borrarRanking: pendiente de implementar'); },

  /** Partidas jugadas, % de aciertos, mejor puntaje y mejor categoría. */
  obtenerEstadisticas() { throw new Error('Almacenamiento.obtenerEstadisticas: pendiente de implementar'); },

  actualizarEstadisticas(partida) { throw new Error('Almacenamiento.actualizarEstadisticas: pendiente de implementar'); },

  /** Mejor puntaje del jugador para una combinación categoría + dificultad. */
  obtenerMejorPuntaje(nombre, categoria, dificultad) { throw new Error('Almacenamiento.obtenerMejorPuntaje: pendiente de implementar'); },

  obtenerPreferencias() { throw new Error('Almacenamiento.obtenerPreferencias: pendiente de implementar'); },

  guardarPreferencias(preferencias) { throw new Error('Almacenamiento.guardarPreferencias: pendiente de implementar'); }
};
