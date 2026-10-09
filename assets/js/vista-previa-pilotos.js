// Herramienta interna: no es parte del juego. Sirve para revisar como queda
// la foto de cada piloto en los tres lugares donde aparece en "Adivina el
// piloto": el buscador, la tabla de intentos y el resultado final. Reusa las
// mismas clases de estilos.css y el mismo buscador compartido del juego.
const RUTA_LOGOS_VISTA_PREVIA = new URL("../images/marcas/", document.currentScript.src).href;
const campoBuscarPiloto = document.getElementById("buscar-piloto");
const casillaSoloLeyendas = document.getElementById("solo-leyendas");
const botonAnterior = document.getElementById("anterior-vista-previa");
const botonSiguiente = document.getElementById("siguiente-vista-previa");
const estadoVistaPrevia = document.getElementById("estado-vista-previa");
const muestraBuscador = document.getElementById("muestra-buscador");
const filaAcierto = document.getElementById("fila-acierto");
const filaError = document.getElementById("fila-error");
const muestraResultados = document.getElementById("muestra-resultados");

// Copia de LOGOS_MARCAS de juego.js: ese archivo arranca la partida al
// cargarse, asi que no se puede incluir en esta pagina.
const LOGOS_VISTA_PREVIA = {
    "Chevrolet (NG)": "chevrolet-logo.jpg",
    "Ford (NG)": "ford-logo.jpg",
    "Torino (NG)": "torino-logo.jpg",
    "Dodge (NG)": "dodge-logo.jpg",
    "Toyota (NG)": "toyota-logo.jpg",
    "BMW (NG)": "bmw-logo.jpg",
    "Mercedez Benz (NG)": "mercedes-logo.jpg",
    "Chevrolet": "chevrolet-clasico.png",
    "Ford": "ford-clasico.png",
    "Torino": "torino-clasico.png",
    "Dodge": "dodge-clasico.png"
};

let pilotoActual = null;

function obtenerListaActual() {
    return casillaSoloLeyendas.checked
        ? pilotos.filter(function (piloto) { return piloto.retirado; })
        : pilotos;
}

const buscadorVistaPrevia = TCdle.crearBuscador({
    campo: campoBuscarPiloto,
    lista: document.getElementById("sugerencias-vista-previa"),
    elementos: pilotos,
    minimoCaracteres: 1,
    obtenerId: function (piloto) { return piloto.id; },
    obtenerEtiqueta: function (piloto) { return piloto.nombre; },
    obtenerTextoBusqueda: function (piloto) {
        return piloto.apodo ? piloto.nombre + " " + piloto.apodo : piloto.nombre;
    },
    obtenerTextoCorto: TCdle.obtenerApellidoPiloto,
    renderizarOpcion: TCdle.renderizarOpcionPiloto,
    alSeleccionar: mostrarPiloto
});

function obtenerFoto(piloto) {
    return piloto.imagenResultado || piloto.imagen || "";
}

function calcularEdadVistaPrevia(piloto) {
    const partes = piloto.fechaNacimiento.split("-").map(Number);
    const referencia = piloto.fechaFallecimiento
        ? new Date(piloto.fechaFallecimiento + "T00:00:00")
        : new Date();
    let edad = referencia.getFullYear() - partes[0];

    if (referencia < new Date(referencia.getFullYear(), partes[1] - 1, partes[2])) {
        edad--;
    }

    return edad;
}

function crearCelda(contenido, coincide) {
    const celda = document.createElement("td");

    celda.textContent = contenido;
    celda.classList.add(coincide ? "coincide" : "no-coincide");

    return celda;
}

function crearFila(piloto, coincide) {
    const fila = document.createElement("tr");
    const celdaFoto = crearCelda("", coincide);
    const foto = document.createElement("img");
    const celdaMarca = crearCelda("", coincide);
    const logo = document.createElement("img");
    const edad = calcularEdadVistaPrevia(piloto);

    foto.src = obtenerFoto(piloto);
    foto.alt = "Foto de " + piloto.nombre;
    foto.title = piloto.nombre;
    foto.className = "foto-piloto";
    celdaFoto.classList.add("celda-piloto");
    celdaFoto.appendChild(foto);

    logo.src = RUTA_LOGOS_VISTA_PREVIA + LOGOS_VISTA_PREVIA[piloto.marca];
    logo.alt = "Logo de " + piloto.marca;
    logo.title = piloto.marca;
    logo.className = "logo-marca";
    celdaMarca.classList.add("celda-marca");
    celdaMarca.appendChild(logo);

    fila.appendChild(celdaFoto);
    fila.appendChild(celdaMarca);
    fila.appendChild(crearCelda(piloto.equipo, coincide));
    fila.appendChild(crearCelda(piloto.localidad, coincide));
    fila.appendChild(crearCelda(piloto.campeonTC ? "Sí" : "No", coincide));
    fila.appendChild(crearCelda(piloto.fechaFallecimiento ? edad + " †" : edad, coincide));
    fila.appendChild(crearCelda(piloto.anioDebutTC, coincide));

    return fila;
}

// Mismo marcado y textos que #resultado-final en adivinar-el-piloto.html,
// con clases en vez de ids para poder mostrar las dos variantes juntas.
function crearResultado(piloto, esCorrecto) {
    const tarjeta = document.createElement("section");
    const media = document.createElement("div");
    const foto = document.createElement("img");
    const contenido = document.createElement("div");
    const etiqueta = document.createElement("p");
    const subtitulo = document.createElement("p");
    const nombre = document.createElement("h2");
    const detalle = document.createElement("p");

    tarjeta.className = "resultado-final";
    tarjeta.classList.add(esCorrecto ? "resultado-final--correcto" : "resultado-final--incorrecto");
    tarjeta.classList.toggle("resultado-final--nombre-largo", piloto.nombre.length > 17);
    tarjeta.classList.toggle("resultado-final--nombre-muy-largo", piloto.nombre.length > 22);
    media.className = "resultado-final__media";
    foto.className = "resultado-final__foto";
    foto.src = obtenerFoto(piloto);
    foto.alt = "Foto de " + piloto.nombre;
    contenido.className = "resultado-final__contenido";
    etiqueta.className = "resultado-final__etiqueta";
    etiqueta.textContent = esCorrecto ? "Bandera a cuadros" : "Se terminaron los intentos";
    subtitulo.className = "resultado-final__subtitulo";
    subtitulo.textContent = esCorrecto ? "Piloto del día" : "El piloto del día era";
    nombre.textContent = piloto.nombre;
    detalle.className = "resultado-final__detalle";
    detalle.textContent = esCorrecto
        ? "Lo resolviste en 3 intentos."
        : "No lograste encontrarlo en los 8 intentos disponibles.";

    media.appendChild(foto);
    contenido.appendChild(etiqueta);
    contenido.appendChild(subtitulo);
    contenido.appendChild(nombre);
    contenido.appendChild(detalle);
    tarjeta.appendChild(media);
    tarjeta.appendChild(contenido);

    return tarjeta;
}

function mostrarPiloto(piloto) {
    const opcion = document.createElement("div");
    const lista = obtenerListaActual();
    const posicion = lista.indexOf(piloto);
    const foto = obtenerFoto(piloto);
    const archivo = foto ? decodeURIComponent(foto.split("/").pop()) : "sin foto";

    pilotoActual = piloto;
    campoBuscarPiloto.value = piloto.nombre;

    opcion.className = "buscador__opcion buscador__opcion--activa";
    TCdle.renderizarOpcionPiloto(opcion, piloto);
    muestraBuscador.replaceChildren(opcion);

    filaAcierto.replaceChildren(crearFila(piloto, true));
    filaError.replaceChildren(crearFila(piloto, false));
    muestraResultados.replaceChildren(crearResultado(piloto, true), crearResultado(piloto, false));

    estadoVistaPrevia.textContent = (posicion >= 0 ? (posicion + 1) + " de " + lista.length + " · " : "") +
        piloto.nombre + " · " + archivo;

    const imagenPrueba = new Image();
    imagenPrueba.addEventListener("error", function () {
        if (pilotoActual === piloto) {
            estadoVistaPrevia.textContent += " · NO SE ENCONTRÓ LA FOTO";
        }
    });
    imagenPrueba.src = foto;
}

function moverA(direccion) {
    const lista = obtenerListaActual();
    const posicion = lista.indexOf(pilotoActual);
    const siguiente = posicion === -1
        ? (direccion > 0 ? 0 : lista.length - 1)
        : (posicion + direccion + lista.length) % lista.length;

    mostrarPiloto(lista[siguiente]);
}

botonAnterior.addEventListener("click", function () { moverA(-1); });
botonSiguiente.addEventListener("click", function () { moverA(1); });
casillaSoloLeyendas.addEventListener("change", function () {
    mostrarPiloto(obtenerListaActual()[0]);
});

mostrarPiloto(obtenerListaActual()[0]);
