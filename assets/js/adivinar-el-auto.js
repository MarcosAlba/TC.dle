const fotoAuto = document.getElementById("foto-auto");
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

const MAXIMO_INTENTOS_AUTO = 8;
const NIVELES_DESENFOQUE = [24, 20, 16, 12, 9, 6, 3, 1, 0];
const CLAVE_PARTIDA_AUTO = "partidaTCdleAuto";
const RUTA_AUTOS = new URL("../images/autos/", document.currentScript.src).href;
const fechaPartidaAutoActual = new Date().toDateString();

const autosDelJuego = [
    { pilotoId: 1, imagen: RUTA_AUTOS + "agustin_canapino.webp" },
    { pilotoId: 2, imagen: RUTA_AUTOS + "mauricio_lambiris.webp" },
    { pilotoId: 3, imagen: RUTA_AUTOS + "german_todino.webp" },
    { pilotoId: 4, imagen: RUTA_AUTOS + "marcelo_agrelo.webp" },
    { pilotoId: 5, imagen: RUTA_AUTOS + "juan_martin_trucco.webp" },
    { pilotoId: 6, imagen: RUTA_AUTOS + "santiago_mangoni.webp" },
    { pilotoId: 8, imagen: RUTA_AUTOS + "mariano_werner.webp" },
    { pilotoId: 9, imagen: RUTA_AUTOS + "christian_ledesma.webp" },
    { pilotoId: 10, imagen: RUTA_AUTOS + "juan_jose_ebarlin.webp" },
    { pilotoId: 11, imagen: RUTA_AUTOS + "luis_jose_di_palma.webp" },
    { pilotoId: 12, imagen: RUTA_AUTOS + "emiliano_spataro.webp" },
    { pilotoId: 13, imagen: RUTA_AUTOS + "elio_craparo.webp" },
    { pilotoId: 14, imagen: RUTA_AUTOS + "matias_canapino.webp" },
    { pilotoId: 15, imagen: RUTA_AUTOS + "norberto_fontana.webp" },
    { pilotoId: 18, imagen: RUTA_AUTOS + "juan_tomas_catalan_magni.webp" },
    { pilotoId: 19, imagen: RUTA_AUTOS + "juan_pablo_gianini.webp" },
    { pilotoId: 21, imagen: RUTA_AUTOS + "jeronimo_teti.webp" },
    { pilotoId: 22, imagen: RUTA_AUTOS + "nicolas_bonelli.webp" },
    { pilotoId: 23, imagen: RUTA_AUTOS + "julian_santero.webp" },
    { pilotoId: 25, imagen: RUTA_AUTOS + "martin_serrano.webp" },
    { pilotoId: 27, imagen: RUTA_AUTOS + "augusto_carinelli.webp" },
    { pilotoId: 28, imagen: RUTA_AUTOS + "facundo_chapur.webp" },
    { pilotoId: 30, imagen: RUTA_AUTOS + "lucas_carabajal.webp" },
    { pilotoId: 31, imagen: RUTA_AUTOS + "facundo_ardusso.webp" },
    { pilotoId: 32, imagen: RUTA_AUTOS + "ricardo_risatti.webp" },
    { pilotoId: 33, imagen: RUTA_AUTOS + "ignacio_fain.webp" },
    { pilotoId: 34, imagen: RUTA_AUTOS + "nicolas_impiombato.webp" },
    { pilotoId: 35, imagen: RUTA_AUTOS + "nicolas_trosset.webp" },
    { pilotoId: 36, imagen: RUTA_AUTOS + "marcos_landa.webp" },
    { pilotoId: 37, imagen: RUTA_AUTOS + "juan_cruz_benvenuti.webp" },
    { pilotoId: 38, imagen: RUTA_AUTOS + "jonatan_castellano.webp" },
    { pilotoId: 39, imagen: RUTA_AUTOS + "tobias_martinez.webp" },
    { pilotoId: 40, imagen: RUTA_AUTOS + "nicolas_moscardini.webp" },
    { pilotoId: 41, imagen: RUTA_AUTOS + "diego_azar.webp" },
    { pilotoId: 42, imagen: RUTA_AUTOS + "lucas_valle.webp" },
    { pilotoId: 43, imagen: RUTA_AUTOS + "rodrigo_lugon.webp" },
    { pilotoId: 44, imagen: RUTA_AUTOS + "gaston_ferrante.webp" },
    { pilotoId: 45, imagen: RUTA_AUTOS + "diego_de_carlo.webp" },
    { pilotoId: 46, imagen: RUTA_AUTOS + "kevin_candela.webp" },
    { pilotoId: 47, imagen: RUTA_AUTOS + "matias_rossi.webp" },
    { pilotoId: 48, imagen: RUTA_AUTOS + "hernan_palazzo.webp" },
    { pilotoId: 49, imagen: RUTA_AUTOS + "andres_jakos.webp" },
    { pilotoId: 50, imagen: RUTA_AUTOS + "martin_vazquez.webp" },
    { pilotoId: 51, imagen: RUTA_AUTOS + "thomas_ricciardi.webp" },
    { pilotoId: 52, imagen: RUTA_AUTOS + "valentin_aguirre.webp" },
    { pilotoId: 54, imagen: RUTA_AUTOS + "jeremias_scialchi.webp" },
    { pilotoId: 55, imagen: RUTA_AUTOS + "gaspar_chansard.webp" },
    { pilotoId: 57, imagen: RUTA_AUTOS + "marco_dianda.webp" },
    { pilotoId: 58, imagen: RUTA_AUTOS + "joaquin_ochoa.webp" },
    { pilotoId: 59, imagen: RUTA_AUTOS + "juan_b_de_benedictis.webp" },
    { pilotoId: 60, imagen: RUTA_AUTOS + "santiago_alvarez.webp" },
    { pilotoId: 61, imagen: RUTA_AUTOS + "juan_manuel_tomasello.webp" },
    { pilotoId: 62, imagen: RUTA_AUTOS + "marcos_castro.webp" },
    { pilotoId: 63, imagen: RUTA_AUTOS + "marcos_quijada.webp" },
    { pilotoId: 64, imagen: RUTA_AUTOS + "jose_manuel_urcera.webp" },
    { pilotoId: 65, imagen: RUTA_AUTOS + "otto_fritzler.webp" }
];

const autoDelDia = obtenerAutoDelDia();
const pilotoSecretoAuto = pilotos.find(function (piloto) {
    return piloto.id === autoDelDia.pilotoId;
});

let idsIntentadosAuto = [];
let partidaTerminadaAuto = false;
let intervaloCuentaRegresivaAuto;
const buscadorPilotosAuto = crearBuscadorPilotos({
    campo: campoPilotoAuto,
    lista: document.getElementById("sugerencias-auto"),
    pilotos: pilotos,
    estaExcluido: function (piloto) {
        return idsIntentadosAuto.includes(piloto.id);
    }
});

function normalizarTextoAuto(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function obtenerAutoDelDia() {
    const hoy = new Date();
    const fecha = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const numeroDia = Math.floor(fecha / 86400000);

    return autosDelJuego[numeroDia % autosDelJuego.length];
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

    fotoAuto.style.filter = "blur(" + nivel + "px)" + (nivel > 12 ? " brightness(0.72)" : " brightness(1)");
    fotoAuto.style.transform = nivel > 0 ? "scale(1.08)" : "scale(1)";
}

function crearIndicadores() {
    nivelesDesenfoque.innerHTML = "";

    for (let indice = 0; indice < MAXIMO_INTENTOS_AUTO; indice++) {
        const indicador = document.createElement("span");
        indicador.className = "nivel-desenfoque";

        if (indice < idsIntentadosAuto.length) {
            indicador.classList.add("nivel-desenfoque--usado");
        }

        if (
            partidaTerminadaAuto &&
            idsIntentadosAuto[idsIntentadosAuto.length - 1] === pilotoSecretoAuto.id &&
            indice === idsIntentadosAuto.length - 1
        ) {
            indicador.classList.add("nivel-desenfoque--acierto");
        }

        nivelesDesenfoque.appendChild(indicador);
    }
}

function actualizarInterfazAuto() {
    const usados = idsIntentadosAuto.length;
    const restantes = MAXIMO_INTENTOS_AUTO - usados;
    const palabra = restantes === 1 ? "intento disponible" : "intentos disponibles";

    intentosRestantesAuto.textContent = restantes + " " + palabra;
    intentosRestantesAuto.hidden = partidaTerminadaAuto;
    regresoAuto.hidden = !partidaTerminadaAuto;
    const numeroVisible = partidaTerminadaAuto ? usados : usados + 1;
    numeroIntentoAuto.textContent = String(Math.min(numeroVisible, MAXIMO_INTENTOS_AUTO)).padStart(2, "0");
    campoPilotoAuto.disabled = partidaTerminadaAuto;
    botonIntentarAuto.disabled = partidaTerminadaAuto;
    actualizarDesenfoque();
    crearIndicadores();
}

function mostrarMensajeAuto(texto, tipo) {
    mensajeAuto.textContent = texto;
    mensajeAuto.className = "mensaje-auto" + (tipo ? " mensaje-auto--" + tipo : "");
}

function intentarPilotoAuto() {
    if (partidaTerminadaAuto) {
        return;
    }

    const nombreIngresado = campoPilotoAuto.value.trim();
    const pilotoElegido = pilotos.find(function (piloto) {
        return normalizarTextoAuto(piloto.nombre) === normalizarTextoAuto(nombreIngresado);
    });

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

    idsIntentadosAuto.push(pilotoElegido.id);
    campoPilotoAuto.value = "";
    buscadorPilotosAuto.ocultar();
    agregarIntentoAlHistorial(pilotoElegido);

    const acerto = pilotoElegido.id === pilotoSecretoAuto.id;
    const seQuedoSinIntentos = idsIntentadosAuto.length >= MAXIMO_INTENTOS_AUTO;

    if (acerto) {
        finalizarPartidaAuto(true, true);
        mostrarMensajeAuto("¡Correcto! Reconociste el auto.", "exito");
    } else if (seQuedoSinIntentos) {
        finalizarPartidaAuto(false, true);
        mostrarMensajeAuto("Se terminaron los intentos.", "error");
    } else {
        mostrarMensajeAuto("No es ese piloto. La imagen ahora está un poco más nítida.", "info");
    }

    guardarPartidaAuto();
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
    imagen.src = piloto.imagen;
    imagen.alt = "";
    nombre.textContent = piloto.nombre;

    intento.appendChild(imagen);
    intento.appendChild(nombre);
    listaIntentosAuto.prepend(intento);
}

function finalizarPartidaAuto(acerto, abrirModal) {
    partidaTerminadaAuto = true;
    estadoFinal.classList.toggle("estado-final--correcto", acerto);
    estadoFinalEtiqueta.textContent = acerto ? "¡Correcto!" : "El piloto era";
    estadoFinalPiloto.textContent = pilotoSecretoAuto.nombre;
    estadoFinal.hidden = false;
    iniciarCuentaRegresivaAuto();

    if (abrirModal) {
        mostrarResultadoAutoModal(acerto);
    }
}

function mostrarResultadoAutoModal(acerto) {
    const cantidadIntentos = idsIntentadosAuto.length;
    const palabraIntentos = cantidadIntentos === 1 ? "intento" : "intentos";

    resultadoAutoModal.classList.toggle("resultado-auto-modal--correcto", acerto);
    tituloResultadoAutoModal.textContent = acerto ? "¡Adivinaste!" : "No lo adivinaste";
    fotoResultadoAutoModal.src = pilotoSecretoAuto.imagenResultado || pilotoSecretoAuto.imagen;
    fotoResultadoAutoModal.alt = "Foto de " + pilotoSecretoAuto.nombre;
    pilotoResultadoAutoModal.textContent = pilotoSecretoAuto.nombre;
    detalleResultadoAutoModal.textContent = acerto
        ? "Lo resolviste en " + cantidadIntentos + " " + palabraIntentos + "."
        : "No lo adivinaste en los " + MAXIMO_INTENTOS_AUTO + " intentos.";

    if (!resultadoAutoModal.open) {
        document.body.classList.add("resultado-auto-modal-abierto");
        resultadoAutoModal.showModal();
        cerrarResultadoAutoModal.focus();
    }
}

function cerrarModalResultadoAuto() {
    if (resultadoAutoModal.open) {
        resultadoAutoModal.close();
    }
}

function iniciarCuentaRegresivaAuto() {
    clearInterval(intervaloCuentaRegresivaAuto);
    actualizarCuentaRegresivaAuto();
    intervaloCuentaRegresivaAuto = setInterval(actualizarCuentaRegresivaAuto, 1000);
}

function actualizarCuentaRegresivaAuto() {
    const ahora = new Date();

    if (ahora.toDateString() !== fechaPartidaAutoActual) {
        location.reload();
        return;
    }

    const proximaMedianoche = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate() + 1
    );
    const diferencia = proximaMedianoche - ahora;
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

    const tiempoRestante = [horas, minutos, segundos]
        .map(function (valor) {
            return String(valor).padStart(2, "0");
        })
        .join(":");

    tiempoNuevoAuto.textContent = tiempoRestante;
    tiempoNuevoAutoModal.textContent = tiempoRestante;
}

function guardarPartidaAuto() {
    localStorage.setItem(CLAVE_PARTIDA_AUTO, JSON.stringify({
        fecha: new Date().toDateString(),
        autoPilotoId: autoDelDia.pilotoId,
        idsIntentados: idsIntentadosAuto,
        terminada: partidaTerminadaAuto
    }));
}

function cargarPartidaAuto() {
    const datosGuardados = localStorage.getItem(CLAVE_PARTIDA_AUTO);

    if (!datosGuardados) {
        return;
    }

    try {
        const partida = JSON.parse(datosGuardados);
        const correspondeAHoy = partida.fecha === new Date().toDateString();
        const correspondeAlAuto = partida.autoPilotoId === autoDelDia.pilotoId;

        if (!correspondeAHoy || !correspondeAlAuto) {
            localStorage.removeItem(CLAVE_PARTIDA_AUTO);
            return;
        }

        idsIntentadosAuto = Array.isArray(partida.idsIntentados) ? partida.idsIntentados : [];
        partidaTerminadaAuto = Boolean(partida.terminada);

        idsIntentadosAuto.forEach(function (idPiloto) {
            const piloto = pilotos.find(function (item) {
                return item.id === idPiloto;
            });

            if (piloto) {
                agregarIntentoAlHistorial(piloto);
            }
        });

        if (partidaTerminadaAuto) {
            finalizarPartidaAuto(idsIntentadosAuto.includes(pilotoSecretoAuto.id), false);
        }
    } catch (error) {
        localStorage.removeItem(CLAVE_PARTIDA_AUTO);
    }
}

campoPilotoAuto.addEventListener("input", function () {
    mostrarMensajeAuto("", "");
});

campoPilotoAuto.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        intentarPilotoAuto();
    }

});

botonIntentarAuto.addEventListener("click", intentarPilotoAuto);
cerrarResultadoAutoModal.addEventListener("click", cerrarModalResultadoAuto);

resultadoAutoModal.addEventListener("click", function (evento) {
    if (evento.target === resultadoAutoModal) {
        cerrarModalResultadoAuto();
    }
});

resultadoAutoModal.addEventListener("close", function () {
    document.body.classList.remove("resultado-auto-modal-abierto");
    estadoFinal.focus({ preventScroll: true });
});

document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && resultadoAutoModal.open) {
        evento.preventDefault();
        cerrarModalResultadoAuto();
    }
});

cargarPartidaAuto();
actualizarInterfazAuto();
configurarImagenAuto();
