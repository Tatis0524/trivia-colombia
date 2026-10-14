/* ==========================================================================
   sonido.js — EFECTOS DE SONIDO
   Responsabilidad ÚNICA: reproducir los audios de assets/sonido/ respetando la
   preferencia "Sonido" de Ajustes. No toca el DOM ni la lógica del juego; app.js
   le avisa cuándo sonar (Sonido.reproducir('correcta'), Sonido.alTick(segundos)…).

   Cómo se conecta: al cargarse (después de app.js) este archivo ENVUELVE los métodos de App y de
   Juego que ya existen (ver Sonido.instalar al final). Así index.html solo necesita la etiqueta
   <script src="js/sonido.js" defer></script> después de app.js y no hay que editar app.js.

   Precisión: los audios se decodifican una vez con la Web Audio API y se reproducen desde memoria
   (latencia casi nula). Además se recorta automáticamente el SILENCIO INICIAL de cada archivo, que
   es la causa habitual de que el sonido "llegue tarde". Si Web Audio no está disponible (o los
   archivos no se pueden leer, p. ej. abriendo index.html con doble clic), se usa <audio> como respaldo.

   Reglas:
     · Si el usuario desactiva el sonido, no suena nada y se corta lo que esté sonando.
     · Si un archivo falta o el navegador bloquea la reproducción, el juego sigue sin sonido
       (nunca lanza errores ni rompe la partida).
     · Los navegadores solo dejan sonar tras una interacción; el primer clic en "Jugar" la cumple.
   ========================================================================== */

const Sonido = {
  /** Se sincroniza con la preferencia guardada (App.iniciar y App.guardarPreferencia). */
  activo: true,

  /** Archivos (carpeta assets/sonido/) y volumen de cada efecto (0 a 1). */
  EFECTOS: {
    botones:        { archivo: 'assets/sonido/botones.mp3',        volumen: 0.5 },
    correcta:       { archivo: 'assets/sonido/rtacorrecta.mp3',    volumen: 0.7 },
    incorrecta:     { archivo: 'assets/sonido/rtaincorrecta.mp3',  volumen: 0.7 },
    racha:          { archivo: 'assets/sonido/racha.mp3',          volumen: 0.8 },
    cuentaregresiva:{ archivo: 'assets/sonido/cuentaregresiva.mp3', volumen: 0.6 }
  },

  /** Cuenta regresiva: se activa en los últimos N segundos. */
  CUENTA_DESDE: 5,
  /** Si el archivo dura más que esto (s), se trata como UNA cuenta completa; si no, como un "tic" por segundo. */
  DURACION_TIC_MAX: 2.5,
  /** Amplitud (0 a 1) por debajo de la cual el inicio del archivo se considera silencio. */
  UMBRAL_SILENCIO: 0.02,
  /** Margen (s) que se deja antes del primer sonido real para no cortar el ataque. */
  MARGEN_INICIO: 0.005,

  _audios: {},                 // respaldo <audio>
  _datos: {},                  // ArrayBuffer descargado de cada archivo
  _buffers: {},                // { buffer, inicio } ya decodificados (Web Audio)
  _fuentes: {},                // fuente Web Audio sonando por efecto
  _ctx: null,
  _estadoCuenta: 'libre',      // 'libre' | 'sonando' | 'terminada' (para no repetir la cuenta en la misma pregunta)

  /** Prepara los audios: crea el respaldo <audio> y descarga los archivos para Web Audio. */
  precargar() {
    if (typeof Audio === 'undefined') return;
    Object.keys(this.EFECTOS).forEach((nombre) => {
      if (this._audios[nombre]) return;
      const efecto = this.EFECTOS[nombre];
      try {
        const audio = new Audio(efecto.archivo);
        audio.preload = 'auto';
        audio.volume = efecto.volumen;
        audio.addEventListener('error', () => { audio._roto = true; });
        this._audios[nombre] = audio;
      } catch (error) { /* sin audio: el juego sigue */ }
      // Con file:// (index.html abierto con doble clic) el navegador bloquea fetch: se usa solo <audio>, sin errores en consola.
      if (typeof fetch === 'function' && window.location.protocol !== 'file:') {
        fetch(efecto.archivo)
          .then((r) => (r.ok ? r.arrayBuffer() : null))
          .then((datos) => { if (datos) { this._datos[nombre] = datos; if (this._ctx) this._decodificar(nombre); } })
          .catch(() => { /* file:// u otro bloqueo: se usa el respaldo */ });
      }
    });
    const cuenta = this._audios.cuentaregresiva;
    if (cuenta) cuenta.addEventListener('ended', () => { this._estadoCuenta = 'terminada'; });
    // Los navegadores solo permiten sonar tras un gesto: se prepara Web Audio en el primero.
    const desbloquear = () => {
      this._crearContexto();
      ['pointerdown', 'keydown', 'touchstart'].forEach((tipo) => document.removeEventListener(tipo, desbloquear, true));
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach((tipo) => document.addEventListener(tipo, desbloquear, true));
  },

  _crearContexto() {
    if (this._ctx) { if (this._ctx.state === 'suspended') this._ctx.resume().catch(() => {}); return; }
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return;
    try {
      this._ctx = new Contexto({ latencyHint: 'interactive' });
      if (this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
      Object.keys(this._datos).forEach((nombre) => this._decodificar(nombre));
    } catch (error) { this._ctx = null; }
  },

  /** Decodifica un archivo y calcula cuántos segundos de silencio trae al principio. */
  _decodificar(nombre) {
    const datos = this._datos[nombre];
    if (!datos || !this._ctx || this._buffers[nombre]) return;
    this._datos[nombre] = null;
    const copia = datos.slice(0);
    const alTerminar = (buffer) => {
      let primero = buffer.length;
      for (let c = 0; c < buffer.numberOfChannels; c += 1) {
        const canal = buffer.getChannelData(c);
        for (let i = 0; i < canal.length && i < primero; i += 1) {
          if (Math.abs(canal[i]) > this.UMBRAL_SILENCIO) { primero = i; break; }
        }
      }
      const inicio = primero >= buffer.length ? 0 : Math.max(0, primero / buffer.sampleRate - this.MARGEN_INICIO);
      this._buffers[nombre] = { buffer, inicio };
    };
    try {
      const promesa = this._ctx.decodeAudioData(copia, alTerminar, () => {});
      if (promesa && typeof promesa.catch === 'function') promesa.catch(() => {});
    } catch (error) { /* sin Web Audio para este archivo: respaldo */ }
  },

  /** Duración útil (s) de un efecto, sin el silencio inicial. Infinity si aún no se conoce. */
  _duracion(nombre) {
    const b = this._buffers[nombre];
    if (b) return b.buffer.duration - b.inicio;
    const audio = this._audios[nombre];
    return audio && Number.isFinite(audio.duration) ? audio.duration : Infinity;
  },

  /** Activa o desactiva todos los sonidos. Al desactivar corta lo que esté sonando. */
  configurar(activo) {
    this.activo = Boolean(activo);
    if (!this.activo) this.detenerTodo();
  },

  /** Reproduce un efecto desde el primer sonido real. Devuelve true si se intentó reproducir. */
  reproducir(nombre) {
    if (!this.activo) return false;
    const efecto = this.EFECTOS[nombre];
    const listo = this._buffers[nombre];
    if (listo && this._ctx) {
      try {
        if (this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
        this.detener(nombre);
        const fuente = this._ctx.createBufferSource();
        const ganancia = this._ctx.createGain();
        fuente.buffer = listo.buffer;
        fuente._nombre = nombre;
        ganancia.gain.value = efecto.volumen;
        fuente.connect(ganancia); ganancia.connect(this._ctx.destination);
        fuente.onended = () => {
          if (this._fuentes[nombre] === fuente) {
            this._fuentes[nombre] = null;
            if (nombre === 'cuentaregresiva' && !fuente._cortada) this._estadoCuenta = 'terminada';
          }
        };
        this._fuentes[nombre] = fuente;
        fuente.start(0, listo.inicio);
        return true;
      } catch (error) { /* cae al respaldo */ }
    }
    return this._reproducirElemento(nombre);
  },

  _reproducirElemento(nombre) {
    const audio = this._audios[nombre];
    if (!audio || audio._roto) return false;
    try {
      audio.currentTime = 0;
      const promesa = audio.play();
      if (promesa && typeof promesa.catch === 'function') promesa.catch(() => { /* bloqueado por el navegador */ });
      return true;
    } catch (error) { return false; }
  },

  detener(nombre) {
    const fuente = this._fuentes[nombre];
    if (fuente) {
      fuente._cortada = true;
      this._fuentes[nombre] = null;
      try { fuente.stop(); } catch (error) { /* ya terminó */ }
    }
    const audio = this._audios[nombre];
    if (audio) { try { audio.pause(); audio.currentTime = 0; } catch (error) { /* nada */ } }
  },

  detenerTodo() {
    Object.keys(this.EFECTOS).forEach((nombre) => this.detener(nombre));
    this._estadoCuenta = 'libre';
  },

  /** Sonido de una respuesta: racha (cada 3 aciertos seguidos), correcta o incorrecta/tiempo agotado. */
  alResponder(resultado) {
    this.detenerCuenta();
    if (!resultado) return;
    if (resultado.acerto) this.reproducir(resultado.desglose && resultado.desglose.racha > 0 ? 'racha' : 'correcta');
    else this.reproducir('incorrecta');
  },

  /** Lo llama el motor cada segundo con los segundos restantes. */
  alTick(segundos) {
    if (!this.activo) return;
    const audio = this._audios.cuentaregresiva;
    if ((!audio || audio._roto) && !this._buffers.cuentaregresiva) return;
    const duracion = this._duracion('cuentaregresiva');
    if (duracion <= this.DURACION_TIC_MAX) {                     // un tic por segundo
      if (segundos >= 1 && segundos <= this.CUENTA_DESDE) this.reproducir('cuentaregresiva');
      return;
    }
    // Cuenta completa: arranca para que termine cerca de 0 (sin pasarse de CUENTA_DESDE si el audio es largo)
    const inicio = Number.isFinite(duracion) ? Math.min(Math.ceil(duracion), this.CUENTA_DESDE) : this.CUENTA_DESDE;
    if (segundos > inicio) {                                      // el comodín +10 s la aleja: se corta
      if (this._estadoCuenta === 'sonando') this.detenerCuenta();
      return;
    }
    if (segundos >= 1 && this._estadoCuenta === 'libre') {
      this._estadoCuenta = 'sonando';
      if (!this.reproducir('cuentaregresiva')) this._estadoCuenta = 'libre';
    }
  },

  /** Corta la cuenta regresiva y la deja lista para la próxima pregunta. */
  detenerCuenta() {
    this.detener('cuentaregresiva');
    this._estadoCuenta = 'libre';
  },

  /** Elementos que suenan al pulsarlos: botones principales y toda la navegación (menú, Inicio, Instrucciones,
   *  Ranking, Configuración, Volver…). Las opciones de respuesta NO están aquí: suenan correcto/incorrecto. */
  SELECTOR_BOTONES: '.boton--primario, [data-ir], .nav__enlace, .boton-icono',

  /** Clic en botones y navegación. */
  enlazarBotones() {
    // Fase de captura: suena en el instante del clic, antes de que la app haga su trabajo.
    document.addEventListener('click', (evento) => {
      const boton = evento.target.closest && evento.target.closest(this.SELECTOR_BOTONES);
      if (boton && !boton.disabled) this.reproducir('botones');
    }, true);
  }
};

/* --------------------------------------------------------------------------
   Instalación: engancha el sonido a los eventos del juego sin editar app.js.
   Es idempotente y segura: si falta algún método, simplemente no engancha ese evento.
   -------------------------------------------------------------------------- */
Sonido.instalar = function instalar() {
  if (this._instalado || typeof App === 'undefined' || typeof Juego === 'undefined') return;
  // Si app.js ya llama a Sonido directamente, no se duplica.
  if (typeof App.iniciar === 'function' && String(App.iniciar).includes('Sonido')) return;
  this._instalado = true;
  const envolver = (objeto, nombre, antes, despues) => {
    const original = objeto[nombre];
    if (typeof original !== 'function') return;
    objeto[nombre] = function (...args) {
      if (antes) { try { antes.apply(this, args); } catch (error) { /* el sonido nunca rompe el juego */ } }
      const resultado = original.apply(this, args);
      if (despues) { try { despues.call(this, resultado, ...args); } catch (error) { /* idem */ } }
      return resultado;
    };
  };

  // El motor avisa cada segundo: se suma el sonido de la cuenta regresiva.
  envolver(Juego, 'conectar', function (callbacks) {
    if (!callbacks || callbacks._conSonido) return;
    const alTickOriginal = callbacks.alTick;
    callbacks.alTick = (segundos) => { if (alTickOriginal) alTickOriginal(segundos); Sonido.alTick(segundos); };
    callbacks._conSonido = true;
  });

  // Arranque: crea los audios y sincroniza la preferencia guardada.
  envolver(App, 'iniciar', null, () => {
    Sonido.precargar();
    Sonido.configurar(App.preferencias && App.preferencias.sonido);
    Sonido.enlazarBotones();
  });

  envolver(App, 'mostrarRetroalimentacion', (resultado) => Sonido.alResponder(resultado));
  envolver(App, 'irA', null, () => { if (App.pantallaActual !== 'juego') Sonido.detenerCuenta(); });
  envolver(App, 'salirPartida', () => Sonido.detenerCuenta());
  envolver(App, 'usarComodin', null, (_r, tipo) => {
    if (tipo === 'tiempo' && Juego.estado) Sonido.alTick(Juego.estado.tiempoRestante);
  });
  envolver(App, 'guardarPreferencia', null, () => Sonido.configurar(App.preferencias && App.preferencias.sonido));
};

try { Sonido.instalar(); } catch (error) { console.warn('Sonido desactivado:', error); }

