#!/usr/bin/env node
/* Recorrido E2E: una partida completa en Chrome headless.
 *
 * Uso (desde la raíz del proyecto):
 *   node tests/e2e-navegador.js                       # verifica: imprime el informe (0 = todo pasa)
 *   node tests/e2e-navegador.js --captura=ruta.png    # además guarda una captura de la pantalla de Resultado
 *
 * Qué hace:
 *   1. Genera `__e2e.html` = `index.html` + el cuerpo de pruebas (`e2e-cuerpo.js`).
 *   2. Sirve la raíz del proyecto en un puerto local efímero (no necesita
 *      levantar `python -m http.server` aparte).
 *   3. Abre la página en Chrome/Edge headless con `--virtual-time-budget`
 *      (los 20 s de temporizador transcurren en milisegundos reales).
 *   4. Extrae el informe de `<pre id="informe">` y lo imprime por consola.
 *   5. Sale con código 0 si todo pasa, 1 si hay fallos.
 *   6. Con --captura: una segunda pasada redirige a #resultado al terminar y
 *      guarda la captura (así el informe y la captura no se pisan).
 *
 * Chrome se busca en las rutas habituales; se puede forzar con la variable
 * de entorno CHROME_PATH (o EDGE_PATH).
 *
 * Sin dependencias: solo Node y un navegador Chromium instalado.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const raiz = path.join(__dirname, '..');
const paginaGenerada = path.join(raiz, '__e2e.html');
const PRESUPUESTO_MS = 300000;   // tiempo virtual para todo el recorrido
const ESPERA_MAX_MS = 240000;    // corte de seguridad en tiempo real

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

/* --------------------------------------------------------------- navegador */

function encontrarNavegador() {
  const candidatos = [];
  if (process.env.CHROME_PATH) candidatos.push(process.env.CHROME_PATH);
  if (process.env.EDGE_PATH) candidatos.push(process.env.EDGE_PATH);

  if (process.platform === 'win32') {
    const pf = process.env.ProgramFiles || 'C:\\Program Files';
    const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const local = process.env.LOCALAPPDATA || '';
    candidatos.push(
      path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      local && path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    );
  } else if (process.platform === 'darwin') {
    candidatos.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    candidatos.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser');
  }

  return candidatos.filter(Boolean).find((ruta) => {
    try { return fs.statSync(ruta).isFile(); } catch { return false; }
  }) || null;
}

/* ----------------------------------------------------------- servidor local */

function crearServidor() {
  return http.createServer((req, res) => {
    const rel = decodeURIComponent((req.url || '/').split('?')[0]);
    const destino = rel === '/' ? '/index.html' : rel;
    const archivo = path.normalize(path.join(raiz, destino));
    if (!archivo.startsWith(raiz + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.readFile(archivo, (err, datos) => {
      if (err) { res.writeHead(404); res.end('no encontrado'); return; }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo).toLowerCase()] || 'application/octet-stream' });
      res.end(datos);
    });
  });
}

/* ------------------------------------------------------------ página de E2E */

/**
 * @param {boolean} haciaResultado en la pasada de captura se activa
 *   `window.__E2E_CAPTURA`, y el recorrido se detiene en la pantalla de
 *   Resultado con la partida terminada en pantalla.
 */
function generarPagina(haciaResultado) {
  const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
  const cuerpo = fs.readFileSync(path.join(__dirname, 'e2e-cuerpo.js'), 'utf8');
  // Pasada de captura: el recorrido se detiene en la pantalla de Resultado.
  const marcaCaptura = haciaResultado ? '<script>window.__E2E_CAPTURA = true;</script>' : '';
  const marcador = '</body>';
  if (!html.includes(marcador)) throw new Error('No se encontró </body> en index.html');
  // Reemplazo con FUNCIÓN: con cadena, String.replace interpretaría los patrones
  // $ del cuerpo ($$, $', $`, $&) y corrompería el script inyectado.
  const salida = html.replace(marcador, () => `${marcaCaptura}<script>\n// GENERADO POR tests/e2e-navegador.js — no editar\n${cuerpo}\n</script>\n${marcador}`);
  fs.writeFileSync(paginaGenerada, salida, 'utf8');
  return salida.length;
}

/* -------------------------------------------------------------- ejecución */

/** Juega la partida y devuelve { dom, diario, codigo } (o { captura } si es pasada de captura). */
function lanzarNavegador(navegador, url, captura) {
  return new Promise((resolver, rechazar) => {
    const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'trivia-e2e-'));
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-sync',
      `--user-data-dir=${perfil}`,
      `--virtual-time-budget=${PRESUPUESTO_MS}`,
    ];
    if (captura) {
      args.push('--hide-scrollbars', '--window-size=1440,1100', `--screenshot=${captura}`);
    } else {
      args.push('--dump-dom');
    }
    args.push(url);

    const hijo = spawn(navegador, args, { windowsHide: true });
    let dom = '';
    let diario = '';
    const limite = setTimeout(() => {
      hijo.kill();
      rechazar(new Error(`Sin respuesta en ${ESPERA_MAX_MS / 1000} s`));
    }, ESPERA_MAX_MS);
    hijo.stdout.on('data', (d) => { dom += d; });
    hijo.stderr.on('data', (d) => { diario += d; });
    hijo.on('error', (e) => { clearTimeout(limite); rechazar(e); });
    hijo.on('close', (codigo) => {
      clearTimeout(limite);
      resolver({ dom, diario, codigo, perfil });
    });
  });
}

function extraerInforme(dom) {
  const m = dom.match(/<pre id="informe">([\s\S]*?)<\/pre>/);
  if (!m) return null;
  return m[1]
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');   // &amp; al final, para no re-escapar lo anterior
}

function informarError(diario, codigo) {
  if (diario && diario.trim()) {
    console.error('Diagnóstico de Chrome:\n' + diario.trim().split('\n').slice(-8).join('\n'));
  }
  if (codigo) console.error('El navegador salió con código ' + codigo + '.');
}

/* ------------------------------------------------------------------ main */

(async () => {
  let servidor = null;
  const perfiles = [];
  try {
    const argCaptura = process.argv.find((a) => a.startsWith('--captura'));
    const rutaCaptura = argCaptura
      ? path.resolve(raiz, argCaptura.split('=')[1] || 'docs/capturas/resultado-final.png')
      : null;

    const navegador = encontrarNavegador();
    if (!navegador) {
      console.error('No se encontró Chrome ni Edge. Indica la ruta con la variable de entorno CHROME_PATH.');
      process.exitCode = 1;
      return;
    }

    servidor = crearServidor();
    await new Promise((ok, ko) => servidor.once('error', ko).listen(0, '127.0.0.1', ok));
    const puerto = servidor.address().port;
    const url = `http://127.0.0.1:${puerto}/__e2e.html`;

    /* --- 1. Pasada de verificación (informe) --- */
    const bytes = generarPagina(false);
    console.log(`Navegador: ${navegador}`);
    console.log(`Página:    __e2e.html (${bytes} chars) · servidor 127.0.0.1:${puerto}`);
    console.log('Ejecutando el recorrido completo…\n');

    const verificacion = await lanzarNavegador(navegador, url, null);
    perfiles.push(verificacion.perfil);

    const informe = extraerInforme(verificacion.dom);
    if (!informe) {
      console.error('No se encontró el informe en la página.');
      informarError(verificacion.diario, verificacion.codigo);
      process.exitCode = 1;
      return;
    }

    console.log(informe);

    const lineas = informe.split('\n');
    const pass = lineas.filter((l) => l.startsWith('PASS')).length;
    const fallos = lineas.filter((l) => /^(FAIL|ERROR|RECHAZO)/.test(l));
    const ok = fallos.length === 0 && /TODAS LAS COMPROBACIONES PASARON/.test(informe);
    console.log(`\nResumen: ${pass} PASS · ${fallos.length} fallo(s)`);
    process.exitCode = ok ? 0 : 1;

    /* --- 2. Pasada de captura (opcional) --- */
    if (rutaCaptura) {
      fs.mkdirSync(path.dirname(rutaCaptura), { recursive: true });
      try { fs.rmSync(rutaCaptura, { force: true }); } catch { /* no existía */ }
      generarPagina(true);
      console.log(`\nCapturando la pantalla de Resultado en ${rutaCaptura}…`);
      const captura = await lanzarNavegador(navegador, url, rutaCaptura);
      perfiles.push(captura.perfil);
      if (fs.existsSync(rutaCaptura)) {
        console.log(`Captura guardada (${fs.statSync(rutaCaptura).size} bytes).`);
      } else {
        console.error('La captura no se generó.');
        informarError(captura.diario, captura.codigo);
        process.exitCode = 1;
      }
    }
  } catch (e) {
    console.error('Error del E2E:', e && e.message ? e.message : e);
    process.exitCode = 1;
  } finally {
    if (servidor) servidor.close();
    try { fs.rmSync(paginaGenerada, { force: true }); } catch { /* ya borrada */ }
    // Perfiles temporales de Chrome (mejor esfuerzo: a veces tardan en liberarse).
    const borrar = perfiles.length
      ? perfiles
      : fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith('trivia-e2e-')).map((n) => path.join(os.tmpdir(), n));
    for (const p of borrar) {
      try { fs.rmSync(p, { recursive: true, force: true, maxRetries: 3 }); } catch { /* mejor esfuerzo */ }
    }
  }
})();
