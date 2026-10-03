const fotoAuto = document.getElementById("foto-auto");
const marcoAuto = document.querySelector(".marco-auto");
const campoPilotoAuto = document.getElementById("nombre-piloto-auto");
const botonIntentarAuto = document.getElementById("boton-intentar-auto");
const mensajeAuto = document.getElementById("mensaje-auto");
const intentosRestantesAuto = document.getElementById("intentos-restantes-auto");
const numeroIntentoAuto = document.getElementById("numero-intento-auto");
const listaIntentosAuto = document.getElementById("lista-intentos-auto");
const historialAuto = document.getElementById("historial-auto");
const estadoFinal = document.getElementById("estado-final");
const estadoFinalEtiqueta = document.getElementById("estado-final-etiqueta");
const estadoFinalPiloto = document.getElementById("estado-final-piloto");
const nivelesDesenfoque = document.getElementById("niveles-desenfoque");
const regresoAuto = document.getElementById("regreso-auto");
const tiempoNuevoAuto = document.getElementById("tiempo-nuevo-auto");
const resultadoAutoModal = document.getElementById("resultado-auto-modal");
const cerrarResultadoAutoModal = document.getElementById("cerrar-resultado-auto-modal");
const tituloResultadoAutoModal = document.getElementById("titulo-resultado-auto-modal");
const fotoResultadoAutoModal = document.getElementById("foto-resultado-auto-modal");
const pilotoResultadoAutoModal = document.getElementById("piloto-resultado-auto-modal");
const detalleResultadoAutoModal = document.getElementById("detalle-resultado-auto-modal");
const tiempoNuevoAutoModal = document.getElementById("tiempo-nuevo-auto-modal");
const panelIntentoAuto = document.getElementById("panel-intento-auto");
const panelAnioAuto = document.getElementById("panel-anio-auto");
const opcionesAnioAuto = document.getElementById("opciones-anio-auto");
const mensajeAnioAuto = document.getElementById("mensaje-anio-auto");
const bonusAnioModal = document.getElementById("bonus-anio-modal");
const introAuto = document.getElementById("intro-auto");
const contenidoAuto = document.getElementById("contenido-auto");
const botonEmpezarAuto = document.getElementById("boton-empezar-auto");

const MAXIMO_INTENTOS_AUTO = 8;
const NIVELES_DESENFOQUE = [24, 20, 16, 12, 9, 6, 3, 1, 0];
const CLAVE_PARTIDA_AUTO = "partidaTCdleAuto";
const CLAVE_ANIO_AUTO = "partidaTCdleAutoAnio";
const PRIMER_ANIO_TC = 1937;
const CANTIDAD_OPCIONES_ANIO = 5;
const RUTA_AUTOS = new URL("../images/autos/", document.currentScript.src).href;
const fechaPartidaAutoActual = TCdle.obtenerFechaLocal();

const autosDelJuego = window.autosTC.map(function (auto) {
    return {
        pilotoId: auto.pilotoId,
        imagen: RUTA_AUTOS + auto.archivo,
        anio: auto.anio
    };
});

const autoDelDia = obtenerAutoDelDia();
const pilotoSecretoAuto = pilotos.find(function (piloto) {
    return piloto.id === autoDelDia.pilotoId;
});

const anioDelAuto = Number.isFinite(Number(autoDelDia.anio)) && autoDelDia.anio !== null
    ? Number(autoDelDia.anio)
    : null;
const datoAnioAuto = TCdle.crearDatoDiario({
    clave: CLAVE_ANIO_AUTO,
    fecha: fechaPartidaAutoActual
});
const anioGuardado = datoAnioAuto.leer();
let respuestaAnio = Number.isFinite(Number(anioGuardado)) && anioGuardado !== null
    ? Number(anioGuardado)
    : null;

const juegoAuto = TCdle.crearJuegoDiario({
    clave: CLAVE_PARTIDA_AUTO,
    fecha: fechaPartidaAutoActual,
    objetivoId: pilotoSecretoAuto.id,
    idsValidos: pilotos.map(function (piloto) { return piloto.id; }),
    maximoIntentos: MAXIMO_INTENTOS_AUTO,
    migrar: function (datos) {
        return TCdle.migrarPartida(datos, {
            campoObjetivo: "autoPilotoId",
            objetivoActual: pilotoSecretoAuto.id,
            maximoIntentos: MAXIMO_INTENTOS_AUTO
        });
    }
});
let estadoAuto = juegoAuto.cargar();
let idsIntentadosAuto = estadoAuto.idsIntentados.slice();
let partidaTerminadaAuto = estadoAuto.terminada;
const cuentaRegresivaAuto = TCdle.crearCuentaRegresiva({
    elementos: [tiempoNuevoAuto, tiempoNuevoAutoModal],
    fecha: fechaPartidaAutoActual
});
const modalResultadoAuto = TCdle.crearModalResultado({
    dialogo: resultadoAutoModal,
    botonCerrar: cerrarResultadoAutoModal,
    focoRetorno: estadoFinal
});
const buscadorPilotosAuto = TCdle.crearBuscador({
    campo: campoPilotoAuto,
    lista: document.getElementById("sugerencias-auto"),
    elementos: pilotos,
    obtenerId: function (piloto) { return piloto.id; },
    obtenerEtiqueta: function (piloto) { return piloto.nombre; },
    obtenerTextoBusqueda: function (piloto) { return piloto.nombre; },
    obtenerTextoCorto: TCdle.obtenerApellidoPiloto,
    minimoCaracteres: 1,
    renderizarOpcion: TCdle.renderizarOpcionPiloto,
    estaExcluido: function (piloto) {
        return idsIntentadosAuto.includes(piloto.id);
    },
    alEnviar: intentarPilotoAuto,
    alCambiar: function () { mostrarMensajeAuto("", ""); }
});

function sincronizarEstadoAuto(nuevoEstado) {
    estadoAuto = nuevoEstado;
    idsIntentadosAuto = estadoAuto.idsIntentados.slice();
    partidaTerminadaAuto = estadoAuto.terminada;
}

function obtenerAutoDelDia() {
    return TCdle.seleccionDiaria.obtener(autosDelJuego, "autos");
}

function configurarImagenAuto() {
    fotoAuto.addEventListener("load", finalizarCargaInicialAuto);
    actualizarDesenfoque();
    fotoAuto.src = autoDelDia.imagen;

    if (fotoAuto.complete) {
        finalizarCargaInicialAuto();
    }
}

function finalizarCargaInicialAuto() {
    ajustarEncuadreAuto();

    requestAnimationFrame(function () {
        fotoAuto.classList.add("foto-auto--preparada");
    });
}

function ajustarEncuadreAuto() {
    const proporcion = fotoAuto.naturalWidth / fotoAuto.naturalHeight;

    fotoAuto.classList.toggle("foto-auto--panoramica", proporcion > 2.15);
}

function actualizarDesenfoque() {
    const nivel = partidaTerminadaAuto
        ? 0
        : NIVELES_DESENFOQUE[Math.min(idsIntentadosAuto.length, NIVELES_DESENFOQUE.length - 1)];

    marcoAuto.style.setProperty("--desenfoque-auto", nivel + "px");
    marcoAuto.style.setProperty("--brillo-auto", nivel > 12 ? "0.72" : "1");
    marcoAuto.style.setProperty("--escala-auto", nivel > 0 ? "1.08" : "1");
}

function crearIndicadores() {
    TCdle.renderizarIndicadores({
        contenedor: nivelesDesenfoque,
        maximo: MAXIMO_INTENTOS_AUTO,
        usados: estadoAuto.intentosUsados,
        acerto: estadoAuto.acerto
    });
}

function actualizarInterfazAuto() {
    TCdle.actualizarEstadoIntentos({
        partida: estadoAuto,
        contador: intentosRestantesAuto,
        regreso: regresoAuto,
        numero: numeroIntentoAuto,
        campo: campoPilotoAuto,
        boton: botonIntentarAuto
    });
    actualizarDesenfoque();
    crearIndicadores();
}

function mostrarMensajeAuto(texto, tipo) {
    TCdle.mostrarMensaje(mensajeAuto, texto, tipo);
}

function intentarPilotoAuto() {
    if (partidaTerminadaAuto) {
        return;
    }

    const nombreIngresado = campoPilotoAuto.value.trim();
    const pilotoElegido = buscadorPilotosAuto.resolver().elemento;

    if (nombreIngresado === "") {
        mostrarMensajeAuto("Ingresá o elegí un piloto.", "error");
        return;
    }

    if (!pilotoElegido) {
        mostrarMensajeAuto("Ese piloto no está en la lista.", "error");
        return;
    }

    if (idsIntentadosAuto.includes(pilotoElegido.id)) {
        mostrarMensajeAuto("Ya intentaste con ese piloto.", "error");
        return;
    }

    const intento = juegoAuto.intentar(pilotoElegido.id);
    sincronizarEstadoAuto(intento.estado);
    buscadorPilotosAuto.limpiar();
    agregarIntentoAlHistorial(pilotoElegido);

    if (intento.resultado === "correcta") {
        finalizarPartidaAuto(true, true);
        mostrarMensajeAuto("¡Correcto! Reconociste el auto.", "exito");
    } else if (intento.resultado === "agotada") {
        finalizarPartidaAuto(false, true);
        mostrarMensajeAuto("Se terminaron los intentos.", "error");
    } else {
        mostrarMensajeAuto("No es ese piloto. La imagen ahora está un poco más nítida.", "info");
    }

    actualizarInterfazAuto();

    if (!partidaTerminadaAuto) {
        campoPilotoAuto.focus();
    }
}

function agregarIntentoAlHistorial(piloto) {
    historialAuto.hidden = false;

    const intento = document.createElement("article");
    const imagen = document.createElement("img");
    const nombre = document.createElement("strong");
    const acerto = piloto.id === pilotoSecretoAuto.id;

    intento.className = "intento-auto " + (acerto ? "intento-auto--correcto" : "intento-auto--incorrecto");
    intento.setAttribute("aria-label", piloto.nombre + ": " + (acerto ? "correcto" : "incorrecto"));
    // piloto.imagen (actc.org.ar) esta caida para todos los pilotos:
    // usamos la foto local como fuente confiable.
    imagen.src = piloto.imagenResultado || piloto.imagen;
    imagen.alt = "";
    nombre.textContent = piloto.nombre;

    intento.appendChild(imagen);
    intento.appendChild(nombre);
    listaIntentosAuto.prepend(intento);
}

function hayRondaAnio() {
    return Number.isFinite(anioDelAuto);
}

function rondaAnioPendiente() {
    return hayRondaAnio() && respuestaAnio === null;
}

// Generador con semilla para que los años señuelo sean los mismos durante
// todo el día, incluso al recargar la página.
function crearGeneradorAnios(texto) {
    let semilla = 2166136261;

    for (let indice = 0; indice < texto.length; indice++) {
        semilla ^= texto.charCodeAt(indice);
        semilla = Math.imul(semilla, 16777619);
    }

    return function () {
        semilla += 0x6D2B79F5;
        let resultado = semilla;
        resultado = Math.imul(resultado ^ (resultado >>> 15), resultado | 1);
        resultado ^= resultado + Math.imul(resultado ^ (resultado >>> 7), resultado | 61);
        return ((resultado ^ (resultado >>> 14)) >>> 0) / 4294967296;
    };
}

// Cinco años ordenados: el real y cuatro señuelos a menos de 8 años de
// distancia, nunca más nuevos que el año actual.
function generarOpcionesAnio() {
    const aleatorio = crearGeneradorAnios(
        "anio:" + fechaPartidaAutoActual + ":" + autoDelDia.pilotoId + ":" + anioDelAuto
    );
    const anioTope = new Date().getFullYear();
    const opciones = [anioDelAuto];

    while (opciones.length < CANTIDAD_OPCIONES_ANIO) {
        const desplazamiento = Math.floor(aleatorio() * 16) - 8;
        const candidato = anioDelAuto + desplazamiento;

        if (
            desplazamiento !== 0 &&
            candidato >= PRIMER_ANIO_TC &&
            candidato <= anioTope &&
            !opciones.includes(candidato)
        ) {
            opciones.push(candidato);
        }
    }

    return opciones.sort(function (a, b) { return a - b; });
}

function renderizarOpcionesAnio() {
    const opciones = generarOpcionesAnio();

    // Una respuesta guardada con la versión anterior (año escrito a mano)
    // puede no estar entre las opciones: se suma para poder marcarla.
    if (respuestaAnio !== null && !opciones.includes(respuestaAnio)) {
        opciones.push(respuestaAnio);
        opciones.sort(function (a, b) { return a - b; });
    }

    opcionesAnioAuto.innerHTML = "";

    opciones.forEach(function (anio) {
        const opcion = document.createElement("button");

        opcion.type = "button";
        opcion.className = "ronda-anio__opcion";
        opcion.dataset.anio = anio;
        opcion.textContent = anio;
        opcion.addEventListener("click", function () {
            elegirAnio(anio);
        });
        opcionesAnioAuto.appendChild(opcion);
    });
}

// La ronda bonus reemplaza al buscador de pilotos una vez adivinado el auto.
function mostrarRondaAnio() {
    panelIntentoAuto.hidden = true;
    panelAnioAuto.hidden = false;
    renderizarOpcionesAnio();

    if (rondaAnioPendiente()) {
        opcionesAnioAuto.querySelector("button").focus();
        return;
    }

    renderizarResultadoAnio();
}

// El resultado se muestra sobre las mismas opciones: la correcta en verde,
// la elegida (si no era) tachada en rojo y el resto apagado.
function renderizarResultadoAnio() {
    opcionesAnioAuto.classList.add("ronda-anio__opciones--respondida");
    opcionesAnioAuto.querySelectorAll(".ronda-anio__opcion").forEach(function (opcion) {
        const anio = Number(opcion.dataset.anio);
        const esCorrecta = anio === anioDelAuto;
        const esElegida = anio === respuestaAnio;

        opcion.disabled = true;
        opcion.classList.toggle("ronda-anio__opcion--correcta", esCorrecta);
        opcion.classList.toggle("ronda-anio__opcion--error", esElegida && !esCorrecta);

        if (esCorrecta) {
            opcion.setAttribute("aria-label", anio + ", año correcto");
        } else if (esElegida) {
            opcion.setAttribute("aria-label", anio + ", tu respuesta");
        }
    });

    // Los tiles ya muestran el resultado; la ayuda deja de hacer falta.
    mensajeAnioAuto.hidden = true;
}

function elegirAnio(anio) {
    if (!rondaAnioPendiente()) {
        return;
    }

    respuestaAnio = anio;
    datoAnioAuto.guardar(anio);
    renderizarResultadoAnio();
    mostrarResultadoAutoModal(true);
}

function finalizarPartidaAuto(acerto, abrirModal) {
    partidaTerminadaAuto = true;
    estadoFinal.classList.toggle("estado-final--correcto", acerto);
    estadoFinalEtiqueta.textContent = acerto ? "¡Correcto!" : "Incorrecto";
    estadoFinalPiloto.textContent = pilotoSecretoAuto.nombre;
    estadoFinal.hidden = false;
    iniciarCuentaRegresivaAuto();

    // La ronda del año solo se abre al acertar el piloto; cuando queda
    // pendiente, el modal espera a que se responda.
    const esperaRondaAnio = acerto && rondaAnioPendiente();

    if (acerto && hayRondaAnio()) {
        mostrarRondaAnio();
    }

    if (abrirModal && !esperaRondaAnio) {
        mostrarResultadoAutoModal(acerto);
    }
}

function mostrarResultadoAutoModal(acerto) {
    const cantidadIntentos = idsIntentadosAuto.length;
    const palabraIntentos = cantidadIntentos === 1 ? "intento" : "intentos";

    resultadoAutoModal.classList.toggle("resultado-modal--correcto", acerto);
    tituloResultadoAutoModal.textContent = acerto ? "¡Adivinaste!" : "No lo adivinaste";
    fotoResultadoAutoModal.src = pilotoSecretoAuto.imagenResultado || pilotoSecretoAuto.imagen;
    fotoResultadoAutoModal.alt = "Foto de " + pilotoSecretoAuto.nombre;
    pilotoResultadoAutoModal.textContent = pilotoSecretoAuto.nombre;
    detalleResultadoAutoModal.textContent = acerto
        ? "Lo resolviste en " + cantidadIntentos + " " + palabraIntentos + "."
        : "No lo adivinaste en los " + MAXIMO_INTENTOS_AUTO + " intentos.";
    actualizarBonusModal();

    modalResultadoAuto.abrir();
}

function actualizarBonusModal() {
    if (respuestaAnio === null) {
        bonusAnioModal.hidden = true;
        return;
    }

    const acertoAnio = respuestaAnio === anioDelAuto;

    bonusAnioModal.hidden = false;
    bonusAnioModal.classList.toggle("resultado-modal__bonus--correcto", acertoAnio);
    bonusAnioModal.textContent = acertoAnio
        ? "Y le acertaste al año: " + anioDelAuto + "."
        : "El diseño era de " + anioDelAuto + ", vos dijiste " + respuestaAnio + ".";
}

function iniciarCuentaRegresivaAuto() {
    cuentaRegresivaAuto.iniciar();
}

function cargarPartidaAuto() {
    idsIntentadosAuto.forEach(function (idPiloto) {
        const piloto = pilotos.find(function (item) { return item.id === idPiloto; });
        if (piloto) {
            agregarIntentoAlHistorial(piloto);
        }
    });

    if (partidaTerminadaAuto) {
        finalizarPartidaAuto(estadoAuto.acerto, false);
    }
}

botonIntentarAuto.addEventListener("click", intentarPilotoAuto);
cargarPartidaAuto();
actualizarInterfazAuto();
configurarImagenAuto();

if (introAuto && contenidoAuto && botonEmpezarAuto) {
    TCdle.crearIntroJuego({
        clave: "tcdleIntroAutoVista",
        intro: introAuto,
        contenido: contenidoAuto,
        boton: botonEmpezarAuto
    });
}
