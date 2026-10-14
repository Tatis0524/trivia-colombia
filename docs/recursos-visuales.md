# Recursos visuales — Trivia Colombia

Inventario de recursos gráficos, decisiones y registro de las imágenes añadidas con sus
fuentes, autorías y licencias. Revisión realizada sobre los 8 mockups de alta fidelidad
(`docs/diseno/mockup-alta-0*.jpg`), la guía de estilos y el código actual.

## 1. Inventario: qué necesita la aplicación y qué falta

| Recurso | Estado | Decisión |
|---|---|---|
| Iconos de las 6 categorías | ✅ Completos | El sprite de `index.html` los cubre (`i-cuadricula`, `i-montana`, `i-monumento`, `i-musica`, `i-balon`, `i-hoja`). **No hace falta generación con IA** |
| Iconos generales (30+) | ✅ Completos | Trofeo, cronómetro, comodines, medallas, etc., todos en el sprite |
| Imágenes de preguntas | ✅ Añadidas 27 | Fotos de Wikimedia Commons con licencia abierta, integradas como campo opcional (sección 3) |
| Panel "Tu espacio de juego" (Configuración) | ✅ Sin imagen | Construido con HTML/CSS según el mockup; no requiere recurso externo |
| Ilustración de Inicio (hero) | ✅ Añadida | `assets/img/hero-inicio.jpg` (550×640, 78 KB). Ilustración generada con IA para el proyecto (sección 3b); sustituye al marcador `hero-colombia.svg`. **No es una foto** para no contradecir la identidad del mockup |
| Favicon / logo | ✅ Añadidos | `assets/img/favicon.png` (64×64) y `assets/img/logo-escudo.png` (472×512). Escudo generado con IA (sección 3b); el favicon se sirve desde `<link rel="icon">` y el escudo en el encabezado (`.marca__escudo`) |
| Efectos de sonido | ⏳ Etapa 4 | `assets/sonidos/` vacío; no es un recurso visual |

## 2. Cómo se integran las imágenes de las preguntas

- **Campos opcionales del banco** (`js/preguntas.js`, formato §13 + campos de imagen):
  `imagenUrl` (URL directa del archivo) y `fuenteImagenUrl` (página de origen con los
  créditos). Las URLs usan https y el banco mantiene su estructura uniforme.
- **Render** (`UI.renderImagenPregunta`, llamada desde `mostrarPregunta`): `<figure>` con
  marco de relación de aspecto fija (3:2, `object-fit: cover`), atributos `width`/`height`
  (960×640), `decoding="async"` y `alt` "Imagen de apoyo: {enunciado}". El pie enlaza a
  `fuenteImagenUrl` con `target="_blank" rel="noopener noreferrer"` (atribución visible).
- **Si la imagen no carga**: `error` + comprobación `complete && naturalWidth === 0`
  sustituyen la foto por un bloque con el ícono de la categoría dentro del mismo marco
  (sin saltos de diseño, sin huecos ni íconos rotos). El E2E lo fuerza con un `error`
  sintético (paso 17).
- **Sin foto en todas las preguntas**: 27 de 150 (18 %). Solo se añadió donde aporta
  valor educativo y visual: monumentos, patrimonio, fauna, flora, paisajes y ciudades.
  Hay al menos **2 fotos en cada categoría**, de modo que cualquier partida Fácil muestra
  entre 2 y 6 fotos (las dificultades Medio y Difícil dependen de cuántas fotos tenga su
  combinación en el banco; ver sección 3).
- **Garantía de fotos por partida**: el sorteo (`Juego.obtenerPreguntas`) asegura que
  **cada partida incluya hasta 4 preguntas con foto** (`REGLAS.imagenesMinimasPorPartida`),
  en la categoría y dificultad elegidas. Si esa combinación tiene menos de 4 fotos en el
  banco, la partida incluye todas las disponibles (nunca inventa ni repite preguntas).

## 3. Registro de imágenes añadidas

Todas proceden de **Wikimedia Commons** (licencias abiertas compatibles con un proyecto
académico público). La URL directa usa el ancho estándar de miniatura de 960 px; el enlace
de `fuenteImagenUrl` lleva a la página del archivo, que contiene la licencia completa.

| Pregunta | Tema | Archivo (Commons) | URL directa (960 px) | Autoría | Licencia | Atribución sugerida |
|---|---|---|---|---|---|---|
| id 12 · Geografía | Parque Nacional Natural Tayrona (Playa Siete Olas) | `File:Parque Nacional Natural Tayrona 7.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Parque_Nacional_Natural_Tayrona_7.jpg/960px-Parque_Nacional_Natural_Tayrona_7.jpg` | Hugo A. Quintero G. (Colombia) | CC BY 2.0 | Foto: Hugo A. Quintero G. / CC BY 2.0, vía Wikimedia Commons |
| id 38 · Historia | Ciudad Perdida (Teyuna), Sierra Nevada de Santa Marta | `File:36Visita Parque Teyuna Ciudad perdida-Ovidio González.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/36Visita_Parque_Teyuna_Ciudad_perdida-Ovidio_Gonz%C3%A1lez.jpg/960px-36Visita_Parque_Teyuna_Ciudad_perdida-Ovidio_Gonz%C3%A1lez.jpg` | Ovidio González — fotografía oficial de la República de Colombia | Dominio público | Foto: República de Colombia (Ovidio González) / dominio público, vía Wikimedia Commons |
| id 63 · Cultura | Carnaval de Barranquilla (danza del Garabato) | `File:Garabato Carnaval de Barranquilla.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Garabato_Carnaval_de_Barranquilla.jpg/960px-Garabato_Carnaval_de_Barranquilla.jpg` | Jdvillalobos | CC BY 3.0 | Foto: Jdvillalobos / CC BY 3.0, vía Wikimedia Commons |
| id 121 · Naturaleza | Cóndor andino, ave nacional (`Vultur gryphus`) | `File:Andean condor (Vultur gryphus) male Farellones.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Andean_condor_%28Vultur_gryphus%29_male_Farellones.jpg/960px-Andean_condor_%28Vultur_gryphus%29_male_Farellones.jpg` | Charles J. Sharp (Sharp Photography) | CC BY-SA 4.0 | Foto: Charles J. Sharp / CC BY-SA 4.0, vía Wikimedia Commons |
| id 122 · Naturaleza | Palma de cera del Quindío, árbol nacional | `File:Ceroxylon quindiuense cocora.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Ceroxylon_quindiuense_cocora.jpg/960px-Ceroxylon_quindiuense_cocora.jpg` | Diegotorquemada | CC BY 3.0 | Foto: Diegotorquemada / CC BY 3.0, vía Wikimedia Commons |
| id 123 · Naturaleza | Orquídea `Cattleya trianae`, flor nacional | `File:Cattleya trianae tipo.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Cattleya_trianae_tipo.jpg/960px-Cattleya_trianae_tipo.jpg` | QuazDelaCruz | CC0 | Foto: QuazDelaCruz / CC0, vía Wikimedia Commons |
| id 124 · Naturaleza | Oso de anteojos | `File:Tremarctos ornatus in Jardim Zoológico de Curitiba.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Tremarctos_ornatus_in_Jardim_Zool%C3%B3gico_de_Curitiba.jpg/960px-Tremarctos_ornatus_in_Jardim_Zool%C3%B3gico_de_Curitiba.jpg` | Wilfredor | CC0 | Foto: Wilfredor / CC0, vía Wikimedia Commons |
| id 125 · Naturaleza | Delfín rosado o boto (`Inia geoffrensis`) | `File:Inia geoffrensis geoffrensis 103297350.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Inia_geoffrensis_geoffrensis_103297350.jpg/960px-Inia_geoffrensis_geoffrensis_103297350.jpg` | Austin R. Kelly (vía iNaturalist) | CC BY 4.0 | Foto: Austin R. Kelly / CC BY 4.0, vía Wikimedia Commons |
| id 127 · Naturaleza | Jaguar (`Panthera onca palustris`) | `File:Jaguar (Panthera onca palustris) male Rio Negro 2.JPG` | `https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Jaguar_%28Panthera_onca_palustris%29_male_Rio_Negro_2.JPG/960px-Jaguar_%28Panthera_onca_palustris%29_male_Rio_Negro_2.JPG` | Charles J. Sharp (Sharp Photography) | CC BY-SA 4.0 | Foto: Charles J. Sharp / CC BY-SA 4.0, vía Wikimedia Commons |
| id 132 · Naturaleza | Caño Cristales, cascadas del Manto de la Virgen (La Macarena, Meta) | `File:Cascadas Manto de La Virgen - Caño Cristales - La Macarena - Meta - Colombia.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Cascadas_Manto_de_La_Virgen_-_Ca%C3%B1o_Cristales_-_La_Macarena_-_Meta_-_Colombia.jpg/960px-Cascadas_Manto_de_La_Virgen_-_Ca%C3%B1o_Cristales_-_La_Macarena_-_Meta_-_Colombia.jpg` | Gicaman | CC BY-SA 4.0 | Foto: Gicaman / CC BY-SA 4.0, vía Wikimedia Commons |
| id 1 · Geografía | Bogotá, capital (vista urbana) | `File:Bogota, Colombia.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Bogota%2C_Colombia.jpg/960px-Bogota%2C_Colombia.jpg` | NASA (dominio público) | Dominio público | Foto: NASA / dominio público, vía Wikimedia Commons |
| id 4 · Geografía | Río Magdalena | `File:Rio Magdalena, Colombia 01.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Rio_Magdalena%2C_Colombia_01.jpg/960px-Rio_Magdalena%2C_Colombia_01.jpg` | Bernard Gagnon | CC BY-SA 4.0 | Foto: Bernard Gagnon / CC BY-SA 4.0, vía Wikimedia Commons |
| id 5 · Geografía | Medellín (vista del Valle de Aburrá) | `File:Overlooking El Tesoro in Medellin, Colombia.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Overlooking_El_Tesoro_in_Medellin%2C_Colombia.jpg/960px-Overlooking_El_Tesoro_in_Medellin%2C_Colombia.jpg` | Elena.laps | CC BY-SA 4.0 | Foto: Elena.laps / CC BY-SA 4.0, vía Wikimedia Commons |
| id 7 · Geografía | Murallas de Cartagena de Indias | `File:Murallas, Cartagena de indias Colombia-2008 04.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Murallas%2C_Cartagena_de_indias_Colombia-2008_04.jpg/960px-Murallas%2C_Cartagena_de_indias_Colombia-2008_04.jpg` | Nickeyra | CC BY-SA 4.0 | Foto: Nickeyra / CC BY-SA 4.0, vía Wikimedia Commons |
| id 13 · Geografía | Tunja, capital de Boyacá (Plaza de Bolívar) | `File:Plaza de Bolivar, Tunja, Boyaca, Colombia - panoramio.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Plaza_de_Bolivar%2C_Tunja%2C_Boyaca%2C_Colombia_-_panoramio.jpg/960px-Plaza_de_Bolivar%2C_Tunja%2C_Boyaca%2C_Colombia_-_panoramio.jpg` | lualcamargo13 | CC BY-SA 3.0 | Foto: lualcamargo13 / CC BY-SA 3.0, vía Wikimedia Commons |
| id 15 · Geografía | La Guajira (Cabo de la Vela / Punta Gallinas) | `File:Desierto - Cabo de la Vela.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Desierto_-_Cabo_de_la_Vela.jpg/960px-Desierto_-_Cabo_de_la_Vela.jpg` | ROCHY HERNÁNDEZ | CC BY-SA 4.0 | Foto: ROCHY HERNÁNDEZ / CC BY-SA 4.0, vía Wikimedia Commons |
| id 17 · Geografía | Buenaventura, principal puerto del Pacífico | `File:Muelle Buenaventura.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Muelle_Buenaventura.jpg/960px-Muelle_Buenaventura.jpg` | leonc27 | CC BY-SA 2.0 | Foto: leonc27 / CC BY-SA 2.0, vía Wikimedia Commons |
| id 31 · Historia | Guerra de Independencia (collage de óleos) | `File:Collage Guerra de Independencia de Colombia.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Collage_Guerra_de_Independencia_de_Colombia.jpg/960px-Collage_Guerra_de_Independencia_de_Colombia.jpg` | Compilación de obras de Generoso Jaspe, Ricardo Acevedo Bernal, Martín Tovar y Tovar y José María Espinoza (dominio público); collage de NicolásF2 | CC BY-SA 4.0 (collage) | Obras originales: dominio público; collage: NicolásF2 / CC BY-SA 4.0, vía Wikimedia Commons |
| id 32 · Historia | Simón Bolívar, El Libertador (retrato) | `File:Retrato de Simon Bolivar en Quinta de los Libertadores en Pueblo Libre.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Retrato_de_Simon_Bolivar_en_Quinta_de_los_Libertadores_en_Pueblo_Libre.jpg/960px-Retrato_de_Simon_Bolivar_en_Quinta_de_los_Libertadores_en_Pueblo_Libre.jpg` | Futuropopular | CC BY-SA 4.0 | Foto: Futuropopular / CC BY-SA 4.0, vía Wikimedia Commons |
| id 33 · Historia | Monumento del Puente de Boyacá | `File:Monumentos puente de Boyaca 3.JPG` | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Monumentos_puente_de_Boyaca_3.JPG/960px-Monumentos_puente_de_Boyaca_3.JPG` | Nelsonc | CC BY-SA 3.0 | Foto: Nelsonc / CC BY-SA 3.0, vía Wikimedia Commons |
| id 39 · Historia | Laguna de Guatavita, leyenda de El Dorado | `File:Laguna Guatavita 06.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Laguna_Guatavita_06.jpg/960px-Laguna_Guatavita_06.jpg` | Burkhard Möcke | CC BY-SA 4.0 | Foto: Burkhard Möcke / CC BY-SA 4.0, vía Wikimedia Commons |
| id 62 · Cultura | Bandeja paisa | `File:Bandeja Paisa (Bogotá).jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Bandeja_Paisa_%28Bogot%C3%A1%29.jpg/960px-Bandeja_Paisa_%28Bogot%C3%A1%29.jpg` | Edgar Zuniga Jr. | CC BY 2.0 | Foto: Edgar Zuniga Jr. / CC BY 2.0, vía Wikimedia Commons |
| id 65 · Cultura | Sombrero vueltiao (símbolo zenú) | `File:Sombrero Vueltiao in den kolumbianischen Nationalfarben.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Sombrero_Vueltiao_in_den_kolumbianischen_Nationalfarben.jpg/960px-Sombrero_Vueltiao_in_den_kolumbianischen_Nationalfarben.jpg` | Hurluberlue | CC BY-SA 4.0 | Foto: Hurluberlue / CC BY-SA 4.0, vía Wikimedia Commons |
| id 68 · Cultura | Desfile de Silleteros (Feria de las Flores, Medellín) | `File:Cuando pasa un silletero, es medellin el que pasa.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Cuando_pasa_un_silletero%2C_es_medellin_el_que_pasa.jpg/960px-Cuando_pasa_un_silletero%2C_es_medellin_el_que_pasa.jpg` | Mariaalejandragallego | CC0 | Foto: Mariaalejandragallego / CC0, vía Wikimedia Commons |
| id 69 · Cultura | Acordeón vallenato | `File:Acordeón vallenato.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Acorde%C3%B3n_vallenato.jpg/960px-Acorde%C3%B3n_vallenato.jpg` | Jdvillalobos | Dominio público | Foto: Jdvillalobos / dominio público, vía Wikimedia Commons |
| id 94 · Deportes | Ciclismo colombiano (Vuelta a Colombia) | `File:Vuelta a Colombia 2012.JPG` | `https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Vuelta_a_Colombia_2012.JPG/960px-Vuelta_a_Colombia_2012.JPG` | Grillobike | CC BY-SA 3.0 | Foto: Grillobike / CC BY-SA 3.0, vía Wikimedia Commons |
| id 98 · Deportes | Estadio Metropolitano de Barranquilla (Junior) | `File:Estadio Metropolitano de Baranquilla 2011.jpg` | `https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Estadio_Metropolitano_de_Baranquilla_2011.jpg/960px-Estadio_Metropolitano_de_Baranquilla_2011.jpg` | Mkstillo | CC BY-SA 4.0 | Foto: Mkstillo / CC BY-SA 4.0, vía Wikimedia Commons |

Nota sobre CC BY-SA: la cláusula "share-alike" se aplica a la fotografía (y a sus
derivados), no obliga a licenciar la página completa; con la atribución anterior y el
enlace a la licencia en la página de origen del archivo se cumple el permiso. No se
descargó ningún archivo: las imágenes se cargan por URL desde los servidores de Wikimedia.

## 3b. Recursos generados con IA para el proyecto (13 de octubre de 2026)

Ilustraciones **propias** (no son fotos), generadas con IA para este proyecto. Sustituyen
los marcadores que esperaban el export de Figma: la ilustración de Inicio, el escudo
(logo) y el favicon. Como son obra propia no requieren licencia externa ni atribución de
terceros, y se guardan ya optimizadas en `assets/img/`:

| Archivo | Uso | Dimensiones | Peso |
|---|---|---|---|
| `hero-inicio.jpg` | Ilustración de Inicio (`.inicio__ilustracion`) | 550×640 | 78 KB |
| `logo-escudo.png` | Encabezado (`.marca__escudo`) | 472×512 | 79 KB |
| `favicon.png` | Favicon (`<link rel="icon">`) | 64×64 | 5 KB |

- **Formato**: el hero va en JPEG (fotográfico, menor peso); el escudo y el favicon en PNG
  con transparencia. Todas con `decoding="async"` y `width`/`height` fijos para evitar
  saltos de diseño.
- **`alt`**: el hero tiene texto alternativo descriptivo; el escudo va dentro de un
  `span aria-hidden="true"` porque es decorativo (el nombre de la app ya está en texto).

## 4. Verificación de las URLs (13 de octubre de 2026)

Ninguna URL fue supuesta. El procedimiento fue:

1. Búsqueda en la **API de Wikimedia Commons** (`action=query&generator=search` sobre el
   espacio `File`), que devuelve además autoría y licencia (`extmetadata`).
2. Elección de una foto por tema entre las de licencia más abierta.
3. Comprobación directa de cada URL: las 10 originales con una petición **GET parcial**
   (`Range: bytes=0-2047`, devolvieron **HTTP 206 con `content-type: image/jpeg`**) y las
   17 nuevas cargándolas en un **navegador real (Chrome)**: las 27 cargaron correctamente.
   (Wikimedia rechaza `HEAD` en miniaturas y limita las peticiones automatizadas con 429;
   por eso se usa el ancho de 960 px que devuelve la propia API y se verifican en navegador.)
4. Las páginas de origen (`fuenteImagenUrl`) respondieron **HTTP 200** (`text/html`).

### Distribución actual por categoría (27 fotos)

| Categoría | Fotos | Dificultades cubiertas |
|---|---|---|
| Geografía | 7 | Fácil (4), Medio (3) |
| Historia | 5 | Fácil (5) |
| Cultura | 5 | Fácil (5) |
| Deportes | 2 | Fácil (2) |
| Naturaleza | 8 | Fácil (6), Medio (2) |

Con esta distribución, **toda partida Fácil muestra entre 2 y 6 fotos** y el sorteo
garantiza hasta 4 cuando la combinación lo permite. Las dificultades Medio y Difícil
muestran las fotos disponibles de su combinación (Geografía Medio tiene 3; el resto,
0 por ahora). Si en el futuro se quiere cubrir una dificultad completa, basta con añadir
más `imagenUrl` a esas preguntas siguiendo el mismo procedimiento de búsqueda y
verificación descrito arriba.

Si en el futuro una imagen dejara de cargar, la interfaz muestra la alternativa con el
ícono de la categoría (sección 2) y basta con sustituir la URL de esa pregunta por otra
foto de Commons siguiendo el mismo procedimiento.

## 5. Ilustraciones de categorías

Los 6 iconos de categoría ya existen en el sprite de `index.html` (estilo línea, trazo
2 px, `currentColor`, viewBox 24×24), coherentes con la guía de estilos y los mockups.
Se conservan en los **chips pequeños** (cabecera de pregunta, retroalimentación),
donde el trazo se lee mejor.

En las **tarjetas-opción grandes** de Configuración de partida se usan ilustraciones
generadas con IA (propias del proyecto), 1:1, en `assets/img/`:

| Categoría | Archivo |
|---|---|
| Todas | `cat-todas.png` |
| Geografía | `cat-geografia.png` |
| Historia | `cat-historia.png` |
| Cultura y Tradiciones | `cat-cultura.png` |
| Deportes | `cat-deportes.png` |
| Ciencia y Naturaleza | `cat-naturaleza.png` |

Si en el futuro se quisieran otras ilustraciones, se sustituye el archivo manteniendo el
nombre, o se ajusta el mapa en `UI.ilustracion` (`js/ui.js`). La paleta de referencia es
coral `#FF6B6B`, amarillo `#FFD166`, azul `#173B72`, fondo `#FFFDF7`.

## 6. Pendientes deliberados

1. Las fotos se muestran solo en la pantalla de pregunta; si se desean también en la
   retroalimentación o en la revisión de falladas, basta con reutilizar
   `UI.renderImagenPregunta` (los campos ya están en el banco).
