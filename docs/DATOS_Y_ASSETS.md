# Datos y assets

## Catalogos

`assets/js/pilotos.js` define `pilotos`, un array global con datos del modo Pilotos y tambien base para Autos. Cada piloto tiene ID numerico, nombre, marca, equipo, ubicacion, nacimiento, campeonatos y rutas de imagen.

`assets/js/autos.js` define `window.autosTC`. Cada entrada conecta un `pilotoId` con un archivo `.webp` dentro de `assets/images/autos/`.

`assets/js/circuitos.js` define `window.circuitosTC`. Contiene 31 configuraciones jugables y 29 sedes. Cada circuito incluye ID, sede, nombre, variante, aliases, ciudad, provincia, longitud, participacion, imagen y fuente.

## Seleccion diaria

`assets/js/seleccion-diaria.js` no elige el siguiente ID en orden. Genera un orden mezclado y estable por modo:

```js
TCdle.seleccionDiaria.obtener(pilotos, "pilotos");
TCdle.seleccionDiaria.obtener(autosDelJuego, "autos");
TCdle.seleccionDiaria.obtener(circuitos, "circuitos");
```

La clave separa la mezcla de cada modo. La posicion depende del numero de dia en UTC, pero la partida y el cambio de dia se manejan con fecha local para el navegador.

La propiedad importante es que no repite hasta recorrer el catalogo completo de ese modo.

## Imagenes

Rutas principales:

- `assets/images/pilotos/`: PNG de pilotos para resultados y portada.
- `assets/images/autos/`: WEBP de autos para el modo Auto.
- `assets/images/circuitos/`: SVG de siluetas.
- `assets/images/iconos/`: iconos de redes.

La portada tiene imagenes fijas:

- `assets/images/pilotos/julian_santero.png`
- `assets/images/autos/agustin_canapino.webp`
- `assets/images/circuitos/alta-gracia.svg`

## Siluetas de circuitos

El catalogo de circuitos esta auditado por `tests/circuitos.test.mjs`. Ese test valida:

- 31 configuraciones jugables.
- 29 sedes.
- IDs unicos.
- Campos obligatorios.
- Fuente con URL valida.
- SVG con dimensiones y `<path>`.
- Ausencia de `<image>`, `<text>` y `<foreignObject>`.
- Variantes con siluetas distintas.

Existe `scripts/generar-siluetas.mjs` para regenerar SVG desde OpenStreetMap. Requiere Node.js y conexion a Internet:

```powershell
node scripts/generar-siluetas.mjs
```

No conviene ejecutarlo como parte de cambios visuales menores, porque sobrescribe assets.
