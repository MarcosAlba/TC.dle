# TCdle

Juego diario del Turismo Carretera con cuatro modos: adivinar el piloto, el auto, el circuito y el Wordle del TC. Cada jugador ve el mismo desafío el mismo día; el progreso y las rachas se guardan en su navegador (`localStorage`) y el desafío cambia a su medianoche.

Hecho con [Astro](https://astro.build) (sitio estático), TypeScript y Svelte para las pantallas de juego. Se publica en GitHub Pages: <https://marcosalba.github.io/TC.dle/>.

## Desarrollo

Hace falta Node 22 (`.nvmrc`).

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:4321/TC.dle/
npm test         # Vitest: lógica, catálogos, imágenes, formato guardado y selección diaria
npm run check    # tipos de Astro, Svelte y TypeScript
npm run build    # genera el sitio en dist/ (npm run preview para verlo)
```

Para probar el tema de Halloween fuera de fecha: agregar `?halloween=1` a la URL (queda prendido en la pestaña; `?halloween=0` lo apaga).

## Dónde está cada cosa

- `src/data/`: catálogos en JSON (pilotos, autos, circuitos, palabras) y `calendario.ts`. `tipos.ts` es el esquema y documenta cada campo; `validar.ts` frena el build si un dato está mal.
- `src/lib/`: lógica en TypeScript puro y con tests (selección diaria, partida, rachas, buscador, calendario, wordle).
- `src/games/` y `src/components/`: pantallas de juego y piezas compartidas en Svelte.
- `src/pages/`: la portada y una página por juego en `pages/*.html` (esos nombres no se tocan: hay links compartidos).
- `src/styles/`: `tokens.css` es la única fuente de colores y define el tema de Halloween como variables.
- `public/assets/images/`: fotos, autos, siluetas y logos. Después de sumar fotos nuevas, `npm run imagenes` las optimiza sin pérdida visible.

## Cuidado con los catálogos

El piloto, el auto, el circuito y la palabra de cada día salen de mezclar el catálogo con una semilla que depende de su **orden y su cantidad**. Sumar, sacar o reordenar elementos cambia lo que sale cada día para todos, y `tests/seleccion-catalogos.test.ts` lo avisa. Si el cambio es a propósito, se regenera el fixture con `node tests/fixtures/generar-seleccion.mjs`. Para el auto, la etiqueta es el nombre de archivo: no se renombra.

Tampoco se cambian las claves ni el formato de lo que se guarda en `localStorage` (`partidaTCdle*`, `rachasTCdle`, `tcdleIntro*Vista`): `tests/almacenamiento-contrato.test.ts` lo fija.

## Despliegue

`.github/workflows/publicar.yml` corre los tests y el build en cada push y pull request, y publica en GitHub Pages cuando el push es a `main`. En el repositorio, Settings > Pages debe tener como fuente "GitHub Actions". Como el sitio vive en `/TC.dle/`, la base está en `astro.config.mjs`; con un dominio propio se construye con `SITIO_BASE=/ SITIO_URL=https://mi-dominio.com`.
