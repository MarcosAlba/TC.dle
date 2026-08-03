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

const MAXIMO_INTENTOS_CIRCUITO = 8;
const CLAVE_PARTIDA_CIRCUITO = "partidaTCdleCircuito";
const RUTA_CIRCUITOS = new URL("../images/circuitos/", document.currentScript.src).href;
const circuitos = Array.isArray(window.circuitosTC) ? window.circuitosTC : [];
const fechaPartidaCircuitoActual = obtenerFechaLocalCircuito();

let idsIntentadosCircuito = [];
let partidaTerminadaCircuito = false;
let indiceSugerenciaCircuito = -1;
let sugerenciasVisiblesCircuito = [];
let intervaloCuentaRegresivaCircuito;

const circuitoDelDia = obtenerCircuitoDelDia();

function obtenerFechaLocalCircuito(fecha = new Date()) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return anio + "-" + mes + "-" + dia;
}

function normalizarTextoCircuito(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.º°]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .trim()
        .toLowerCase();
}

function obtenerEtiquetaCircuito(circuito) {
    return circuito.nombre + " — " + circuito.variante;
}

function obtenerTextoBusquedaCircuito(circuito) {
    return [
        circuito.nombre,
        circuito.variante,
        circuito.ciudad,
        circuito.provincia
    ].concat(circuito.aliases || []).map(normalizarTextoCircuito).join(" ");
}

function obtenerCircuitoDelDia() {
    if (circuitos.length === 0) {
        return null;
    }

    const hoy = new Date();
    const fechaUtc = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const numeroDia = Math.floor(fechaUtc / 86400000);

    return circuitos[numeroDia % circuitos.length];
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
    nivelesIntentosCircuito.innerHTML = "";

    for (let indice = 0; indice < MAXIMO_INTENTOS_CIRCUITO; indice++) {
        const indicador = document.createElement("span");
        indicador.className = "nivel-intento-circuito";

        if (indice < idsIntentadosCircuito.length) {
            indicador.classList.add("nivel-intento-circuito--usado");
        }

        if (
            partidaTerminadaCircuito &&
            idsIntentadosCircuito[idsIntentadosCircuito.length - 1] === circuitoDelDia.id &&
            indice === idsIntentadosCircuito.length - 1
        ) {
            indicador.classList.add("nivel-intento-circuito--acierto");
        }

        nivelesIntentosCircuito.appendChild(indicador);
    }
}

function actualizarInterfazCircuito() {
    const usados = idsIntentadosCircuito.length;
    const restantes = MAXIMO_INTENTOS_CIRCUITO - usados;
    const palabra = restantes === 1 ? "intento disponible" : "intentos disponibles";
    const numeroVisible = partidaTerminadaCircuito ? usados : usados + 1;

    intentosRestantesCircuito.textContent = restantes + " " + palabra;
    intentosRestantesCircuito.hidden = partidaTerminadaCircuito;
    regresoCircuito.hidden = !partidaTerminadaCircuito;
    numeroIntentoCircuito.textContent = String(Math.min(Math.max(numeroVisible, 1), MAXIMO_INTENTOS_CIRCUITO)).padStart(2, "0");
    campoCircuito.disabled = partidaTerminadaCircuito || !circuitoDelDia;
    botonIntentarCircuito.disabled = partidaTerminadaCircuito || !circuitoDelDia;
    crearIndicadoresCircuito();
}

function mostrarMensajeCircuito(texto, tipo) {
    mensajeCircuito.textContent = texto;
    mensajeCircuito.className = "mensaje-circuito" + (tipo ? " mensaje-circuito--" + tipo : "");
}

function buscarCircuitos(consulta) {
    const consultaNormalizada = normalizarTextoCircuito(consulta);

    if (!consultaNormalizada) {
        return [];
    }

    return circuitos
        .filter(function (circuito) {
            return !idsIntentadosCircuito.includes(circuito.id) &&
                obtenerTextoBusquedaCircuito(circuito).includes(consultaNormalizada);
        })
        .sort(function (a, b) {
            const etiquetaA = normalizarTextoCircuito(obtenerEtiquetaCircuito(a));
            const etiquetaB = normalizarTextoCircuito(obtenerEtiquetaCircuito(b));
            const empiezaA = etiquetaA.startsWith(consultaNormalizada) ? 0 : 1;
            const empiezaB = etiquetaB.startsWith(consultaNormalizada) ? 0 : 1;

            return empiezaA - empiezaB || etiquetaA.localeCompare(etiquetaB, "es");
        })
        .slice(0, 8);
}

function renderizarSugerenciasCircuito() {
    sugerenciasCircuitos.innerHTML = "";
    sugerenciasVisiblesCircuito = buscarCircuitos(campoCircuito.value);
    indiceSugerenciaCircuito = -1;

    if (sugerenciasVisiblesCircuito.length === 0 || partidaTerminadaCircuito) {
        ocultarSugerenciasCircuito();
        return;
    }

    sugerenciasVisiblesCircuito.forEach(function (circuito, indice) {
        const opcion = document.createElement("button");
        const nombre = document.createElement("strong");
        const detalle = document.createElement("span");

        opcion.type = "button";
        opcion.className = "sugerencia-circuito";
        opcion.setAttribute("role", "option");
        opcion.dataset.indice = String(indice);
        nombre.textContent = circuito.nombre;
        detalle.textContent = circuito.variante + " · " + circuito.ciudad;
        opcion.appendChild(nombre);
        opcion.appendChild(detalle);
        opcion.addEventListener("mousedown", function (evento) {
            evento.preventDefault();
            seleccionarSugerenciaCircuito(indice);
        });
        sugerenciasCircuitos.appendChild(opcion);
    });

    sugerenciasCircuitos.hidden = false;
    campoCircuito.setAttribute("aria-expanded", "true");
}

function ocultarSugerenciasCircuito() {
    sugerenciasCircuitos.hidden = true;
    campoCircuito.setAttribute("aria-expanded", "false");
    campoCircuito.removeAttribute("aria-activedescendant");
    indiceSugerenciaCircuito = -1;
}

function seleccionarSugerenciaCircuito(indice) {
    const circuito = sugerenciasVisiblesCircuito[indice];

    if (!circuito) {
        return;
    }

    campoCircuito.value = obtenerEtiquetaCircuito(circuito);
    campoCircuito.dataset.circuitoId = circuito.id;
    ocultarSugerenciasCircuito();
    mostrarMensajeCircuito("", "");
    campoCircuito.focus();
}

function moverSugerenciaCircuito(direccion) {
    if (sugerenciasCircuitos.hidden || sugerenciasVisiblesCircuito.length === 0) {
        return;
    }

    indiceSugerenciaCircuito = (
        indiceSugerenciaCircuito + direccion + sugerenciasVisiblesCircuito.length
    ) % sugerenciasVisiblesCircuito.length;

    Array.from(sugerenciasCircuitos.children).forEach(function (opcion, indice) {
        const activa = indice === indiceSugerenciaCircuito;
        opcion.classList.toggle("sugerencia-circuito--activa", activa);
        opcion.setAttribute("aria-selected", String(activa));

        if (activa) {
            opcion.id = "sugerencia-circuito-activa";
            campoCircuito.setAttribute("aria-activedescendant", opcion.id);
            opcion.scrollIntoView({ block: "nearest" });
        } else {
            opcion.removeAttribute("id");
        }
    });
}

function coincideEntradaCircuito(circuito, entradaNormalizada) {
    const opciones = [obtenerEtiquetaCircuito(circuito), circuito.nombre]
        .concat(circuito.aliases || [])
        .map(normalizarTextoCircuito);

    return opciones.includes(entradaNormalizada);
}

function resolverCircuitoIngresado() {
    const idSeleccionado = campoCircuito.dataset.circuitoId;

    if (idSeleccionado) {
        const seleccionado = circuitos.find(function (circuito) {
            return circuito.id === idSeleccionado;
        });

        if (seleccionado && normalizarTextoCircuito(campoCircuito.value) === normalizarTextoCircuito(obtenerEtiquetaCircuito(seleccionado))) {
            return { circuito: seleccionado };
        }
    }

    const entradaNormalizada = normalizarTextoCircuito(campoCircuito.value);
    const coincidencias = circuitos.filter(function (circuito) {
        return coincideEntradaCircuito(circuito, entradaNormalizada);
    });

    if (coincidencias.length > 1) {
        return { ambiguo: true };
    }

    return { circuito: coincidencias[0] || null };
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

    const resultado = resolverCircuitoIngresado();

    if (resultado.ambiguo) {
        mostrarMensajeCircuito("Ese autódromo tiene más de un trazado. Elegí una variante de la lista.", "error");
        renderizarSugerenciasCircuito();
        return;
    }

    const circuitoElegido = resultado.circuito;

    if (!circuitoElegido) {
        mostrarMensajeCircuito("Ese circuito no está en la lista.", "error");
        return;
    }

    if (idsIntentadosCircuito.includes(circuitoElegido.id)) {
        mostrarMensajeCircuito("Ya intentaste con ese trazado.", "error");
        return;
    }

    idsIntentadosCircuito.push(circuitoElegido.id);
    campoCircuito.value = "";
    delete campoCircuito.dataset.circuitoId;
    ocultarSugerenciasCircuito();
    agregarIntentoCircuito(circuitoElegido);

    const acerto = circuitoElegido.id === circuitoDelDia.id;
    const seQuedoSinIntentos = idsIntentadosCircuito.length >= MAXIMO_INTENTOS_CIRCUITO;

    if (acerto) {
        finalizarPartidaCircuito(true, true);
        mostrarMensajeCircuito("¡Correcto! Reconociste el trazado.", "exito");
    } else if (seQuedoSinIntentos) {
        finalizarPartidaCircuito(false, true);
        mostrarMensajeCircuito("Se terminaron los intentos.", "error");
    } else {
        mostrarMensajeCircuito("No es ese circuito. La silueta permanece igual de nítida.", "");
    }

    guardarPartidaCircuito();
    actualizarInterfazCircuito();

    if (!partidaTerminadaCircuito) {
        campoCircuito.focus();
    }
}

function agregarIntentoCircuito(circuito) {
    historialCircuito.hidden = false;

    const intento = document.createElement("article");
    const nombre = document.createElement("strong");
    const variante = document.createElement("span");
    const acerto = circuito.id === circuitoDelDia.id;

    intento.className = "intento-circuito " + (acerto ? "intento-circuito--correcto" : "intento-circuito--incorrecto");
    intento.setAttribute("aria-label", obtenerEtiquetaCircuito(circuito) + ": " + (acerto ? "correcto" : "incorrecto"));
    nombre.textContent = circuito.nombre;
    variante.textContent = circuito.variante;
    intento.appendChild(nombre);
    intento.appendChild(variante);
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

    resultadoCircuitoModal.classList.toggle("resultado-circuito-modal--correcto", acerto);
    tituloResultadoCircuitoModal.textContent = acerto ? "¡Adivinaste!" : "No lo adivinaste";
    fotoResultadoCircuitoModal.src = RUTA_CIRCUITOS + circuitoDelDia.imagen;
    fotoResultadoCircuitoModal.alt = "Silueta de " + obtenerEtiquetaCircuito(circuitoDelDia);
    nombreResultadoCircuitoModal.textContent = obtenerEtiquetaCircuito(circuitoDelDia);
    detalleResultadoCircuitoModal.textContent = acerto
        ? "Lo resolviste en " + cantidadIntentos + " " + palabraIntentos + "."
        : "No lo adivinaste en los " + MAXIMO_INTENTOS_CIRCUITO + " intentos.";

    if (!resultadoCircuitoModal.open) {
        document.body.classList.add("resultado-circuito-modal-abierto");
        resultadoCircuitoModal.showModal();
        cerrarResultadoCircuitoModal.focus();
    }
}

function cerrarModalResultadoCircuito() {
    if (resultadoCircuitoModal.open) {
        resultadoCircuitoModal.close();
    }
}

function iniciarCuentaRegresivaCircuito() {
    clearInterval(intervaloCuentaRegresivaCircuito);
    actualizarCuentaRegresivaCircuito();
    intervaloCuentaRegresivaCircuito = setInterval(actualizarCuentaRegresivaCircuito, 1000);
}

function actualizarCuentaRegresivaCircuito() {
    const ahora = new Date();

    if (obtenerFechaLocalCircuito(ahora) !== fechaPartidaCircuitoActual) {
        location.reload();
        return;
    }

    const proximaMedianoche = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);
    const diferencia = proximaMedianoche - ahora;
    const horas = Math.floor(diferencia / 3600000);
    const minutos = Math.floor((diferencia % 3600000) / 60000);
    const segundos = Math.floor((diferencia % 60000) / 1000);
    const tiempoRestante = [horas, minutos, segundos]
        .map(function (valor) {
            return String(valor).padStart(2, "0");
        })
        .join(":");

    tiempoNuevoCircuito.textContent = tiempoRestante;
    tiempoNuevoCircuitoModal.textContent = tiempoRestante;
}

function guardarPartidaCircuito() {
    if (!circuitoDelDia) {
        return;
    }

    localStorage.setItem(CLAVE_PARTIDA_CIRCUITO, JSON.stringify({
        fecha: fechaPartidaCircuitoActual,
        circuitoId: circuitoDelDia.id,
        idsIntentados: idsIntentadosCircuito,
        terminada: partidaTerminadaCircuito
    }));
}

function cargarPartidaCircuito() {
    if (!circuitoDelDia) {
        return;
    }

    const datosGuardados = localStorage.getItem(CLAVE_PARTIDA_CIRCUITO);

    if (!datosGuardados) {
        return;
    }

    try {
        const partida = JSON.parse(datosGuardados);
        const correspondeAHoy = partida.fecha === fechaPartidaCircuitoActual;
        const correspondeAlCircuito = partida.circuitoId === circuitoDelDia.id;

        if (!correspondeAHoy || !correspondeAlCircuito || !Array.isArray(partida.idsIntentados)) {
            localStorage.removeItem(CLAVE_PARTIDA_CIRCUITO);
            return;
        }

        idsIntentadosCircuito = partida.idsIntentados
            .filter(function (id, indice, lista) {
                return lista.indexOf(id) === indice && circuitos.some(function (circuito) {
                    return circuito.id === id;
                });
            })
            .slice(0, MAXIMO_INTENTOS_CIRCUITO);

        partidaTerminadaCircuito = Boolean(partida.terminada) && (
            idsIntentadosCircuito.includes(circuitoDelDia.id) ||
            idsIntentadosCircuito.length === MAXIMO_INTENTOS_CIRCUITO
        );

        idsIntentadosCircuito.forEach(function (idCircuito) {
            const circuito = circuitos.find(function (item) {
                return item.id === idCircuito;
            });

            if (circuito) {
                agregarIntentoCircuito(circuito);
            }
        });

        if (partidaTerminadaCircuito) {
            finalizarPartidaCircuito(idsIntentadosCircuito.includes(circuitoDelDia.id), false);
        }
    } catch (error) {
        localStorage.removeItem(CLAVE_PARTIDA_CIRCUITO);
    }
}

campoCircuito.addEventListener("input", function () {
    delete campoCircuito.dataset.circuitoId;
    mostrarMensajeCircuito("", "");
    renderizarSugerenciasCircuito();
});

campoCircuito.addEventListener("keydown", function (evento) {
    if (evento.key === "ArrowDown") {
        evento.preventDefault();
        moverSugerenciaCircuito(1);
    } else if (evento.key === "ArrowUp") {
        evento.preventDefault();
        moverSugerenciaCircuito(-1);
    } else if (evento.key === "Enter") {
        evento.preventDefault();

        if (indiceSugerenciaCircuito >= 0) {
            seleccionarSugerenciaCircuito(indiceSugerenciaCircuito);
        } else {
            intentarCircuito();
        }
    } else if (evento.key === "Escape") {
        ocultarSugerenciasCircuito();
    }
});

campoCircuito.addEventListener("blur", function () {
    setTimeout(ocultarSugerenciasCircuito, 120);
});

botonIntentarCircuito.addEventListener("click", intentarCircuito);
cerrarResultadoCircuitoModal.addEventListener("click", cerrarModalResultadoCircuito);

resultadoCircuitoModal.addEventListener("click", function (evento) {
    if (evento.target === resultadoCircuitoModal) {
        cerrarModalResultadoCircuito();
    }
});

resultadoCircuitoModal.addEventListener("close", function () {
    document.body.classList.remove("resultado-circuito-modal-abierto");
    estadoFinalCircuito.focus({ preventScroll: true });
});

configurarImagenCircuito();
cargarPartidaCircuito();
actualizarInterfazCircuito();
