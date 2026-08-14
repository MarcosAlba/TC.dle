# Guia para futuros agentes

Este proyecto ya paso por una unificacion grande. Antes de cambiar codigo, revisar estos puntos.

## Reglas de oro

- No duplicar buscadores. Usar `TCdle.crearBuscador`.
- No duplicar logica diaria. Usar `TCdle.crearJuegoDiario`.
- No implementar otra cuenta regresiva. Usar `TCdle.crearCuentaRegresiva`.
- No cambiar la seleccion diaria si el pedido es solo visual.
- No editar catalogos sin correr los tests.
- No borrar cambios existentes sin entender de quien son.

## Donde tocar segun el cambio

Cambio visual comun:

- `assets/css/juego-compartido.css`

Cambio visual solo Pilotos:

- `assets/css/estilos.css`

Cambio visual solo Autos:

- `assets/css/adivinar-el-auto.css`

Cambio visual solo Circuitos:

- `assets/css/adivinar-el-circuito.css`

Cambio visual solo Wordle:

- `assets/css/tcdle-wordle.css`

Comportamiento comun:

- `assets/js/tcdle.js`
- Tests en `tests/tcdle.test.mjs` y `tests/estructura-compartida.test.mjs`

Rotacion diaria:

- `assets/js/seleccion-diaria.js`
- Tests en `tests/seleccion-diaria.test.mjs`

Catalogos:

- Pilotos: `assets/js/pilotos.js`
- Autos: `assets/js/autos.js`
- Circuitos: `assets/js/circuitos.js`
- Wordle: `assets/js/palabras-tc.js`

## Verificacion recomendada

Minimo antes de entregar:

```powershell
Get-ChildItem tests\*.test.mjs | ForEach-Object { node $_.FullName }
git diff --check
```

Si tocaste JS:

```powershell
node --check assets/js/tcdle.js
node --check assets/js/seleccion-diaria.js
node --check assets/js/juego.js
node --check assets/js/adivinar-el-auto.js
node --check assets/js/adivinar-el-circuito.js
node --check assets/js/palabras-tc.js
node --check assets/js/tcdle-wordle.js
```

Si tocaste UI, revisar manualmente desktop y mobile. Los puntos mas sensibles son:

- Fotos de pilotos con fondo negro.
- Flechas numericas en Pilotos, que deben aparecer con su celda.
- Desenfoque inicial del auto, que no debe mostrar la imagen nitida al recargar.
- Modal de Autos y Circuitos.
- Buscadores con teclado: Enter, flechas y Escape.

## Git

La rama de trabajo historica de la refactorizacion fue `codex/refactor-random-juegos`. El objetivo final es que `main` tenga todo mergeado y publicado.

Antes de mergear:

```powershell
git status --short --branch
Get-ChildItem tests\*.test.mjs | ForEach-Object { node $_.FullName }
```

Despues de mergear a `main`, verificar que no queden commits locales sin subir:

```powershell
git status --short --branch
git log --oneline -5
```
