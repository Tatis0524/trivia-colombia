/* ==========================================================================
   ui.js — RENDERIZADO del contenido dinámico en el DOM
   Responsabilidad ÚNICA: dibujar datos dentro de los contenedores de index.html
   (categorías, pregunta, opciones, marcadores, resultado, ranking, mensajes).
   NO decide qué pantalla se muestra (eso es app.js), NO calcula nada del juego
   (juego.js) y NO lee/escribe localStorage (almacenamiento.js).
   Recibe datos ya calculados y los pinta.
   ========================================================================== */

const UI = {
  /** Pantalla de configuración de partida: tarjetas de categoría y selector de dificultad. */
  renderConfiguracionPartida(jugador, categorias, dificultades, mejorPuntaje) { throw new Error('UI.renderConfiguracionPartida: pendiente de implementar'); },

  /** Pantalla de juego: enunciado, opciones, progreso (n/10), puntaje y comodines. */
  mostrarPregunta(pregunta, indice, total) { throw new Error('UI.mostrarPregunta: pendiente de implementar'); },

  actualizarTemporizador(segundos) { throw new Error('UI.actualizarTemporizador: pendiente de implementar'); },

  actualizarPuntaje(puntaje) { throw new Error('UI.actualizarPuntaje: pendiente de implementar'); },

  /** Marca opción correcta/incorrecta, bloquea opciones y muestra la explicación. */
  mostrarRetroalimentacion(resultadoRespuesta) { throw new Error('UI.mostrarRetroalimentacion: pendiente de implementar'); },

  /** Oculta visualmente las 2 opciones eliminadas por el 50/50 y deshabilita el comodín usado. */
  aplicarComodin(tipo, datos) { throw new Error('UI.aplicarComodin: pendiente de implementar'); },

  mostrarResultado(resumenPartida, posicionRanking) { throw new Error('UI.mostrarResultado: pendiente de implementar'); },

  renderRanking(ranking, estadisticas) { throw new Error('UI.renderRanking: pendiente de implementar'); },

  /** Aplica el tema (data-tema en <html>) y refleja las preferencias en los controles. */
  aplicarPreferencias(preferencias) { throw new Error('UI.aplicarPreferencias: pendiente de implementar'); },

  /** Muestra u oculta el error de validación de un campo (ej. nombre vacío, RF-01). */
  mostrarErrorCampo(idCampo, mensaje) { throw new Error('UI.mostrarErrorCampo: pendiente de implementar'); },

  /** Mensaje accesible en #mensajes (aria-live). */
  mostrarMensaje(texto, tipo) { throw new Error('UI.mostrarMensaje: pendiente de implementar'); }
};
