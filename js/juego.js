/* ==========================================================================
   juego.js — LÓGICA de la partida
   Responsabilidad ÚNICA: estado de la partida, selección de preguntas,
   temporizador, validación de respuestas, comodines, racha y puntaje.
   NO toca el DOM (eso es ui.js) y NO usa localStorage (eso es almacenamiento.js).
   Para avisar a la interfaz usa callbacks que le entrega app.js (Juego.conectar).

   ---------------------------------------------------------------------------
   PUNTUACIÓN (Word §6.1) — orden de aplicación
   ---------------------------------------------------------------------------
   Para cada respuesta CORRECTA:
     1. base     = 100
     2. rapidez  = 5 × segundos restantes al responder, con tope de +100
     3. racha    = +50 cuando la racha de aciertos llega a 3, 6, 9… (cada 3 seguidos)
     4. bruto    = base + rapidez + racha
     5. total    = redondear( bruto × multiplicador de dificultad )
        multiplicador: fácil ×1 · medio ×1,5 · difícil ×2
        (el multiplicador afecta a los puntos de la pregunta, incluidos rapidez y racha;
         el redondeo es al entero más cercano, el .5 sube).
   Respuesta incorrecta o tiempo agotado: 0 puntos y la racha vuelve a 0.

   PENALIZACIÓN POR COMODÍN
     · Cada comodín usado resta 30 puntos, un valor FIJO: NO se multiplica.
     · Se descuenta del total acumulado, no de una pregunta concreta.
     · El puntaje mostrado nunca baja de 0:  puntaje = max(0, puntos ganados − penalizaciones).
       (Así usar un comodín al inicio, con 0 puntos, no genera un puntaje negativo
        y la penalización se compensa con los aciertos posteriores.)

   PUNTAJE MÁXIMO POSIBLE (10 aciertos, siempre con ≥20 s restantes, sin comodines):
     (10 × (100 + 100) + 3 × 50) × multiplicador = 2.150 × multiplicador
     → fácil 2.150 · medio 3.225 · difícil 4.300.

   Cambio respecto a la etapa 2: allí se había implementado la versión del mockup
   (+100 plano, máximo 1.000). Esta etapa aplica el Word §6.1 por solicitud de la
   estudiante. Está documentado en el README (decisión 1).
   ========================================================================== */

const REGLAS = {
  preguntasPorPartida: 10,
  // Mínimo de preguntas con foto que el sorteo garantiza por partida (si el
  // banco tiene suficientes fotos para la categoría y dificultad elegidas).
  imagenesMinimasPorPartida: 4,
  tiempoPorPregunta: 20,     // segundos
  tiempoExtra: 10,           // segundos que suma el comodín de tiempo
  opcionesPorPregunta: 4,
  puntosPorAcierto: 100,
  puntosPorSegundo: 5,       // bonificación por rapidez
  bonoRapidezMaximo: 100,
  rachaLongitud: 3,          // cada 3 aciertos seguidos…
  bonoRacha: 50,             // …suma 50 puntos
  penalizacionComodin: 30,
  multiplicadores: { facil: 1, medio: 1.5, dificil: 2 },
  nombreMinimo: 2,
  nombreMaximo: 20
};

const Juego = {
  /** Estado de la partida (estructura del Word §13 + campos de control). Se crea en iniciarPartida(). */
  estado: null,

  /** Callbacks que entrega app.js: { alTick(segundosRestantes), alAgotarTiempo(resultado) }. */
  callbacks: {},

  /** Fuente de azar y reloj inyectables (las pruebas los sustituyen por versiones deterministas). */
  aleatorio() { return Math.random(); },
  _reloj: {
    iniciar(funcion, ms) { return globalThis.setInterval(funcion, ms); },
    detener(id) { globalThis.clearInterval(id); }
  },
  _temporizadorId: null,

  conectar(callbacks) { this.callbacks = Object.assign({}, callbacks); },

  /* ------------------------------------------------------------------ */
  /* Validación del nombre (RF-01)                                       */
  /* ------------------------------------------------------------------ */

  /** @returns {{valido: boolean, nombre?: string, error?: string}} */
  validarNombre(nombre) {
    const limpio = String(nombre ?? '').replace(/\s+/g, ' ').trim();
    if (limpio.length < REGLAS.nombreMinimo) {
      return { valido: false, error: `Escribe un nombre de al menos ${REGLAS.nombreMinimo} caracteres para jugar.` };
    }
    if (limpio.length > REGLAS.nombreMaximo) {
      return { valido: false, error: `El nombre puede tener máximo ${REGLAS.nombreMaximo} caracteres.` };
    }
    if (!/[\p{L}\p{N}]/u.test(limpio)) {
      return { valido: false, error: 'El nombre debe tener al menos una letra o un número.' };
    }
    return { valido: true, nombre: limpio };
  },

  /* ------------------------------------------------------------------ */
  /* Selección de preguntas                                              */
  /* ------------------------------------------------------------------ */

  /** Fisher-Yates. Única función de mezcla del proyecto (preguntas y opciones). No modifica el original. */
  mezclar(arreglo) {
    const copia = Array.from(arreglo);
    for (let i = copia.length - 1; i > 0; i -= 1) {
      const j = Math.min(i, Math.floor(this.aleatorio() * (i + 1)));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  },

  /** Copia de la pregunta con las 4 opciones mezcladas y `correcta` recalculada. No toca PREGUNTAS. */
  _prepararPregunta(pregunta) {
    const orden = this.mezclar(pregunta.opciones.map((_, i) => i));
    const copia = Object.assign({}, pregunta);
    copia.opciones = orden.map((i) => pregunta.opciones[i]);
    copia.correcta = orden.indexOf(pregunta.correcta);
    return copia;
  },

  _validarSeleccion(categoria, dificultad) {
    if (!CATEGORIAS.some((c) => c.id === categoria)) throw new Error(`Categoría no válida: "${categoria}".`);
    if (!DIFICULTADES.some((d) => d.id === dificultad)) throw new Error(`Dificultad no válida: "${dificultad}".`);
  },

  /** Filtra PREGUNTAS por categoría ("todas" incluye las cinco) y dificultad, mezcla y devuelve 10 sin repetir.
   *  Garantiza que la partida incluya al menos REGLAS.imagenesMinimasPorPartida preguntas con foto
   *  (si el banco dispone de esa cantidad para la combinación elegida). */
  obtenerPreguntas(categoria, dificultad) {
    this._validarSeleccion(categoria, dificultad);
    const disponibles = PREGUNTAS.filter((p) =>
      p.dificultad === dificultad && (categoria === 'todas' || p.categoria === categoria));
    if (disponibles.length < REGLAS.preguntasPorPartida) {
      throw new Error(`No hay suficientes preguntas (${disponibles.length}) para ${categoria} · ${dificultad}.`);
    }

    const total = REGLAS.preguntasPorPartida;
    const minConFoto = Math.min(REGLAS.imagenesMinimasPorPartida, total);

    // Barajamos las con foto y las sin foto por separado para poder intercalarlas.
    const conFoto = this.mezclar(disponibles.filter((p) => p.imagenUrl));
    const sinFoto = this.mezclar(disponibles.filter((p) => !p.imagenUrl));

    // Partida garantizada: sacamos 'minConFoto' preguntas con foto…
    const elegidas = conFoto.slice(0, minConFoto);
    // …y completamos el resto con preguntas aleatorias sin foto.
    elegidas.push(...sinFoto.slice(0, total - elegidas.length));
    // Si aún faltan (pocas fotos en el banco), las cubrimos con las con foto restantes.
    if (elegidas.length < total) elegidas.push(...conFoto.slice(minConFoto, minConFoto + (total - elegidas.length)));

    return this.mezclar(elegidas).map((p) => this._prepararPregunta(p));
  },

  /* ------------------------------------------------------------------ */
  /* Puntaje (funciones puras, fáciles de probar)                        */
  /* ------------------------------------------------------------------ */

  multiplicador(dificultad) { return REGLAS.multiplicadores[dificultad] ?? 1; },

  /** Puntos de UNA respuesta correcta. `racha` es la racha ya incluyendo este acierto. */
  calcularPuntos({ segundosRestantes, racha, dificultad }) {
    const base = REGLAS.puntosPorAcierto;
    const segundos = Math.max(0, Math.floor(segundosRestantes));
    const rapidez = Math.min(REGLAS.bonoRapidezMaximo, segundos * REGLAS.puntosPorSegundo);
    const bonoRacha = racha > 0 && racha % REGLAS.rachaLongitud === 0 ? REGLAS.bonoRacha : 0;
    const bruto = base + rapidez + bonoRacha;
    const mult = this.multiplicador(dificultad);
    return { base, rapidez, racha: bonoRacha, bruto, multiplicador: mult, total: Math.round(bruto * mult) };
  },

  /** Puntaje máximo teórico de una partida en esa dificultad (ver cabecera). */
  puntajeMaximo(dificultad) {
    const porPregunta = REGLAS.puntosPorAcierto + REGLAS.bonoRapidezMaximo;
    const rachas = Math.floor(REGLAS.preguntasPorPartida / REGLAS.rachaLongitud);
    const bruto = REGLAS.preguntasPorPartida * porPregunta + rachas * REGLAS.bonoRacha;
    return Math.round(bruto * this.multiplicador(dificultad));
  },

  _recalcularPuntaje(estado) {
    estado.puntaje = Math.max(0, estado.puntosGanados - estado.penalizacion);
  },

  /* ------------------------------------------------------------------ */
  /* Partida                                                             */
  /* ------------------------------------------------------------------ */

  /** True mientras hay una partida iniciada y sin terminar. */
  hayPartidaEnCurso() { return Boolean(this.estado) && !this.estado.terminada; },

  preguntaActual() { return this.estado ? this.estado.preguntas[this.estado.indiceActual] : null; },

  /**
   * Reinicia el estado, selecciona las preguntas y deja lista la primera.
   * NO arranca el reloj: app.js llama a iniciarTemporizador() cuando la pregunta ya está en pantalla.
   * Lanza Error si el nombre, la categoría o la dificultad no son válidos.
   */
  iniciarPartida(categoria, dificultad, jugador) {
    const nombre = this.validarNombre(jugador);
    if (!nombre.valido) throw new Error(nombre.error);
    this._validarSeleccion(categoria, dificultad);

    this.detenerTemporizador();                       // sin temporizadores heredados de otra partida
    const preguntas = this.obtenerPreguntas(categoria, dificultad);

    this.estado = {
      jugador: nombre.nombre,
      categoria,
      dificultad,
      preguntas,
      indiceActual: 0,
      aciertos: 0,
      racha: 0,
      puntaje: 0,
      tiempoRestante: REGLAS.tiempoPorPregunta,
      comodines: { cincuenta: true, tiempo: true },
      // --- campos de control (además de los del Word §13) ---
      tiempoLimite: REGLAS.tiempoPorPregunta,         // 20 s (+10 si usó el comodín de tiempo en esta pregunta)
      respondida: false,
      terminada: false,
      eliminadas: [],                                 // índices ocultos por el 50/50 en la pregunta actual
      puntosGanados: 0,
      penalizacion: 0,
      comodinesUsados: 0,
      tiempoTotal: 0,
      recorrido: [],                                  // true/false por pregunta respondida
      falladas: [],
      resumen: null
    };
    return this.estado;
  },

  /** Abandona la partida (botón Salir): detiene el reloj y descarta el estado sin guardar nada. */
  cancelarPartida() {
    this.detenerTemporizador();
    this.estado = null;
  },

  /* ------------------------------------------------------------------ */
  /* Temporizador                                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Cuenta regresiva de 1 s sobre la pregunta actual, desde el tiempo que quede.
   * Es seguro llamarla varias veces: siempre cancela el intervalo anterior, así que
   * nunca hay dos temporizadores simultáneos. No hace nada si ya se respondió.
   * @returns {boolean} true si quedó corriendo.
   */
  iniciarTemporizador() {
    const estado = this.estado;
    if (!estado || estado.terminada || estado.respondida) return false;

    this.detenerTemporizador();
    const indice = estado.indiceActual;
    this._temporizadorId = this._reloj.iniciar(() => this._tic(estado, indice), 1000);
    return true;
  },

  detenerTemporizador() {
    if (this._temporizadorId !== null) {
      this._reloj.detener(this._temporizadorId);
      this._temporizadorId = null;
    }
  },

  /** Un segundo. Ignora el tic si la partida o la pregunta ya no son las que lo iniciaron. */
  _tic(estado, indice) {
    if (this.estado !== estado || estado.terminada || estado.respondida || estado.indiceActual !== indice) {
      this.detenerTemporizador();
      return;
    }
    estado.tiempoRestante -= 1;
    if (this.callbacks.alTick) this.callbacks.alTick(estado.tiempoRestante);

    if (estado.tiempoRestante <= 0) {
      estado.tiempoRestante = 0;
      const resultado = this.responder(null);          // se agotó el tiempo
      if (resultado && this.callbacks.alAgotarTiempo) this.callbacks.alAgotarTiempo(resultado);
    }
  },

  /* ------------------------------------------------------------------ */
  /* Respuesta                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Valida la respuesta, calcula puntos y actualiza racha.
   * `null` solo se acepta cuando el tiempo llegó a 0 (lo usa el temporizador).
   * Devuelve null —sin cambiar nada— si la pregunta ya fue respondida, la partida no
   * está en curso, el índice no es válido o la opción fue eliminada por el 50/50.
   * Esto es lo que bloquea dobles respuestas y puntos duplicados.
   */
  responder(indiceOpcion) {
    const estado = this.estado;
    if (!estado || estado.terminada || estado.respondida) return null;

    const pregunta = estado.preguntas[estado.indiceActual];
    const agotado = indiceOpcion === null;
    if (agotado) {
      if (estado.tiempoRestante > 0) return null;
    } else {
      if (!Number.isInteger(indiceOpcion) || indiceOpcion < 0 || indiceOpcion >= pregunta.opciones.length) return null;
      if (estado.eliminadas.includes(indiceOpcion)) return null;
    }

    estado.respondida = true;                          // bloqueo ANTES de calcular cualquier cosa
    this.detenerTemporizador();

    const acerto = !agotado && indiceOpcion === pregunta.correcta;
    let desglose = { base: 0, rapidez: 0, racha: 0, bruto: 0, multiplicador: this.multiplicador(estado.dificultad), total: 0 };

    if (acerto) {
      estado.aciertos += 1;
      estado.racha += 1;
      desglose = this.calcularPuntos({
        segundosRestantes: estado.tiempoRestante,
        racha: estado.racha,
        dificultad: estado.dificultad
      });
    } else {
      estado.racha = 0;
      estado.falladas.push({
        id: pregunta.id,
        enunciado: pregunta.enunciado,
        elegida: agotado ? null : indiceOpcion,
        correcta: pregunta.correcta
      });
    }

    estado.puntosGanados += desglose.total;
    this._recalcularPuntaje(estado);
    estado.recorrido.push(acerto);
    estado.tiempoTotal += estado.tiempoLimite - estado.tiempoRestante;

    return {
      jugador: estado.jugador,
      pregunta,
      indice: estado.indiceActual + 1,                 // 1-based, como lo espera ui.js
      total: estado.preguntas.length,
      elegida: agotado ? null : indiceOpcion,
      acerto,
      agotado,
      aciertos: estado.aciertos,
      respondidas: estado.indiceActual + 1,
      racha: estado.racha,
      puntos: desglose.total,
      desglose,
      puntaje: estado.puntaje,
      esUltima: estado.indiceActual === estado.preguntas.length - 1
    };
  },

  /* ------------------------------------------------------------------ */
  /* Comodines                                                           */
  /* ------------------------------------------------------------------ */

  /**
   * tipo: 'cincuenta' | 'tiempo'. Cada uno se usa una sola vez por partida y resta 30 puntos.
   * @returns {{ok: true, tipo, eliminadas?, tiempoRestante, puntaje, penalizacion}
   *          | {ok: false, motivo: string}}
   */
  usarComodin(tipo) {
    const estado = this.estado;
    if (!estado || estado.terminada) return { ok: false, motivo: 'No hay una partida en curso.' };
    if (tipo !== 'cincuenta' && tipo !== 'tiempo') return { ok: false, motivo: 'Comodín desconocido.' };
    if (estado.respondida) return { ok: false, motivo: 'Ya respondiste esta pregunta.' };
    if (!estado.comodines[tipo]) return { ok: false, motivo: 'Ya usaste este comodín en la partida.' };

    const respuesta = { ok: true, tipo };
    if (tipo === 'cincuenta') {
      const pregunta = estado.preguntas[estado.indiceActual];
      const incorrectas = pregunta.opciones.map((_, i) => i).filter((i) => i !== pregunta.correcta);
      estado.eliminadas = this.mezclar(incorrectas).slice(0, 2).sort((a, b) => a - b);
      respuesta.eliminadas = estado.eliminadas.slice();
    } else {
      estado.tiempoRestante += REGLAS.tiempoExtra;
      estado.tiempoLimite += REGLAS.tiempoExtra;
    }

    estado.comodines[tipo] = false;                    // se marca como usado una sola vez
    estado.comodinesUsados += 1;
    estado.penalizacion += REGLAS.penalizacionComodin;
    this._recalcularPuntaje(estado);

    respuesta.tiempoRestante = estado.tiempoRestante;
    respuesta.puntaje = estado.puntaje;
    respuesta.penalizacion = REGLAS.penalizacionComodin;
    return respuesta;
  },

  /* ------------------------------------------------------------------ */
  /* Avance y final                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Avanza a la siguiente pregunta (reinicia 20 s y el 50/50 visible; no arranca el reloj).
   * @returns {true} avanzó · {false} no quedan preguntas (hay que llamar a finalizarPartida)
   *          · {null} se ignoró porque la pregunta actual aún no se responde o no hay partida.
   */
  avanzarPregunta() {
    const estado = this.estado;
    if (!estado || estado.terminada || !estado.respondida) return null;
    if (estado.indiceActual >= estado.preguntas.length - 1) return false;

    estado.indiceActual += 1;
    estado.respondida = false;
    estado.tiempoRestante = REGLAS.tiempoPorPregunta;
    estado.tiempoLimite = REGLAS.tiempoPorPregunta;
    estado.eliminadas = [];
    return true;
  },

  /**
   * Cierra la partida y devuelve el resumen para ui.js y almacenamiento.js.
   * Solo se puede cerrar cuando las 10 preguntas fueron respondidas (si no, devuelve null).
   * Es idempotente: llamarla otra vez devuelve el mismo resumen sin recalcular.
   */
  finalizarPartida() {
    const estado = this.estado;
    if (!estado) return null;
    if (estado.resumen) return estado.resumen;
    if (estado.recorrido.length < estado.preguntas.length) return null;

    this.detenerTemporizador();
    estado.terminada = true;
    estado.resumen = {
      jugador: estado.jugador,
      categoria: estado.categoria,
      dificultad: estado.dificultad,
      puntaje: estado.puntaje,
      maximo: this.puntajeMaximo(estado.dificultad),
      aciertos: estado.aciertos,
      total: estado.preguntas.length,
      recorrido: estado.recorrido.slice(),
      tiempoTotal: estado.tiempoTotal,
      falladas: estado.falladas.slice(),
      multiplicador: this.multiplicador(estado.dificultad),
      comodinesUsados: estado.comodinesUsados,
      penalizacionComodines: estado.penalizacion,
      fecha: new Date().toISOString()
    };
    return estado.resumen;
  }
};