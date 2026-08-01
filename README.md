# TCdle

Juego diario inspirado en Turismo Carretera.

## Estructura del proyecto

```text
TCdle/
├── index.html                         # Juego principal
├── pages/                             # Páginas secundarias
│   └── adivinar-el-auto.html
└── assets/                            # Recursos usados por las páginas
    ├── css/                           # Estilos
    ├── js/                            # Lógica y datos
    └── images/                        # Imágenes
        ├── autos/
        └── pilotos/
```

## Convenciones

- Las páginas secundarias van en `pages/`.
- Los nombres de archivos nuevos usan minúsculas y guiones: `nuevo-juego.html`.
- Los estilos van en `assets/css/` y los scripts en `assets/js/`.
- Las fotos de pilotos van en `assets/images/pilotos/`.
- Las fotos de autos van en `assets/images/autos/`.
- `index.html` queda en la raíz porque es la entrada principal del sitio.

## Autos disponibles

El modo auto usa archivos WebP cuyo nombre coincide con el nombre normalizado
del piloto. Cada imagen se relaciona con su `pilotoId` en
`assets/js/adivinar-el-auto.js`.

Los pilotos sin foto de auto quedan fuera de la rotación diaria, pero siguen
disponibles como respuestas en el buscador.

## Modos diarios

- Los botones `Modo clásico` y `Modo auto` permiten navegar entre juegos.
- Cada modo conserva su propia partida durante el día y presenta un nuevo
  desafío a la medianoche local.
- Al completar una partida se muestra una cuenta regresiva hasta el próximo
  piloto o auto.
- Los parámetros de la URL no modifican el auto seleccionado para el día.

## Reiniciar partidas desde la consola

```js
localStorage.clear();
location.reload();
```

Solo para Adivinar Auto:

```js
localStorage.removeItem("partidaTCdleAuto");
location.reload();
```

Solo para Adivinar el Piloto:

```js
localStorage.removeItem("partidaTCdle");
location.reload();
```
