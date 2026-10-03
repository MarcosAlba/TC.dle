// Herramienta interna: no es parte del juego, sirve para revisar las fotos
// de assets/images/autos/ antes de cargarlas. Usa el mismo buscador
// compartido (TCdle.crearBuscador) que el resto de los modos.
const RUTA_AUTOS_VISTA_PREVIA = new URL("../images/autos/", document.currentScript.src).href;
const campoBuscarAuto = document.getElementById("buscar-auto");
const marcoVistaPrevia = document.getElementById("marco-vista-previa");
const fotoVistaPrevia = document.getElementById("foto-vista-previa");
const vacioVistaPrevia = document.getElementById("vacio-vista-previa");
const estadoVistaPrevia = document.getElementById("estado-vista-previa");
const botonAplicarBlur = document.getElementById("aplicar-blur-vista-previa");
const botonQuitarBlur = document.getElementById("quitar-blur-vista-previa");

// Una entrada por auto cargado, no por piloto: si un piloto tiene varios
// anios (varias fotos), aparece varias veces en el buscador, una por cada
// una, para poder elegir la foto exacta que se quiere revisar.
const autosVistaPrevia = window.autosTC.map(function (auto, indice) {
    const piloto = pilotos.find(function (candidato) {
        return candidato.id === auto.pilotoId;
    });

    return piloto ? {
        id: indice,
        piloto: piloto,
        anio: auto.anio || null,
        imagen: RUTA_AUTOS_VISTA_PREVIA + auto.archivo
    } : null;
}).filter(Boolean);

function etiquetaAuto(auto) {
    return auto.piloto.nombre + (auto.anio ? " (" + auto.anio + ")" : "");
}

function renderizarOpcionVistaPrevia(opcion, auto) {
    const contenido = document.createElement("span");
    const nombre = document.createElement("strong");
    const anio = document.createElement("span");

    contenido.className = "buscador__contenido";
    nombre.textContent = auto.piloto.nombre;
    anio.textContent = auto.anio ? "Año " + auto.anio : "Sin año cargado";
    contenido.appendChild(nombre);
    contenido.appendChild(anio);
    opcion.appendChild(contenido);
}

const buscadorVistaPrevia = TCdle.crearBuscador({
    campo: campoBuscarAuto,
    lista: document.getElementById("sugerencias-vista-previa"),
    elementos: autosVistaPrevia,
    minimoCaracteres: 1,
    obtenerId: function (auto) { return auto.id; },
    obtenerEtiqueta: etiquetaAuto,
    obtenerTextoBusqueda: function (auto) { return auto.piloto.nombre; },
    obtenerTextoCorto: function (auto) { return TCdle.obtenerApellidoPiloto(auto.piloto); },
    renderizarOpcion: renderizarOpcionVistaPrevia,
    alSeleccionar: mostrarAuto
});

// Igual que adivinar-el-auto.js: se pisan las variables con setProperty en
// vez de alternar clases, para que la transicion de filter reaccione bien
// en todos los navegadores.
function aplicarBlurOriginal() {
    marcoVistaPrevia.style.setProperty("--desenfoque-auto", "24px");
    marcoVistaPrevia.style.setProperty("--brillo-auto", "0.72");
    marcoVistaPrevia.style.setProperty("--escala-auto", "1.08");
}

function quitarBlur() {
    marcoVistaPrevia.style.setProperty("--desenfoque-auto", "0px");
    marcoVistaPrevia.style.setProperty("--brillo-auto", "1");
    marcoVistaPrevia.style.setProperty("--escala-auto", "1");
}

function mostrarAuto(auto) {
    fotoVistaPrevia.src = auto.imagen;
    fotoVistaPrevia.alt = "Auto de " + auto.piloto.nombre;
    fotoVistaPrevia.hidden = false;
    quitarBlur();
    vacioVistaPrevia.hidden = true;
    estadoVistaPrevia.textContent = auto.piloto.nombre + " · " + auto.piloto.marca +
        " · " + (auto.anio ? "Año " + auto.anio : "Sin año cargado");
    botonAplicarBlur.disabled = false;
    botonQuitarBlur.disabled = false;
}

botonAplicarBlur.addEventListener("click", aplicarBlurOriginal);
botonQuitarBlur.addEventListener("click", quitarBlur);

quitarBlur();
