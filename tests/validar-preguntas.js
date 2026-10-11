/* validar-preguntas.js — Valida el banco de js/preguntas.js.
   Uso (desde la raíz del proyecto):  node tests/validar-preguntas.js
   Sale con código 0 si todo pasa y 1 si algo falla. No modifica ningún archivo. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ruta = path.join(__dirname, '..', 'js', 'preguntas.js');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(ruta, 'utf8') + '\n;this.__d = { CATEGORIAS, DIFICULTADES, PREGUNTAS };', ctx);
const { CATEGORIAS, DIFICULTADES, PREGUNTAS } = ctx.__d;

const TOTAL = 150, POR_CATEGORIA = 30, POR_COMBO = 10;
const cats = CATEGORIAS.filter(c => c.id !== 'todas').map(c => c.id);
const difs = DIFICULTADES.map(d => d.id);
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const vacio = s => typeof s !== 'string' || s.trim() === '';

const resultados = [];
const chequeo = (nombre, ok, detalle) => { resultados.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${nombre}${detalle ? ' — ' + detalle : ''}`); };
const listar = a => a.length ? a.slice(0, 8).join('; ') : '';

chequeo('Total de preguntas', PREGUNTAS.length === TOTAL, `${PREGUNTAS.length} (esperadas ${TOTAL})`);

const porCat = {}, porCombo = {};
PREGUNTAS.forEach(p => { porCat[p.categoria] = (porCat[p.categoria] || 0) + 1; const k = p.categoria + '/' + p.dificultad; porCombo[k] = (porCombo[k] || 0) + 1; });
chequeo('30 preguntas por categoría', cats.every(c => porCat[c] === POR_CATEGORIA), cats.map(c => `${c}=${porCat[c] || 0}`).join(', '));
const malCombo = [];
cats.forEach(c => difs.forEach(d => { if (porCombo[c + '/' + d] !== POR_COMBO) malCombo.push(`${c}/${d}=${porCombo[c + '/' + d] || 0}`); }));
chequeo('10 preguntas por categoría × dificultad', malCombo.length === 0, malCombo.length ? listar(malCombo) : `${cats.length * difs.length} combinaciones con ${POR_COMBO}`);

const ids = PREGUNTAS.map(p => p.id);
const dupIds = ids.filter((x, i) => ids.indexOf(x) !== i);
chequeo('Identificadores únicos y enteros', dupIds.length === 0 && ids.every(Number.isInteger), dupIds.length ? 'repetidos: ' + listar(dupIds) : `ids ${Math.min(...ids)}-${Math.max(...ids)}`);

chequeo('Categoría y dificultad válidas', PREGUNTAS.every(p => cats.includes(p.categoria) && difs.includes(p.dificultad)), listar(PREGUNTAS.filter(p => !cats.includes(p.categoria) || !difs.includes(p.dificultad)).map(p => 'id ' + p.id)));

const malOps = PREGUNTAS.filter(p => !Array.isArray(p.opciones) || p.opciones.length !== 4 || p.opciones.some(vacio)).map(p => 'id ' + p.id);
chequeo('Exactamente 4 opciones con texto', malOps.length === 0, listar(malOps));

const opsRep = PREGUNTAS.filter(p => Array.isArray(p.opciones) && new Set(p.opciones.map(norm)).size !== p.opciones.length).map(p => 'id ' + p.id);
chequeo('Opciones no repetidas dentro de cada pregunta', opsRep.length === 0, listar(opsRep));

const malIdx = PREGUNTAS.filter(p => !Number.isInteger(p.correcta) || p.correcta < 0 || p.correcta > 3).map(p => 'id ' + p.id);
chequeo('Índice correcto entero dentro de 0-3', malIdx.length === 0, listar(malIdx));

const sinEnun = PREGUNTAS.filter(p => vacio(p.enunciado)).map(p => 'id ' + p.id);
chequeo('Todas tienen enunciado', sinEnun.length === 0, listar(sinEnun));
const sinExp = PREGUNTAS.filter(p => vacio(p.explicacion)).map(p => 'id ' + p.id);
chequeo('Todas tienen explicación', sinExp.length === 0, listar(sinExp));

const enun = PREGUNTAS.map(p => norm(p.enunciado));
const dupEnun = PREGUNTAS.filter((p, i) => enun.indexOf(norm(p.enunciado)) !== i).map(p => 'id ' + p.id);
chequeo('Enunciados no duplicados', dupEnun.length === 0, listar(dupEnun));

const malImg = PREGUNTAS.filter(p => {
  const a = p.imagenUrl, b = p.fuenteImagenUrl;
  if (a === undefined && b === undefined) return false;
  const https = u => typeof u === 'string' && /^https:\/\/\S+$/.test(u);
  return !(https(a) && https(b));
}).map(p => 'id ' + p.id);
const conImg = PREGUNTAS.filter(p => p.imagenUrl !== undefined).length;
chequeo('Campos de imagen (opcionales) coherentes', malImg.length === 0, `${conImg} preguntas con imagen; ${malImg.length ? listar(malImg) : 'sin incoherencias'}`);

const inesperados = PREGUNTAS.filter(p => Object.keys(p).some(k => !['id', 'categoria', 'dificultad', 'enunciado', 'opciones', 'correcta', 'explicacion', 'imagenUrl', 'fuenteImagenUrl'].includes(k))).map(p => 'id ' + p.id);
chequeo('Sin campos inesperados (estructura uniforme)', inesperados.length === 0, listar(inesperados));

const pos = [0, 0, 0, 0]; PREGUNTAS.forEach(p => pos[p.correcta]++);
console.log(`INFO  Distribución de la respuesta correcta por posición (A-D): ${pos.join(' / ')}`);
console.log(`INFO  Dificultad: ${difs.map(d => d + '=' + PREGUNTAS.filter(p => p.dificultad === d).length).join(', ')}`);

const fallos = resultados.filter(r => !r).length;
console.log(`\n${fallos === 0 ? 'RESULTADO: TODAS LAS COMPROBACIONES PASARON' : 'RESULTADO: ' + fallos + ' COMPROBACIÓN(ES) FALLARON'} (${resultados.length} comprobaciones)`);
process.exit(fallos ? 1 : 0);