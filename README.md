# TCdle

Juego diario del Turismo Carretera con cinco modos: adivinar el piloto, el auto, el circuito, el Wordle del TC y el top 10 de una carrera. Cada jugador ve el mismo desafío el mismo día; el progreso y las rachas se guardan en su navegador (`localStorage`) y el desafío cambia a su medianoche.

Hecho con [Astro](https://astro.build) (sitio estático), TypeScript y Svelte para las pantallas de juego. Se publica en Vercel: <https://tc-dle.vercel.app>.

## Desarrollo

Hace falta Node 22 (`.nvmrc`).

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:4321/
npm test         # Vitest: lógica, catálogos, imágenes, formato guardado y selección diaria
npm run check    # tipos de Astro, Svelte y TypeScript
npm run build    # genera el sitio en dist/ (npm run preview para verlo)
```

Para probar los temas fuera de fecha: `?halloween=1` prende el de Halloween y `?copa=1` el dorado de la Copa de Oro (quedan prendidos en la pestaña; con `=0` se apagan). Para ver la Copa en plena temporada de Halloween: `?halloween=0&copa=1`.

Cualquier juego se puede jugar en un día anterior con `?dia=AAAA-MM-DD` (es lo que usa el archivo, `/archivo.html`). Esas partidas se guardan en otra clave (`partidaTCdle*Archivo`) y no suman a la racha.

## Dónde está cada cosa

- `src/data/`: catálogos en JSON (pilotos, autos, circuitos, palabras), `calendario.ts` y `copa-de-oro.ts` (pilotos y fechas de la Copa de cada temporada, a mano). `carreras.json` (finales del TC desde 2010) no se edita a mano: viene del repo [tcdle-resultados](https://github.com/MarcosAlba/tcdle-resultados) con `npm run carreras`. `tipos.ts` es el esquema y documenta cada campo; `validar.ts` frena el build si un dato está mal.
- `src/lib/`: lógica en TypeScript puro y con tests (selección diaria, partida, rachas, buscador, calendario, wordle).
- `src/games/` y `src/components/`: pantallas de juego y piezas compartidas en Svelte.
- `src/pages/`: la portada, el archivo, la 404 y una página por juego en `pages/*.html` (esos nombres no se tocan: hay links compartidos).
- `src/styles/`: `tokens.css` es la única fuente de colores y define como variables los temas de Halloween y de la Copa de Oro y el modo de alto contraste.
- `public/assets/images/`: fotos, autos, siluetas y logos. Después de sumar fotos nuevas, `npm run imagenes` las optimiza sin pérdida visible. Las tarjetas de vista previa al compartir están en `og/`: se regeneran con la herramienta `/pages/tarjetas-og` de `npm run dev`.

## Cuidado con los catálogos

El piloto, el auto, el circuito y la palabra de cada día salen de mezclar el catálogo con una semilla que depende de su **orden y su cantidad**. Sumar, sacar o reordenar elementos cambia lo que sale cada día para todos, y `tests/seleccion-catalogos.test.ts` lo avisa. Si el cambio es a propósito, se regenera el fixture con `node tests/fixtures/generar-seleccion.mjs`. Para el auto, la etiqueta es el nombre de archivo: no se renombra.

Tampoco se cambian las claves ni el formato de lo que se guarda en `localStorage` (`partidaTCdle*`, `rachasTCdle`, `tcdleIntro*Vista`; el resumen del día y el historial del archivo van aparte, en `tcdleResumenDia` y `tcdleHistorial`): `tests/almacenamiento-contrato.test.ts` lo fija.

## Despliegue

Vercel publica `main` solo: detecta Astro, ejecuta `npm run build` y sirve `dist` desde la raíz, que es la base por defecto de `astro.config.mjs`. `.github/workflows/verificar.yml` corre los tests, los tipos y el build en cada push y pull request para avisar si algo se rompe antes de publicar. Para publicar en GitHub Pages como página de proyecto hay que construir con `SITIO_BASE=/TC.dle SITIO_URL=https://marcosalba.github.io`.
