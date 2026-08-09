# Modos de juego

Los tres modos comparten ocho intentos, fecha local, bloqueo al terminar, restauracion de partida y cuenta regresiva al proximo dia.

## Adivina el piloto

Archivos principales:

- `pages/adivinar-el-piloto.html`
- `assets/js/juego.js`
- `assets/css/estilos.css`
- `assets/js/pilotos.js`

Objetivo: adivinar el piloto del dia. El jugador busca un piloto y recibe una tabla de pistas.

Pistas actuales:

- Nombre/foto.
- Marca.
- Equipo.
- Localidad, con estado "cerca" cuando coincide la provincia.
- Edad, con flecha si el valor buscado es mayor o menor.
- Campeon de TC.
- Anio de debut en TC, con flecha si el valor buscado es mayor o menor.

Pilotos mantiene un resultado integrado en la pagina, no modal.

## Adivina el auto

Archivos principales:

- `pages/adivinar-el-auto.html`
- `assets/js/adivinar-el-auto.js`
- `assets/css/adivinar-el-auto.css`
- `assets/js/autos.js`
- `assets/js/pilotos.js`

Objetivo: reconocer que piloto maneja el auto del dia.

El auto empieza muy difuminado. El desenfoque baja despues de cada intento usando `NIVELES_DESENFOQUE`. El filtro inicial esta en CSS para que la imagen no aparezca nitida durante la carga.

Al terminar, el resultado visible queda en el pie de la tarjeta: correcto/incorrecto, piloto y cuenta regresiva. Tambien se abre un modal con la foto del piloto.

## Adivina el circuito

Archivos principales:

- `pages/adivinar-el-circuito.html`
- `assets/js/adivinar-el-circuito.js`
- `assets/css/adivinar-el-circuito.css`
- `assets/js/circuitos.js`

Objetivo: reconocer el trazado por su silueta.

El buscador acepta nombre, variante, ciudad, provincia y aliases. Cuando una sede tiene variantes, el jugador debe elegir una variante concreta para evitar respuestas ambiguas.

Circuitos usa modal de resultado. Las siluetas se mantienen en `assets/images/circuitos/`.

## Buscadores

Todos los buscadores usan `TCdle.crearBuscador`. Esta utilidad se configura con:

- Catalogo.
- Funcion para obtener ID.
- Etiqueta visible.
- Texto de busqueda.
- Renderizado de sugerencia.
- Exclusion de elementos ya intentados.
- Callback para enviar con Enter.

Pilotos y Autos usan `TCdle.renderizarOpcionPiloto`, que muestra miniatura y nombre. Circuitos tiene un render propio con silueta, nombre, variante y ciudad.
