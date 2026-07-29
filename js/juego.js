const campoPiloto = document.getElementById("nombre-piloto");
const botonIntentar = document.getElementById("boton-intentar");
const tablaIntentos = document.getElementById("tabla-intentos");
const sugerenciasPilotos = document.getElementById("sugerencias-pilotos");
const textoIntentos = document.getElementById("intentos-restantes");
const mensajeJuego = document.getElementById("mensaje-juego");
const resultadoFinal = document.getElementById("resultado-final");
const fotoPilotoFinal = document.getElementById("foto-piloto-final");
const nombrePilotoFinal = document.getElementById("nombre-piloto-final");
const detalleResultadoFinal = document.getElementById("detalle-resultado-final");
const etiquetaResultado = document.getElementById("etiqueta-resultado");
const subtituloResultado = document.getElementById("subtitulo-resultado");
const guiaPistas = document.getElementById("guia-pistas");
const panelBusqueda = document.querySelector(".panel-busqueda");
const tiempoNuevoPiloto = document.getElementById("tiempo-nuevo-piloto");

const pilotoSecreto = obtenerPilotoDelDia();
const fechaPartidaActual = new Date().toDateString();

const MAXIMO_INTENTOS = 8;
const RETRASO_CELDAS = 350;
let cantidadIntentos = 0;
let intervaloCuentaRegresiva;

const pilotosIntentados = [];

async function mostrarPilotoIngresado() {
    const nombreIngresado = campoPiloto.value.trim();

    if (nombreIngresado === "") {
        mostrarMensaje(
            "Por favor, ingresá un nombre de piloto.",
            "mensaje-error"
        );
        return;
    }

    const pilotoEncontrado = pilotos.find(function (piloto) {
        return piloto.nombre.toLowerCase() === nombreIngresado.toLowerCase();
    });

    if (pilotoEncontrado === undefined) {
        mostrarMensaje("Piloto no encontrado.", "mensaje-error");
        return;
    }

    if (pilotosIntentados.includes(pilotoEncontrado.id)) {
        mostrarMensaje("Ya intentaste con ese piloto.", "mensaje-error");
        return;
    }

    pilotosIntentados.push(pilotoEncontrado.id);

    cambiarEstadoControles(false);
    ocultarSugerencias();
    resultadoFinal.hidden = true;
    mostrarMensaje("", "");

    cantidadIntentos++;
    actualizarContadorIntentos();

    guardarPartida();

    campoPiloto.value = "";

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
    const fila = document.createElement("tr");

    const celdaNombre = crearCeldaPiloto(
        piloto,
        piloto.id === pilotoSecreto.id
    );

    const celdaMarca = crearCelda(
        piloto.marca,
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
        celdaEdad,
        celdaCampeon,
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
    fila.appendChild(celdaEdad);
    fila.appendChild(celdaCampeon);
    fila.appendChild(celdaDebut);
    tablaIntentos.prepend(fila);

    if (!animar) {
        return;
    }

    for (const celda of celdasConRetraso) {
        await esperar(RETRASO_CELDAS);
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
    return crearCelda(
        valor + " " + obtenerFlecha(valor, valorBuscado),
        valor === valorBuscado,
        Math.abs(valor - valorBuscado) <= 2
    );
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

function obtenerFlecha(valorIngresado, valorBuscado) {
    if (valorIngresado === valorBuscado) {
        return "";
    }

    if (valorBuscado > valorIngresado) {
        return "↑";
    }

    return "↓";
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
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function ocultarSugerencias() {
    sugerenciasPilotos.hidden = true;
    sugerenciasPilotos.innerHTML = "";
}

function mostrarSugerencias() {
    const busqueda = campoPiloto.value.trim();
    sugerenciasPilotos.innerHTML = "";

    if (busqueda.length < 2) {
        ocultarSugerencias();
        return;
    }

    const busquedaNormalizada = normalizarTexto(busqueda);
    const pilotosFiltrados = pilotos.filter(function (piloto) {
        return normalizarTexto(piloto.nombre).includes(busquedaNormalizada);
    });

    if (pilotosFiltrados.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.classList.add("sugerencias-vacias");
        mensaje.textContent = "No hay pilotos que coincidan.";
        sugerenciasPilotos.appendChild(mensaje);
    }

    pilotosFiltrados.forEach(function (piloto) {
        const opcion = document.createElement("button");
        const imagen = document.createElement("img");
        const nombre = document.createElement("span");

        opcion.type = "button";
        opcion.classList.add("sugerencia-piloto");
        opcion.setAttribute("role", "option");

        imagen.src = piloto.imagen;
        imagen.alt = "";
        imagen.classList.add("sugerencia-piloto__imagen");

        nombre.textContent = piloto.nombre;

        opcion.appendChild(imagen);
        opcion.appendChild(nombre);

        opcion.addEventListener("click", function () {
            campoPiloto.value = piloto.nombre;
            ocultarSugerencias();
            campoPiloto.focus();
        });

        sugerenciasPilotos.appendChild(opcion);
    });

    sugerenciasPilotos.hidden = false;
}

campoPiloto.addEventListener("input", mostrarSugerencias);

campoPiloto.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        mostrarPilotoIngresado();
    }

    if (evento.key === "Escape") {
        ocultarSugerencias();
    }
});

document.addEventListener("click", function (evento) {
    if (!evento.target.closest(".contenedor-autocompletado")) {
        ocultarSugerencias();
    }
});

function mostrarMensaje(texto, tipo) {
    mensajeJuego.textContent = texto;
    mensajeJuego.className = tipo;
}

function mostrarGuiaPistas() {
    guiaPistas.hidden = false;
}

function actualizarContadorIntentos() {
    const intentosRestantes = MAXIMO_INTENTOS - cantidadIntentos;
    const palabraIntento =
        intentosRestantes === 1 ? "intento disponible" : "intentos disponibles";

    textoIntentos.textContent =
        intentosRestantes + " " + palabraIntento;
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
    fotoPilotoFinal.src = piloto.imagen;
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
    clearInterval(intervaloCuentaRegresiva);
    actualizarCuentaRegresiva();

    intervaloCuentaRegresiva = setInterval(
        actualizarCuentaRegresiva,
        1000
    );
}

function actualizarCuentaRegresiva() {
    const ahora = new Date();

    if (ahora.toDateString() !== fechaPartidaActual) {
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
    const minutos = Math.floor(
        (diferencia % (1000 * 60 * 60)) / (1000 * 60)
    );
    const segundos = Math.floor(
        (diferencia % (1000 * 60)) / 1000
    );

    tiempoNuevoPiloto.textContent = [
        horas,
        minutos,
        segundos
    ]
        .map(function (valor) {
            return String(valor).padStart(2, "0");
        })
        .join(":");
}

function obtenerPilotoDelDia() {
    const hoy = new Date();

    const fechaNormalizada = Date.UTC(
        hoy.getFullYear(),
        hoy.getMonth(),
        hoy.getDate()
    );

    const milisegundosPorDia = 1000 * 60 * 60 * 24;
    const numeroDeDia = Math.floor(fechaNormalizada / milisegundosPorDia);
    const indicePiloto = numeroDeDia % pilotos.length;

    return pilotos[indicePiloto];
}

function guardarPartida() {
    const datosPartida = {
        fecha: new Date().toDateString(),
        cantidadIntentos: cantidadIntentos,
        pilotosIntentados: pilotosIntentados
    };

    localStorage.setItem(
        "partidaTCdle",
        JSON.stringify(datosPartida)
    );
}

function cargarPartida() {
    const partidaGuardada = localStorage.getItem("partidaTCdle");

    if (partidaGuardada === null) {
        return;
    }

    const datosPartida = JSON.parse(partidaGuardada);
    const fechaActual = new Date().toDateString();

    if (datosPartida.fecha !== fechaActual) {
        localStorage.removeItem("partidaTCdle");
        return;
    }

    cantidadIntentos = datosPartida.cantidadIntentos;
    pilotosIntentados.push(...datosPartida.pilotosIntentados);

    pilotosIntentados.forEach(function (idPiloto) {
        const pilotoGuardado = pilotos.find(function (piloto) {
            return piloto.id === idPiloto;
        });

        if (pilotoGuardado !== undefined) {
            agregarFilaIntento(pilotoGuardado, false);
        }
    });

    actualizarContadorIntentos();

    const partidaGanada = pilotosIntentados.includes(pilotoSecreto.id);

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

    if (cantidadIntentos >= MAXIMO_INTENTOS) {
        mostrarResultadoPerdida(pilotoSecreto, false);
        terminarPartida(
            "Se terminaron los intentos. El piloto era: " + pilotoSecreto.nombre,
            "mensaje-error"
        );
    }
}

cargarPartida();
botonIntentar.addEventListener("click", mostrarPilotoIngresado);
