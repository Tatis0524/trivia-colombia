/* ==========================================================================
   app.js — PUNTO DE ENTRADA y NAVEGACIÓN
   Responsabilidad ÚNICA: arrancar la aplicación, mostrar/ocultar pantallas y
   conectar eventos de la interfaz con juego.js, ui.js y almacenamiento.js.
   NO contiene reglas del juego y NO dibuja contenido dinámico directamente:
   delega el renderizado en ui.js y las reglas en juego.js.

   Nota de la etapa 2 (maquetación): el motor del juego aún no está implementado.
   Todas las pantallas y controles existen y tienen una acción definida; las
   áreas de preguntas, respuestas, estadísticas y ranking ya están preparadas
   y muestran un estado vacío hasta que haya datos.
   ========================================================================== */

const App = {
  /** Pantalla visible actualmente (valor de data-pantalla). */
  pantallaActual: 'inicio',

  /** Estado de la sesión de juego (se completa al validar el nombre). */
  jugador: '',

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
    const destino = document.querySelector(`.pantalla[data-pantalla="${nombre}"]`);
    if (!destino) {
      console.warn(`App.irA: la pantalla "${nombre}" no existe en index.html`);
      return;
    }

    // Preparación de pantallas con contenido dinámico
    this.prepararPantalla(nombre);

    document.querySelectorAll('.pantalla').forEach((pantalla) => {
      pantalla.hidden = pantalla !== destino;
    });

    this.pantallaActual = nombre;
    this.actualizarNavegacion(nombre);
    this.actualizarEnlace(nombre);

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

    if (nombre === 'resultado' && !this.ultimoResultado) {
      document.getElementById('resultado-estado-vacio')?.removeAttribute('hidden');
      document.getElementById('resultado-contenido')?.setAttribute('hidden', '');
    }
  },

  /* ------------------------------------------------------------------ */
  /* Acciones                                                            */
  /* ------------------------------------------------------------------ */

  /** RF-01: valida el nombre y, si es válido, pasa a configurar la partida. */
  confirmarNombre() {
    const input = document.getElementById('nombre-jugador');
    const nombre = (input?.value || '').trim();

    if (nombre.length < 2) {
      UI.mostrarErrorCampo('nombre-jugador', 'Escribe un nombre de al menos 2 caracteres para jugar.');
      UI.mostrarMensaje('Necesitamos tu nombre para jugar y para el ranking.', 'error');
      input?.focus();
      return false;
    }

    UI.mostrarErrorCampo('nombre-jugador', '');
    this.jugador = nombre;
    this.ultimoResultado = null;
    UI.mostrarMensaje(`¡Hola, ${nombre}! Elige categoría y dificultad.`, 'exito');
    this.irA('configuracion-partida');
    return true;
  },

  /** Inicia la partida con la selección actual (motor pendiente: etapa 3). */
  iniciarPartida() {
    if (!this.jugador) {
      UI.mostrarMensaje('Escribe tu nombre en el inicio para jugar.', 'error');
      this.irA('inicio');
      return;
    }

    this.partida = this.partida || { categoria: 'todas', dificultad: 'medio' };

    const contexto = `${this.jugador} · ${UI.categoria(this.partida.categoria).nombre} · Nivel ${UI.dificultad(this.partida.dificultad).nombre}`;
    const titulo = document.getElementById('titulo-juego');
    const contextoTexto = document.getElementById('juego-contexto');
    if (titulo) titulo.textContent = `¡Vamos, ${this.jugador}!`;
    if (contextoTexto) contextoTexto.textContent = contexto;

    UI.actualizarPuntaje(0);
    UI.actualizarTemporizador(20);
    UI.actualizarComodines({ cincuenta: true, tiempo: true });
    this.irA('juego');

    if (PREGUNTAS.length === 0) {
      // Sin banco de preguntas todavía: la pantalla muestra su estado vacío.
      UI.mostrarMensaje('El banco de preguntas llega en la etapa 3. La interfaz ya está lista.', 'info');
    }
    // Etapa 3: Juego.iniciarPartida(this.jugador, this.partida.categoria,
    //                               this.partida.dificultad) y UI.mostrarPregunta(...).
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

  /** Sale de una partida en curso sin guardarla. */
  salirPartida() {
    const confirmado = window.confirm('¿Salir de la partida? Esta partida no se guardará.');
    if (!confirmado) return;
    this.partidaEnCurso = null;
    UI.mostrarMensaje('Saliste de la partida. No se guardó ningún resultado.', 'info');
    this.irA(this.jugador ? 'configuracion-partida' : 'inicio');
  },

  /** Siguiente pregunta (motor pendiente: etapa 3). */
  siguientePregunta() {
    if (!this.partidaEnCurso) {
      UI.mostrarMensaje('Cuando termines una partida podrás continuar con la siguiente pregunta.', 'info');
      return;
    }
    // Etapa 3: Juego.siguientePregunta() y UI.mostrarPregunta(...) o UI.mostrarResultado(...).
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

    // Juego: opciones y comodines (motor pendiente: etapa 3)
    document.getElementById('juego-opciones')?.addEventListener('click', (evento) => {
      const opcion = evento.target.closest('.opcion');
      if (!opcion || opcion.disabled) return;
      if (!this.partidaEnCurso) {
        UI.mostrarMensaje('La validación de respuestas llega con el motor de preguntas (etapa 3).', 'info');
      }
      // Etapa 3: Juego.responder(Number(opcion.dataset.indice)) → retroalimentación.
    });
    ['btn-comodin-5050', 'btn-comodin-tiempo'].forEach((id) => {
      document.getElementById(id)?.addEventListener('click', () => {
        UI.mostrarMensaje('Los comodines se activan con el motor de preguntas (etapa 3).', 'info');
      });
    });
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

    this.enlazarNavegacion();
    this.enlazarEventos();
    this.irADesdeEnlace();
  }
};

document.addEventListener('DOMContentLoaded', () => App.iniciar());
