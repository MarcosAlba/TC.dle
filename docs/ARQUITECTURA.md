# Arquitectura

TCdle es una aplicacion web estatica. No hay servidor de aplicacion, bundler ni framework. Las paginas HTML cargan CSS y scripts globales en un orden fijo.

## Capas principales

`index.html` es la portada. Las cuatro paginas dentro de `pages/` son los juegos.

`assets/js/tcdle.js` crea el namespace global `window.TCdle`. Ese archivo concentra la infraestructura comun:

- Normalizacion de texto para busquedas sin acentos.
- Fecha local en formato `YYYY-MM-DD`.
- Cuenta regresiva hasta medianoche.
- Buscador accesible con teclado, ARIA, sugerencias y exclusiones.
- Controlador de partida diaria con intentos configurables (ocho por defecto), repetidos, victoria, derrota y bloqueo final. Por defecto valida los intentos contra un catalogo cerrado (`idsValidos`), pero acepta una funcion `validarId(id)` alternativa para modos sin catalogo cerrado de intentos (asi lo usa Wordle).
- Migracion de estructuras viejas de `localStorage`.
- Render de indicadores y modales accesibles.

`assets/js/seleccion-diaria.js` agrega `TCdle.seleccionDiaria.obtener`. Esa utilidad selecciona el elemento diario de cada catalogo.

Los archivos de modo solo deberian encargarse de:

- Elegir el objetivo del dia.
- Configurar buscador y partida diaria.
- Renderizar pistas o resultado propio del modo.
- Conectar botones, mensajes, historial y modales.

## Orden de carga esperado

Cada pagina de juego debe cargar:

1. Catalogos necesarios.
2. `assets/js/tcdle.js`.
3. `assets/js/seleccion-diaria.js`.
4. Script especifico del modo.

Ejemplo para Autos:

```html
<script src="../assets/js/pilotos.js"></script>
<script src="../assets/js/autos.js"></script>
<script src="../assets/js/tcdle.js"></script>
<script src="../assets/js/seleccion-diaria.js"></script>
<script src="../assets/js/adivinar-el-auto.js"></script>
```

Ejemplo para Wordle:

```html
<script src="../assets/js/palabras-tc.js"></script>
<script src="../assets/js/tcdle.js"></script>
<script src="../assets/js/seleccion-diaria.js"></script>
<script src="../assets/js/tcdle-wordle.js"></script>
```

## Persistencia

Cada modo guarda una partida por dia en `localStorage`:

- Pilotos: `partidaTCdle`.
- Autos: `partidaTCdleAuto`.
- Circuitos: `partidaTCdleCircuito`.
- Wordle: `partidaTCdleWordle`.

La estructura actual es versionada:

```json
{
  "version": 2,
  "fecha": "2026-08-09",
  "objetivoId": 1,
  "idsIntentados": [2, 3],
  "terminada": false
}
```

Si el JSON esta corrupto, pertenece a otra fecha o apunta a una respuesta diaria distinta, el nucleo lo descarta y arranca una partida limpia.

## CSS

`assets/css/juego-compartido.css` contiene la base visual comun: header, presentacion, panel de intento, buscador, mensajes, historial, indicadores, modales y layout responsive.

Los CSS por modo se limitan a diferencias reales:

- `estilos.css`: tabla comparativa de Pilotos, guia de pistas y resultado integrado.
- `adivinar-el-auto.css`: tarjeta 16:9 del auto, desenfoque progresivo e historial con fotos.
- `adivinar-el-circuito.css`: silueta, modal de circuito e historial de trazados.
- `tcdle-wordle.css`: tablero de letras, teclado virtual y sus animaciones.

La portada usa `assets/css/inicio.css`.
