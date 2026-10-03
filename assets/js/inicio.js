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
