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

/* Categorías jugables. "todas" es una opción de filtro, no una categoría del banco. */
const CATEGORIAS = [
  { id: 'todas',       nombre: 'Todas' },
  { id: 'geografia',   nombre: 'Geografía' },
  { id: 'historia',    nombre: 'Historia' },
  { id: 'cultura',     nombre: 'Cultura y Tradiciones' },
  { id: 'deportes',    nombre: 'Deportes' },
  { id: 'naturaleza',  nombre: 'Ciencia y Naturaleza' }
];

const DIFICULTADES = [
  { id: 'facil',   nombre: 'Fácil' },
  { id: 'medio',   nombre: 'Medio' },
  { id: 'dificil', nombre: 'Difícil' }
];

/* Banco de preguntas. PENDIENTE: redactar las preguntas reales (etapa posterior).
   Se deja vacío a propósito: no se incluyen datos de prueba ni ficticios. */
const PREGUNTAS = [];
