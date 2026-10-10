/* ==========================================================================
   almacenamiento.js — Persistencia en localStorage
   Responsabilidad ÚNICA: leer y escribir ranking, estadísticas y preferencias.
   NO calcula puntajes (eso es de juego.js), NO toca el DOM y NO conoce las
   reglas del juego. Todo acceso va en try/catch: localStorage puede estar
   bloqueado (modo privado, navegador con permisos restringidos).
   ========================================================================== */

const Almacenamiento = {
  CLAVES: {
    ranking: 'trivia_ranking',            // definida en el Word (§13)
    estadisticas: 'trivia_stats',         // definida en el Word (§13)
    preferencias: 'trivia_preferencias'   // sonido y tema
  },

  /** Tamaño máximo del ranking (Word §10 RF-13). */
  TOPE_RANKING: 10,

  /* ---------- utilidades internas ---------- */

  /** Lee una clave y devuelve un valor validado, o el respaldo si algo falla. */
  _leer(clave, respaldo) {
    try {
      const crudo = window.localStorage.getItem(clave);
      return crudo === null ? respaldo : JSON.parse(crudo);
    } catch (error) {
      console.warn(`Almacenamiento: no se pudo leer "${clave}".`, error);
      return respaldo;
    }
  },

  /** Escribe una clave. Devuelve true si se guardó y false si no fue posible. */
  _escribir(clave, valor) {
    try {
      window.localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (error) {
      console.warn(`Almacenamiento: no se pudo escribir "${clave}".`, error);
      return false;
    }
  },

  /** Orden del ranking: mayor puntaje primero; en empate, la partida más antigua. */
  _comparar(a, b) {
    if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
  },

  /* ---------- ranking ---------- */

  /** @returns {Array<{nombre, puntaje, categoria, dificultad, fecha}>} top 10 de mayor a menor. */
  obtenerRanking() {
    const ranking = this._leer(this.CLAVES.ranking, []);
    if (!Array.isArray(ranking)) return [];
    return ranking.sort(this._comparar).slice(0, this.TOPE_RANKING);
  },

  /**
   * Agrega la partida, ordena, conserva el top 10 y devuelve la posición
   * obtenida (1-based) o null si no se pudo guardar.
   * @param {{nombre, puntaje, categoria, dificultad, fecha}} partida
   */
  guardarEnRanking(partida) {
    const ranking = this.obtenerRanking();
    const registro = {
      nombre: partida.nombre,
      puntaje: partida.puntaje,
      categoria: partida.categoria,
      dificultad: partida.dificultad,
      fecha: partida.fecha || new Date().toISOString()
    };
    ranking.push(registro);
    ranking.sort(this._comparar);
    const recortado = ranking.slice(0, this.TOPE_RANKING);

    if (!this._escribir(this.CLAVES.ranking, recortado)) return null;

    const posicion = recortado.indexOf(registro);
    return posicion === -1 ? null : posicion + 1;
  },

  /** Borra el ranking y las estadísticas locales (así lo indica el mockup). */
  borrarRanking() {
    try {
      window.localStorage.removeItem(this.CLAVES.ranking);
      window.localStorage.removeItem(this.CLAVES.estadisticas);
      return true;
    } catch (error) {
      console.warn('Almacenamiento: no se pudo borrar el ranking.', error);
      return false;
    }
  },

  /* ---------- estadísticas ---------- */

  /**
   * Formato guardado: { partidas, aciertos, totalPreguntas, mejorPuntaje,
   *                     mejoresPuntajes: { categoriaId: puntaje } }
   */
  obtenerEstadisticas() {
    const base = { partidas: 0, aciertos: 0, totalPreguntas: 0, mejorPuntaje: 0, mejoresPuntajes: {} };
    const guardadas = this._leer(this.CLAVES.estadisticas, base);
    return Object.assign(base, guardadas && typeof guardadas === 'object' ? guardadas : {});
  },

  /** Suma una partida terminada a las estadísticas acumuladas. */
  actualizarEstadisticas(partida) {
    const stats = this.obtenerEstadisticas();
    stats.partidas += 1;
    stats.aciertos += partida.aciertos || 0;
    stats.totalPreguntas += partida.totalPreguntas || 10;
    stats.mejorPuntaje = Math.max(stats.mejorPuntaje, partida.puntaje || 0);

    if (partida.categoria && partida.categoria !== 'todas') {
      const anterior = stats.mejoresPuntajes[partida.categoria] || 0;
      stats.mejoresPuntajes[partida.categoria] = Math.max(anterior, partida.puntaje || 0);
    }

    this._escribir(this.CLAVES.estadisticas, stats);
    return stats;
  },

  /** Mejor puntaje del jugador para una combinación categoría + dificultad. */
  obtenerMejorPuntaje(nombre, categoria, dificultad) {
    const coincidencias = this.obtenerRanking().filter((partida) =>
      partida.nombre === nombre &&
      (categoria === 'todas' || partida.categoria === categoria) &&
      partida.dificultad === dificultad
    );
    if (coincidencias.length === 0) return null;
    return Math.max(...coincidencias.map((partida) => partida.puntaje));
  },

  /* ---------- preferencias ---------- */

  obtenerPreferencias() {
    const base = { sonido: true, tema: 'claro' };
    const guardadas = this._leer(this.CLAVES.preferencias, base);
    const preferencias = Object.assign(base, guardadas && typeof guardadas === 'object' ? guardadas : {});
    if (preferencias.tema !== 'oscuro') preferencias.tema = 'claro';
    return preferencias;
  },

  guardarPreferencias(preferencias) {
    return this._escribir(this.CLAVES.preferencias, {
      sonido: Boolean(preferencias.sonido),
      tema: preferencias.tema === 'oscuro' ? 'oscuro' : 'claro'
    });
  }
};
