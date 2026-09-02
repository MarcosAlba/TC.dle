# Modos de juego

Los cuatro modos comparten fecha local, bloqueo al terminar, restauracion de partida y cuenta regresiva al proximo dia. Pilotos, Autos y Circuitos usan ocho intentos fijos; Wordle usa intentos variables segun el largo de la palabra (ver mas abajo).

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

## Wordle del TC

Archivos principales:

- `pages/tcdle-wordle.html`
- `assets/js/tcdle-wordle.js`
- `assets/css/tcdle-wordle.css`
- `assets/js/palabras-tc.js`

Objetivo: adivinar la palabra del dia letra por letra, como el Wordle clasico, con palabras relacionadas al Turismo Carretera (pilotos, marcas, circuitos, vocabulario de carreras).

Reglas propias de este modo:

- El largo de la palabra del dia (4 a 8 letras) sale de `TCdle.seleccionDiaria.obtener` sobre `palabrasTC` filtrado por longitud.
- La cantidad de intentos es `largo_de_la_palabra + 1` (por ejemplo, 6 intentos para una palabra de 5 letras).
- `assets/js/palabras-tc.js` solo define que palabras pueden salir como RESPUESTA del dia. Para intentar no hace falta que este en el catalogo: se puede escribir cualquier combinacion de letras (A-Z/Ñ) del mismo largo que la palabra del dia, igual que el Wordle clasico sin diccionario propio. Esto se logra pasando una funcion `validarId` a `TCdle.crearJuegoDiario` en vez del `idsValidos` que usan los otros tres modos.
- Cada letra tipeada se evalua con `TCdleWordle.evaluarIntento` (funcion pura, sin DOM, definida en `tcdle-wordle.js`) que marca cada posicion como correcta, presente o ausente, manejando letras repetidas.
- Acepta teclado fisico (letras, Ñ, Enter, Backspace) y el teclado virtual en pantalla, que ademas se pinta con el mejor estado conocido de cada letra.
- Usa `TCdle.crearModalResultado` y `TCdle.crearCuentaRegresiva` igual que Autos y Circuitos.

Para sumar palabras nuevas, editar el comentario y el array en `assets/js/palabras-tc.js`.

## Buscadores

Todos los buscadores usan `TCdle.crearBuscador`. Esta utilidad se configura con:

- Catalogo.
- Funcion para obtener ID.
- Etiqueta visible.
- Texto de busqueda.
- Renderizado de sugerencia.
- Exclusion de elementos ya intentados.
- Callback para enviar con Enter.
- Minimo de caracteres (`minimoCaracteres`, 2 por defecto).
- Texto corto opcional (`obtenerTextoCorto`), usado cuando la consulta tiene una sola letra.

La coincidencia es por prefijo de palabra: `al` encuentra `Alvarez` pero no `Gonzalez`. Pilotos y Autos pasan `minimoCaracteres: 1` y `obtenerTextoCorto: TCdle.obtenerApellidoPiloto`, asi que con una sola letra solo aparecen los apellidos que empiezan con esa letra, y los que coinciden por apellido se ordenan primero.

Enter y el boton Intentar mandan el intento en un solo toque: `resolver` usa la opcion resaltada o la coincidencia exacta y, si no hay ninguna, la primera sugerencia a la vista. Si el texto coincide exacto con mas de un elemento (un autodromo con varios trazados) sigue avisando que hay que elegir una variante.

Pilotos y Autos usan `TCdle.renderizarOpcionPiloto`, que muestra miniatura y nombre. Circuitos tiene un render propio con nombre, variante y ciudad, sin silueta: la miniatura regalaba la respuesta del dia.
