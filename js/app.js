/* ==========================================================================
   app.js — PUNTO DE ENTRADA y NAVEGACIÓN
   Responsabilidad ÚNICA: arrancar la aplicación, mostrar/ocultar pantallas y
   conectar eventos de la interfaz con juego.js, ui.js y almacenamiento.js.
   NO contiene reglas del juego, NO dibuja contenido dinámico y NO accede a
   localStorage directamente: solo coordina a los otros módulos.
   ========================================================================== */

const App = {
  /** Pantalla visible actualmente (valor de data-pantalla). */
  pantallaActual: 'inicio',

  /** Muestra una pantalla y oculta las demás. Es la ÚNICA función que cambia de pantalla. */
  irA(nombre) {
    const destino = document.querySelector(`.pantalla[data-pantalla="${nombre}"]`);
    if (!destino) {
      console.warn(`App.irA: la pantalla "${nombre}" no existe en index.html`);
      return;
    }

    document.querySelectorAll('.pantalla').forEach((pantalla) => {
      pantalla.hidden = pantalla !== destino;
    });

    this.pantallaActual = nombre;
    this.actualizarNavegacion(nombre);

    // Accesibilidad: llevar el foco al título de la nueva pantalla y volver arriba.
    window.scrollTo(0, 0);
    destino.querySelector('h1')?.focus();
  },

  /** Marca el enlace activo del menú con aria-current. */
  actualizarNavegacion(nombre) {
    document.querySelectorAll('.nav-principal__enlace').forEach((enlace) => {
      if (enlace.dataset.ir === nombre) {
        enlace.setAttribute('aria-current', 'page');
      } else {
        enlace.removeAttribute('aria-current');
      }
    });
  },

  /** Enlaza todos los elementos con data-ir="<pantalla>" (delegación de eventos). */
  enlazarNavegacion() {
    document.addEventListener('click', (evento) => {
      const control = evento.target.closest('[data-ir]');
      if (control) this.irA(control.dataset.ir);
    });
  },

  /** Eventos de formularios y botones de juego. Se completa en las etapas siguientes. */
  enlazarEventos() {
    // Etapa siguiente: validar nombre (RF-01) y pasar a "configuracion-partida".
    // Por ahora solo se evita que el formulario recargue la página.
    document.getElementById('form-jugador').addEventListener('submit', (evento) => {
      evento.preventDefault();
    });
  },

  iniciar() {
    this.enlazarNavegacion();
    this.enlazarEventos();
    this.irA('inicio');
  }
};

document.addEventListener('DOMContentLoaded', () => App.iniciar());
