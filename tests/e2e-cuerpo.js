/* Cuerpo del test E2E. Lo inyecta `tests/e2e-navegador.js` en index.html para
   generar __e2e.html y recorrer una partida completa en Chrome headless.
   Escribe el informe EN VIVO en #informe tras cada paso, para ver el avance
   aunque el recorrido se cuelgue en algún await.
   Convenciones del informe: PASS / FAIL  ·  RECHAZO / ERROR-*  ·  RESULTADO final. */
(function () {
  const informe = [];
  let completado = false;
  const pre = document.createElement('pre');
  pre.id = 'informe';
  pre.textContent = 'INICIANDO…';
  const derramar = () => {
    pre.textContent = informe.join('\n') + (completado ? '' : `\n\n[A la espera] último paso: ${informe[informe.length - 1] || '—'}`);
  };
  const pasar = (nombre, ok, detalle = '') => {
    informe.push(`${ok ? 'PASS' : 'FAIL'}  ${nombre}${detalle ? ' — ' + detalle : ''}`);
    derramar();
  };
  const paso = (texto) => { informe.push(`··· ${texto}`); derramar(); };
  window.addEventListener('unhandledrejection', (e) => { informe.push(`RECHAZO  ${e.reason && e.reason.message}`); derramar(); });
  window.addEventListener('error', (e) => { informe.push(`ERROR-REC  ${e.message || (e.target && e.target.src)}`); derramar(); }, true);
  window.onerror = (m) => { informe.push(`ERROR-JS  ${m}`); derramar(); };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const visible = (sel) => { const e = $(sel); return Boolean(e) && !e.closest('[hidden]') && e.offsetParent !== null; };
  const texto = (sel) => ($(sel)?.textContent || '').trim();
  const click = (el) => { if (!el) throw new Error(`elemento inexistente para clic`); el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); };
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Cambia el hash y espera el hashchange. Si el hash ya es el objetivo, no hay evento: resuelve tras un turno. */
  const cambiarHash = async (hash) => {
    paso(`cambiarHash(${hash}) desde ${window.location.hash || '(vacío)'}`);
    if (window.location.hash === hash) { await esperar(80); return; }
    let resuelto = false;
    const oyente = () => { resuelto = true; };
    window.addEventListener('hashchange', oyente, { once: true });
    window.location.hash = hash;
    // Red de seguridad: si el hash no dispara evento en 3 s (virtuales), seguimos.
    for (let i = 0; i < 60 && !resuelto; i += 1) await esperar(50);
    window.removeEventListener('hashchange', oyente);
    await esperar(80);
  };

  /** Cierra el informe y marca el título para que el navegador sepa que terminó. */
  const finalizar = () => {
    completado = true;
    const fallos = informe.filter((l) => l.startsWith('FAIL') || l.startsWith('ERROR') || l.startsWith('RECHAZO'));
    informe.push(`\nRESULTADO: ${fallos.length === 0 ? 'TODAS LAS COMPROBACIONES PASARON' : `HAY ${fallos.length} FALLO(S)`} (${informe.filter((l) => l.startsWith('PASS')).length} PASS)`);
    derramar();
    document.title = fallos.length === 0 ? 'E2E-OK' : 'E2E-FALLOS';
  };

  const correr = async () => {
    /* Los scripts clásicos declaran con `const`, que NO crea propiedades en
       window: hay que referenciarlos como identificadores globales (typeof es
       seguro aunque no existan). */
    let intentos = 0;
    while (!(typeof App === 'object' && typeof Juego === 'object' && typeof UI === 'object')) {
      await esperar(50);
      intentos += 1;
      if (intentos > 200) {
        const diag = `readyState=${document.readyState} · PREGUNTAS=${typeof PREGUNTAS} · Almacenamiento=${typeof Almacenamiento} · Juego=${typeof Juego} · UI=${typeof UI} · App=${typeof App} · scripts=[${[...document.scripts].map((s) => (s.src ? s.src.split('/').pop() : 'inline')).join(',')}]`;
        throw new Error(`La app no arrancó tras ${intentos} sondeos → ${diag}`);
      }
    }
    await esperar(100);
    const J = Juego, A = App;
    informe.push(`DIAG  arranque tras ${intentos} sondeos · readyState=${document.readyState}`);
    derramar();
    if (!document.body.contains(pre)) document.body.appendChild(pre);

    /* ---- 1. Inicio y validación del nombre ---- */
    paso('1. Inicio y nombre');
    pasar('Pantalla inicial visible', visible('[data-pantalla="inicio"]'), texto('#titulo-inicio'));
    click($('#btn-jugar'));
    pasar('Nombre vacío: error visible y sin navegación', !$('#nombre-jugador-error').hidden && visible('[data-pantalla="inicio"]'), texto('#nombre-jugador-error'));
    pasar('Campo marcado aria-invalid', $('#nombre-jugador').getAttribute('aria-invalid') === 'true');

    $('#nombre-jugador').value = 'Tatiana';
    click($('#btn-jugar'));
    await esperar(150);
    pasar('Nombre válido: navega a configuración', visible('[data-pantalla="configuracion-partida"]'));
    pasar('Subtítulo con el nombre', texto('#config-partida-subtitulo').includes('Tatiana'), texto('#config-partida-subtitulo'));
    pasar('Categorías renderizadas (6 tarjetas)', $$('#categorias-lista .tarjeta-opcion').length === 6);
    pasar('Dificultades renderizadas (3 segmentos)', $$('#dificultad-lista .segmento').length === 3);
    pasar('Mejor puntaje: "Aún no juegas"', texto('#mejor-puntaje-combinacion').includes('Aún no'), texto('#mejor-puntaje-combinacion'));

    /* ---- 2. Configuración ---- */
    paso('2. Categoría y dificultad');
    $('#cat-historia').click();
    $('#dif-facil').click();
    await esperar(60);
    pasar('Selección reflejada en "Tu partida"', texto('#resumen-categoria') === 'Historia' && texto('#resumen-dificultad') === 'Nivel Fácil', `${texto('#resumen-categoria')} / ${texto('#resumen-dificultad')}`);
    pasar('Ayuda de dificultad', texto('#dificultad-ayuda').length > 5, texto('#dificultad-ayuda'));

    /* ---- 3. Partida ---- */
    paso('3. Comenzar partida');
    click($('#btn-comenzar-partida'));
    await esperar(150);
    pasar('Pantalla de juego visible', visible('[data-pantalla="juego"]'));
    pasar('Enunciado cargado', texto('#juego-enunciado').length > 5, texto('#juego-enunciado').slice(0, 60));
    pasar('Progreso "1 de 10"', texto('#juego-progreso-texto') === '1 de 10', texto('#juego-progreso-texto'));
    pasar('4 opciones renderizadas', $$('#juego-opciones .opcion').length === 4);
    pasar('Temporizador en 20 s', texto('#juego-tiempo') === '20 s', texto('#juego-tiempo'));
    pasar('Marcador en 0', texto('#juego-puntaje') === '0');
    pasar('Chip con la categoría', texto('#juego-categoria') === 'Historia', texto('#juego-categoria'));
    pasar('10 segmentos de progreso', $$('#juego-progreso .progreso__segmento').length === 10);
    pasar('Comodines habilitados', !$('#btn-comodin-5050').disabled && !$('#btn-comodin-tiempo').disabled);
    pasar('Opciones: botones nativos (teclado/táctil)', $$('#juego-opciones .opcion').every((b) => b.tagName === 'BUTTON' && b.type === 'button'));
    pasar('Título con el nombre', texto('#titulo-juego').includes('Tatiana'), texto('#titulo-juego'));

    paso('3b. Reloj real');
    await esperar(2600);
    const bajado = parseInt(texto('#juego-tiempo'), 10);
    pasar('El temporizador baja en tiempo real', bajado >= 16 && bajado < 20, texto('#juego-tiempo'));

    /* Pausa al salir de la pantalla de juego y reanuda al volver (reloj real). */
    const tAlSalir = parseInt(texto('#juego-tiempo'), 10);
    await cambiarHash('#ranking');
    await esperar(1500);
    const tFuera = parseInt(texto('#juego-tiempo'), 10);
    pasar('El reloj se pausa fuera de la pantalla de juego', tFuera === tAlSalir, `${tAlSalir} s → ${tFuera} s`);
    await cambiarHash('#juego');
    await esperar(1500);
    const tVuelta = parseInt(texto('#juego-tiempo'), 10);
    pasar('El reloj se reanuda al volver sin reiniciar a 20 s', tVuelta <= tFuera && tVuelta >= 5, `${tFuera} s → ${tVuelta} s`);

    J.detenerTemporizador();
    let tics = 0;
    J._reloj = {
      iniciar(fn) { tics += 1; this._fn = fn; return tics; },
      detener() { this._fn = null; }
    };
    paso('3c. Reloj falso activo');

    /* ---- 4. 50/50 ---- */
    paso('4. Comodín 50/50');
    click($('#btn-comodin-5050'));
    await esperar(60);
    const fuera = $$('#juego-opciones .opcion--fuera');
    pasar('50/50: 2 opciones deshabilitadas', fuera.length === 2 && fuera.every((o) => o.disabled), `${fuera.length}`);
    pasar('50/50: botón usado', $('#btn-comodin-5050').disabled);
    pasar('50/50: nota actualizada', texto('#nota-comodin-5050').includes('0 disponibles'), texto('#nota-comodin-5050'));
    click(fuera[0]);
    await esperar(60);
    pasar('Opción eliminada no responde', visible('[data-pantalla="juego"]') && J.estado.respondida === false);

    /* ---- 5. Acierto y retro ---- */
    paso('5. Acierto y retroalimentación');
    const correcta1 = J.estado.preguntas[0].correcta;
    const btn1 = $(`#juego-opciones .opcion[data-indice="${correcta1}"]`);
    const enunciado1 = texto('#juego-enunciado');
    pasar('Correcta habilitada tras 50/50', !btn1.disabled);
    btn1.focus();
    pasar('Opción alcanzable con teclado (foco nativo en el botón)', document.activeElement === btn1);
    click(btn1);
    await esperar(150);
    pasar('Navega a retroalimentación', visible('[data-pantalla="retroalimentacion"]'));
    pasar('Foco movido al título de la pantalla (accesibilidad)', document.activeElement === $('[data-pantalla="retroalimentacion"] h1'), document.activeElement && document.activeElement.id);
    pasar('Retro: enunciado coincide', texto('#retro-enunciado') === enunciado1);
    pasar('Retro: correcta resaltada', $('#retro-opciones .opcion--correcta') !== null);
    pasar('Retro: acierto visible', visible('#retro-estado') && $('#retro-estado').classList.contains('retro-tarjeta--acierto'), texto('#retro-estado .retro-tarjeta__titulo'));
    pasar('Retro: explicación visible', visible('#retro-explicacion') && texto('#retro-explicacion').length > 10);
    pasar('Retro: puntos de la pregunta', /\+\d+ puntos/.test(texto('#retro-estado .retro-tarjeta__puntos')), texto('#retro-estado .retro-tarjeta__puntos'));
    pasar('Retro: acumulado', /puntos acumulados/.test(texto('#retro-acumulado')), texto('#retro-acumulado'));
    pasar('Retro: botón "Siguiente pregunta"', texto('#btn-siguiente-texto') === 'Siguiente pregunta');
    const puntos1 = J.estado.puntaje;
    pasar('Puntaje > 0 tras el acierto', puntos1 > 0, `${puntos1} pts`);

    /* ---- 6. Doble clic en Siguiente ---- */
    paso('6. Doble clic en Siguiente');
    click($('#btn-siguiente'));
    click($('#btn-siguiente'));
    await esperar(150);
    pasar('Avanza a la 2 una sola vez', visible('[data-pantalla="juego"]') && texto('#juego-progreso-texto') === '2 de 10', texto('#juego-progreso-texto'));
    pasar('Tiempo reiniciado a 20 s', texto('#juego-tiempo') === '20 s');

    /* ---- 7. Triple clic ---- */
    paso('7. Triple clic en opción');
    const p2 = J.estado.preguntas[1].correcta;
    const btn2 = $(`#juego-opciones .opcion[data-indice="${p2}"]`);
    click(btn2); click(btn2); click(btn2);
    await esperar(150);
    const puntos2 = J.estado.puntaje;
    pasar('Una sola respuesta (recorrido = 2)', J.estado.recorrido.length === 2 && texto('#retro-contexto').includes('Pregunta 2 de 10'), texto('#retro-contexto'));

    /* ---- 8. Preguntas 3-5 ---- */
    paso('8. Preguntas 3-5 (tiempo extra, comodín usado, errores)');
    let puntosTrasComodin = null;   // acumulado tras el −30 del comodín de tiempo
    for (let i = 2; i < 5; i += 1) {
      click($('#btn-siguiente'));
      await esperar(120);
      const idx = J.estado.preguntas[i].correcta;
      const mal = (idx + 1) % 4;
      if (i === 2) {
        click($('#btn-comodin-tiempo'));
        await esperar(60);
        pasar('Comodín tiempo: marcador a 30 s', texto('#juego-tiempo') === '30 s', texto('#juego-tiempo'));
        puntosTrasComodin = J.estado.puntaje;   // tras el −30 del comodín
        click($('#btn-comodin-5050'));
        await esperar(60);
        pasar('Comodín ya usado no re-aplica', J.estado.comodines.cincuenta === false && $$('#juego-opciones .opcion--fuera').length === 0);
      }
      click($(`#juego-opciones .opcion[data-indice="${mal}"]`));
      await esperar(120);
      pasar(`P${i + 1}: retro de error`, visible('#retro-estado') && $('#retro-estado').classList.contains('retro-tarjeta--error'), texto('#retro-estado .retro-tarjeta__titulo'));
      pasar(`P${i + 1}: correcta y explicación`, $('#retro-opciones .opcion--correcta') !== null && visible('#retro-explicacion'));
    }
    const puntajeTrasErrores = J.estado.puntaje;
    pasar('Errores suman 0 (acumulado inmutable tras el −30 del comodín)', puntajeTrasErrores === puntosTrasComodin, `${puntosTrasComodin} → ${puntajeTrasErrores}`);
    pasar('Penalización de comodines (−60)', J.estado.penalizacion === 60, `${J.estado.penalizacion}`);

    /* ---- 9. Enlaces profundos ---- */
    paso('9. Enlaces profundos con partida en curso');
    await cambiarHash('#juego');
    pasar('#juego con respondida → retro', visible('[data-pantalla="retroalimentacion"]'));
    await cambiarHash('#ranking');
    pasar('Ranking vacío durante la partida', $('#ranking-tabla .estado-vacio') !== null);
    await cambiarHash('#juego');
    pasar('Volver a #juego retoma la retro', visible('[data-pantalla="retroalimentacion"]'));

    /* ---- 10. Tiempo agotado ---- */
    paso('10. Agotar el tiempo en la pregunta 6');
    click($('#btn-siguiente'));
    await esperar(120);
    pasar('Pregunta 6 en juego', texto('#juego-progreso-texto') === '6 de 10', texto('#juego-progreso-texto'));
    for (let s = 0; s < 20; s += 1) { if (J._reloj._fn) J._reloj._fn(); else break; }
    await esperar(150);
    pasar('Tiempo agotado → retro de error', visible('[data-pantalla="retroalimentacion"]') && $('#retro-estado').classList.contains('retro-tarjeta--error'), texto('#retro-estado .retro-tarjeta__titulo'));
    pasar('Texto "Se acabó el tiempo"', texto('#retro-estado .retro-tarjeta__titulo').includes('acabó el tiempo'), texto('#retro-estado .retro-tarjeta__titulo'));
    pasar('Marcador de tiempo en 0 s', texto('#juego-tiempo') === '0 s', texto('#juego-tiempo'));

    /* ---- 11. Preguntas 7-10 ---- */
    paso('11. Preguntas 7-10');
    for (let i = 6; i < 10; i += 1) {
      click($('#btn-siguiente'));
      await esperar(120);
      const idx = J.estado.preguntas[i].correcta;
      const elegir = i === 9 ? (idx + 1) % 4 : idx;
      click($(`#juego-opciones .opcion[data-indice="${elegir}"]`));
      await esperar(120);
    }
    pasar('Última: botón "Ver resultado"', texto('#btn-siguiente-texto') === 'Ver resultado', texto('#btn-siguiente-texto'));

    /* ---- 12. Final (doble clic) ---- */
    paso('12. Final de partida');
    click($('#btn-siguiente'));
    click($('#btn-siguiente'));
    await esperar(200);
    pasar('Pantalla de resultado', visible('[data-pantalla="resultado"]'));
    const resumen = A.ultimoResultado;
    pasar('Puntaje coherente con el motor', texto('#resultado-puntaje') === String(resumen.puntaje), `${texto('#resultado-puntaje')} pts`);
    pasar('Aciertos 5 de 10 (Q1, Q2, Q7, Q8, Q9)', texto('#resultado-resumen .dato-tarjeta__valor') === '5 / 10', texto('#resultado-resumen .dato-tarjeta__valor'));
    pasar('Recorrido con 10 ítems', $$('#resultado-recorrido .recorrido__item').length === 10);
    pasar('5 fallos marcados (Q3-Q6 y Q10)', $$('#resultado-recorrido .recorrido__item--error').length === 5);
    pasar('Desglose con comodines', texto('#resultado-desglose').includes('comodines'), texto('#resultado-desglose'));
    pasar('Puesto en el ranking', texto('#resultado-puesto').includes('Puesto'), texto('#resultado-puesto'));
    pasar('Récord personal', texto('#resultado-record').includes('récord'), texto('#resultado-record'));
    pasar('Fecha y jugador', texto('#resultado-fecha').includes('Tatiana'), texto('#resultado-fecha'));
    pasar('Mensaje motivador acorde al desempeño (50 %)', texto('#resultado-mensaje').includes('pregunta'), texto('#resultado-mensaje'));
    pasar('Revisión de falladas visible con las 5 incorrectas', visible('#resultado-falladas-tarjeta') && $$('#resultado-falladas .fallada').length === 5, `${$$('#resultado-falladas .fallada').length} revisadas`);
    pasar('Cada fallada muestra correcta y explicación', $$('#resultado-falladas .fallada__correcta').length === 5 && $$('#resultado-falladas .fallada__explicacion').every((p) => p.textContent.trim().length > 10));
    pasar('La pregunta agotada aparece como "Sin respuesta"', texto('#resultado-falladas').includes('Sin respuesta'), '');

    /* Modo captura (window.__E2E_CAPTURA): la partida terminada queda visible
       en Resultado y aquí se corta el recorrido. */
    if (window.__E2E_CAPTURA) {
      paso('captura: recorrido detenido en la pantalla de Resultado');
      finalizar();
      return;
    }

    /* ---- 13. Ranking ---- */
    paso('13. Ranking y estadísticas');
    await cambiarHash('#ranking');
    const filas = $$('#ranking-tabla tbody tr').length;
    pasar('Exactamente 1 partida (sin duplicar)', filas === 1, `${filas} filas`);
    pasar('Fila resaltada como propia', $('#ranking-tabla .fila--propia') !== null);
    pasar('Puntaje coincide con el resultado', texto('#ranking-tabla .celda-puntaje') === `${resumen.puntaje} pts`, texto('#ranking-tabla .celda-puntaje'));
    const stats = $$('#ranking-estadisticas .dato-tarjeta');
    pasar('1 partida jugada', stats[0] && stats[0].textContent.includes('1'), stats[0] && stats[0].textContent.trim());
    pasar('5 aciertos de 10 en estadísticas', stats[1] && stats[1].textContent.includes('Aciertos de 10'), stats[1] && stats[1].textContent.trim());

    /* ---- 14. Jugar de nuevo ---- */
    paso('14. Jugar de nuevo');
    await cambiarHash('#resultado');
    click($('#btn-jugar-de-nuevo'));
    await esperar(120);
    pasar('Jugar de nuevo → configuración', visible('[data-pantalla="configuracion-partida"]'));
    pasar('Mejor puntaje de la combinación', texto('#mejor-puntaje-valor').includes('pts') && !texto('#mejor-puntaje-combinacion').includes('Aún no'), `${texto('#mejor-puntaje-valor')} · ${texto('#mejor-puntaje-combinacion')}`);
    click($('#btn-comenzar-partida'));
    await esperar(150);
    pasar('Partida limpia (1 de 10, 0 pts, comodines)', visible('[data-pantalla="juego"]') && texto('#juego-progreso-texto') === '1 de 10' && texto('#juego-puntaje') === '0' && !$('#btn-comodin-5050').disabled);

    /* ---- 15. Salir descarta ---- */
    paso('15. Salir de la partida');
    window.confirm = () => true;
    click($('#btn-salir-partida'));
    await esperar(150);
    pasar('Salir cancela y vuelve a configuración', visible('[data-pantalla="configuracion-partida"]') && J.estado === null);
    await cambiarHash('#ranking');
    pasar('La partida cancelada NO se guardó', $$('#ranking-tabla tbody tr').length === 1, `${$$('#ranking-tabla tbody tr').length} filas`);

    /* ---- 16. Configuración general ---- */
    paso('16. Configuración general');
    await cambiarHash('#configuracion');
    pasar('Pantalla de configuración visible', visible('[data-pantalla="configuracion"]'));
    pasar('Sonido activado y reflejado en el interruptor', $('#pref-sonido').checked === true && texto('#sonido-estado') === 'Activado', texto('#sonido-estado'));
    $('#tema-oscuro').click();
    await esperar(60);
    pasar('Cambiar a tema oscuro aplica data-tema', document.documentElement.getAttribute('data-tema') === 'oscuro' && $('#tema-oscuro').checked, document.documentElement.getAttribute('data-tema'));
    $('#pref-sonido').click();
    await esperar(60);
    pasar('Desactivar sonido actualiza interruptor y estado', $('#pref-sonido').checked === false && texto('#sonido-estado') === 'Desactivado', texto('#sonido-estado'));
    pasar('Resumen de preferencias actualizado', texto('#preferencias-resumen').includes('desactivado') && texto('#preferencias-resumen').includes('oscuro'), texto('#preferencias-resumen'));
    click($('[data-pantalla="configuracion"] aside [data-ir="inicio"]'));
    await esperar(150);
    pasar('Navegación de regreso al inicio desde Configuración', visible('[data-pantalla="inicio"]'));

    finalizar();
  };

  correr().catch((e) => {
    informe.push(`ERROR-TEST  ${e && e.message}`);
    derramar();
    if (!document.body.contains(pre)) document.body.appendChild(pre);
    document.title = 'E2E-FALLOS';
  });

  document.body.appendChild(pre);
})();
