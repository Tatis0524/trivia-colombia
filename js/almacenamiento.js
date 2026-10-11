/* ==========================================================================
   almacenamiento.js — Persistencia en localStorage
   Responsabilidad ÚNICA: leer y escribir ranking, estadísticas y preferencias.
   NO calcula puntajes (eso es de juego.js), NO toca el DOM y NO conoce las
   reglas del juego. Todo acceso va en try/catch: localStorage puede estar
   bloqueado (modo privado, navegador con permisos restringidos).

   Integridad de los datos (etapa 4):
   · guardarEnRanking valida los cinco campos antes de escribir: una partida
     incompleta o inválida se rechaza (devuelve null) y NO modifica lo guardado.
   · Los registros idénticos (mismo nombre, puntaje, categoría, dificultad y
     fecha) no se agregan dos veces: repetir el guardado —doble clic, recarga,
     cambio de pantalla— devuelve la posición existente sin duplicar filas.
   · Al leer se descartan entradas corruptas y duplicados, se normalizan los
     textos y el ranking vuelve ordenado con máximo 10 filas (RF-13).
     Leer nunca escribe en el almacenamiento.
   · actualizarEstadisticas deduplica por `fecha` y acumula además
     `mejoresCombinaciones` (mejor puntaje por jugador + dificultad + categoría)
     para que obtenerMejorPuntaje siga siendo correcto cuando esa partida ya
     salió del top 10.
   · obtenerEstadisticas agrega dos campos calculados que NO se persisten:
     `porcentaje` de aciertos y `mejorCategoria` (id; el nombre visible lo
     resuelve ui.js con UI.categoria()).

   Coordinación con las demás integrantes (ver README, "Persistencia local"):
   · app.js es el único llamante: pasa `dificultad`, `jugador` y `fecha` a
     actualizarEstadisticas (campos nuevos, opcionales y retrocompatibles).
   · ui.js lee obtenerRanking/obtenerEstadisticas: sus formatos no cambian.
   · La confirmación (window.confirm) de "Borrar ranking" vive en app.js
     (capa de interfaz); aquí solo se borra.
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

  /** Un registro solo es válido si trae los cinco campos que exige el enunciado. */
  _esRegistroValido(registro) {
    if (!registro || typeof registro !== 'object') return false;
    if (typeof registro.nombre !== 'string' || registro.nombre.trim() === '') return false;
    if (typeof registro.categoria !== 'string' || registro.categoria.trim() === '') return false;
    if (typeof registro.dificultad !== 'string' || registro.dificultad.trim() === '') return false;
    if (typeof registro.puntaje !== 'number' || !Number.isFinite(registro.puntaje) || registro.puntaje < 0) return false;
    if (typeof registro.fecha !== 'string' || Number.isNaN(new Date(registro.fecha).getTime())) return false;
    return true;
  },

  /** Copia canónica (sin espacios de sobra) para guardar y comparar. */
  _normalizar(registro) {
    return {
      nombre: registro.nombre.trim(),
      puntaje: registro.puntaje,
      categoria: registro.categoria.trim(),
      dificultad: registro.dificultad.trim(),
      fecha: registro.fecha
    };
  },

  /** Identidad de una partida para detectar duplicados exactos. */
  _claveRegistro(registro) {
    return [registro.nombre, registro.puntaje, registro.categoria, registro.dificultad, registro.fecha].join('|');
  },

  /** Número mayor o igual a cero; cualquier otra cosa usa el valor por defecto. */
  _numero(valor, predeterminado) {
    return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0 ? valor : predeterminado;
  },

  /** Mapa {clave: puntaje} saneado: fuera claves vacías y valores no numéricos. */
  _mapaNumerico(mapa) {
    const salida = {};
    if (!mapa || typeof mapa !== 'object' || Array.isArray(mapa)) return salida;
    Object.entries(mapa).forEach(([clave, valor]) => {
      if (clave.trim() !== '' && typeof valor === 'number' && Number.isFinite(valor) && valor >= 0) {
        salida[clave] = valor;
      }
    });
    return salida;
  },

  /** Mapa {jugador: {dificultad: {categoria: puntaje}}} saneado por niveles. */
  _mapaCombinaciones(mapa) {
    const salida = {};
    if (!mapa || typeof mapa !== 'object' || Array.isArray(mapa)) return salida;
    Object.entries(mapa).forEach(([jugador, niveles]) => {
      if (jugador.trim() === '' || !niveles || typeof niveles !== 'object' || Array.isArray(niveles)) return;
      Object.entries(niveles).forEach(([dificultad, categorias]) => {
        if (dificultad.trim() === '' || !categorias || typeof categorias !== 'object' || Array.isArray(categorias)) return;
        Object.entries(categorias).forEach(([categoria, puntaje]) => {
          if (categoria.trim() === '' || typeof puntaje !== 'number' || !Number.isFinite(puntaje) || puntaje < 0) return;
          if (!salida[jugador]) salida[jugador] = {};
          if (!salida[jugador][dificultad]) salida[jugador][dificultad] = {};
          salida[jugador][dificultad][categoria] = puntaje;
        });
      });
    });
    return salida;
  },

  /**
   * Orden del ranking: mayor puntaje primero; en empate, la partida más antigua
   * y, si coincide también la fecha, orden alfabético (así el orden es el
   * mismo vengan como vengan las partidas).
   */
  _comparar(a, b) {
    if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
    const fechaA = new Date(a.fecha).getTime();
    const fechaB = new Date(b.fecha).getTime();
    if (fechaA !== fechaB) return fechaA - fechaB;
    return String(a.nombre).localeCompare(String(b.nombre));
  },

  /* ---------- ranking ---------- */

  /**
   * Ranking saneado: entradas inválidas y duplicados exactos fuera, textos sin
   * espacios de sobra, orden consistente y máximo 10 posiciones.
   * @returns {Array<{nombre, puntaje, categoria, dificultad, fecha}>}
   */
  obtenerRanking() {
    const crudo = this._leer(this.CLAVES.ranking, []);
    if (!Array.isArray(crudo)) return [];
    const vistos = new Set();
    const validos = [];
    crudo.forEach((registro) => {
      if (!this._esRegistroValido(registro)) return;
      const limpio = this._normalizar(registro);
      const clave = this._claveRegistro(limpio);
      if (vistos.has(clave)) return;
      vistos.add(clave);
      validos.push(limpio);
    });
    return validos.sort(this._comparar).slice(0, this.TOPE_RANKING);
  },

  /**
   * Agrega la partida terminada, ordena, conserva el top 10 y devuelve la
   * posición obtenida (1-based). Devuelve null si el registro está incompleto
   * o inválido (no se escribe nada) o si el almacenamiento no está disponible.
   * Si la misma partida ya estaba guardada no se duplica: devuelve la posición
   * que ya ocupaba (guardado idempotente).
   * @param {{nombre, puntaje, categoria, dificultad, fecha?}} partida
   * @returns {number|null}
   */
  guardarEnRanking(partida) {
    const candidata = partida && typeof partida === 'object' ? {
      nombre: partida.nombre,
      puntaje: partida.puntaje,
      categoria: partida.categoria,
      dificultad: partida.dificultad,
      fecha: partida.fecha || new Date().toISOString()
    } : null;

    if (!this._esRegistroValido(candidata)) {
      console.warn('Almacenamiento: la partida está incompleta o es inválida; no se guardó.', partida);
      return null;
    }
    const registro = this._normalizar(candidata);

    const ranking = this.obtenerRanking();
    const clave = this._claveRegistro(registro);
    const yaGuardada = ranking.find((guardada) => this._claveRegistro(guardada) === clave);
    if (yaGuardada) return ranking.indexOf(yaGuardada) + 1;   // ya estaba: no duplica

    ranking.push(registro);
    ranking.sort(this._comparar);
    const recortado = ranking.slice(0, this.TOPE_RANKING);

    if (!this._escribir(this.CLAVES.ranking, recortado)) return null;

    const posicion = recortado.indexOf(registro);
    return posicion === -1 ? null : posicion + 1;   // quedó fuera del top 10
  },

  /**
   * Borra el ranking y las estadísticas locales (así lo indica el mockup, que
   * advierte "Borrar el ranking también elimina tus estadísticas locales").
   * NO borra las preferencias. La confirmación al usuario (window.confirm) la
   * hace app.js antes de llamar a esta función.
   */
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
   *                     mejoresPuntajes: { categoriaId: puntaje },
   *                     mejoresCombinaciones: { jugador: { dificultad: { categoriaId: puntaje } } },
   *                     ultimaFecha: ISO | null }
   * `mejoresCombinaciones` y `ultimaFecha` son internos: el primero responde
   * "mejor puntaje por categoría y dificultad" más allá del top 10, el segundo
   * evita contar dos veces la misma partida finalizada.
   */
  _datosEstadisticas() {
    const base = {
      partidas: 0,
      aciertos: 0,
      totalPreguntas: 0,
      mejorPuntaje: 0,
      mejoresPuntajes: {},
      mejoresCombinaciones: {},
      ultimaFecha: null
    };
    const guardadas = this._leer(this.CLAVES.estadisticas, null);
    if (!guardadas || typeof guardadas !== 'object' || Array.isArray(guardadas)) return base;

    base.partidas = this._numero(guardadas.partidas, 0);
    base.aciertos = this._numero(guardadas.aciertos, 0);
    base.totalPreguntas = this._numero(guardadas.totalPreguntas, 0);
    base.mejorPuntaje = this._numero(guardadas.mejorPuntaje, 0);
    base.mejoresPuntajes = this._mapaNumerico(guardadas.mejoresPuntajes);
    base.mejoresCombinaciones = this._mapaCombinaciones(guardadas.mejoresCombinaciones);
    base.ultimaFecha = typeof guardadas.ultimaFecha === 'string' &&
      !Number.isNaN(new Date(guardadas.ultimaFecha).getTime())
      ? guardadas.ultimaFecha
      : null;
    return base;
  },

  /**
   * Estadísticas acumuladas del dispositivo, saneadas. Incluye además dos
   * campos calculados que NO se guardan: `porcentaje` de aciertos (redondeo
   * entero; 0 si aún no hay preguntas) y `mejorCategoria` (id de la categoría
   * con más puntos, o null; "todas" no cuenta porque reparte varias).
   * ui.js presenta estos mismos datos con la misma fórmula.
   */
  obtenerEstadisticas() {
    const stats = this._datosEstadisticas();
    stats.porcentaje = stats.totalPreguntas > 0
      ? Math.round((stats.aciertos / stats.totalPreguntas) * 100)
      : 0;
    let mejorCategoria = null;
    Object.entries(stats.mejoresPuntajes).forEach(([categoria, puntaje]) => {
      if (mejorCategoria === null || puntaje > stats.mejoresPuntajes[mejorCategoria]) {
        mejorCategoria = categoria;
      }
    });
    stats.mejorCategoria = mejorCategoria;
    return stats;
  },

  /**
   * Suma una partida terminada a las estadísticas acumuladas.
   * Rechaza (sin escribir nada) los datos inválidos: sin aciertos numéricos,
   * con aciertos que superan el total o con puntaje negativo/no numérico.
   * Deduplica por `fecha`: llamar dos veces con la misma fecha —el mismo
   * resultado finalizado— solo cuenta una vez.
   * @param {{aciertos, totalPreguntas?, puntaje, categoria?, dificultad?, jugador?, fecha?}} partida
   */
  actualizarEstadisticas(partida) {
    const datos = partida && typeof partida === 'object' ? partida : null;
    const aciertos = datos ? this._numero(datos.aciertos, null) : null;
    const puntaje = datos ? this._numero(datos.puntaje, null) : null;

    if (aciertos === null || puntaje === null) {
      console.warn('Almacenamiento: estadísticas no actualizadas, la partida recibida es inválida.', partida);
      return this.obtenerEstadisticas();
    }

    const total = this._numero(datos.totalPreguntas, 0);
    const totalPreguntas = total > 0 ? total : 10;
    if (aciertos > totalPreguntas) {
      console.warn('Almacenamiento: estadísticas no actualizadas, los aciertos superan el total de preguntas.', partida);
      return this.obtenerEstadisticas();
    }

    const categoria = typeof datos.categoria === 'string' && datos.categoria.trim() !== '' ? datos.categoria.trim() : null;
    const dificultad = typeof datos.dificultad === 'string' && datos.dificultad.trim() !== '' ? datos.dificultad.trim() : null;
    const jugador = typeof datos.jugador === 'string' && datos.jugador.trim() !== '' ? datos.jugador.trim() : null;
    const fecha = typeof datos.fecha === 'string' && !Number.isNaN(new Date(datos.fecha).getTime())
      ? datos.fecha
      : null;

    const stats = this._datosEstadisticas();
    if (fecha && fecha === stats.ultimaFecha) return this.obtenerEstadisticas();   // ya contada

    stats.partidas += 1;
    stats.aciertos += aciertos;
    stats.totalPreguntas += totalPreguntas;
    stats.mejorPuntaje = Math.max(stats.mejorPuntaje, puntaje);

    // "Mejor categoría" se alimenta solo de partidas de una categoría concreta.
    if (categoria && categoria !== 'todas') {
      stats.mejoresPuntajes[categoria] = Math.max(stats.mejoresPuntajes[categoria] || 0, puntaje);
    }

    // Mejor puntaje por jugador + dificultad + categoría (incluye "todas",
    // para que la consulta de la configuración responda también en "todas").
    if (jugador && dificultad && categoria) {
      if (!stats.mejoresCombinaciones[jugador]) stats.mejoresCombinaciones[jugador] = {};
      if (!stats.mejoresCombinaciones[jugador][dificultad]) stats.mejoresCombinaciones[jugador][dificultad] = {};
      const anterior = stats.mejoresCombinaciones[jugador][dificultad][categoria] || 0;
      stats.mejoresCombinaciones[jugador][dificultad][categoria] = Math.max(anterior, puntaje);
    }

    if (fecha) stats.ultimaFecha = fecha;
    this._escribir(this.CLAVES.estadisticas, stats);
    return this.obtenerEstadisticas();
  },

  /**
   * Mejor puntaje de un jugador para una combinación categoría + dificultad
   * (la tarjeta "Tu mejor puntaje" de la pantalla de configuración).
   * Usa `mejoresCombinaciones` (que no depende del top 10) y como respaldo las
   * partidas todavía guardadas en el ranking —dato heredado de antes de
   * existir las combinaciones o si las estadísticas se perdieron—.
   * @param {string} nombre jugador · @param {string} categoria id o 'todas'
   * @param {string} dificultad id · @returns {number|null}
   */
  obtenerMejorPuntaje(nombre, categoria, dificultad) {
    if (typeof nombre !== 'string' || nombre.trim() === '' ||
        typeof categoria !== 'string' || typeof dificultad !== 'string') return null;
    const jugador = nombre.trim();
    const combinaciones = this._datosEstadisticas().mejoresCombinaciones[jugador];
    let mejor = null;
    const considerar = (puntaje) => {
      if (typeof puntaje === 'number' && Number.isFinite(puntaje) && puntaje >= 0 &&
          (mejor === null || puntaje > mejor)) {
        mejor = puntaje;
      }
    };

    if (combinaciones && combinaciones[dificultad]) {
      if (categoria === 'todas') {
        Object.values(combinaciones[dificultad]).forEach(considerar);
      } else {
        considerar(combinaciones[dificultad][categoria]);
      }
    }

    this.obtenerRanking()
      .filter((partida) =>
        partida.nombre === jugador &&
        (categoria === 'todas' || partida.categoria === categoria) &&
        partida.dificultad === dificultad)
      .forEach((partida) => considerar(partida.puntaje));

    return mejor;
  },

  /* ---------- preferencias ---------- */

  /**
   * Preferencias saneadas: solo `sonido` (booleano, por defecto true) y
   * `tema` ('claro' | 'oscuro', por defecto 'claro'). Cualquier otra clave o
   * valor guardado se ignora.
   */
  obtenerPreferencias() {
    const guardadas = this._leer(this.CLAVES.preferencias, null);
    const datos = guardadas && typeof guardadas === 'object' && !Array.isArray(guardadas) ? guardadas : {};
    return {
      sonido: typeof datos.sonido === 'boolean' ? datos.sonido : true,
      tema: datos.tema === 'oscuro' ? 'oscuro' : 'claro'
    };
  },

  /**
   * Guarda las preferencias combinándolas con las ya guardadas: se puede pasar
   * un solo campo y el otro se conserva (app.js las mezcla igualmente antes de
   * llamar). Solo persiste `sonido` y `tema`, normalizados.
   */
  guardarPreferencias(preferencias) {
    const entradas = preferencias && typeof preferencias === 'object' && !Array.isArray(preferencias)
      ? preferencias
      : {};
    const combinadas = Object.assign({}, this.obtenerPreferencias(), entradas);
    return this._escribir(this.CLAVES.preferencias, {
      sonido: typeof combinadas.sonido === 'boolean' ? combinadas.sonido : true,
      tema: combinadas.tema === 'oscuro' ? 'oscuro' : 'claro'
    });
  }
};
