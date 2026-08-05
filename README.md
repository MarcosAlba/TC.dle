# TCdle

Juego diario inspirado en Turismo Carretera. Incluye tres desafíos independientes:

- Adiviná el piloto.
- Adiviná el piloto por su auto.
- Adiviná el circuito por su silueta.

Cada modo mantiene su propia partida en el navegador y cambia el desafío a la medianoche local.

## Estructura

```text
TCdle/
├── index.html                         # Portada y selector de juegos
├── pages/
│   ├── adivinar-el-piloto.html
│   ├── adivinar-el-auto.html
│   └── adivinar-el-circuito.html
├── scripts/
│   └── generar-siluetas.mjs
└── assets/
    ├── css/
    ├── js/
    └── images/
        ├── autos/
        ├── circuitos/
        └── pilotos/
```

## Catálogo de circuitos

`assets/js/circuitos.js` es la única fuente de verdad del modo Circuitos: alimenta la selección diaria, el buscador, las respuestas y el resultado final. En esta versión contiene **29 sedes de la era moderna (1997–2026)** y **31 configuraciones jugables**.

El recorte parte de las 29 sedes contabilizadas por SoloTC hasta 2020 y suma El Calafate, estrenado por el TC en 2023. La Pedrera integra esas 29 sedes; el registro “Santiago del Estero” de mayo de 2008 no se cuenta como otra sede porque corresponde a la inauguración de Termas de Río Hondo.

Una configuración se separa solo cuando cambia la silueta y hay evidencia de que fue utilizada por una categoría de la ACTC. El catálogo distingue:

- La Plata, circuito largo con y sin chicana.
- Buenos Aires, circuito N.º 12 sin chicana.
- Termas de Río Hondo, trazado largo y perimetral corto.

Cada entrada incluye identificador, sede, nombre oficial, variante, alias aceptados, ubicación, longitud, participación, fuente y SVG. Las siluetas se generan con orientación norte preservada a partir de datos de OpenStreetMap y se guardan como SVG transparentes, sin rótulos ni elementos que revelen la respuesta.

Fuentes generales: [SoloTC](https://www.solotc.com.ar/tc-corre-solo-autodromos/), [archivo y circuitos de ACTC](https://www.actc.org.ar/tc/), [debut de El Calafate](https://elcalafate.gov.ar/elementor-3243/) y [OpenStreetMap](https://www.openstreetmap.org/copyright).

## Regenerar las siluetas

Requiere Node.js y conexión a Internet:

```powershell
node scripts/generar-siluetas.mjs
```

El script consulta las geometrías `highway=raceway`, descarta boxes, kartódromos y pistas de aceleración, encuadra el recorrido en un `viewBox` común y sobrescribe los SVG locales.

## Reiniciar partidas desde la consola

Todos los modos:

```js
localStorage.clear();
location.reload();
```

Solo un modo:

```js
localStorage.removeItem("partidaTCdle"); // Piloto
localStorage.removeItem("partidaTCdleAuto"); // Auto
localStorage.removeItem("partidaTCdleCircuito"); // Circuito
location.reload();
```
