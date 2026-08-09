# TCdle

TCdle es un juego diario web inspirado en el TC. Tiene tres modos independientes:

- Adivina el piloto.
- Adivina el piloto por el auto.
- Adivina el circuito por su silueta.

Es un proyecto estatico: no usa backend, build step ni base de datos. Cada juego corre en el navegador, guarda el progreso en `localStorage` y cambia el desafio a la medianoche local.

## Estado actual

- Portada: `index.html`.
- Paginas de juego: `pages/adivinar-el-piloto.html`, `pages/adivinar-el-auto.html`, `pages/adivinar-el-circuito.html`.
- Nucleo compartido: `assets/js/tcdle.js`.
- Seleccion diaria: `assets/js/seleccion-diaria.js`.
- Catalogos: `assets/js/pilotos.js`, `assets/js/autos.js`, `assets/js/circuitos.js`.
- Estilos compartidos: `assets/css/juego-compartido.css`.
- Estilos por modo: `assets/css/estilos.css`, `assets/css/adivinar-el-auto.css`, `assets/css/adivinar-el-circuito.css`.

## Como abrirlo

Al ser estatico, se puede abrir `index.html` directamente en el navegador. Para probarlo con un servidor local simple:

```powershell
node -e "require('http').createServer((req,res)=>{const fs=require('fs'),path=require('path');let p=path.join(process.cwd(),req.url==='/'?'index.html':decodeURIComponent(req.url.split('?')[0]));fs.readFile(p,(e,d)=>{if(e){res.writeHead(404);res.end('Not found');return}res.end(d)})}).listen(8080)"
```

Luego entrar a `http://127.0.0.1:8080/`.

## Pruebas

No hay `package.json` con scripts. Las pruebas son archivos `.mjs` autocontenidos:

```powershell
Get-ChildItem tests\*.test.mjs | ForEach-Object { node $_.FullName }
```

Tambien conviene correr:

```powershell
node --check assets/js/tcdle.js
node --check assets/js/seleccion-diaria.js
node --check assets/js/juego.js
node --check assets/js/adivinar-el-auto.js
node --check assets/js/adivinar-el-circuito.js
git diff --check
```

## Documentacion

- [Arquitectura](docs/ARQUITECTURA.md)
- [Modos de juego](docs/MODOS_DE_JUEGO.md)
- [Datos, assets y seleccion diaria](docs/DATOS_Y_ASSETS.md)
- [Guia para futuros agentes](docs/GUIA_PARA_AGENTES.md)

## Reiniciar partidas desde consola

Todos los modos:

```js
localStorage.clear();
location.reload();
```

Un modo puntual:

```js
localStorage.removeItem("partidaTCdle"); // Piloto
localStorage.removeItem("partidaTCdleAuto"); // Auto
localStorage.removeItem("partidaTCdleCircuito"); // Circuito
location.reload();
```

## Nota de mantenimiento

La regla mas importante del proyecto es mantener separados los datos, el flujo diario compartido y el render especifico de cada modo. Si se agrega otro juego, deberia reutilizar `TCdle.crearBuscador`, `TCdle.crearJuegoDiario`, `TCdle.crearCuentaRegresiva` y `TCdle.seleccionDiaria.obtener`.
