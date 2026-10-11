/* ==========================================================================
   app.js — PUNTO DE ENTRADA y NAVEGACIÓN
   Responsabilidad ÚNICA: arrancar la aplicación, mostrar/ocultar pantallas y
   conectar eventos de la interfaz con juego.js, ui.js y almacenamiento.js.
   NO contiene reglas del juego y NO dibuja contenido dinámico directamente:
   delega el renderizado en ui.js y las reglas en juego.js.

   Etapa 3: conecta el motor (juego.js) con la interfaz (ui.js). App solo
   orquesta: pide datos a Juego, los entrega a UI y guarda el resultado con
   Almacenamiento. No calcula puntos ni decide qué pregunta sigue.
   ========================================================================== */

const App = {
  /** Pantalla visible actualmente (valor de data-pantalla). */
  pantallaActual: 'inicio',

  /** Estado de la sesión de juego (se completa al validar el nombre). */
  jugador: '',

  /** Última retroalimentación y último resultado (para volver a pintarlos al regresar a la pantalla). */
  ultimaRetro: null,
  ultimoResultado: null,

  /** Selección de la próxima partida (se define en la pantalla 3). */
  partida: null,

  /** Preferencias cargadas desde localStorage. */
  preferencias: { sonido: true, tema: 'claro' },

  /** Enlace de navegación activo por pantalla (el menú no tiene "configuración"). */
  PANTALLAS_NAV: {
    inicio: 'inicio',
    instrucciones: 'instrucciones',
    ranking: 'ranking',
    'configuracion-partida': 'jugar',
    juego: 'jugar',
    retroalimentacion: 'jugar',
    resultado: 'jugar',
    configuracion: null
  },

  /* ------------------------------------------------------------------ */
  /* Navegación                                                          */
  /* ------------------------------------------------------------------ */

  /** Muestra una pantalla y oculta las demás. Es la ÚNICA función que cambia de pantalla. */
  irA(nombre) {
    // Una pregunta ya respondida no se vuelve a jugar: se regresa a su retroalimentación.
    if (nombre === 'juego' && Juego.hayPartidaEnCurso() && Juego.estado.respondida && this.ultimaRetro) {
      nombre = 'retroalimentacion';
    }

    const destino = document.querySelector(`.pantalla[data-pantalla="${nombre}"]`);
    if (!destino) {
      console.warn(`App.irA: la pantalla "${nombre}" no existe en index.html`);
      return;
    }

    // El reloj solo corre mientras se ve la pantalla de juego (salir o cambiar de pantalla lo detiene).
    if (nombre !== 'juego') Juego.detenerTemporizador();

    // Preparación de pantallas con contenido dinámico
    this.prepararPantalla(nombre);

    document.querySelectorAll('.pantalla').forEach((pantalla) => {
      pantalla.hidden = pantalla !== destino;
    });

    this.pantallaActual = nombre;
    this.actualizarNavegacion(nombre);
    this.actualizarEnlace(nombre);

    // Con la pregunta ya visible arranca (o se reanuda) la cuenta de 20 s.
    if (nombre === 'juego') Juego.iniciarTemporizador();

    // Accesibilidad: llevar el foco al título de la nueva pantalla y volver arriba.
    window.scrollTo(0, 0);
    destino.querySelector('h1')?.focus();
  },

  /** Marca el enlace activo del menú con aria-current. */
  actualizarNavegacion(nombre) {
    const activo = this.PANTALLAS_NAV[nombre];
    document.querySelectorAll('.nav__enlace').forEach((enlace) => {
      if (enlace.dataset.ir === activo) enlace.setAttribute('aria-current', 'page');
      else enlace.removeAttribute('aria-current');
    });
  },

  /** Mantiene la URL en sincronía con la pantalla visible (enlaces profundos). */
  actualizarEnlace(nombre) {
    const hash = `#${nombre}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash);
    }
  },

  /** Lee el enlace profundo (#pantalla) al cargar o al cambiar el hash. */
  irADesdeEnlace() {
    const nombre = window.location.hash.replace('#', '');
    if (nombre && document.querySelector(`.pantalla[data-pantalla="${nombre}"]`)) {
      this.irA(nombre);
    } else {
      this.irA('inicio');
    }
  },

  /** Pinta los datos dinámicos que necesita cada pantalla antes de mostrarla. */
  prepararPantalla(nombre) {
    if (nombre === 'configuracion-partida') {
      if (!this.partida) this.partida = { categoria: 'todas', dificultad: 'medio' };
      UI.renderCategorias(this.partida.categoria);
      UI.renderDificultades(this.partida.dificultad);
      UI.renderConfiguracionPartida({
        jugador: this.jugador,               // cadena vacía si aún no se escribió (RF-01)
        categoria: this.partida.categoria,
        dificultad: this.partida.dificultad,
        mejorPuntaje: this.jugador
          ? Almacenamiento.obtenerMejorPuntaje(this.jugador, this.partida.categoria, this.partida.dificultad)
          : null
      });
    }

    if (nombre === 'ranking') {
      UI.renderRanking(Almacenamiento.obtenerRanking(), Almacenamiento.obtenerEstadisticas(), this.jugador);
    }

    if (nombre === 'configuracion') {
      UI.aplicarPreferencias(this.preferencias);
    }

    if (nombre === 'juego') {
      if (Juego.hayPartidaEnCurso()) this.renderJuego();
      else this.mostrarEstadoVacio('juego-estado-vacio', ['juego-pregunta']);
    }

    if (nombre === 'retroalimentacion') {
      if (this.ultimaRetro && Juego.hayPartidaEnCurso()) UI.mostrarRetroalimentacion(this.ultimaRetro);
      else this.mostrarEstadoVacio('retro-estado-vacio', ['retro-pregunta', 'retro-estado', 'retro-explicacion', 'retro-avance']);
    }

    if (nombre === 'resultado') {
      if (this.ultimoResultado) {
        UI.mostrarResultado(this.ultimoResultado);
      } else {
        document.getElementById('resultado-estado-vacio')?.removeAttribute('hidden');
        document.getElementById('resultado-contenido')?.setAttribute('hidden', '');
      }
    }
  },

  /** Sin partida en curso: oculta lo que quedó de una partida anterior y muestra el estado vacío. */
  mostrarEstadoVacio(idVacio, idsContenido) {
    const vacio = document.getElementById(idVacio);
    if (vacio) vacio.hidden = false;
    idsContenido.forEach((id) => { const el = document.getElementById(id); if (el) el.hidden = true; });
  },

  /** Pinta la pregunta actual del motor con su marcador, tiempo y comodines (sin tocar el reloj). */
  renderJuego() {
    const estado = Juego.estado;
    const contexto = `${estado.jugador} · ${UI.categoria(estado.categoria).nombre} · Nivel ${UI.dificultad(estado.dificultad).nombre}`;
    const titulo = document.getElementById('titulo-juego');
    const contextoTexto = document.getElementById('juego-contexto');
    if (titulo) titulo.textContent = `¡Vamos, ${estado.jugador}!`;
    if (contextoTexto) contextoTexto.textContent = contexto;

    UI.mostrarPregunta(Juego.preguntaActual(), estado.indiceActual + 1, estado.preguntas.length);
    UI.aplicarComodin('cincuenta', { eliminadas: estado.eliminadas });
    UI.actualizarPuntaje(estado.puntaje);
    UI.actualizarTemporizador(estado.tiempoRestante);
    UI.actualizarComodines(estado.comodines);
  },

  /* ------------------------------------------------------------------ */
  /* Acciones                                                            */
  /* ------------------------------------------------------------------ */

  /** RF-01: valida el nombre y, si es válido, pasa a configurar la partida. */
  confirmarNombre() {
    const input = document.getElementById('nombre-jugador');
    const validacion = Juego.validarNombre(input?.value);

    if (!validacion.valido) {
      UI.mostrarErrorCampo('nombre-jugador', validacion.error);
      UI.mostrarMensaje('Necesitamos tu nombre para jugar y para el ranking.', 'error');
      input?.focus();
      return false;
    }

    const nombre = validacion.nombre;
    UI.mostrarErrorCampo('nombre-jugador', '');
    this.jugador = nombre;
    this.ultimoResultado = null;
    UI.mostrarMensaje(`¡Hola, ${nombre}! Elige categoría y dificultad.`, 'exito');
    this.irA('configuracion-partida');
    return true;
  },

  /** Inicia la partida con la selección actual: el motor prepara el estado y la pantalla lo dibuja. */
  iniciarPartida() {
    if (!this.jugador) {
      UI.mostrarMensaje('Escribe tu nombre en el inicio para jugar.', 'error');
      this.irA('inicio');
      return;
    }

    this.partida = this.partida || { categoria: 'todas', dificultad: 'medio' };

    try {
      Juego.iniciarPartida(this.partida.categoria, this.partida.dificultad, this.jugador);
    } catch (error) {
      UI.mostrarMensaje(error.message, 'error');
      return;
    }

    this.ultimaRetro = null;
    this.ultimoResultado = null;
    this.irA('juego');           // prepararPantalla dibuja la pregunta e irA arranca el reloj
  },

  /** Abre el juego desde el menú "Jugar": pide el nombre si hace falta. */
  irAJugar() {
    if (this.jugador) {
      this.irA('configuracion-partida');
      return;
    }
    UI.mostrarMensaje('Escribe tu nombre para comenzar.', 'info');
    this.irA('inicio');
    window.setTimeout(() => document.getElementById('nombre-jugador')?.focus(), 60);
  },

  /** Responde con la opción elegida (o null si se agotó el tiempo) y muestra la retroalimentación. */
  responder(indice) {
    const resultado = Juego.responder(indice);
    if (!resultado) return;                // ya respondida, bloqueada o inválida: no pasa nada
    this.mostrarRetroalimentacion(resultado);
  },

  mostrarRetroalimentacion(resultado) {
    this.ultimaRetro = resultado;
    UI.actualizarPuntaje(resultado.puntaje);
    this.irA('retroalimentacion');
  },

  /** Comodín 50/50 o +10 s: el motor aplica la regla y la interfaz refleja el resultado. */
  usarComodin(tipo) {
    const resultado = Juego.usarComodin(tipo);
    if (!resultado.ok) {
      UI.mostrarMensaje(resultado.motivo, 'info');
      return;
    }
    UI.aplicarComodin(tipo, resultado);
    UI.actualizarComodines(Juego.estado.comodines);
    UI.actualizarPuntaje(resultado.puntaje);
    UI.actualizarTemporizador(resultado.tiempoRestante);
    UI.mostrarMensaje(tipo === 'cincuenta'
      ? 'Quitamos dos opciones incorrectas. El comodín resta 30 puntos.'
      : 'Sumaste 10 segundos. El comodín resta 30 puntos.', 'info');
  },

  /** Sale de una partida en curso sin guardarla. */
  salirPartida() {
    Juego.detenerTemporizador();           // el reloj no corre mientras se decide
    const confirmado = window.confirm('¿Salir de la partida? Esta partida no se guardará.');
    if (!confirmado) {
      Juego.iniciarTemporizador();         // sigue donde iba (no hace nada si ya respondió)
      return;
    }
    Juego.cancelarPartida();
    this.ultimaRetro = null;
    UI.mostrarMensaje('Saliste de la partida. No se guardó ningún resultado.', 'info');
    this.irA(this.jugador ? 'configuracion-partida' : 'inicio');
  },

  /** Siguiente pregunta o, tras la décima, cierre de la partida. */
  siguientePregunta() {
    if (!Juego.hayPartidaEnCurso()) {
      UI.mostrarMensaje('Cuando termines una partida podrás continuar con la siguiente pregunta.', 'info');
      return;
    }
    const avanzo = Juego.avanzarPregunta();
    if (avanzo === null) {
      UI.mostrarMensaje('Primero responde la pregunta actual.', 'info');
      return;
    }
    if (avanzo) this.irA('juego');
    else this.finalizarPartida();
  },

  /** Cierra la partida, guarda ranking y estadísticas y muestra el resultado. */
  finalizarPartida() {
    const resumen = Juego.finalizarPartida();
    if (!resumen) return;

    const recordAnterior = Almacenamiento.obtenerEstadisticas().mejorPuntaje;
    const puesto = Almacenamiento.guardarEnRanking({
      nombre: resumen.jugador,
      puntaje: resumen.puntaje,
      categoria: resumen.categoria,
      dificultad: resumen.dificultad,
      fecha: resumen.fecha
    });
    Almacenamiento.actualizarEstadisticas({
      aciertos: resumen.aciertos,
      totalPreguntas: resumen.total,
      puntaje: resumen.puntaje,
      categoria: resumen.categoria
    });

    this.ultimoResultado = Object.assign({}, resumen, {
      puesto,                                   // null si no entró al top 10 o no se pudo guardar
      recordAnterior,
      esRecord: resumen.puntaje > recordAnterior
    });
    this.ultimaRetro = null;
    this.irA('resultado');
  },

  /** Borra el ranking local y las estadísticas (acción del mockup). */
  borrarRanking() {
    const confirmado = window.confirm('¿Borrar el ranking y las estadísticas locales? Esta acción no se puede deshacer.');
    if (!confirmado) return;
    if (Almacenamiento.borrarRanking()) {
      UI.renderRanking([], Almacenamiento.obtenerEstadisticas(), this.jugador);
      UI.mostrarMensaje('Ranking y estadísticas borrados.', 'exito');
    } else {
      UI.mostrarMensaje('No fue posible borrar el ranking en este navegador.', 'error');
    }
  },

  /** Guarda una preferencia (sonido o tema) y la refleja en la interfaz. */
  guardarPreferencia(cambios) {
    this.preferencias = Object.assign({}, this.preferencias, cambios);
    Almacenamiento.guardarPreferencias(this.preferencias);
    UI.aplicarPreferencias(this.preferencias);
    UI.mostrarMensaje('Preferencia guardada.', 'exito');
  },

  /* ------------------------------------------------------------------ */
  /* Eventos                                                             */
  /* ------------------------------------------------------------------ */

  /** Enlaza todos los elementos con data-ir="<pantalla>" (delegación de eventos). */
  enlazarNavegacion() {
    document.addEventListener('click', (evento) => {
      const control = evento.target.closest('[data-ir]');
      if (!control) return;

      // "Jugar" necesita nombre previo; el resto navega directo.
      if (control.dataset.ir === 'jugar') {
        this.irAJugar();
        return;
      }
      this.irA(control.dataset.ir);
    });

    window.addEventListener('hashchange', () => this.irADesdeEnlace());
  },

  enlazarEventos() {
    // Inicio: nombre del jugador (RF-01)
    document.getElementById('form-jugador')?.addEventListener('submit', (evento) => {
      evento.preventDefault();
      this.confirmarNombre();
    });
    document.getElementById('btn-jugar')?.addEventListener('click', () => this.confirmarNombre());
    document.getElementById('nombre-jugador')?.addEventListener('input', () => {
      UI.mostrarErrorCampo('nombre-jugador', '');
    });

    // Instrucciones: "Comenzar"
    document.getElementById('btn-instrucciones-comenzar')?.addEventListener('click', () => {
      if (this.jugador) this.irA('configuracion-partida');
      else {
        UI.mostrarMensaje('Primero escribe tu nombre en el inicio.', 'info');
        this.irA('inicio');
        window.setTimeout(() => document.getElementById('nombre-jugador')?.focus(), 60);
      }
    });

    // Configuración de partida: selección de categoría y dificultad
    document.getElementById('categorias-lista')?.addEventListener('change', (evento) => {
      if (evento.target.name !== 'categoria') return;
      this.partida = Object.assign({}, this.partida, { categoria: evento.target.value });
      this.actualizarConfiguracionPartida();
    });
    document.getElementById('dificultad-lista')?.addEventListener('change', (evento) => {
      if (evento.target.name !== 'dificultad') return;
      this.partida = Object.assign({}, this.partida, { dificultad: evento.target.value });
      this.actualizarConfiguracionPartida();
    });
    document.getElementById('btn-comenzar-partida')?.addEventListener('click', () => this.iniciarPartida());

    // Juego: opciones y comodines
    document.getElementById('juego-opciones')?.addEventListener('click', (evento) => {
      const opcion = evento.target.closest('.opcion');
      if (!opcion || opcion.disabled) return;
      this.responder(Number(opcion.dataset.indice));
    });
    document.getElementById('btn-comodin-5050')?.addEventListener('click', () => this.usarComodin('cincuenta'));
    document.getElementById('btn-comodin-tiempo')?.addEventListener('click', () => this.usarComodin('tiempo'));
    document.getElementById('btn-salir-partida')?.addEventListener('click', () => this.salirPartida());

    // Retroalimentación
    document.getElementById('btn-siguiente')?.addEventListener('click', () => this.siguientePregunta());

    // Resultado
    document.getElementById('btn-jugar-de-nuevo')?.addEventListener('click', () => {
      if (this.jugador) this.irA('configuracion-partida');
      else this.irA('inicio');
    });

    // Ranking
    document.getElementById('btn-borrar-ranking')?.addEventListener('click', () => this.borrarRanking());

    // Configuración general
    document.getElementById('pref-sonido')?.addEventListener('change', (evento) => {
      this.guardarPreferencia({ sonido: evento.target.checked });
    });
    document.querySelectorAll('input[name="pref-tema"]').forEach((radio) => {
      radio.addEventListener('change', (evento) => {
        if (evento.target.checked) this.guardarPreferencia({ tema: evento.target.value });
      });
    });
  },

  /** Actualiza ayudas y tarjeta "Tu partida" tras cambiar categoría o dificultad. */
  actualizarConfiguracionPartida() {
    UI.renderConfiguracionPartida({
      jugador: this.jugador,
      categoria: this.partida.categoria,
      dificultad: this.partida.dificultad,
      mejorPuntaje: Almacenamiento.obtenerMejorPuntaje(this.jugador, this.partida.categoria, this.partida.dificultad)
    });
  },

  /* ------------------------------------------------------------------ */
  /* Arranque                                                            */
  /* ------------------------------------------------------------------ */

  iniciar() {
    this.preferencias = Almacenamiento.obtenerPreferencias();
    UI.aplicarPreferencias(this.preferencias);

    // El motor avisa a la interfaz cada segundo y cuando se agota el tiempo.
    Juego.conectar({
      alTick: (segundos) => UI.actualizarTemporizador(segundos),
      alAgotarTiempo: (resultado) => this.mostrarRetroalimentacion(resultado)
    });

    this.enlazarNavegacion();
    this.enlazarEventos();
    this.irADesdeEnlace();
  }
};

document.addEventListener('DOMContentLoaded', () => App.iniciar());