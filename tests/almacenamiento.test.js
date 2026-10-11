/* almacenamiento.test.js — Pruebas de la persistencia (js/almacenamiento.js).
   Uso (desde la raíz del proyecto):  node tests/almacenamiento.test.js
   Sin dependencias: usa assert de Node y un localStorage falso (Map) dentro de
   un contexto de vm; una "recarga" se simula creando otra sesión sobre el mismo
   Map. Sale con código 0 si todo pasa y 1 si algo falla. No modifica archivos. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const fuente = fs.readFileSync(path.join(__dirname, '..', 'js', 'almacenamiento.js'), 'utf8');

/**
 * Crea una "sesión" (contexto vm) con un localStorage falso.
 * @param {Map} datosPrevios mapa compartido (simula datos ya almacenados o una recarga)
 * @param {{roto?: boolean}} opciones roto = el getter de localStorage lanza
 */
const crearSesion = (datosPrevios, opciones = {}) => {
  const datos = datosPrevios || new Map();
  const fallos = { lectura: false, escritura: false, borrado: false };
  const storage = {
    getItem(clave) {
      if (fallos.lectura) throw new Error('SecurityError: lectura denegada');
      return datos.has(clave) ? datos.get(clave) : null;
    },
    setItem(clave, valor) {
      if (fallos.escritura) throw new Error('QuotaExceededError');
      datos.set(clave, String(valor));
    },
    removeItem(clave) {
      if (fallos.borrado) throw new Error('SecurityError: borrado denegado');
      datos.delete(clave);
    }
  };
  const ventana = {};
  if (opciones.roto) {
    Object.defineProperty(ventana, 'localStorage', {
      get() { throw new Error('SecurityError: localStorage inaccesible'); }
    });
  } else {
    ventana.localStorage = storage;
  }
  const ctx = vm.createContext({
    window: ventana,
    console: { log() {}, warn() {}, error() {}, info() {} }   // los avisos esperados no ensucian el informe
  });
  vm.runInContext(`${fuente}\n;this.__m = { Almacenamiento };`, ctx);
  return { Almacenamiento: ctx.__m.Almacenamiento, datos, fallos };
};

/* ---------- utilidades de prueba ---------- */
/* Comparación por contenido (los objetos del contexto de vm no son del realm de Node). */
const igual = (real, esperado, mensaje) => assert.strictEqual(JSON.stringify(real), JSON.stringify(esperado), mensaje);
/** Una partida completa y válida; se sobrescriben los campos que hagan falta. */
const partida = (sobrescrituras = {}) => Object.assign({
  nombre: 'Tatiana', puntaje: 975, categoria: 'historia', dificultad: 'facil', fecha: '2026-10-11T10:00:00.000Z'
}, sobrescrituras);

const resultados = [];
const prueba = (nombre, fn) => {
  try { fn(); resultados.push(true); console.log(`PASS  ${nombre}`); }
  catch (e) { resultados.push(false); console.log(`FAIL  ${nombre}\n        ${String(e.message).split('\n')[0]}`); }
};
const titulo = (t) => console.log(`\n== ${t} ==`);

/* ========================================================================== */
titulo('1. Persistencia: guardar y recuperar partidas finalizadas');

prueba('guardarEnRanking guarda los 5 campos exigidos y devuelve la posición 1', () => {
  const s = crearSesion();
  assert.strictEqual(s.Almacenamiento.guardarEnRanking(partida()), 1);
  const filas = s.Almacenamiento.obtenerRanking();
  assert.strictEqual(filas.length, 1);
  igual(filas[0], partida());
  assert.ok(s.datos.has('trivia_ranking'), 'usa la clave trivia_ranking');
});

prueba('Sin fecha se usa la hora actual en formato ISO', () => {
  const s = crearSesion();
  assert.strictEqual(s.Almacenamiento.guardarEnRanking({ nombre: 'Ana', puntaje: 500, categoria: 'deportes', dificultad: 'medio' }), 1);
  const fecha = s.Almacenamiento.obtenerRanking()[0].fecha;
  assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(fecha), `fecha: ${fecha}`);
});

prueba('Varias partidas quedan guardadas con sus campos completos', () => {
  const s = crearSesion();
  s.Almacenamiento.guardarEnRanking(partida({ nombre: 'Ana', puntaje: 400, categoria: 'deportes', dificultad: 'medio', fecha: '2026-10-10T09:00:00.000Z' }));
  s.Almacenamiento.guardarEnRanking(partida());
  const filas = s.Almacenamiento.obtenerRanking();
  igual([filas.length, filas[0].nombre, filas[0].puntaje, filas[1].nombre, filas[1].puntaje], [2, 'Tatiana', 975, 'Ana', 400]);
});

/* ========================================================================== */
titulo('2. Requisito 1 y 4: partidas incompletas se rechazan sin tocar lo guardado');

prueba('Partida incompleta o inválida: null como respuesta y el ranking no cambia', () => {
  const s = crearSesion();
  s.Almacenamiento.guardarEnRanking(partida());
  const antes = s.datos.get('trivia_ranking');
  assert.strictEqual(s.Almacenamiento.guardarEnRanking({ nombre: 'Ana' }), null);                                                             // solo nombre
  assert.strictEqual(s.Almacenamiento.guardarEnRanking({ nombre: 'Ana', puntaje: 100 }), null);                                                // sin categoría ni dificultad
  assert.strictEqual(s.Almacenamiento.guardarEnRanking(partida({ puntaje: '100' })), null);                                                    // puntaje no numérico
  assert.strictEqual(s.Almacenamiento.guardarEnRanking(partida({ nombre: '   ' })), null);                                                     // nombre vacío
  assert.strictEqual(s.Almacenamiento.guardarEnRanking(partida({ puntaje: -5 })), null);                                                       // puntaje negativo
  assert.strictEqual(s.Almacenamiento.guardarEnRanking(partida({ fecha: 'no-fecha' })), null);                                                 // fecha inválida
  assert.strictEqual(s.Almacenamiento.guardarEnRanking(undefined), null);
  assert.strictEqual(s.datos.get('trivia_ranking'), antes, 'los datos existentes quedan intactos');
  assert.strictEqual(s.Almacenamiento.obtenerRanking().length, 1);
});

/* ========================================================================== */
titulo('3. Requisito 3: almacenamiento vacío, datos inválidos y errores de acceso');

prueba('localStorage bloqueado (lectura y escritura): sin excepciones y con valores por defecto', () => {
  const s = crearSesion();
  s.fallos.lectura = true;
  s.fallos.escritura = true;
  assert.strictEqual(s.Almacenamiento.obtenerRanking().length, 0);
  assert.strictEqual(s.Almacenamiento.guardarEnRanking(partida()), null);
  const stats = s.Almacenamiento.actualizarEstadisticas({ aciertos: 5, totalPreguntas: 10, puntaje: 975 });
  igual([stats.partidas, stats.aciertos, stats.mejorPuntaje], [0, 0, 0]);                       // nada quedó escrito
  assert.strictEqual(s.Almacenamiento.obtenerEstadisticas().partidas, 0);
  igual(s.Almacenamiento.obtenerPreferencias(), { sonido: true, tema: 'claro' });
  assert.strictEqual(s.Almacenamiento.guardarPreferencias({ sonido: false }), false);
});

prueba('Borrar con el almacenamiento bloqueado devuelve false sin lanzar', () => {
  const s = crearSesion();
  s.fallos.borrado = true;
  assert.strictEqual(s.Almacenamiento.borrarRanking(), false);
});

prueba('localStorage inaccesible (el getter lanza): todo responde con valores vacíos', () => {
  const s = crearSesion(undefined, { roto: true });
  assert.strictEqual(s.Almacenamiento.obtenerRanking().length, 0);
  assert.strictEqual(s.Almacenamiento.guardarEnRanking(partida()), null);
  assert.strictEqual(s.Almacenamiento.obtenerEstadisticas().partidas, 0);
  igual(s.Almacenamiento.obtenerPreferencias(), { sonido: true, tema: 'claro' });
  assert.strictEqual(s.Almacenamiento.obtenerMejorPuntaje('Tatiana', 'historia', 'facil'), null);
});

prueba('JSON corrupto o de tipo equivocado en las claves: se ignora sin lanzar', () => {
  const s = crearSesion();
  s.datos.set('trivia_ranking', '{esto no es json');
  s.datos.set('trivia_stats', '"una cadena"');
  s.datos.set('trivia_preferencias', 'null');
  const stats = s.Almacenamiento.obtenerEstadisticas();
  assert.strictEqual(s.Almacenamiento.obtenerRanking().length, 0);
  igual([stats.partidas, stats.porcentaje, stats.mejorCategoria], [0, 0, null]);
  igual(s.Almacenamiento.obtenerPreferencias(), { sonido: true, tema: 'claro' });
});

prueba('Entradas corruptas, duplicadas o sin campos se filtran al leer', () => {
  const s = crearSesion();
  s.datos.set('trivia_ranking', JSON.stringify([
    null,
    42,
    {},
    { nombre: 'Ana' },
    partida(),
    partida({ nombre: '  Tatiana  ' }),       // duplicado tras normalizar
    partida({ fecha: undefined }),            // sin fecha
    partida({ puntaje: 'alto' })              // puntaje no numérico
  ]));
  const filas = s.Almacenamiento.obtenerRanking();
  assert.strictEqual(filas.length, 1);
  igual(filas[0], partida());
});

/* ========================================================================== */
titulo('4. Requisito 6: orden consistente y top 10');

prueba('El ranking ordena por puntaje de mayor a menor', () => {
  const s = crearSesion();
  s.Almacenamiento.guardarEnRanking(partida({ puntaje: 500, fecha: '2026-10-01T10:00:00.000Z' }));
  s.Almacenamiento.guardarEnRanking(partida({ puntaje: 900, fecha: '2026-10-02T10:00:00.000Z' }));
  s.Almacenamiento.guardarEnRanking(partida({ puntaje: 700, fecha: '2026-10-03T10:00:00.000Z' }));
  igual(s.Almacenamiento.obtenerRanking().map((f) => f.puntaje), [900, 700, 500]);
});

prueba('En empate gana la partida más antigua y el desempate final es alfabético', () => {
  const s = crearSesion();
  s.Almacenamiento.guardarEnRanking(partida({ nombre: 'Zoe', puntaje: 800, fecha: '2026-10-05T10:00:00.000Z' }));
  s.Almacenamiento.guardarEnRanking(partida({ nombre: 'Ana', puntaje: 800, fecha: '2026-10-05T10:00:00.000Z' }));   // misma fecha → Ana antes que Zoe
  s.Almacenamiento.guardarEnRanking(partida({ nombre: 'Luis', puntaje: 800, fecha: '2026-10-04T10:00:00.000Z' }));   // más antigua → primera
  igual(s.Almacenamiento.obtenerRanking().map((f) => f.nombre), ['Luis', 'Ana', 'Zoe']);
});

prueba('Solo se conservan las 10 mejores posiciones (RF-13)', () => {
  const s = crearSesion();
  for (let i = 1; i <= 11; i += 1) {
    s.Almacenamiento.guardarEnRanking(partida({ puntaje: i * 100, fecha: `2026-10-${String(i).padStart(2, '0')}T10:00:00.000Z` }));
  }
  const filas = s.Almacenamiento.obtenerRanking();
  assert.strictEqual(filas.length, 10);
  igual([filas[0].puntaje, filas[9].puntaje], [1100, 200]);
  assert.strictEqual(s.Almacenamiento.guardarEnRanking(partida({ puntaje: 50, fecha: '2026-10-12T10:00:00.000Z' })), null, 'una partida fuera del top 10 responde null');
  assert.strictEqual(s.Almacenamiento.obtenerRanking().length, 10);
});

prueba('El orden no depende del orden de llegada de las partidas', () => {
  const partidas = [
    partida({ nombre: 'Ana', puntaje: 300, fecha: '2026-10-01T10:00:00.000Z' }),
    partida({ nombre: 'Ana', puntaje: 800, fecha: '2026-10-02T10:00:00.000Z' }),
    partida({ nombre: 'Ana', puntaje: 500, fecha: '2026-10-03T10:00:00.000Z' }),
    partida({ nombre: 'Ana', puntaje: 800, fecha: '2026-10-04T10:00:00.000Z' })
  ];
  const a = crearSesion();
  const b = crearSesion();
  partidas.forEach((p) => a.Almacenamiento.guardarEnRanking(p));
  [3, 1, 0, 2].forEach((i) => b.Almacenamiento.guardarEnRanking(partidas[i]));
  assert.strictEqual(
    JSON.stringify(a.Almacenamiento.obtenerRanking()),
    JSON.stringify(b.Almacenamiento.obtenerRanking()),
    'mismas 10 posiciones, mismo orden'
  );
});

/* ========================================================================== */
titulo('5. Requisito 2: sin resultados duplicados');

prueba('La misma partida guardada dos veces ocupa 1 fila y devuelve la misma posición', () => {
  const s = crearSesion();
  assert.strictEqual(s.Almacenamiento.guardarEnRanking(partida()), 1);
  assert.strictEqual(s.Almacenamiento.guardarEnRanking(partida()), 1);
  assert.strictEqual(s.Almacenamiento.obtenerRanking().length, 1);
});

prueba('Re-guardar una partida intermedia devuelve su posición sin duplicar nada', () => {
  const s = crearSesion();
  s.Almacenamiento.guardarEnRanking(partida({ nombre: 'Ana', puntaje: 900, fecha: '2026-10-01T10:00:00.000Z' }));
  s.Almacenamiento.guardarEnRanking(partida({ nombre: 'Luis', puntaje: 500, fecha: '2026-10-02T10:00:00.000Z' }));
  s.Almacenamiento.guardarEnRanking(partida({ nombre: 'Zoe', puntaje: 700, fecha: '2026-10-03T10:00:00.000Z' }));
  assert.strictEqual(s.Almacenamiento.guardarEnRanking(partida({ nombre: 'Luis', puntaje: 500, fecha: '2026-10-02T10:00:00.000Z' })), 3);
  assert.strictEqual(s.Almacenamiento.obtenerRanking().length, 3);
});

prueba('Dos jugadores con el mismo puntaje y fecha no se confunden', () => {
  const s = crearSesion();
  s.Almacenamiento.guardarEnRanking(partida({ nombre: 'Ana', puntaje: 600 }));
  s.Almacenamiento.guardarEnRanking(partida({ nombre: 'Zoe', puntaje: 600 }));
  igual(s.Almacenamiento.obtenerRanking().map((f) => f.nombre), ['Ana', 'Zoe']);
  assert.strictEqual(s.Almacenamiento.obtenerRanking().length, 2);
});

prueba('Flujo de app.js: finalizar dos veces guarda 1 fila, cuenta 1 partida y da el mismo puesto', () => {
  const s = crearSesion();
  const resumen = { jugador: 'Tatiana', puntaje: 975, categoria: 'historia', dificultad: 'facil', fecha: '2026-10-11T12:00:00.000Z', aciertos: 5, total: 10 };
  const finalizar = () => {
    const puesto = s.Almacenamiento.guardarEnRanking({
      nombre: resumen.jugador, puntaje: resumen.puntaje, categoria: resumen.categoria, dificultad: resumen.dificultad, fecha: resumen.fecha
    });
    s.Almacenamiento.actualizarEstadisticas({
      aciertos: resumen.aciertos, totalPreguntas: resumen.total, puntaje: resumen.puntaje,
      categoria: resumen.categoria, dificultad: resumen.dificultad, jugador: resumen.jugador, fecha: resumen.fecha
    });
    return puesto;
  };
  const primero = finalizar();
  const segundo = finalizar();
  const stats = s.Almacenamiento.obtenerEstadisticas();
  igual([primero, segundo, s.Almacenamiento.obtenerRanking().length, stats.partidas, stats.aciertos], [1, 1, 1, 1, 5]);
});

prueba('actualizarEstadisticas con la misma fecha no cuenta dos veces la partida', () => {
  const s = crearSesion();
  const datos = { aciertos: 5, totalPreguntas: 10, puntaje: 975, categoria: 'historia', fecha: '2026-10-11T12:00:00.000Z' };
  s.Almacenamiento.actualizarEstadisticas(datos);
  s.Almacenamiento.actualizarEstadisticas(datos);
  const stats = s.Almacenamiento.obtenerEstadisticas();
  igual([stats.partidas, stats.aciertos, stats.totalPreguntas, stats.mejorPuntaje], [1, 5, 10, 975]);
});

/* ========================================================================== */
titulo('6. Limpieza: borrar el ranking');

prueba('borrarRanking elimina ranking y estadísticas, pero conserva las preferencias', () => {
  const s = crearSesion();
  s.Almacenamiento.guardarEnRanking(partida());
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 5, totalPreguntas: 10, puntaje: 975, categoria: 'historia' });
  s.Almacenamiento.guardarPreferencias({ sonido: false, tema: 'oscuro' });
  assert.strictEqual(s.Almacenamiento.borrarRanking(), true);
  assert.strictEqual(s.datos.has('trivia_ranking'), false, 'borra trivia_ranking');
  assert.strictEqual(s.datos.has('trivia_stats'), false, 'borra trivia_stats (así lo indica el mockup)');
  assert.strictEqual(s.datos.has('trivia_preferencias'), true, 'no toca las preferencias');
  const stats = s.Almacenamiento.obtenerEstadisticas();
  igual([s.Almacenamiento.obtenerRanking().length, stats.partidas, stats.mejorPuntaje, stats.mejorCategoria], [0, 0, 0, null]);
  igual(s.Almacenamiento.obtenerPreferencias(), { sonido: false, tema: 'oscuro' });
});

/* ========================================================================== */
titulo('7. Estadísticas acumuladas');

prueba('Acumulan partidas, aciertos, preguntas y porcentaje', () => {
  const s = crearSesion();
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 5, totalPreguntas: 10, puntaje: 975, categoria: 'historia', dificultad: 'facil', jugador: 'Tatiana', fecha: '2026-10-11T12:00:00.000Z' });
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 8, totalPreguntas: 10, puntaje: 1400, categoria: 'deportes', dificultad: 'medio', jugador: 'Tatiana', fecha: '2026-10-12T12:00:00.000Z' });
  const stats = s.Almacenamiento.obtenerEstadisticas();
  igual([stats.partidas, stats.aciertos, stats.totalPreguntas, stats.porcentaje, stats.mejorPuntaje], [2, 13, 20, 65, 1400]);
  assert.ok(s.datos.has('trivia_stats'), 'usa la clave trivia_stats');
});

prueba('Sin partidas registradas el porcentaje es 0 (sin división por cero)', () => {
  const s = crearSesion();
  const stats = s.Almacenamiento.obtenerEstadisticas();
  igual([stats.partidas, stats.aciertos, stats.totalPreguntas, stats.porcentaje, stats.mejorPuntaje, stats.mejorCategoria], [0, 0, 0, 0, 0, null]);
});

prueba('mejorCategoria es la categoría con más puntos; "todas" no atribuye a ninguna', () => {
  const s = crearSesion();
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 5, totalPreguntas: 10, puntaje: 999, categoria: 'todas', fecha: '2026-10-01T12:00:00.000Z' });
  assert.strictEqual(s.Almacenamiento.obtenerEstadisticas().mejorCategoria, null);
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 5, totalPreguntas: 10, puntaje: 300, categoria: 'historia', fecha: '2026-10-02T12:00:00.000Z' });
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 5, totalPreguntas: 10, puntaje: 200, categoria: 'deportes', fecha: '2026-10-03T12:00:00.000Z' });
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 5, totalPreguntas: 10, puntaje: 500, categoria: 'geografia', fecha: '2026-10-04T12:00:00.000Z' });
  const stats = s.Almacenamiento.obtenerEstadisticas();
  igual([stats.mejorCategoria, stats.mejoresPuntajes.historia, stats.mejoresPuntajes.deportes], ['geografia', 300, 200]);
});

prueba('Guardar una partida nueva no borra los datos ya acumulados', () => {
  const s = crearSesion();
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 4, totalPreguntas: 10, puntaje: 700, categoria: 'historia', dificultad: 'facil', jugador: 'Ana', fecha: '2026-10-01T12:00:00.000Z' });
  s.Almacenamiento.guardarEnRanking(partida({ nombre: 'Ana', puntaje: 700, fecha: '2026-10-01T12:00:00.000Z' }));
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 6, totalPreguntas: 10, puntaje: 1200, categoria: 'deportes', dificultad: 'medio', jugador: 'Ana', fecha: '2026-10-02T12:00:00.000Z' });
  s.Almacenamiento.guardarEnRanking(partida({ nombre: 'Ana', puntaje: 1200, categoria: 'deportes', dificultad: 'medio', fecha: '2026-10-02T12:00:00.000Z' }));
  const stats = s.Almacenamiento.obtenerEstadisticas();
  const filas = s.Almacenamiento.obtenerRanking();
  igual(
    [filas.length, filas[1].nombre, stats.partidas, stats.aciertos, stats.mejoresPuntajes.historia, stats.mejoresPuntajes.deportes],
    [2, 'Ana', 2, 10, 700, 1200]
  );
});

prueba('Datos inválidos no actualizan las estadísticas (sin aciertos, no numéricos o aciertos > total)', () => {
  const s = crearSesion();
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 5, totalPreguntas: 10, puntaje: 975, categoria: 'historia', fecha: '2026-10-11T12:00:00.000Z' });
  const antes = s.datos.get('trivia_stats');
  s.Almacenamiento.actualizarEstadisticas({ puntaje: 400 });                                 // sin aciertos
  s.Almacenamiento.actualizarEstadisticas({ aciertos: '5', totalPreguntas: 10, puntaje: 400 }); // aciertos no numéricos
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 15, totalPreguntas: 10, puntaje: 400 }); // aciertos > total
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 5, totalPreguntas: 10, puntaje: -20 });  // puntaje negativo
  s.Almacenamiento.actualizarEstadisticas(null);
  assert.strictEqual(s.datos.get('trivia_stats'), antes, 'nada cambió en el almacenamiento');
  const stats = s.Almacenamiento.obtenerEstadisticas();
  igual([stats.partidas, stats.aciertos, stats.mejorPuntaje], [1, 5, 975]);
});

/* ========================================================================== */
titulo('8. Preferencias (sonido y tema)');

prueba('Preferencias por defecto con el almacenamiento vacío', () => {
  const s = crearSesion();
  igual(s.Almacenamiento.obtenerPreferencias(), { sonido: true, tema: 'claro' });
});

prueba('Sonido y tema se conservan tras una recarga', () => {
  const s = crearSesion();
  assert.strictEqual(s.Almacenamiento.guardarPreferencias({ sonido: false, tema: 'oscuro' }), true);
  const recargada = crearSesion(s.datos);                    // nueva sesión sobre los mismos datos
  igual(recargada.Almacenamiento.obtenerPreferencias(), { sonido: false, tema: 'oscuro' });
});

prueba('Valores guardados inválidos se sanean y solo se exponen las dos claves conocidas', () => {
  const s = crearSesion();
  s.datos.set('trivia_preferencias', JSON.stringify({ sonido: 'no', tema: 'neon', rastro: 'x' }));
  igual(s.Almacenamiento.obtenerPreferencias(), { sonido: true, tema: 'claro' });
  assert.strictEqual(Object.keys(s.Almacenamiento.obtenerPreferencias()).length, 2);
});

prueba('guardarPreferencias normaliza y permite actualizar un solo campo sin perder el otro', () => {
  const s = crearSesion();
  s.Almacenamiento.guardarPreferencias({ sonido: true, tema: 'claro' });
  s.Almacenamiento.guardarPreferencias({ tema: 'oscuro' });                 // solo un campo
  igual(s.Almacenamiento.obtenerPreferencias(), { sonido: true, tema: 'oscuro' });
  s.Almacenamiento.guardarPreferencias({ sonido: false, tema: 'auto' });    // tema inválido → 'claro'
  igual(s.Almacenamiento.obtenerPreferencias(), { sonido: false, tema: 'claro' });
});

prueba('guardarPreferencias con datos inválidos no lanza y conserva lo guardado', () => {
  const s = crearSesion();
  s.Almacenamiento.guardarPreferencias({ sonido: false, tema: 'oscuro' });
  s.Almacenamiento.guardarPreferencias(null);
  s.Almacenamiento.guardarPreferencias('hola');
  igual(s.Almacenamiento.obtenerPreferencias(), { sonido: false, tema: 'oscuro' });
});

/* ========================================================================== */
titulo('9. Mejor puntaje por categoría y dificultad');

prueba('Mejor puntaje por combinación, aislado por jugador y dificultad', () => {
  const s = crearSesion();
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 5, totalPreguntas: 10, puntaje: 500, categoria: 'historia', dificultad: 'facil', jugador: 'Tatiana', fecha: '2026-10-01T12:00:00.000Z' });
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 7, totalPreguntas: 10, puntaje: 800, categoria: 'historia', dificultad: 'facil', jugador: 'Tatiana', fecha: '2026-10-02T12:00:00.000Z' });
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 3, totalPreguntas: 10, puntaje: 999, categoria: 'historia', dificultad: 'dificil', jugador: 'Ana', fecha: '2026-10-03T12:00:00.000Z' });
  igual([
    s.Almacenamiento.obtenerMejorPuntaje('Tatiana', 'historia', 'facil'),
    s.Almacenamiento.obtenerMejorPuntaje('Tatiana', 'historia', 'dificil'),
    s.Almacenamiento.obtenerMejorPuntaje('Ana', 'historia', 'dificil'),
    s.Almacenamiento.obtenerMejorPuntaje('Tatiana', 'deportes', 'facil')
  ], [800, null, 999, null]);
});

prueba('"todas" devuelve el mejor puntaje de cualquier categoría de ese nivel', () => {
  const s = crearSesion();
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 5, totalPreguntas: 10, puntaje: 450, categoria: 'historia', dificultad: 'medio', jugador: 'Tatiana', fecha: '2026-10-01T12:00:00.000Z' });
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 6, totalPreguntas: 10, puntaje: 700, categoria: 'deportes', dificultad: 'medio', jugador: 'Tatiana', fecha: '2026-10-02T12:00:00.000Z' });
  s.Almacenamiento.actualizarEstadisticas({ aciertos: 4, totalPreguntas: 10, puntaje: 300, categoria: 'todas', dificultad: 'facil', jugador: 'Tatiana', fecha: '2026-10-03T12:00:00.000Z' });
  igual([
    s.Almacenamiento.obtenerMejorPuntaje('Tatiana', 'todas', 'medio'),
    s.Almacenamiento.obtenerMejorPuntaje('Tatiana', 'todas', 'facil'),
    s.Almacenamiento.obtenerMejorPuntaje('Tatiana', 'todas', 'dificil')
  ], [700, 300, null]);
});

prueba('Sin nombre de jugador no consulta (devuelve null)', () => {
  const s = crearSesion();
  igual([
    s.Almacenamiento.obtenerMejorPuntaje('', 'historia', 'facil'),
    s.Almacenamiento.obtenerMejorPuntaje(null, 'historia', 'facil')
  ], [null, null]);
});

prueba('La consulta sigue siendo correcta cuando esa partida salió del top 10', () => {
  const s = crearSesion();
  const guardar = (puntaje, categoria, dificultad, fecha) => {
    s.Almacenamiento.guardarEnRanking(partida({ puntaje, categoria, dificultad, fecha }));
    s.Almacenamiento.actualizarEstadisticas({ aciertos: 5, totalPreguntas: 10, puntaje, categoria, dificultad, jugador: 'Tatiana', fecha });
  };
  guardar(500, 'historia', 'facil', '2026-10-01T12:00:00.000Z');
  for (let i = 1; i <= 10; i += 1) {
    guardar(1000 + i, 'deportes', 'medio', `2026-10-${String(i + 1).padStart(2, '0')}T12:00:00.000Z`);
  }
  assert.strictEqual(s.Almacenamiento.obtenerRanking().some((f) => f.categoria === 'historia'), false, 'la partida de historia ya no está en el top 10');
  assert.strictEqual(s.Almacenamiento.obtenerMejorPuntaje('Tatiana', 'historia', 'facil'), 500, 'pero la combinación la conserva');
  assert.strictEqual(s.Almacenamiento.obtenerMejorPuntaje('Tatiana', 'deportes', 'medio'), 1010);
});

prueba('Con datos antiguos sin combinaciones, la consulta usa el ranking como respaldo', () => {
  const s = crearSesion();
  s.datos.set('trivia_ranking', JSON.stringify([partida()]));        // solo ranking, como antes del cambio
  assert.strictEqual(s.Almacenamiento.obtenerMejorPuntaje('Tatiana', 'historia', 'facil'), 975);
  assert.strictEqual(s.Almacenamiento.obtenerMejorPuntaje('Tatiana', 'historia', 'medio'), null);
});

/* ========================================================================== */
const fallos = resultados.filter((r) => !r).length;
console.log(`\n${fallos === 0 ? 'RESULTADO: TODAS LAS PRUEBAS PASARON' : `RESULTADO: ${fallos} PRUEBA(S) FALLARON`} (${resultados.length - fallos}/${resultados.length})`);
process.exit(fallos ? 1 : 0);
