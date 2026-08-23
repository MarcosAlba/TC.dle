const fotoCircuito = document.getElementById("foto-circuito");
const campoCircuito = document.getElementById("nombre-circuito");
const botonIntentarCircuito = document.getElementById("boton-intentar-circuito");
const mensajeCircuito = document.getElementById("mensaje-circuito");
const intentosRestantesCircuito = document.getElementById("intentos-restantes-circuito");
const numeroIntentoCircuito = document.getElementById("numero-intento-circuito");
const nivelesIntentosCircuito = document.getElementById("niveles-intentos-circuito");
const sugerenciasCircuitos = document.getElementById("sugerencias-circuitos");
const historialCircuito = document.getElementById("historial-circuito");
const listaIntentosCircuito = document.getElementById("lista-intentos-circuito");
const estadoFinalCircuito = document.getElementById("estado-final-circuito");
const estadoFinalEtiquetaCircuito = document.getElementById("estado-final-etiqueta-circuito");
const estadoFinalNombreCircuito = document.getElementById("estado-final-nombre-circuito");
const regresoCircuito = document.getElementById("regreso-circuito");
const tiempoNuevoCircuito = document.getElementById("tiempo-nuevo-circuito");
const resultadoCircuitoModal = document.getElementById("resultado-circuito-modal");
const cerrarResultadoCircuitoModal = document.getElementById("cerrar-resultado-circuito-modal");
const tituloResultadoCircuitoModal = document.getElementById("titulo-resultado-circuito-modal");
const fotoResultadoCircuitoModal = document.getElementById("foto-resultado-circuito-modal");
const nombreResultadoCircuitoModal = document.getElementById("nombre-resultado-circuito-modal");
const detalleResultadoCircuitoModal = document.getElementById("detalle-resultado-circuito-modal");
const tiempoNuevoCircuitoModal = document.getElementById("tiempo-nuevo-circuito-modal");
const introCircuito = document.getElementById("intro-circuito");
const contenidoCircuito = document.getElementById("contenido-circuito");
const botonEmpezarCircuito = document.getElementById("boton-empezar-circuito");

const MAXIMO_INTENTOS_CIRCUITO = 8;
const CLAVE_PARTIDA_CIRCUITO = "partidaTCdleCircuito";
const RUTA_CIRCUITOS = new URL("../images/circuitos/", document.currentScript.src).href;
const circuitos = Array.isArray(window.circuitosTC) ? window.circuitosTC : [];
const fechaPartidaCircuitoActual = TCdle.obtenerFechaLocal();

const circuitoDelDia = obtenerCircuitoDelDia();
const juegoCircuito = TCdle.crearJuegoDiario({
    clave: CLAVE_PARTIDA_CIRCUITO,
    fecha: fechaPartidaCircuitoActual,
    objetivoId: circuitoDelDia ? circuitoDelDia.id : null,
    idsValidos: circuitos.map(function (circuito) { return circuito.id; }),
    maximoIntentos: MAXIMO_INTENTOS_CIRCUITO,
    migrar: function (datos) {
        return TCdle.migrarPartida(datos, {
            campoObjetivo: "circuitoId",
            objetivoActual: circuitoDelDia ? circuitoDelDia.id : null,
            maximoIntentos: MAXIMO_INTENTOS_CIRCUITO
        });
    }
});
let estadoCircuito = juegoCircuito.cargar();
let idsIntentadosCircuito = estadoCircuito.idsIntentados.slice();
let partidaTerminadaCircuito = estadoCircuito.terminada;
const cuentaRegresivaCircuito = TCdle.crearCuentaRegresiva({
    elementos: [tiempoNuevoCircuito, tiempoNuevoCircuitoModal],
    fecha: fechaPartidaCircuitoActual
});
const modalResultadoCircuito = TCdle.crearModalResultado({
    dialogo: resultadoCircuitoModal,
    botonCerrar: cerrarResultadoCircuitoModal,
    focoRetorno: estadoFinalCircuito
});

function sincronizarEstadoCircuito(nuevoEstado) {
    estadoCircuito = nuevoEstado;
    idsIntentadosCircuito = estadoCircuito.idsIntentados.slice();
    partidaTerminadaCircuito = estadoCircuito.terminada;
}

function normalizarTextoCircuito(texto) {
    return TCdle.normalizarTexto(texto);
}

function obtenerEtiquetaCircuito(circuito) {
    const etiquetaRepetida = circuitos.some(function (item) {
        return item.id !== circuito.id &&
            item.nombre === circuito.nombre &&
            item.variante === circuito.variante;
    });
    const ubicacion = etiquetaRepetida ? " (" + circuito.ciudad + ")" : "";
    const variante = circuito.variante === "Circuito principal"
        ? ""
        : " — " + circuito.variante;

    return circuito.nombre + variante + ubicacion;
}

function obtenerTextoBusquedaCircuito(circuito) {
    return [
        circuito.nombre,
        circuito.variante,
        circuito.ciudad,
        circuito.provincia
    ].concat(circuito.aliases || []).map(normalizarTextoCircuito).join(" ");
}

function renderizarOpcionCircuito(opcion, circuito) {
    const miniatura = document.createElement("span");
    const imagen = document.createElement("img");
    const contenido = document.createElement("span");
    const nombre = document.createElement("strong");
    const detalle = document.createElement("span");

    miniatura.className = "buscador__miniatura buscador__miniatura--circuito";
    imagen.src = RUTA_CIRCUITOS + circuito.imagen;
    imagen.alt = "";
    imagen.loading = "lazy";
    contenido.className = "buscador__contenido";
    nombre.textContent = circuito.nombre;
    detalle.textContent = circuito.variante === "Circuito principal"
        ? circuito.ciudad
        : circuito.variante + " · " + circuito.ciudad;
    miniatura.appendChild(imagen);
    contenido.appendChild(nombre);
    contenido.appendChild(detalle);
    opcion.appendChild(miniatura);
    opcion.appendChild(contenido);
}

const buscadorCircuitos = TCdle.crearBuscador({
    campo: campoCircuito,
    lista: sugerenciasCircuitos,
    elementos: circuitos,
    obtenerId: function (circuito) { return circuito.id; },
    obtenerEtiqueta: obtenerEtiquetaCircuito,
    obtenerTextoBusqueda: obtenerTextoBusquedaCircuito,
    obtenerValoresExactos: function (circuito) {
        return [obtenerEtiquetaCircuito(circuito), circuito.nombre]
            .concat(circuito.aliases || []);
    },
    renderizarOpcion: renderizarOpcionCircuito,
    estaExcluido: function (circuito) {
        return idsIntentadosCircuito.includes(circuito.id);
    },
    alEnviar: intentarCircuito,
    alCambiar: function () { mostrarMensajeCircuito("", ""); }
});

function obtenerCircuitoDelDia() {
    return TCdle.seleccionDiaria.obtener(circuitos, "circuitos");
}

function configurarImagenCircuito() {
    if (!circuitoDelDia) {
        fotoCircuito.alt = "No hay circuitos disponibles";
        mostrarMensajeCircuito("No se pudo cargar el catálogo de circuitos.", "error");
        campoCircuito.disabled = true;
        botonIntentarCircuito.disabled = true;
        return;
    }

    fotoCircuito.src = RUTA_CIRCUITOS + circuitoDelDia.imagen;
    fotoCircuito.alt = "Silueta del circuito del día";
}

function crearIndicadoresCircuito() {
    TCdle.renderizarIndicadores({
        contenedor: nivelesIntentosCircuito,
        maximo: MAXIMO_INTENTOS_CIRCUITO,
        usados: estadoCircuito.intentosUsados,
        acerto: estadoCircuito.acerto
    });
}

function actualizarInterfazCircuito() {
    TCdle.actualizarEstadoIntentos({
        partida: estadoCircuito,
        contador: intentosRestantesCircuito,
        regreso: regresoCircuito,
        numero: numeroIntentoCircuito,
        campo: campoCircuito,
        boton: botonIntentarCircuito,
        sinObjetivo: !circuitoDelDia
    });
    crearIndicadoresCircuito();
}

function mostrarMensajeCircuito(texto, tipo) {
    TCdle.mostrarMensaje(mensajeCircuito, texto, tipo);
}

function intentarCircuito() {
    if (partidaTerminadaCircuito || !circuitoDelDia) {
        return;
    }

    const entrada = campoCircuito.value.trim();

    if (!entrada) {
        mostrarMensajeCircuito("Ingresá o elegí un circuito.", "error");
        return;
    }

    const resultado = buscadorCircuitos.resolver();

    if (resultado.ambiguo) {
        mostrarMensajeCircuito("Ese autódromo tiene más de un trazado. Elegí una variante de la lista.", "error");
        buscadorCircuitos.buscar();
        return;
    }

    const circuitoElegido = resultado.elemento;

    if (!circuitoElegido) {
        mostrarMensajeCircuito("Ese circuito no está en la lista.", "error");
        return;
    }

    if (idsIntentadosCircuito.includes(circuitoElegido.id)) {
        mostrarMensajeCircuito("Ya intentaste con ese trazado.", "error");
        return;
    }

    const intento = juegoCircuito.intentar(circuitoElegido.id);
    sincronizarEstadoCircuito(intento.estado);
    buscadorCircuitos.limpiar();
    agregarIntentoCircuito(circuitoElegido);

    if (intento.resultado === "correcta") {
        finalizarPartidaCircuito(true, true);
        mostrarMensajeCircuito("¡Correcto! Reconociste el trazado.", "exito");
    } else if (intento.resultado === "agotada") {
        finalizarPartidaCircuito(false, true);
        mostrarMensajeCircuito("Se terminaron los intentos.", "error");
    } else {
        mostrarMensajeCircuito("No es ese circuito. La silueta permanece igual de nítida.", "");
    }

    actualizarInterfazCircuito();

    if (!partidaTerminadaCircuito) {
        campoCircuito.focus();
    }
}

function agregarIntentoCircuito(circuito) {
    historialCircuito.hidden = false;

    const intento = document.createElement("article");
    const nombre = document.createElement("strong");
    const acerto = circuito.id === circuitoDelDia.id;
    const tieneVariantes = circuitos.some(function (item) {
        return item.id !== circuito.id && item.sedeId === circuito.sedeId;
    });

    intento.className = "intento-circuito " + (acerto ? "intento-circuito--correcto" : "intento-circuito--incorrecto");
    intento.setAttribute("aria-label", obtenerEtiquetaCircuito(circuito) + ": " + (acerto ? "correcto" : "incorrecto"));
    nombre.textContent = circuito.nombre;
    intento.appendChild(nombre);

    if (tieneVariantes) {
        const variante = document.createElement("span");
        variante.textContent = circuito.variante;
        intento.appendChild(variante);
    }

    listaIntentosCircuito.prepend(intento);
}

function finalizarPartidaCircuito(acerto, abrirModal) {
    partidaTerminadaCircuito = true;
    fotoCircuito.alt = "Silueta de " + obtenerEtiquetaCircuito(circuitoDelDia);
    estadoFinalCircuito.classList.toggle("estado-final-circuito--correcto", acerto);
    estadoFinalEtiquetaCircuito.textContent = acerto ? "¡Correcto!" : "El circuito era";
    estadoFinalNombreCircuito.textContent = obtenerEtiquetaCircuito(circuitoDelDia);
    estadoFinalCircuito.hidden = false;
    iniciarCuentaRegresivaCircuito();

    if (abrirModal) {
        mostrarResultadoCircuitoModal(acerto);
    }
}

function mostrarResultadoCircuitoModal(acerto) {
    const cantidadIntentos = idsIntentadosCircuito.length;
    const palabraIntentos = cantidadIntentos === 1 ? "intento" : "intentos";

    resultadoCircuitoModal.classList.toggle("resultado-modal--correcto", acerto);
    tituloResultadoCircuitoModal.textContent = acerto ? "¡Adivinaste!" : "No lo adivinaste";
    fotoResultadoCircuitoModal.src = RUTA_CIRCUITOS + circuitoDelDia.imagen;
    fotoResultadoCircuitoModal.alt = "Silueta de " + obtenerEtiquetaCircuito(circuitoDelDia);
    nombreResultadoCircuitoModal.textContent = obtenerEtiquetaCircuito(circuitoDelDia);
    detalleResultadoCircuitoModal.textContent = acerto
        ? "Lo resolviste en " + cantidadIntentos + " " + palabraIntentos + "."
        : "No lo adivinaste en los " + MAXIMO_INTENTOS_CIRCUITO + " intentos.";

    modalResultadoCircuito.abrir();
}

function iniciarCuentaRegresivaCircuito() {
    cuentaRegresivaCircuito.iniciar();
}

function cargarPartidaCircuito() {
    if (!circuitoDelDia) {
        return;
    }

    idsIntentadosCircuito.forEach(function (idCircuito) {
        const circuito = circuitos.find(function (item) { return item.id === idCircuito; });
        if (circuito) {
            agregarIntentoCircuito(circuito);
        }
    });

    if (partidaTerminadaCircuito) {
        finalizarPartidaCircuito(estadoCircuito.acerto, false);
    }
}

botonIntentarCircuito.addEventListener("click", intentarCircuito);

configurarImagenCircuito();
cargarPartidaCircuito();
actualizarInterfazCircuito();

if (introCircuito && contenidoCircuito && botonEmpezarCircuito) {
    TCdle.crearIntroJuego({
        clave: "tcdleIntroCircuitoVista",
        intro: introCircuito,
        contenido: contenidoCircuito,
        boton: botonEmpezarCircuito
    });
}
