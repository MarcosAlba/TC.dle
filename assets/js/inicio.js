// Cuenta regresiva de la portada hasta la próxima carrera de calendarioTC.
(function () {
    const bloque = document.getElementById("proxima-carrera");

    if (!bloque || typeof calendarioTC === "undefined") {
        return;
    }

    const campos = {
        fecha: document.getElementById("proxima-carrera-fecha"),
        lugar: document.getElementById("proxima-carrera-lugar"),
        trazado: document.getElementById("proxima-carrera-trazado"),
        dias: document.getElementById("proxima-carrera-dias"),
        horas: document.getElementById("proxima-carrera-horas"),
        minutos: document.getElementById("proxima-carrera-minutos"),
        segundos: document.getElementById("proxima-carrera-segundos")
    };
    let carrera = null;
    let intervalo;

    function obtenerProximaCarrera(ahora) {
        return calendarioTC
            .map(function (entrada) {
                return Object.assign({}, entrada, { inicio: new Date(entrada.largada) });
            })
            .filter(function (entrada) {
                return entrada.inicio > ahora;
            })
            .sort(function (a, b) {
                return a.inicio - b.inicio;
            })[0] || null;
    }

    function dosDigitos(numero) {
        return String(numero).padStart(2, "0");
    }

    function mostrarCarrera() {
        carrera = obtenerProximaCarrera(new Date());
        bloque.hidden = !carrera;

        if (!carrera) {
            clearInterval(intervalo);
            return;
        }

        const dia = carrera.inicio.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
        campos.fecha.textContent = "Fecha " + carrera.fecha;
        campos.lugar.textContent = carrera.lugar;
        campos.trazado.hidden = !carrera.circuito;
        if (carrera.circuito) {
            campos.trazado.src = "assets/images/circuitos/" + carrera.circuito + ".svg";
        }
        bloque.setAttribute(
            "aria-label",
            "Próxima carrera: fecha " + carrera.fecha + " en " + carrera.lugar + ", el " + dia
        );
    }

    function actualizar() {
        let restante = Math.floor((carrera.inicio - new Date()) / 1000);

        // Al largar la carrera, pasa a la siguiente del calendario.
        if (restante <= 0) {
            mostrarCarrera();
            if (!carrera) {
                return;
            }
            restante = Math.floor((carrera.inicio - new Date()) / 1000);
        }

        campos.dias.textContent = dosDigitos(Math.floor(restante / 86400));
        campos.horas.textContent = dosDigitos(Math.floor((restante % 86400) / 3600));
        campos.minutos.textContent = dosDigitos(Math.floor((restante % 3600) / 60));
        campos.segundos.textContent = dosDigitos(restante % 60);
    }

    mostrarCarrera();

    if (carrera) {
        actualizar();
        intervalo = setInterval(actualizar, 1000);
    }
})();

// Racha de cada juego sobre su tarjeta: suma un día por cada acierto seguido
// y desaparece al perder o al saltear un día.
(function () {
    if (typeof TCdle === "undefined") {
        return;
    }

    // Dos banderas a cuadros cruzadas. Los cuadros siguen una onda para que
    // flameen; los blancos toman el color del texto y los negros van por CSS.
    const BANDERA_IZQUIERDA =
        '<g transform="rotate(-28 12 15)">' +
        '<rect x="11.2" y="4" width="1.6" height="19.5" rx=".8"/><circle cx="12" cy="4" r="1.5"/>' +
        '<path d="M11.2 5L9.32 5.9L9.32 7.9L11.2 7ZM11.2 9L9.32 9.9L9.32 11.9L11.2 11ZM9.32 7.9L7.45 7L7.45 9L9.32 9.9Z' +
        'M7.45 5L5.57 4.1L5.57 6.1L7.45 7ZM7.45 9L5.57 8.1L5.57 10.1L7.45 11ZM5.57 6.1L3.7 7L3.7 9L5.57 8.1Z"/>' +
        '<path class="tarjeta-juego__racha-negros" d="M11.2 7L9.32 7.9L9.32 9.9L11.2 9ZM9.32 5.9L7.45 5L7.45 7L9.32 7.9Z' +
        'M9.32 9.9L7.45 9L7.45 11L9.32 11.9ZM7.45 7L5.57 6.1L5.57 8.1L7.45 9ZM5.57 4.1L3.7 5L3.7 7L5.57 6.1Z' +
        'M5.57 8.1L3.7 9L3.7 11L5.57 10.1Z"/>' +
        '</g>';
    const BANDERAS_CRUZADAS =
        '<svg class="tarjeta-juego__racha-icono" viewBox="0 0 24 24" aria-hidden="true">' +
        BANDERA_IZQUIERDA +
        '<g transform="translate(24 0) scale(-1 1)">' + BANDERA_IZQUIERDA + '</g>' +
        '</svg>';

    TCdle.JUEGOS.forEach(function (juego) {
        const tarjeta = document.querySelector(".tarjeta-juego--" + juego.id);
        const racha = TCdle.obtenerRacha(juego.id);

        if (!tarjeta || racha < 1) {
            return;
        }

        const insignia = document.createElement("span");
        insignia.className = "tarjeta-juego__racha";
        insignia.innerHTML = BANDERAS_CRUZADAS;
        insignia.append(String(racha));
        insignia.setAttribute("aria-label", "Racha de " + racha + (racha === 1 ? " día" : " días"));
        tarjeta.appendChild(insignia);
    });
})();
