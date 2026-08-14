(function (global) {
    "use strict";

    // Evaluación pura de un intento contra la palabra objetivo, expuesta en
    // window.TCdleWordle para poder testearla igual que el resto del núcleo
    // (ver tests/tcdle-wordle.test.mjs). No depende del DOM.
    function evaluarIntento(intento, objetivo) {
        const letrasIntento = intento.split("");
        const letrasObjetivo = objetivo.split("");
        const resultado = new Array(letrasIntento.length).fill("ausente");
        const disponibles = letrasObjetivo.slice();

        letrasIntento.forEach(function (letra, indice) {
            if (letra === letrasObjetivo[indice]) {
                resultado[indice] = "correcta";
                disponibles[indice] = null;
            }
        });

        letrasIntento.forEach(function (letra, indice) {
            if (resultado[indice] === "correcta") {
                return;
            }

            const posicion = disponibles.indexOf(letra);
            if (posicion !== -1) {
                resultado[indice] = "presente";
                disponibles[posicion] = null;
            }
        });

        return resultado;
    }

    global.TCdleWordle = { evaluarIntento: evaluarIntento };
})(window);

(function () {
    "use strict";

    // Solo corre en el navegador: si no hay DOM (por ejemplo al cargar este
    // archivo con vm.runInNewContext en los tests), nos quedamos únicamente
    // con TCdleWordle.evaluarIntento definido arriba.
    if (typeof document === "undefined" || !document.getElementById) {
        return;
    }

    const LONGITUD_MINIMA = 4;
    const LONGITUD_MAXIMA = 8;
    const CLAVE_PARTIDA_WORDLE = "partidaTCdleWordleOriginal";
    const PRIORIDAD_ESTADO = { ausente: 0, presente: 1, correcta: 2 };
    const FILAS_TECLADO = [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
        ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BORRAR"]
    ];

    const tableroWordle = document.getElementById("tablero-wordle");
    const tecladoVirtual = document.getElementById("teclado-virtual");
    const mensajeWordle = document.getElementById("mensaje-wordle");
    const intentosRestantesWordle = document.getElementById("intentos-restantes-wordle");
    const regresoWordle = document.getElementById("regreso-wordle");
    const tiempoNuevaPalabra = document.getElementById("tiempo-nueva-palabra");
    const resultadoWordleModal = document.getElementById("resultado-wordle-modal");
    const cerrarResultadoWordleModal = document.getElementById("cerrar-resultado-wordle-modal");
    const tituloResultadoWordleModal = document.getElementById("titulo-resultado-wordle-modal");
    const palabraResultadoWordleModal = document.getElementById("palabra-resultado-wordle-modal");
    const detalleResultadoWordleModal = document.getElementById("detalle-resultado-wordle-modal");
    const tiempoNuevaPalabraModal = document.getElementById("tiempo-nueva-palabra-modal");

    const fechaPartidaWordleActual = TCdle.obtenerFechaLocal();
    const palabrasValidas = palabrasTC.filter(function (item) {
        return item.palabra.length >= LONGITUD_MINIMA && item.palabra.length <= LONGITUD_MAXIMA;
    });
    const palabraDelDia = TCdle.seleccionDiaria.obtener(palabrasValidas, "wordle");
    const LARGO_PALABRA = palabraDelDia.palabra.length;
    const MAXIMO_INTENTOS_WORDLE = LARGO_PALABRA + 1;

    const juegoWordle = TCdle.crearJuegoDiario({
        clave: CLAVE_PARTIDA_WORDLE,
        fecha: fechaPartidaWordleActual,
        objetivoId: palabraDelDia.id,
        maximoIntentos: MAXIMO_INTENTOS_WORDLE,
        // A diferencia de los otros modos, acá no hay un catálogo cerrado de
        // intentos válidos: se puede escribir cualquier combinación de letras
        // (A-Z / Ñ) del mismo largo que la palabra del día. El catálogo
        // palabrasTC sólo se usa arriba para elegir la palabra secreta.
        validarId: function (id) {
            return typeof id === "string" && id.length === LARGO_PALABRA && /^[A-ZÑ]+$/.test(id);
        }
    });
    let estadoWordle = juegoWordle.cargar();

    const cuentaRegresivaWordle = TCdle.crearCuentaRegresiva({
        elementos: [tiempoNuevaPalabra, tiempoNuevaPalabraModal],
        fecha: fechaPartidaWordleActual
    });
    const modalResultadoWordle = TCdle.crearModalResultado({
        dialogo: resultadoWordleModal,
        botonCerrar: cerrarResultadoWordleModal,
        focoRetorno: tableroWordle
    });

    const filasWordle = [];
    const celdasWordle = [];
    const teclasVirtuales = {};
    const botonesTeclado = [];
    let intentoActual = "";
    let filaActivaIndice = 0;

    function esperar(milisegundos) {
        return new Promise(function (resolve) {
            setTimeout(resolve, milisegundos);
        });
    }

    function construirTablero() {
        tableroWordle.style.setProperty("--largo-palabra", LARGO_PALABRA);

        for (let fila = 0; fila < MAXIMO_INTENTOS_WORDLE; fila++) {
            const filaElemento = document.createElement("div");
            filaElemento.className = "fila-wordle";
            filaElemento.setAttribute("role", "row");
            const celdas = [];

            for (let columna = 0; columna < LARGO_PALABRA; columna++) {
                const celda = document.createElement("span");
                celda.className = "celda-wordle";
                celda.setAttribute("role", "gridcell");
                filaElemento.appendChild(celda);
                celdas.push(celda);
            }

            tableroWordle.appendChild(filaElemento);
            filasWordle.push(filaElemento);
            celdasWordle.push(celdas);
        }
    }

    function construirTeclado() {
        FILAS_TECLADO.forEach(function (filaTeclas) {
            const filaElemento = document.createElement("div");
            filaElemento.className = "teclado-virtual__fila";

            filaTeclas.forEach(function (tecla) {
                const boton = document.createElement("button");
                boton.type = "button";
                boton.className = "tecla";

                if (tecla === "ENTER" || tecla === "BORRAR") {
                    boton.classList.add("tecla--ancha");
                }

                boton.textContent = tecla === "BORRAR" ? "⌫" : tecla;
                boton.setAttribute(
                    "aria-label",
                    tecla === "BORRAR" ? "Borrar letra" : tecla === "ENTER" ? "Enviar intento" : "Letra " + tecla
                );
                boton.addEventListener("click", function () {
                    manejarTecla(tecla);
                });

                if (tecla.length === 1) {
                    teclasVirtuales[tecla] = boton;
                }
                botonesTeclado.push(boton);
                filaElemento.appendChild(boton);
            });

            tecladoVirtual.appendChild(filaElemento);
        });
    }

    function manejarTecla(tecla) {
        if (estadoWordle.terminada) {
            return;
        }

        if (tecla === "ENTER") {
            enviarIntento();
        } else if (tecla === "BORRAR") {
            borrarLetra();
        } else {
            escribirLetra(tecla);
        }
    }

    function escribirLetra(letra) {
        if (intentoActual.length >= LARGO_PALABRA) {
            return;
        }

        intentoActual += letra;
        actualizarFilaActual();
    }

    function borrarLetra() {
        intentoActual = intentoActual.slice(0, -1);
        actualizarFilaActual();
    }

    function actualizarFilaActual() {
        const celdas = celdasWordle[filaActivaIndice];
        if (!celdas) {
            return;
        }

        celdas.forEach(function (celda, indice) {
            const letra = intentoActual[indice] || "";
            celda.textContent = letra;
            celda.classList.toggle("celda-wordle--llena", Boolean(letra));
        });
    }

    function agitarFilaActual() {
        const fila = filasWordle[filaActivaIndice];
        if (!fila) {
            return;
        }

        fila.classList.remove("fila-wordle--agitando");
        void fila.offsetWidth;
        fila.classList.add("fila-wordle--agitando");
    }

    function mostrarMensajeWordle(texto, tipo) {
        TCdle.mostrarMensaje(mensajeWordle, texto, tipo);
    }

    function actualizarTecla(letra, estado) {
        const boton = teclasVirtuales[letra];
        if (!boton) {
            return;
        }

        const actual = boton.dataset.estado;
        if (actual && PRIORIDAD_ESTADO[actual] >= PRIORIDAD_ESTADO[estado]) {
            return;
        }

        if (actual) {
            boton.classList.remove("tecla--" + actual);
        }
        boton.classList.add("tecla--" + estado);
        boton.dataset.estado = estado;
    }

    async function revelarFila(indiceFila, palabraIntentada, animar) {
        const estados = TCdleWordle.evaluarIntento(palabraIntentada, palabraDelDia.palabra);
        const celdas = celdasWordle[indiceFila];
        const duracionGiro = 420;

        for (let indice = 0; indice < celdas.length; indice++) {
            const celda = celdas[indice];
            const estado = estados[indice];
            celda.textContent = palabraIntentada[indice];

            if (animar) {
                celda.classList.add("celda-wordle--girando");
                await esperar(duracionGiro / 2);
                celda.classList.remove("celda-wordle--llena");
                celda.classList.add("celda-wordle--" + estado);
                await esperar(duracionGiro / 2);
                celda.classList.remove("celda-wordle--girando");
            } else {
                celda.classList.remove("celda-wordle--llena");
                celda.classList.add("celda-wordle--" + estado);
            }

            actualizarTecla(palabraIntentada[indice], estado);
        }
    }

    function sincronizarEstadoWordle(nuevoEstado) {
        estadoWordle = nuevoEstado;
    }

    function actualizarDisponibilidadTeclado() {
        botonesTeclado.forEach(function (boton) {
            boton.disabled = estadoWordle.terminada;
        });
    }

    function actualizarInterfazWordle() {
        TCdle.actualizarEstadoIntentos({
            partida: estadoWordle,
            contador: intentosRestantesWordle,
            regreso: regresoWordle
        });
        actualizarDisponibilidadTeclado();
    }

    async function enviarIntento() {
        if (intentoActual.length !== LARGO_PALABRA) {
            mostrarMensajeWordle("Faltan letras.", "error");
            agitarFilaActual();
            return;
        }

        // El intento se acepta tal cual se escribió: no hace falta que esté
        // en el catálogo, cualquier combinación de letras del largo correcto
        // es válida (ver validarId en TCdle.crearJuegoDiario más arriba).
        const intento = juegoWordle.intentar(intentoActual);

        if (intento.resultado === "repetida") {
            mostrarMensajeWordle("Ya probaste esa palabra.", "error");
            return;
        }
        if (intento.resultado === "bloqueada" || intento.resultado === "invalida") {
            return;
        }

        const indiceFila = filaActivaIndice;
        const palabraEnviada = intentoActual;
        sincronizarEstadoWordle(intento.estado);
        filaActivaIndice++;
        intentoActual = "";

        await revelarFila(indiceFila, palabraEnviada, true);

        // El resultado final (ganaste/perdiste) ya lo anuncia el modal de
        // resultado, así que acá sólo limpiamos el mensaje de error previo.
        mostrarMensajeWordle("", "");

        if (intento.resultado === "correcta") {
            finalizarPartidaWordle(true, true);
        } else if (intento.resultado === "agotada") {
            finalizarPartidaWordle(false, true);
        }

        actualizarInterfazWordle();
    }

    function finalizarPartidaWordle(acerto, abrirModal) {
        cuentaRegresivaWordle.iniciar();
        actualizarDisponibilidadTeclado();

        if (abrirModal) {
            mostrarResultadoWordleModal(acerto);
        }
    }

    function mostrarResultadoWordleModal(acerto) {
        const cantidadIntentos = estadoWordle.intentosUsados;
        const palabraIntentos = cantidadIntentos === 1 ? "intento" : "intentos";

        resultadoWordleModal.classList.toggle("resultado-modal--correcto", acerto);
        tituloResultadoWordleModal.textContent = acerto ? "¡Adivinaste!" : "No la adivinaste";
        palabraResultadoWordleModal.textContent = palabraDelDia.palabra;
        detalleResultadoWordleModal.textContent = acerto
            ? "Lo resolviste en " + cantidadIntentos + " " + palabraIntentos + "."
            : "La palabra era \"" + palabraDelDia.palabra + "\".";

        modalResultadoWordle.abrir();
    }

    function cargarPartidaWordle() {
        // El id guardado ya es la palabra intentada tal cual se escribió.
        estadoWordle.idsIntentados.forEach(function (id, indice) {
            revelarFila(indice, id, false);
        });
        filaActivaIndice = estadoWordle.idsIntentados.length;

        if (estadoWordle.terminada) {
            finalizarPartidaWordle(estadoWordle.acerto, false);
        }
    }

    document.addEventListener("keydown", function (evento) {
        if (evento.ctrlKey || evento.metaKey || evento.altKey || estadoWordle.terminada) {
            return;
        }

        const tecla = evento.key.length === 1 ? evento.key.toUpperCase() : evento.key;

        if (tecla === "Enter") {
            evento.preventDefault();
            manejarTecla("ENTER");
        } else if (tecla === "Backspace") {
            evento.preventDefault();
            manejarTecla("BORRAR");
        } else if (/^[A-ZÑ]$/.test(tecla)) {
            manejarTecla(tecla);
        }
    });

    construirTablero();
    construirTeclado();
    cargarPartidaWordle();
    actualizarInterfazWordle();
})();
