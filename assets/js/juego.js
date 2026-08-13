const campoPiloto = document.getElementById("nombre-piloto");
const botonIntentar = document.getElementById("boton-intentar");
const tablaIntentos = document.getElementById("tabla-intentos");
const panelIntentos = document.getElementById("panel-intentos");
const textoIntentos = document.getElementById("intentos-restantes");
const mensajeJuego = document.getElementById("mensaje-juego");
const resultadoFinal = document.getElementById("resultado-final");
const fotoPilotoFinal = document.getElementById("foto-piloto-final");
const nombrePilotoFinal = document.getElementById("nombre-piloto-final");
const detalleResultadoFinal = document.getElementById("detalle-resultado-final");
const etiquetaResultado = document.getElementById("etiqueta-resultado");
const subtituloResultado = document.getElementById("subtitulo-resultado");
const guiaPistas = document.getElementById("guia-pistas");
const panelBusqueda = document.querySelector(".panel-intento");
const numeroIntentoPiloto = document.getElementById("numero-intento-piloto");
const tiempoNuevoPiloto = document.getElementById("tiempo-nuevo-piloto");

const pilotoSecreto = obtenerPilotoDelDia();
const fechaPartidaActual = TCdle.obtenerFechaLocal();

const MAXIMO_INTENTOS = 8;
const RETRASO_CELDAS = 350;
const juegoPilotos = TCdle.crearJuegoDiario({
    clave: "partidaTCdle",
    fecha: fechaPartidaActual,
    objetivoId: pilotoSecreto.id,
    idsValidos: pilotos.map(function (piloto) { return piloto.id; }),
    maximoIntentos: MAXIMO_INTENTOS,
    migrar: function (datos) {
        return TCdle.migrarPartida(datos, {
            campoIntentos: "pilotosIntentados",
            objetivoActual: pilotoSecreto.id,
            maximoIntentos: MAXIMO_INTENTOS
        });
    }
});
let estadoPilotos = juegoPilotos.cargar();
let cantidadIntentos = estadoPilotos.intentosUsados;
const pilotosIntentados = estadoPilotos.idsIntentados.slice();
const cuentaRegresivaPilotos = TCdle.crearCuentaRegresiva({
    elementos: [tiempoNuevoPiloto],
    fecha: fechaPartidaActual
});
const buscadorPilotos = TCdle.crearBuscador({
    campo: campoPiloto,
    lista: document.getElementById("sugerencias-pilotos"),
    elementos: pilotos,
    obtenerId: function (piloto) { return piloto.id; },
    obtenerEtiqueta: function (piloto) { return piloto.nombre; },
    obtenerTextoBusqueda: function (piloto) { return piloto.nombre; },
    renderizarOpcion: TCdle.renderizarOpcionPiloto,
    estaExcluido: function (piloto) {
        return pilotosIntentados.includes(piloto.id);
    },
    alEnviar: mostrarPilotoIngresado,
    alCambiar: function () { mostrarMensaje("", ""); }
});

async function mostrarPilotoIngresado() {
    const nombreIngresado = campoPiloto.value.trim();

    if (nombreIngresado === "") {
        mostrarMensaje(
            "Por favor, ingresá un nombre de piloto.",
            "mensaje-error"
        );
        return;
    }

    const pilotoEncontrado = buscadorPilotos.resolver().elemento;

    if (pilotoEncontrado === undefined) {
        mostrarMensaje("Piloto no encontrado.", "mensaje-error");
        return;
    }

    if (pilotosIntentados.includes(pilotoEncontrado.id)) {
        mostrarMensaje("Ya intentaste con ese piloto.", "mensaje-error");
        return;
    }

    const intento = juegoPilotos.intentar(pilotoEncontrado.id);
    estadoPilotos = intento.estado;
    pilotosIntentados.splice(0, pilotosIntentados.length, ...estadoPilotos.idsIntentados);
    cantidadIntentos = estadoPilotos.intentosUsados;

    cambiarEstadoControles(false);
    buscadorPilotos.ocultar();
    resultadoFinal.hidden = true;
    mostrarMensaje("", "");

    actualizarContadorIntentos();
    buscadorPilotos.limpiar();

    await agregarFilaIntento(pilotoEncontrado);

    if (pilotoEncontrado.id === pilotoSecreto.id) {
        mostrarResultadoFinal(pilotoSecreto);
        terminarPartida(
            "¡Felicidades! Adivinaste el piloto secreto: " + pilotoSecreto.nombre,
            "mensaje-exito"
        );
        return;
    }

    mostrarGuiaPistas();

    if (cantidadIntentos >= MAXIMO_INTENTOS) {
        mostrarResultadoPerdida(pilotoSecreto);
        terminarPartida(
            "Se terminaron los intentos. El piloto era: " + pilotoSecreto.nombre,
            "mensaje-error"
        );
        return;
    }

    mostrarMensaje(
        "Piloto incorrecto. Intentá nuevamente.",
        "mensaje-info"
    );

    cambiarEstadoControles(true);
    campoPiloto.focus();
}

async function agregarFilaIntento(piloto, animar = true) {
    panelIntentos.hidden = false;

    const fila = document.createElement("tr");

    const celdaNombre = crearCeldaPiloto(
        piloto,
        piloto.id === pilotoSecreto.id
    );

    const celdaMarca = crearCeldaMarca(
        piloto,
        piloto.marca === pilotoSecreto.marca
    );

    const celdaEquipo = crearCelda(
        piloto.equipo,
        piloto.equipo === pilotoSecreto.equipo
    );

    const localidadCoincide =
        normalizarTexto(piloto.localidad) ===
        normalizarTexto(pilotoSecreto.localidad);

    const provinciaCoincide =
        normalizarTexto(piloto.provincia) ===
        normalizarTexto(pilotoSecreto.provincia);

    const celdaLocalidad = crearCelda(
        piloto.localidad,
        localidadCoincide,
        provinciaCoincide
    );

    const edadPiloto = calcularEdad(piloto.fechaNacimiento);
    const edadSecreta = calcularEdad(pilotoSecreto.fechaNacimiento);
    const celdaEdad = crearCeldaNumerica(edadPiloto, edadSecreta);

    const textoCampeon = piloto.campeonTC ? "Sí" : "No";

    const celdaCampeon = crearCelda(
        textoCampeon,
        piloto.campeonTC === pilotoSecreto.campeonTC
    );

    const celdaDebut = crearCeldaNumerica(
        piloto.anioDebutTC,
        pilotoSecreto.anioDebutTC
    );

    const celdasConRetraso = [
        celdaMarca,
        celdaEquipo,
        celdaLocalidad,
        celdaCampeon,
        celdaEdad,
        celdaDebut
    ];

    if (animar) {
        celdasConRetraso.forEach(function (celda) {
            celda.classList.add("celda-pendiente");
        });
    }

    fila.appendChild(celdaNombre);
    fila.appendChild(celdaMarca);
    fila.appendChild(celdaEquipo);
    fila.appendChild(celdaLocalidad);
    fila.appendChild(celdaCampeon);
    fila.appendChild(celdaEdad);
    fila.appendChild(celdaDebut);
    tablaIntentos.prepend(fila);

    if (!animar) {
        return;
    }

    for (const celda of celdasConRetraso) {
        await esperar(RETRASO_CELDAS);
        celda.classList.remove("celda-pendiente");
        celda.classList.add("celda-visible");
    }
}

function esperar(milisegundos) {
    return new Promise(function (resolver) {
        setTimeout(resolver, milisegundos);
    });
}

function crearCelda(valor, coincide, estaCerca = false) {
    const celda = document.createElement("td");

    celda.textContent = valor;

    if (coincide) {
        celda.classList.add("coincide");
    } else if (estaCerca) {
        celda.classList.add("cerca");
    } else {
        celda.classList.add("no-coincide");
    }

    return celda;
}

function crearCeldaNumerica(valor, valorBuscado) {
    const celda = crearCelda(
        "",
        valor === valorBuscado,
        Math.abs(valor - valorBuscado) <= 2
    );
    const contenido = document.createElement("span");

    contenido.className = "celda-numerica__valor";
    contenido.textContent = valor;
    celda.classList.add("celda-numerica");
    celda.appendChild(contenido);

    if (valorBuscado > valor) {
        celda.classList.add("celda-numerica--mayor");
        celda.setAttribute(
            "aria-label",
            valor + ". El valor buscado es mayor."
        );
    } else if (valorBuscado < valor) {
        celda.classList.add("celda-numerica--menor");
        celda.setAttribute(
            "aria-label",
            valor + ". El valor buscado es menor."
        );
    }

    return celda;
}

function crearCeldaPiloto(piloto, coincide) {
    const celda = crearCelda("", coincide);
    const imagen = document.createElement("img");

    imagen.src = piloto.imagen;
    imagen.alt = "Foto de " + piloto.nombre;
    imagen.title = piloto.nombre;
    imagen.classList.add("foto-piloto");
    celda.classList.add("celda-piloto");

    celda.appendChild(imagen);

    return celda;
}

const LOGOS_MARCAS = {
    "Chevrolet": "chevrolet-logo.jpg",
    "Ford": "ford-logo.jpg",
    "Torino": "torino-logo.jpg",
    "Dodge": "dodge-logo.jpg",
    "Toyota": "toyota-logo.jpg",
    "BMW": "bmw-logo.jpg",
    "Mercedez Benz": "mercedes-logo.jpg"
};

function crearCeldaMarca(piloto, coincide) {
    const celda = crearCelda("", coincide);
    const logo = document.createElement("img");

    logo.src = RUTA_IMAGENES + "marcas/" + LOGOS_MARCAS[piloto.marca];
    logo.alt = "Logo de " + piloto.marca;
    logo.title = piloto.marca;
    logo.classList.add("logo-marca");
    celda.classList.add("celda-marca");

    celda.appendChild(logo);

    return celda;
}

function calcularEdad(fechaNacimiento) {
    const partesFecha = fechaNacimiento.split("-");
    const anioNacimiento = Number(partesFecha[0]);
    const mesNacimiento = Number(partesFecha[1]);
    const diaNacimiento = Number(partesFecha[2]);

    const hoy = new Date();
    let edad = hoy.getFullYear() - anioNacimiento;

    const cumpleaniosEsteAnio = new Date(
        hoy.getFullYear(),
        mesNacimiento - 1,
        diaNacimiento
    );

    if (hoy < cumpleaniosEsteAnio) {
        edad--;
    }

    return edad;
}

function terminarPartida(mensaje, tipo) {
    mostrarMensaje(mensaje, tipo);
    cambiarEstadoControles(false);
}

function cambiarEstadoControles(habilitados) {
    campoPiloto.disabled = !habilitados;
    botonIntentar.disabled = !habilitados;
}

function normalizarTexto(texto) {
    return TCdle.normalizarTexto(texto);
}

function mostrarMensaje(texto, tipo) {
    TCdle.mostrarMensaje(
        mensajeJuego,
        texto,
        tipo.replace("mensaje-", "")
    );
}

function mostrarGuiaPistas() {
    guiaPistas.hidden = false;
}

function actualizarContadorIntentos() {
    TCdle.actualizarEstadoIntentos({
        partida: estadoPilotos,
        contador: textoIntentos,
        numero: numeroIntentoPiloto
    });
}

function mostrarResultadoFinal(piloto, desplazar = true) {
    guiaPistas.hidden = false;

    const palabraIntento = cantidadIntentos === 1 ? "intento" : "intentos";

    mostrarResultado(
        piloto,
        true,
        "Bandera a cuadros",
        "Piloto del día",
        "Lo resolviste en " + cantidadIntentos + " " + palabraIntento + ".",
        desplazar
    );
}

function mostrarResultadoPerdida(piloto, desplazar = true) {
    mostrarResultado(
        piloto,
        false,
        "Se terminaron los intentos",
        "El piloto del día era",
        "No lograste encontrarlo en los 8 intentos disponibles.",
        desplazar
    );
}

function mostrarResultado(
    piloto,
    esCorrecto,
    etiqueta,
    subtitulo,
    detalle,
    desplazar
) {
    panelBusqueda.hidden = true;
    resultadoFinal.classList.toggle("resultado-final--correcto", esCorrecto);
    resultadoFinal.classList.toggle("resultado-final--incorrecto", !esCorrecto);
    resultadoFinal.classList.toggle(
        "resultado-final--nombre-largo",
        piloto.nombre.length > 17
    );
    resultadoFinal.classList.toggle(
        "resultado-final--nombre-muy-largo",
        piloto.nombre.length > 22
    );
    fotoPilotoFinal.src = piloto.imagenResultado || piloto.imagen;
    fotoPilotoFinal.alt = "Foto de " + piloto.nombre;
    nombrePilotoFinal.textContent = piloto.nombre;
    etiquetaResultado.textContent = etiqueta;
    subtituloResultado.textContent = subtitulo;
    detalleResultadoFinal.textContent = detalle;
    resultadoFinal.hidden = false;
    iniciarCuentaRegresiva();

    if (desplazar) {
        resultadoFinal.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

function iniciarCuentaRegresiva() {
    cuentaRegresivaPilotos.iniciar();
}

function obtenerPilotoDelDia() {
    return TCdle.seleccionDiaria.obtener(pilotos, "pilotos");
}

function cargarPartida() {
    pilotosIntentados.forEach(function (idPiloto) {
        const pilotoGuardado = pilotos.find(function (piloto) {
            return piloto.id === idPiloto;
        });

        if (pilotoGuardado !== undefined) {
            agregarFilaIntento(pilotoGuardado, false);
        }
    });

    actualizarContadorIntentos();

    const partidaGanada = estadoPilotos.acerto;

    if (partidaGanada) {
        mostrarResultadoFinal(pilotoSecreto, false);
        terminarPartida(
            "¡Felicidades! Adivinaste el piloto secreto: " + pilotoSecreto.nombre,
            "mensaje-exito"
        );
        return;
    }

    if (cantidadIntentos > 0) {
        mostrarGuiaPistas();
    }

    if (estadoPilotos.terminada) {
        mostrarResultadoPerdida(pilotoSecreto, false);
        terminarPartida(
            "Se terminaron los intentos. El piloto era: " + pilotoSecreto.nombre,
            "mensaje-error"
        );
    }
}

cargarPartida();
botonIntentar.addEventListener("click", mostrarPilotoIngresado);
