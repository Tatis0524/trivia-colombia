/* ==========================================================================
   preguntas.js — DATOS del juego (sin lógica)
   Responsabilidad ÚNICA: contener el catálogo de categorías, dificultades y el
   banco de preguntas. No filtra, no mezcla, no valida: eso es de juego.js.

   Formato de cada pregunta (Word de requerimientos, §13):
   {
     id: 1,
     categoria: 'naturaleza',        // id de CATEGORIAS
     dificultad: 'facil',            // id de DIFICULTADES
     enunciado: '...',
     opciones: ['...', '...', '...', '...'],   // exactamente 4
     correcta: 0,                    // índice (0-3) dentro de opciones
     explicacion: '...'
   }
   ========================================================================== */

/* Categorías jugables. "todas" es una opción de filtro, no una categoría del banco.
   'icono' hace referencia a un <symbol> del sprite de index.html (guía §6).
   'descripcion' y 'pista' son los textos del mockup de alta fidelidad. */
const CATEGORIAS = [
  { id: 'todas',      nombre: 'Todas',                  icono: 'i-cuadricula',  descripcion: 'Un viaje por todo el país' },
  { id: 'geografia',  nombre: 'Geografía',              icono: 'i-montana',     descripcion: 'Regiones, ríos y ciudades' },
  { id: 'historia',   nombre: 'Historia',               icono: 'i-monumento',   descripcion: 'Los hechos que nos unen' },
  { id: 'cultura',    nombre: 'Cultura y Tradiciones',  icono: 'i-musica',      descripcion: 'Fiestas, sabores y raíces' },
  { id: 'deportes',   nombre: 'Deportes',               icono: 'i-balon',       descripcion: 'Talento que hace historia' },
  { id: 'naturaleza', nombre: 'Ciencia y Naturaleza',   icono: 'i-hoja',        descripcion: 'Vida, ingenio y diversidad' }
];

/* Dificultades. 'pista' es la ayuda que se muestra bajo el selector (mockup).
   Pendiente: el mockup solo define la pista de "Medio"; las otras dos se
   completan con la frase común de 20 segundos (ver README, decisiones). */
const DIFICULTADES = [
  { id: 'facil',   nombre: 'Fácil',   pista: 'Siempre tienes 20 segundos por pregunta.' },
  { id: 'medio',   nombre: 'Medio',   pista: 'Medio: un reto para mentes curiosas. Siempre tienes 20 segundos por pregunta.' },
  { id: 'dificil', nombre: 'Difícil', pista: 'Siempre tienes 20 segundos por pregunta.' }
];

/* Banco de preguntas. PENDIENTE: redactar las preguntas reales (etapa posterior).
   Se deja vacío a propósito: no se incluyen datos de prueba ni ficticios.
   Mientras esté vacío, la pantalla de Juego muestra un estado vacío. */
const PREGUNTAS = [];
