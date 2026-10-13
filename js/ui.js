/* ==========================================================================
   ui.js — RENDERIZADO del contenido dinámico en el DOM
   Responsabilidad ÚNICA: dibujar datos dentro de los contenedores de index.html
   (categorías, pregunta, opciones, marcadores, resultado, ranking, mensajes).
   NO decide qué pantalla se muestra (eso es app.js), NO calcula nada del juego
   (juego.js) y NO lee/escribe localStorage (almacenamiento.js).
   Recibe datos ya calculados y los pinta.
   ========================================================================== */

const UI = {
  /* ---------- utilidades ---------- */

  /** Escapa texto del usuario antes de insertarlo en innerHTML. */
  esc(texto) {
    return String(texto ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  /** Devuelve la marca de un ícono del sprite (index.html). */
  icono(id, clase = 'icono') {
    return `<svg class="${clase}" aria-hidden="true"><use href="#${id}"></use></svg>`;
  },

  /** Referencia a una categoría o dificultad por su id. */
  categoria(id) { return CATEGORIAS.find((c) => c.id === id) || CATEGORIAS[0]; },
  dificultad(id) { return DIFICULTADES.find((d) => d.id === id) || DIFICULTADES[1]; },

  /** Fecha legible tipo "09 oct 2026". */
  fecha(iso) {
    const fecha = iso ? new Date(iso) : new Date();
    if (Number.isNaN(fecha.getTime())) return '';
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace('.', '');
  },

  /** Duración en segundos → "02:38". */
  duracion(segundos) {
    const total = Math.max(0, Math.round(segundos || 0));
    const min = String(Math.floor(total / 60)).padStart(2, '0');
    const seg = String(total % 60).padStart(2, '0');
    return `${min}:${seg}`;
  },

  /** Número → palabra en mayúscula inicial (para el mensaje del resultado). */
  enPalabra(numero) {
    const palabras = ['Cero', 'Una', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez'];
    return palabras[numero] ?? String(numero);
  },

  /**
   * Mensaje motivador acorde al porcentaje de aciertos (variantes de texto no
   * definidas en el mockup, registradas en docs/diseno/notas-mockups.md).
   * Para el tramo "bueno" se conserva la frase del mockup.
   */
  mensajeDesempeno(porcentaje) {
    if (porcentaje === 100) return '¡Impecable! Diez de diez: conoces Colombia como poquita gente.';
    if (porcentaje >= 70) return 'Hoy conoces un poco más de Colombia. Ese es el mejor premio.';
    if (porcentaje >= 40) return 'Buen recorrido: cada pregunta te acerca más a Colombia. ¡Vamos por otra!';
    if (porcentaje > 0) return 'Fallar también enseña: revisa tus preguntas y vuelve a retar al país.';
    return 'Hoy no sumaste aciertos, pero tu próxima pregunta ya te está esperando. ¡Inténtalo de nuevo!';
  },

  /* ---------- 3. Configuración de partida ---------- */

  /** Tarjetas-opción de categoría (radio-card del mockup). */
  renderCategorias(seleccion = 'todas') {
    const contenedor = document.getElementById('categorias-lista');
    if (!contenedor) return;
    contenedor.innerHTML = CATEGORIAS.map((categoria) => `
      <label class="tarjeta-opcion" for="cat-${categoria.id}">
        <input type="radio" name="categoria" id="cat-${categoria.id}" value="${categoria.id}" ${categoria.id === seleccion ? 'checked' : ''}>
        <span class="tarjeta-opcion__icono">${this.icono(categoria.icono)}</span>
        <span class="tarjeta-opcion__nombre">${this.esc(categoria.nombre)}</span>
        <span class="tarjeta-opcion__descripcion">${this.esc(categoria.descripcion)}</span>
        <span class="tarjeta-opcion__marca">${this.icono('i-circulo-check')}</span>
      </label>`).join('');
  },

  /** Control segmentado de dificultad. */
  renderDificultades(seleccion = 'medio') {
    const contenedor = document.getElementById('dificultad-lista');
    if (!contenedor) return;
    contenedor.innerHTML = DIFICULTADES.map((dificultad) => `
      <label class="segmento" for="dif-${dificultad.id}">
        <input type="radio" name="dificultad" id="dif-${dificultad.id}" value="${dificultad.id}" ${dificultad.id === seleccion ? 'checked' : ''}>
        <span class="segmento__check">${this.icono('i-check')}</span>
        <span>${this.esc(dificultad.nombre)}</span>
      </label>`).join('');
  },

  /** Ayudas dinámicas + tarjeta "Tu partida" + mejor puntaje. */
  renderConfiguracionPartida(datos) {
    const { jugador, categoria, dificultad, mejorPuntaje } = datos;
    const categoriaInfo = this.categoria(categoria);
    const dificultadInfo = this.dificultad(dificultad);

    const setTexto = (id, texto) => {
      const elemento = document.getElementById(id);
      if (elemento) elemento.textContent = texto;
    };

    setTexto(
      'config-partida-subtitulo',
      jugador
        ? `${jugador}, elige tu tema y el nivel de la partida.`
        : 'Elige tu tema y el nivel de la partida.'
    );
    setTexto('categoria-ayuda', categoria === 'todas'
      ? 'Todas está seleccionada. Tendrás preguntas de todos los temas.'
      : `${categoriaInfo.nombre} está seleccionada. Tendrás preguntas solo de este tema.`);
    setTexto('dificultad-ayuda', dificultadInfo.pista);
    setTexto('resumen-categoria', categoria === 'todas' ? 'Todas las categorías' : categoriaInfo.nombre);
    setTexto('resumen-dificultad', `Nivel ${dificultadInfo.nombre}`);
    setTexto('mejor-puntaje-valor', mejorPuntaje === null ? '0 pts' : `${mejorPuntaje} pts`);

    const combinacion = document.getElementById('mejor-puntaje-combinacion');
    if (combinacion) {
      combinacion.textContent = mejorPuntaje === null
        ? 'Aún no juegas esta combinación'
        : `${categoriaInfo.nombre} · ${dificultadInfo.nombre}`;
    }
  },

  /* ---------- 4. Juego ---------- */

  /** Barra de progreso de 10 segmentos (los respondidos, el actual y los pendientes). */
  renderProgreso(idContenedor, indice, total) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    const segmentos = [];
    for (let i = 1; i <= total; i += 1) {
      let clase = 'progreso__segmento';
      if (i < indice) clase += ' progreso__segmento--hecho';
      else if (i === indice) clase += ' progreso__segmento--actual';
      segmentos.push(`<span class="${clase}"></span>`);
    }
    contenedor.innerHTML = segmentos.join('');
    contenedor.setAttribute('aria-label', `Pregunta ${indice} de ${total}`);
  },

  /** Pantalla de juego: enunciado, opciones, progreso (n/10), marcadores. */
  mostrarPregunta(pregunta, indice, total) {
    const estadoVacio = document.getElementById('juego-estado-vacio');
    const bloque = document.getElementById('juego-pregunta');
    if (!bloque) return;

    if (estadoVacio) estadoVacio.hidden = true;
    bloque.hidden = false;

    const categoriaInfo = this.categoria(pregunta.categoria);
    const chip = document.querySelector('#juego-pregunta .chip');
    if (chip) chip.innerHTML = `${this.icono(categoriaInfo.icono)}<span id="juego-categoria">${this.esc(categoriaInfo.nombre)}</span>`;

    const setTexto = (id, texto) => {
      const elemento = document.getElementById(id);
      if (elemento) elemento.textContent = texto;
    };
    setTexto('juego-progreso-texto', `${indice} de ${total}`);
    setTexto('juego-enunciado', pregunta.enunciado);

    this.renderProgreso('juego-progreso', indice, total);

    const letras = ['A', 'B', 'C', 'D'];
    const opciones = document.getElementById('juego-opciones');
    if (opciones) {
      opciones.innerHTML = pregunta.opciones.map((opcion, i) => `
        <button type="button" class="opcion" data-indice="${i}">
          <span class="opcion__letra" aria-hidden="true">${letras[i]}</span>
          <span class="opcion__cuerpo"><span class="opcion__texto">${this.esc(opcion)}</span></span>
        </button>`).join('');
    }
  },

  actualizarTemporizador(segundos) {
    const elemento = document.getElementById('juego-tiempo');
    if (elemento) elemento.textContent = `${Math.max(0, segundos)} s`;
  },

  actualizarPuntaje(puntaje) {
    const elemento = document.getElementById('juego-puntaje');
    if (elemento) elemento.textContent = String(puntaje);
  },

  /** Activa o desactiva los botones de comodín y sus notas. */
  actualizarComodines(comodines) {
    const boton5050 = document.getElementById('btn-comodin-5050');
    const botonTiempo = document.getElementById('btn-comodin-tiempo');
    const nota5050 = document.getElementById('nota-comodin-5050');
    const notaTiempo = document.getElementById('nota-comodin-tiempo');

    if (boton5050) boton5050.disabled = !comodines.cincuenta;
    if (botonTiempo) botonTiempo.disabled = !comodines.tiempo;
    if (nota5050) nota5050.textContent = comodines.cincuenta
      ? '1 disponible · Quita 2 opciones'
      : '0 disponibles · Ya lo usaste';
    if (notaTiempo) notaTiempo.textContent = comodines.tiempo
      ? '1 disponible · Tiempo extra'
      : '0 disponibles · Ya lo usaste';
  },

  /** Oculta visualmente las 2 opciones eliminadas por el 50/50. */
  aplicarComodin(tipo, datos) {
    if (tipo !== 'cincuenta' || !Array.isArray(datos?.eliminadas)) return;
    datos.eliminadas.forEach((indice) => {
      const opcion = document.querySelector(`#juego-opciones .opcion[data-indice="${indice}"]`);
      if (!opcion) return;
      opcion.classList.add('opcion--fuera');
      opcion.disabled = true;
      opcion.setAttribute('aria-hidden', 'true');
    });
  },

  /* ---------- 5. Retroalimentación ---------- */

  /**
   * @param {{pregunta, indice, total, categoria, dificultad, elegida, aciertos,
   *          respondidas, puntaje, puntos, esUltima}} resultado
   */
  mostrarRetroalimentacion(resultado) {
    const estadoVacio = document.getElementById('retro-estado-vacio');
    const bloque = document.getElementById('retro-pregunta');
    if (!bloque) return;
    if (estadoVacio) estadoVacio.hidden = true;
    bloque.hidden = false;

    const { pregunta, indice, total, elegida, aciertos, respondidas, puntaje, puntos, esUltima } = resultado;
    const categoriaInfo = this.categoria(pregunta.categoria);
    const dificultadInfo = this.dificultad(pregunta.dificultad);
    const acerto = elegida === pregunta.correcta;

    const setTexto = (id, texto) => {
      const elemento = document.getElementById(id);
      if (elemento) elemento.textContent = texto;
    };

    setTexto('retro-contexto', `${resultado.jugador} · Pregunta ${indice} de ${total}`);
    setTexto('retro-categoria', categoriaInfo.nombre);
    setTexto('retro-dificultad', dificultadInfo.nombre);
    setTexto('retro-enunciado', pregunta.enunciado);

    const chipCategoria = document.querySelector('#retro-pregunta .chip');
    if (chipCategoria) {
      chipCategoria.innerHTML = `${this.icono(categoriaInfo.icono)}<span id="retro-categoria">${this.esc(categoriaInfo.nombre)}</span>`;
    }

    this.renderProgreso('retro-progreso', indice, total);

    const letras = ['A', 'B', 'C', 'D'];
    const opciones = document.getElementById('retro-opciones');
    if (opciones) {
      opciones.innerHTML = pregunta.opciones.map((opcion, i) => {
        const clases = ['opcion'];
        let detalle = '';
        let marca = '';
        if (i === pregunta.correcta) {
          clases.push('opcion--correcta');
          detalle = 'Respuesta correcta';
          marca = this.icono('i-circulo-check');
        } else if (i === elegida) {
          clases.push('opcion--incorrecta');
          detalle = 'Tu elección · Incorrecta';
          marca = this.icono('i-circulo-x');
        }
        return `
          <div class="${clases.join(' ')}" role="listitem">
            <span class="opcion__letra" aria-hidden="true">${letras[i]}</span>
            <span class="opcion__cuerpo">
              <span class="opcion__texto">${this.esc(opcion)}</span>
              ${detalle ? `<span class="opcion__detalle">${detalle}</span>` : ''}
            </span>
            ${marca ? `<span class="opcion__marca">${marca}</span>` : ''}
          </div>`;
      }).join('');
    }

    // Tarjeta de estado (correcta / incorrecta)
    const tarjetaEstado = document.getElementById('retro-estado');
    if (tarjetaEstado) {
      tarjetaEstado.hidden = false;
      tarjetaEstado.classList.toggle('retro-tarjeta--acierto', acerto);
      tarjetaEstado.classList.toggle('retro-tarjeta--error', !acerto);
      if (acerto) {
        tarjetaEstado.innerHTML = `
          <h2 class="retro-tarjeta__titulo">${this.icono('i-circulo-check')}¡Tu respuesta es correcta!</h2>
          <p class="retro-tarjeta__puntos">+${puntos} puntos</p>
          <p>${this.esc(pregunta.opciones[pregunta.correcta])} suma a tu marcador. ¡Sigue así!</p>`;
      } else {
        const elegido = elegida === null ? 'No alcanzaste a responder' : `Elegiste ${pregunta.opciones[elegida]}`;
        tarjetaEstado.innerHTML = `
          <h2 class="retro-tarjeta__titulo">${this.icono('i-circulo-x')}${elegida === null ? 'Se acabó el tiempo' : 'Tu respuesta es incorrecta'}</h2>
          <p class="retro-tarjeta__puntos">+${puntos} puntos</p>
          <p>${this.esc(elegido)}.</p>
          <p>Esta pregunta suma 0 puntos y tu racha vuelve a cero. ¡Sigue aprendiendo!</p>`;
      }
    }

    // Tarjeta de explicación
    const tarjetaExplicacion = document.getElementById('retro-explicacion');
    if (tarjetaExplicacion) {
      tarjetaExplicacion.hidden = false;
      tarjetaExplicacion.classList.add('retro-tarjeta--acierto');
      tarjetaExplicacion.setAttribute('aria-label', 'Respuesta correcta y explicación');
      tarjetaExplicacion.innerHTML = `
        <h2 class="retro-tarjeta__titulo">${this.icono('i-circulo-check')}La correcta: ${this.esc(pregunta.opciones[pregunta.correcta])}</h2>
        <p>${this.esc(pregunta.explicacion)}</p>`;
    }

    // Acumulado y botón siguiente
    const tarjetaAvance = document.getElementById('retro-avance');
    if (tarjetaAvance) tarjetaAvance.hidden = false;
    setTexto('retro-acumulado', `${puntaje} puntos acumulados`);
    setTexto('retro-detalle', `${aciertos} aciertos de ${respondidas} preguntas respondidas.`);
    setTexto('btn-siguiente-texto', esUltima ? 'Ver resultado' : 'Siguiente pregunta');
  },

  /* ---------- 6. Resultado ---------- */

  /**
   * @param {{jugador, puntaje, maximo, aciertos, total, recorrido, tiempoTotal,
   *          categoria, dificultad, fecha, puesto, recordAnterior, esRecord}} resumen
   */
  mostrarResultado(resumen) {
    const vacio = document.getElementById('resultado-estado-vacio');
    const contenido = document.getElementById('resultado-contenido');
    if (!contenido) return;
    if (vacio) vacio.hidden = true;
    contenido.hidden = false;

    const setTexto = (id, texto) => {
      const elemento = document.getElementById(id);
      if (elemento) elemento.textContent = texto;
    };

    const categoriaInfo = this.categoria(resumen.categoria);
    const dificultadInfo = this.dificultad(resumen.dificultad);
    const errores = resumen.total - resumen.aciertos;
    const porcentaje = resumen.total > 0 ? Math.round((resumen.aciertos / resumen.total) * 100) : 0;

    setTexto('titulo-resultado', `¡Muy bien, ${resumen.jugador}!`);
    setTexto('resultado-mensaje', this.mensajeDesempeno(porcentaje));
    setTexto('resultado-puntaje', String(resumen.puntaje));
    setTexto('resultado-maximo', `de ${resumen.maximo} puntos posibles`);
    setTexto('resultado-combinacion', `${resumen.categoria === 'todas' ? 'Todas las categorías' : categoriaInfo.nombre} · ${dificultadInfo.nombre}`);

    const resumenContenedor = document.getElementById('resultado-resumen');
    if (resumenContenedor) {
      resumenContenedor.innerHTML = `
        <p class="dato-tarjeta"><strong class="dato-tarjeta__valor">${resumen.aciertos} / ${resumen.total}</strong><span class="dato-tarjeta__etiqueta">Aciertos</span></p>
        <p class="dato-tarjeta"><strong class="dato-tarjeta__valor">${porcentaje} %</strong><span class="dato-tarjeta__etiqueta">Porcentaje</span></p>
        <p class="dato-tarjeta"><strong class="dato-tarjeta__valor">${this.duracion(resumen.tiempoTotal)}</strong><span class="dato-tarjeta__etiqueta">Tiempo total</span></p>`;
    }

    const recorrido = document.getElementById('resultado-recorrido');
    if (recorrido) {
      recorrido.innerHTML = resumen.recorrido.map((acierto, i) => `
        <li class="recorrido__item ${acierto ? '' : 'recorrido__item--error'}">
          ${this.icono(acierto ? 'i-check' : 'i-circulo-x')}
          <span class="visually-hidden">Pregunta ${i + 1}: ${acierto ? 'acierto' : 'incorrecta'}</span>
        </li>`).join('');
    }

    const mult = String(resumen.multiplicador ?? 1).replace('.', ',');
    const comodines = resumen.comodinesUsados
      ? ` · ${resumen.comodinesUsados} ${resumen.comodinesUsados === 1 ? 'comodín' : 'comodines'} (−${resumen.penalizacionComodines} pts)`
      : '';
    setTexto('resultado-desglose', `${resumen.aciertos} aciertos · ${errores} errores · multiplicador ×${mult}${comodines}`);

    // Revisión de preguntas falladas: usa el detalle que el motor dejó en el
    // resumen (id, enunciado, elegida, correcta) + el banco PREGUNTAS.
    // Si no hay falladas (partida perfecta) la tarjeta queda oculta.
    const falladasTarjeta = document.getElementById('resultado-falladas-tarjeta');
    const falladasContenedor = document.getElementById('resultado-falladas');
    const falladas = Array.isArray(resumen.falladas) ? resumen.falladas : [];
    if (falladasTarjeta && falladasContenedor) {
      falladasTarjeta.hidden = falladas.length === 0;
      falladasContenedor.innerHTML = falladas.map((fallada) => {
        const pregunta = PREGUNTAS.find((p) => p.id === fallada.id);
        const opciones = pregunta ? pregunta.opciones : [];
        const textoDe = (indice) => (typeof opciones[indice] === 'string' ? this.esc(opciones[indice]) : `Opción ${Number(indice) + 1}`);
        const agotado = fallada.elegida === null || fallada.elegida === undefined;
        const explicacion = pregunta && pregunta.explicacion ? `<p class="fallada__explicacion">${this.esc(pregunta.explicacion)}</p>` : '';
        return `
          <li class="fallada">
            <p class="fallada__enunciado">${this.esc(fallada.enunciado)}</p>
            <p class="fallada__opciones">
              <span class="fallada__correcta">${this.icono('i-circulo-check')}<span><strong>Respuesta correcta:</strong> ${textoDe(fallada.correcta)}</span></span>
              <span class="fallada__elegida">${this.icono('i-circulo-x')}<span><strong>${agotado ? 'Sin respuesta' : 'Elegiste'}:</strong> ${agotado ? 'se agotó el tiempo' : textoDe(fallada.elegida)}</span></span>
            </p>
            ${explicacion}
          </li>`;
      }).join('');
    }

    setTexto('resultado-mensaje-lateral',
      `${this.enPalabra(resumen.aciertos)} descubrimientos para celebrar y ${this.enPalabra(errores).toLowerCase()} oportunidades para seguir aprendiendo. ¿Vamos por el siguiente reto?`);
    setTexto('resultado-puesto', resumen.puesto ? `Puesto ${resumen.puesto} en el ranking` : 'Fuera del top 10 del ranking');
    setTexto('resultado-fecha', `${this.fecha(resumen.fecha)} · ${resumen.jugador}`);
    setTexto('resultado-record', resumen.esRecord
      ? '¡Nuevo récord personal!'
      : `Tu récord sigue siendo ${resumen.recordAnterior} puntos.`);
  },

  /* ---------- 7. Ranking y estadísticas ---------- */

  renderRanking(ranking, estadisticas, nombreJugador) {
    const contenedorEstadisticas = document.getElementById('ranking-estadisticas');
    const contenedorTabla = document.getElementById('ranking-tabla');
    const actualizacion = document.getElementById('ranking-actualizacion');
    const tituloRecorrido = document.getElementById('titulo-recorrido-jugador');

    if (tituloRecorrido) {
      tituloRecorrido.textContent = nombreJugador ? `Tu recorrido, ${nombreJugador}` : 'Tu recorrido';
    }

    const porcentaje = estadisticas.totalPreguntas > 0
      ? Math.round((estadisticas.aciertos / estadisticas.totalPreguntas) * 100)
      : 0;
    const mejorCategoriaId = Object.entries(estadisticas.mejoresPuntajes || {})
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    const mejorCategoria = mejorCategoriaId ? this.categoria(mejorCategoriaId).nombre : '—';

    if (contenedorEstadisticas) {
      contenedorEstadisticas.innerHTML = `
        <p class="dato-tarjeta"><strong class="dato-tarjeta__valor">${estadisticas.partidas}</strong><span class="dato-tarjeta__etiqueta">Partidas jugadas</span></p>
        <p class="dato-tarjeta"><strong class="dato-tarjeta__valor">${estadisticas.aciertos}</strong><span class="dato-tarjeta__etiqueta">${estadisticas.totalPreguntas > 0 ? `Aciertos de ${estadisticas.totalPreguntas} · ${porcentaje} %` : 'Aciertos totales'}</span></p>
        <p class="dato-tarjeta"><strong class="dato-tarjeta__valor">${estadisticas.mejorPuntaje}</strong><span class="dato-tarjeta__etiqueta">Récord personal · pts</span></p>
        <p class="dato-tarjeta"><strong class="dato-tarjeta__valor dato-tarjeta__valor--texto">${this.esc(mejorCategoria)}</strong><span class="dato-tarjeta__etiqueta">Tu mejor categoría</span></p>`;
    }

    if (actualizacion) {
      actualizacion.textContent = ranking.length === 0
        ? 'Sin partidas registradas'
        : `Actualizado el ${this.fecha(ranking[0].fecha)}`;
    }

    if (!contenedorTabla) return;

    if (ranking.length === 0) {
      contenedorTabla.innerHTML = `
        <div class="estado-vacio">
          ${this.icono('i-info', 'icono icono--grande')}
          <h3 class="estado-vacio__titulo">Todavía no hay resultados</h3>
          <p class="estado-vacio__texto">Juega tu primera partida y tu puntaje aparecerá aquí,
            junto a los demás jugadores de este dispositivo.</p>
          <div class="acciones acciones--centrado">
            <button type="button" class="boton boton--primario" data-ir="configuracion-partida">Configurar una partida</button>
          </div>
        </div>`;
      return;
    }

    const filas = ranking.map((partida, i) => {
      const posicion = i + 1;
      const esPropia = Boolean(nombreJugador) && partida.nombre === nombreJugador;
      const clases = ['fila-ranking'];
      if (posicion <= 3) clases.push('fila--podio');
      if (esPropia) clases.push('fila--propia');
      const medalla = posicion <= 3 ? this.icono('i-medalla') : '';
      return `
        <tr class="${clases.join(' ')}">
          <td class="celda-pos" data-etiqueta="Posición">${medalla}${posicion}</td>
          <td class="celda-jugador" data-etiqueta="Jugador">${this.esc(partida.nombre)}${esPropia ? ' · Tú' : ''}</td>
          <td class="celda-puntaje" data-etiqueta="Puntaje">${partida.puntaje} pts</td>
          <td class="celda-categoria" data-etiqueta="Categoría">${this.esc(this.categoria(partida.categoria).nombre)}</td>
          <td class="celda-fecha" data-etiqueta="Fecha">${this.fecha(partida.fecha)}</td>
        </tr>`;
    }).join('');

    contenedorTabla.innerHTML = `
      <table class="tabla">
        <caption class="visually-hidden">Top ${ranking.length} de partidas guardadas en este dispositivo</caption>
        <thead>
          <tr><th scope="col">Pos.</th><th scope="col">Jugador</th><th scope="col">Puntaje</th><th scope="col">Categoría</th><th scope="col">Fecha</th></tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>`;
  },

  /* ---------- 8. Configuración ---------- */

  /** Aplica el tema (data-tema en <html>) y refleja las preferencias en los controles. */
  aplicarPreferencias(preferencias) {
    document.documentElement.setAttribute('data-tema', preferencias.tema);

    const sonido = document.getElementById('pref-sonido');
    if (sonido) sonido.checked = Boolean(preferencias.sonido);

    const estadoSonido = document.getElementById('sonido-estado');
    if (estadoSonido) estadoSonido.textContent = preferencias.sonido ? 'Activado' : 'Desactivado';

    const temaClaro = document.getElementById('tema-claro');
    const temaOscuro = document.getElementById('tema-oscuro');
    if (temaClaro) temaClaro.checked = preferencias.tema === 'claro';
    if (temaOscuro) temaOscuro.checked = preferencias.tema === 'oscuro';

    document.querySelectorAll('#tema-lista [data-estado-tema]').forEach((etiqueta, i) => {
      const esSeleccionado = (i === 0 && preferencias.tema === 'claro') || (i === 1 && preferencias.tema === 'oscuro');
      etiqueta.textContent = esSeleccionado ? 'Seleccionado' : 'No seleccionado';
    });

    const resumen = document.getElementById('preferencias-resumen');
    if (resumen) {
      resumen.textContent = `Sonido ${preferencias.sonido ? 'activado' : 'desactivado'} y tema ${preferencias.tema === 'oscuro' ? 'oscuro' : 'claro'}. Los ajustes se conservan en este dispositivo.`;
    }
  },

  /* ---------- validación y mensajes ---------- */

  /** Muestra u oculta el error de validación de un campo (ej. nombre vacío, RF-01). */
  mostrarErrorCampo(idCampo, mensaje) {
    const campo = document.getElementById(idCampo);
    const error = document.getElementById(`${idCampo}-error`);
    if (campo) {
      if (mensaje) campo.setAttribute('aria-invalid', 'true');
      else campo.removeAttribute('aria-invalid');
    }
    if (error) {
      error.textContent = mensaje || '';
      error.hidden = !mensaje;
    }
  },

  /** Mensaje accesible en #mensajes (aria-live). `tipo`: 'info' | 'exito' | 'error'. */
  mostrarMensaje(texto, tipo = 'info') {
    const zona = document.getElementById('mensajes');
    if (!zona) return;
    const mensaje = document.createElement('p');
    mensaje.className = `mensaje${tipo === 'exito' ? ' mensaje--exito' : tipo === 'error' ? ' mensaje--error' : ''}`;
    mensaje.textContent = texto;
    zona.appendChild(mensaje);
    window.setTimeout(() => mensaje.remove(), 4200);
  }
};