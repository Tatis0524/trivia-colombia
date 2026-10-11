/* motor-juego.test.js — Pruebas del motor (js/juego.js) con el banco real (js/preguntas.js).
   Uso (desde la raíz del proyecto):  node tests/motor-juego.test.js
   Sin dependencias: usa assert de Node, un reloj falso (para no esperar 20 s reales)
   y un generador pseudoaleatorio con semilla cuando se necesita un resultado repetible.
   Sale con código 0 si todo pasa y 1 si algo falla. No modifica ningún archivo. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const leer = (archivo) => fs.readFileSync(path.join(__dirname, '..', 'js', archivo), 'utf8');
const ctx = vm.createContext({ console });
vm.runInContext(`${leer('preguntas.js')}\n${leer('juego.js')}\n;this.__m = { Juego, REGLAS, PREGUNTAS, CATEGORIAS };`, ctx);
const { Juego, REGLAS, PREGUNTAS, CATEGORIAS } = ctx.__m;

/* ---------- utilidades de prueba ---------- */
/* Compara por contenido (los arreglos del motor viven en otro contexto de vm y deepStrictEqual los vería distintos). */
const igual = (real, esperado, mensaje) => assert.strictEqual(JSON.stringify(real), JSON.stringify(esperado), mensaje);
const semilla = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ALEATORIO_ORIGINAL = Juego.aleatorio;

/** Reloj falso: guarda los intervalos activos y deja avanzar "segundos" a mano. */
const crearReloj = () => {
  const activos = new Map(); let id = 0; let creados = 0;
  return {
    activos, get creados() { return creados; },
    iniciar(fn) { id += 1; creados += 1; activos.set(id, fn); return id; },
    detener(i) { activos.delete(i); },
    pasar(segundos) { for (let s = 0; s < segundos; s += 1) [...activos.values()].forEach((fn) => fn()); }
  };
};

let reloj; let eventos;
const nuevaPartida = (categoria = 'historia', dificultad = 'facil', jugador = 'Catalina') => {
  Juego.cancelarPartida();
  reloj = crearReloj(); eventos = { ticks: [], agotados: [] };
  Juego._reloj = reloj;
  Juego.aleatorio = semilla(12345);
  Juego.conectar({ alTick: (s) => eventos.ticks.push(s), alAgotarTiempo: (r) => eventos.agotados.push(r) });
  Juego.iniciarPartida(categoria, dificultad, jugador);
  return Juego.estado;
};
const acertar = () => Juego.responder(Juego.preguntaActual().correcta);
const fallar = () => Juego.responder((Juego.preguntaActual().correcta + 1) % 4);
const siguiente = () => { assert.strictEqual(Juego.avanzarPregunta(), true); };

const resultados = [];
const prueba = (nombre, fn) => {
  try { fn(); resultados.push(true); console.log(`PASS  ${nombre}`); }
  catch (e) { resultados.push(false); console.log(`FAIL  ${nombre}\n        ${String(e.message).split('\n')[0]}`); }
  finally { Juego.aleatorio = ALEATORIO_ORIGINAL; }
};
const titulo = (t) => console.log(`\n== ${t} ==`);

/* ========================================================================== */
titulo('1. Cálculo de puntaje (Word §6.1)');

prueba('CP-04: acierto con 12 s restantes en Fácil = 100 + 60 = 160', () => {
  const p = Juego.calcularPuntos({ segundosRestantes: 12, racha: 1, dificultad: 'facil' });
  igual([p.base, p.rapidez, p.racha, p.total], [100, 60, 0, 160]);
});
prueba('Multiplicadores: 12 s → Fácil 160, Medio 240, Difícil 320', () => {
  const t = (d) => Juego.calcularPuntos({ segundosRestantes: 12, racha: 1, dificultad: d }).total;
  igual([t('facil'), t('medio'), t('dificil')], [160, 240, 320]);
});
prueba('El multiplicador se aplica DESPUÉS de sumar rapidez y racha', () => {
  const p = Juego.calcularPuntos({ segundosRestantes: 10, racha: 3, dificultad: 'dificil' });
  assert.strictEqual(p.bruto, 100 + 50 + 50);
  assert.strictEqual(p.total, (100 + 50 + 50) * 2);
});
prueba('Rapidez: +5 por segundo y tope de +100 (20 s o más)', () => {
  const r = (s) => Juego.calcularPuntos({ segundosRestantes: s, racha: 1, dificultad: 'facil' }).rapidez;
  igual([r(0), r(1), r(19), r(20), r(30)], [0, 5, 95, 100, 100]);
});
prueba('Racha: +50 solo al 3.º, 6.º y 9.º acierto seguido', () => {
  const b = (n) => Juego.calcularPuntos({ segundosRestantes: 0, racha: n, dificultad: 'facil' }).racha;
  igual([1, 2, 3, 4, 5, 6, 9].map(b), [0, 0, 50, 0, 0, 50, 50]);
});
prueba('Redondeo al entero más cercano (105 × 1,5 = 157,5 → 158)', () => {
  assert.strictEqual(Juego.calcularPuntos({ segundosRestantes: 1, racha: 1, dificultad: 'medio' }).total, 158);
});
prueba('Puntaje máximo teórico: 2.150 / 3.225 / 4.300', () => {
  igual(['facil', 'medio', 'dificil'].map((d) => Juego.puntajeMaximo(d)), [2150, 3225, 4300]);
});
prueba('Partida real: 3 aciertos con 20 s en Fácil = 200 + 200 + 250 = 650', () => {
  nuevaPartida('historia', 'facil');
  acertar(); siguiente(); acertar(); siguiente(); acertar();
  assert.strictEqual(Juego.estado.puntaje, 650);
});
prueba('Partida real: los mismos 3 aciertos en Medio = 300 + 300 + 375 = 975', () => {
  nuevaPartida('historia', 'medio');
  acertar(); siguiente(); acertar(); siguiente(); acertar();
  assert.strictEqual(Juego.estado.puntaje, 975);
});
prueba('Respuesta incorrecta: 0 puntos y la racha vuelve a 0 (sin bono a los 5 seguidos)', () => {
  nuevaPartida();
  acertar(); siguiente(); acertar(); siguiente();
  const r = fallar();
  assert.strictEqual(r.puntos, 0); assert.strictEqual(Juego.estado.racha, 0);
  siguiente(); assert.strictEqual(acertar().desglose.racha, 0);
  siguiente(); assert.strictEqual(acertar().desglose.racha, 0);
  siguiente(); assert.strictEqual(acertar().desglose.racha, 50);   // tercer acierto seguido tras el fallo
});
prueba('Comodín resta 30 fijos (no se multiplican) y el puntaje no baja de 0', () => {
  nuevaPartida('historia', 'dificil');
  const r = Juego.usarComodin('cincuenta');
  assert.strictEqual(r.puntaje, 0);                                  // 0 − 30 → piso en 0
  acertar();                                                          // +(200 × 2) = 400
  assert.strictEqual(Juego.estado.puntaje, 400 - 30);                // la penalización se compensa con lo ganado
});
prueba('Dos comodines = −60 sobre lo ganado', () => {
  nuevaPartida('historia', 'facil');
  acertar(); siguiente();                                             // 200
  Juego.usarComodin('cincuenta'); Juego.usarComodin('tiempo');
  assert.strictEqual(Juego.estado.puntaje, 200 - 60);
});

/* ========================================================================== */
titulo('2. Selección de preguntas y mezcla');

prueba('mezclar (Fisher-Yates) conserva los elementos y NO modifica el arreglo original', () => {
  const original = [1, 2, 3, 4, 5, 6, 7, 8];
  const copia = original.slice();
  const m = Juego.mezclar(original);
  igual(original, copia);
  igual(m.slice().sort((a, b) => a - b), copia);
});
prueba('mezclar es uniforme: 6.000 mezclas de 3 elementos, cada permutación ≈ 1.000 (±15 %)', () => {
  Juego.aleatorio = semilla(2026);
  const cuenta = {};
  for (let i = 0; i < 6000; i += 1) { const k = Juego.mezclar([0, 1, 2]).join(''); cuenta[k] = (cuenta[k] || 0) + 1; }
  assert.strictEqual(Object.keys(cuenta).length, 6);
  Object.values(cuenta).forEach((n) => assert.ok(n > 850 && n < 1150, `frecuencia ${n} fuera de rango`));
});
prueba('mezclar con azar real (Math.random) devuelve el mismo conjunto', () => {
  const m = Juego.mezclar([...Array(50).keys()]);
  assert.strictEqual(new Set(m).size, 50);
});
prueba('obtenerPreguntas: 10 preguntas sin repetir en las 18 combinaciones (6 categorías × 3 niveles)', () => {
  const ids = CATEGORIAS.map((c) => c.id);
  ids.forEach((c) => ['facil', 'medio', 'dificil'].forEach((d) => {
    const qs = Juego.obtenerPreguntas(c, d);
    assert.strictEqual(qs.length, 10, `${c}/${d}`);
    assert.strictEqual(new Set(qs.map((q) => q.id)).size, 10, `repetidas en ${c}/${d}`);
    qs.forEach((q) => { assert.strictEqual(q.dificultad, d); if (c !== 'todas') assert.strictEqual(q.categoria, c); });
  }));
});
prueba('Categoría "Todas": mezcla las 5 categorías (200 partidas, todas aparecen)', () => {
  const vistas = new Set();
  for (let i = 0; i < 200; i += 1) Juego.obtenerPreguntas('todas', 'medio').forEach((q) => vistas.add(q.categoria));
  assert.strictEqual(vistas.size, 5);
});
prueba('Cada categoría específica solo trae preguntas de esa categoría (5 categorías)', () => {
  CATEGORIAS.filter((c) => c.id !== 'todas').forEach((c) => {
    Juego.obtenerPreguntas(c.id, 'facil').forEach((q) => assert.strictEqual(q.categoria, c.id));
  });
});
prueba('Las 4 opciones se mezclan SIN perder la respuesta correcta (todo el banco × 20 mezclas)', () => {
  PREGUNTAS.forEach((orig) => {
    for (let i = 0; i < 20; i += 1) {
      const q = Juego._prepararPregunta(orig);
      assert.strictEqual(q.opciones.length, 4);
      assert.strictEqual(q.opciones[q.correcta], orig.opciones[orig.correcta], `id ${orig.id}`);
      igual(q.opciones.slice().sort(), orig.opciones.slice().sort());
    }
  });
});
prueba('La posición de la correcta varía (no queda fija tras mezclar)', () => {
  const pos = new Set();
  for (let i = 0; i < 100; i += 1) pos.add(Juego._prepararPregunta(PREGUNTAS[0]).correcta);
  assert.strictEqual(pos.size, 4);
});
prueba('Mezclar no altera el banco original (PREGUNTAS idéntico antes y después)', () => {
  const antes = JSON.stringify(PREGUNTAS);
  for (let i = 0; i < 30; i += 1) Juego.obtenerPreguntas('todas', 'dificil');
  nuevaPartida(); acertar();
  assert.strictEqual(JSON.stringify(PREGUNTAS), antes);
});
prueba('Dos partidas con los mismos filtros cambian el orden (CP-03)', () => {
  const a = Juego.obtenerPreguntas('historia', 'facil').map((q) => q.id).join();
  const b = Juego.obtenerPreguntas('historia', 'facil').map((q) => q.id).join();
  assert.notStrictEqual(a, b);
});
prueba('Categoría o dificultad inválidas lanzan error', () => {
  assert.throws(() => Juego.obtenerPreguntas('musica', 'facil'));
  assert.throws(() => Juego.obtenerPreguntas('historia', 'imposible'));
});

/* ========================================================================== */
titulo('3. Nombre válido antes de comenzar (RF-01, CP-01)');

prueba('validarNombre: rechaza vacío, 1 carácter, solo símbolos y más de 20; acepta y normaliza espacios', () => {
  ['', '   ', 'a', '!!', null, undefined, 'x'.repeat(21)].forEach((n) => assert.strictEqual(Juego.validarNombre(n).valido, false, String(n)));
  const ok = Juego.validarNombre('  María   José ');
  igual([ok.valido, ok.nombre], [true, 'María José']);
  assert.strictEqual(Juego.validarNombre('x'.repeat(20)).valido, true);
});
prueba('iniciarPartida sin nombre válido lanza error y no crea partida', () => {
  Juego.cancelarPartida();
  assert.throws(() => Juego.iniciarPartida('historia', 'facil', ''));
  assert.throws(() => Juego.iniciarPartida('historia', 'facil'));
  assert.strictEqual(Juego.estado, null);
});
prueba('iniciarPartida deja el estado del Word §13: 10 preguntas, 20 s, comodines disponibles', () => {
  const e = nuevaPartida('naturaleza', 'medio', 'Ana');
  igual(
    [e.jugador, e.categoria, e.dificultad, e.preguntas.length, e.indiceActual, e.aciertos, e.racha, e.puntaje, e.tiempoRestante],
    ['Ana', 'naturaleza', 'medio', 10, 0, 0, 0, 0, 20]);
  igual(e.comodines, { cincuenta: true, tiempo: true });
});

/* ========================================================================== */
titulo('4. Temporizador');

prueba('iniciarPartida NO arranca el reloj; iniciarTemporizador crea exactamente un intervalo', () => {
  nuevaPartida();
  assert.strictEqual(reloj.activos.size, 0);
  assert.strictEqual(Juego.iniciarTemporizador(), true);
  assert.strictEqual(reloj.activos.size, 1);
});
prueba('Llamar iniciarTemporizador varias veces nunca deja temporizadores simultáneos', () => {
  nuevaPartida();
  for (let i = 0; i < 5; i += 1) Juego.iniciarTemporizador();
  assert.strictEqual(reloj.activos.size, 1);
  reloj.pasar(3);
  assert.strictEqual(Juego.estado.tiempoRestante, 17);           // 3 s, no 15: un solo reloj corriendo
});
prueba('La cuenta regresiva baja 1 por segundo y avisa a la interfaz (alTick)', () => {
  nuevaPartida(); Juego.iniciarTemporizador(); reloj.pasar(4);
  igual(eventos.ticks, [19, 18, 17, 16]);
});
prueba('CP-06: al llegar a 0 la pregunta cuenta incorrecta con 0 puntos y se avisa (alAgotarTiempo)', () => {
  nuevaPartida(); Juego.iniciarTemporizador(); reloj.pasar(20);
  assert.strictEqual(eventos.agotados.length, 1);
  const r = eventos.agotados[0];
  igual([r.agotado, r.acerto, r.elegida, r.puntos], [true, false, null, 0]);
  igual([Juego.estado.aciertos, Juego.estado.puntaje, Juego.estado.recorrido], [0, 0, [false]]);
  assert.strictEqual(reloj.activos.size, 0);                       // el reloj se detiene solo
  assert.strictEqual(Juego.estado.tiempoTotal, 20);
});
prueba('Pasado el cero el reloj ya no sigue contando ni vuelve a responder', () => {
  nuevaPartida(); Juego.iniciarTemporizador(); reloj.pasar(40);
  assert.strictEqual(eventos.agotados.length, 1);
  assert.strictEqual(Juego.estado.tiempoRestante, 0);
});
prueba('Al responder el reloj se detiene (sin ticks posteriores)', () => {
  nuevaPartida(); Juego.iniciarTemporizador(); reloj.pasar(5);
  acertar();
  assert.strictEqual(reloj.activos.size, 0);
  reloj.pasar(30);
  assert.strictEqual(Juego.estado.tiempoRestante, 15);
  assert.strictEqual(eventos.agotados.length, 0);
});
prueba('Responder con 8 s consumidos (12 restantes) da +60 de rapidez (CP-04 en juego)', () => {
  nuevaPartida(); Juego.iniciarTemporizador(); reloj.pasar(8);
  const r = acertar();
  igual([r.desglose.rapidez, r.puntos], [60, 160]);
  assert.strictEqual(Juego.estado.tiempoTotal, 8);
});
prueba('avanzarPregunta reinicia a 20 s y el reloj se reanuda sin duplicarse', () => {
  nuevaPartida(); Juego.iniciarTemporizador(); reloj.pasar(7); acertar(); siguiente();
  assert.strictEqual(Juego.estado.tiempoRestante, 20);
  Juego.iniciarTemporizador();
  assert.strictEqual(reloj.activos.size, 1);
  reloj.pasar(2); assert.strictEqual(Juego.estado.tiempoRestante, 18);
});
prueba('Pausa y reanudación (cambiar de pantalla / salir y cancelar) conservan el tiempo', () => {
  nuevaPartida(); Juego.iniciarTemporizador(); reloj.pasar(6);
  Juego.detenerTemporizador(); reloj.pasar(10);
  assert.strictEqual(Juego.estado.tiempoRestante, 14);
  Juego.iniciarTemporizador(); reloj.pasar(1);
  assert.strictEqual(Juego.estado.tiempoRestante, 13);
});
prueba('Reiniciar la partida cancela el reloj anterior: un tic viejo no afecta la partida nueva', () => {
  nuevaPartida(); Juego.iniciarTemporizador();
  const viejo = [...reloj.activos.values()][0];
  Juego.iniciarPartida('deportes', 'facil', 'Otra');
  assert.strictEqual(reloj.activos.size, 0);
  viejo(); viejo();                                                // tics rezagados del reloj anterior
  assert.strictEqual(Juego.estado.tiempoRestante, 20);
});
prueba('Salir (cancelarPartida) detiene el reloj y descarta el estado', () => {
  nuevaPartida(); Juego.iniciarTemporizador(); Juego.cancelarPartida();
  assert.strictEqual(reloj.activos.size, 0); assert.strictEqual(Juego.estado, null);
  assert.strictEqual(Juego.iniciarTemporizador(), false);
});
prueba('Comodín de tiempo suma 10 s: la pregunta dura 30 s en total', () => {
  nuevaPartida(); Juego.iniciarTemporizador(); reloj.pasar(5);
  const r = Juego.usarComodin('tiempo');
  assert.strictEqual(r.tiempoRestante, 25);
  reloj.pasar(24); assert.strictEqual(eventos.agotados.length, 0);
  reloj.pasar(1);  assert.strictEqual(eventos.agotados.length, 1);
  assert.strictEqual(Juego.estado.tiempoTotal, 30);
});
prueba('El comodín de tiempo no pasa a la pregunta siguiente (vuelve a 20 s)', () => {
  nuevaPartida(); Juego.usarComodin('tiempo'); acertar(); siguiente();
  assert.strictEqual(Juego.estado.tiempoRestante, 20);
  assert.strictEqual(Juego.estado.tiempoLimite, 20);
});
prueba('responder(null) con tiempo restante no cuenta como "tiempo agotado"', () => {
  nuevaPartida();
  assert.strictEqual(Juego.responder(null), null);
  assert.strictEqual(Juego.estado.respondida, false);
});

/* ========================================================================== */
titulo('5. Bloqueo de respuestas y comodines');

prueba('CP-07: una segunda respuesta a la misma pregunta se ignora (sin puntos duplicados)', () => {
  nuevaPartida();
  const primera = acertar(); const puntaje = Juego.estado.puntaje;
  assert.ok(primera);
  assert.strictEqual(acertar(), null); assert.strictEqual(fallar(), null);
  igual([Juego.estado.puntaje, Juego.estado.aciertos, Juego.estado.recorrido.length], [puntaje, 1, 1]);
});
prueba('Responder muchas veces seguidas (doble clic / 50 clics) suma los puntos una sola vez', () => {
  nuevaPartida();
  for (let i = 0; i < 50; i += 1) acertar();
  igual([Juego.estado.puntaje, Juego.estado.aciertos], [200, 1]);
});
prueba('Tras agotarse el tiempo ya no se acepta respuesta (ni se duplica el resultado)', () => {
  nuevaPartida(); Juego.iniciarTemporizador(); reloj.pasar(20);
  assert.strictEqual(acertar(), null);
  igual([Juego.estado.aciertos, Juego.estado.puntaje, Juego.estado.recorrido.length], [0, 0, 1]);
});
prueba('Una respuesta fuera de rango o con tipo inválido se ignora', () => {
  nuevaPartida();
  [-1, 4, 1.5, '1', undefined, NaN].forEach((v) => assert.strictEqual(Juego.responder(v), null, String(v)));
  assert.strictEqual(Juego.estado.respondida, false);
});
prueba('Sin partida o con partida terminada, responder no hace nada', () => {
  Juego.cancelarPartida(); assert.strictEqual(Juego.responder(0), null);
});
prueba('CP-08: el 50/50 elimina 2 opciones incorrectas (nunca la correcta) y queda usado', () => {
  for (let i = 0; i < 100; i += 1) {
    nuevaPartida();
    const r = Juego.usarComodin('cincuenta');
    assert.strictEqual(r.ok, true); assert.strictEqual(r.eliminadas.length, 2);
    assert.strictEqual(new Set(r.eliminadas).size, 2);
    assert.ok(!r.eliminadas.includes(Juego.preguntaActual().correcta));
    assert.strictEqual(Juego.estado.comodines.cincuenta, false);
  }
});
prueba('Una opción eliminada por el 50/50 no se puede elegir', () => {
  nuevaPartida();
  const { eliminadas } = Juego.usarComodin('cincuenta');
  assert.strictEqual(Juego.responder(eliminadas[0]), null);
  assert.strictEqual(Juego.estado.respondida, false);
});
prueba('Cada comodín se usa una sola vez por partida (aunque sea en otra pregunta)', () => {
  nuevaPartida();
  assert.strictEqual(Juego.usarComodin('cincuenta').ok, true);
  assert.strictEqual(Juego.usarComodin('cincuenta').ok, false);
  acertar(); siguiente();
  assert.strictEqual(Juego.usarComodin('cincuenta').ok, false);
  assert.strictEqual(Juego.usarComodin('tiempo').ok, true);
  assert.strictEqual(Juego.usarComodin('tiempo').ok, false);
  assert.strictEqual(Juego.estado.comodinesUsados, 2);
  assert.strictEqual(Juego.estado.penalizacion, 60);
});
prueba('Comodín no se puede usar tras responder, con tipo desconocido o sin partida', () => {
  nuevaPartida(); acertar();
  assert.strictEqual(Juego.usarComodin('cincuenta').ok, false);
  siguiente();
  assert.strictEqual(Juego.usarComodin('pista').ok, false);
  Juego.cancelarPartida();
  assert.strictEqual(Juego.usarComodin('tiempo').ok, false);
});
prueba('El 50/50 no pasa a la siguiente pregunta (eliminadas se limpia)', () => {
  nuevaPartida(); Juego.usarComodin('cincuenta'); acertar(); siguiente();
  igual(Juego.estado.eliminadas, []);
});

/* ========================================================================== */
titulo('6. Avance y final de partida');

prueba('avanzarPregunta no avanza si la pregunta actual no se ha respondido', () => {
  nuevaPartida();
  assert.strictEqual(Juego.avanzarPregunta(), null);
  assert.strictEqual(Juego.estado.indiceActual, 0);
});
prueba('finalizarPartida antes de responder las 10 devuelve null', () => {
  nuevaPartida(); acertar();
  assert.strictEqual(Juego.finalizarPartida(), null);
  assert.strictEqual(Juego.hayPartidaEnCurso(), true);
});
prueba('CP-10: partida completa de 10 preguntas con aciertos y errores → resumen correcto', () => {
  nuevaPartida('todas', 'medio', 'Valentina');
  const esperado = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 4 === 3 ? fallar() : acertar();
    esperado.push(r.acerto);
    assert.strictEqual(r.indice, i + 1);
    if (i < 9) siguiente();
  }
  assert.strictEqual(Juego.avanzarPregunta(), false);                  // no hay una 11.ª pregunta
  const res = Juego.finalizarPartida();
  igual(res.recorrido, esperado);
  igual([res.jugador, res.categoria, res.dificultad, res.total, res.aciertos], ['Valentina', 'todas', 'medio', 10, esperado.filter(Boolean).length]);
  assert.strictEqual(res.falladas.length, 10 - res.aciertos);
  assert.strictEqual(res.maximo, 3225);
  assert.ok(res.puntaje > 0 && res.puntaje <= res.maximo);
  assert.strictEqual(Juego.hayPartidaEnCurso(), false);
});
prueba('Puntaje perfecto (10 aciertos, 20 s restantes, sin comodines) = máximo teórico por nivel', () => {
  [['facil', 2150], ['medio', 3225], ['dificil', 4300]].forEach(([d, max]) => {
    nuevaPartida('geografia', d);
    for (let i = 0; i < 10; i += 1) { acertar(); if (i < 9) siguiente(); }
    assert.strictEqual(Juego.finalizarPartida().puntaje, max, d);
  });
});
prueba('Partida de 10 errores = 0 puntos y 0 aciertos', () => {
  nuevaPartida();
  for (let i = 0; i < 10; i += 1) { fallar(); if (i < 9) siguiente(); }
  const res = Juego.finalizarPartida();
  igual([res.puntaje, res.aciertos, res.recorrido.every((x) => x === false)], [0, 0, true]);
});
prueba('Partida completa solo con tiempo agotado: 10 resultados incorrectos, un solo reloj a la vez', () => {
  nuevaPartida();
  for (let i = 0; i < 10; i += 1) {
    Juego.iniciarTemporizador(); assert.ok(reloj.activos.size <= 1);
    reloj.pasar(20);
    if (i < 9) siguiente();
  }
  const res = Juego.finalizarPartida();
  igual([res.puntaje, res.aciertos, res.tiempoTotal, eventos.agotados.length], [0, 0, 200, 10]);
  assert.strictEqual(reloj.activos.size, 0);
});
prueba('finalizarPartida es idempotente y no responde después de terminar', () => {
  nuevaPartida();
  for (let i = 0; i < 10; i += 1) { acertar(); if (i < 9) siguiente(); }
  const a = Juego.finalizarPartida(); const b = Juego.finalizarPartida();
  assert.strictEqual(a, b);
  assert.strictEqual(acertar(), null);
  assert.strictEqual(Juego.avanzarPregunta(), null);
});
prueba('Reiniciar tras terminar crea una partida limpia (puntaje, racha y comodines en su valor inicial)', () => {
  nuevaPartida(); acertar();
  Juego.iniciarPartida('deportes', 'dificil', 'Ana');
  const e = Juego.estado;
  igual([e.puntaje, e.aciertos, e.racha, e.indiceActual, e.penalizacion, e.comodines.cincuenta, e.comodines.tiempo], [0, 0, 0, 0, 0, true, true]);
});

/* ========================================================================== */
const fallos = resultados.filter((r) => !r).length;
console.log(`\n${fallos === 0 ? 'RESULTADO: TODAS LAS PRUEBAS PASARON' : `RESULTADO: ${fallos} PRUEBA(S) FALLARON`} (${resultados.length - fallos}/${resultados.length})`);
process.exit(fallos ? 1 : 0);