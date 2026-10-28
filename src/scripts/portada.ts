// Portada: racha y estado del día de cada juego sobre su tarjeta, la fecha y el
// progreso del día, y la cuenta regresiva a la próxima carrera. No usa Svelte:
// es DOM mínimo y la portada queda liviana.
import { calendarioTC } from "../data/calendario";
import { obtenerAlmacenamiento } from "../lib/almacenamiento";
import { describirTiempoRestante, obtenerProximaCarrera, obtenerTiempoRestante, type CarreraConInicio } from "../lib/calendario";
import { JUEGOS } from "../lib/juegos";
import { obtenerProgresoJuego, obtenerRacha } from "../lib/rachas";
import { urlImagen } from "../lib/rutas";

// Racha sobre la tarjeta: suma un día por cada acierto seguido y desaparece
// al perder o al saltear un día.
function mostrarRachas(): void {
    const almacenamiento = obtenerAlmacenamiento();

    for (const juego of JUEGOS) {
        const tarjeta = document.querySelector(`.tarjeta-juego--${juego.id}`);
        const insignia = tarjeta?.querySelector<HTMLElement>(".tarjeta-juego__racha");
        const racha = obtenerRacha(almacenamiento, juego.id);

        if (!insignia || racha < 1) {
            continue;
        }

        insignia.querySelector("[data-racha]")!.textContent = String(racha);
        insignia.setAttribute("aria-label", "Racha de " + racha + (racha === 1 ? " día" : " días"));
        insignia.hidden = false;
    }
}

const dosDigitos = (numero: number): string => String(numero).padStart(2, "0");

// En PC el estado se ve en el color de la franja del zócalo; esto es lo que oye el lector de pantalla.
function describirProgreso(estado: ReturnType<typeof obtenerProgresoJuego>): string {
    if (estado === "acertado") {
        return "Resuelto.";
    }
    if (estado === "fallado") {
        return "Terminado sin acertar.";
    }
    return estado === "en-curso" ? "En curso." : "Sin jugar.";
}

function mostrarEstados(): void {
    const almacenamiento = obtenerAlmacenamiento();
    let completados = 0;

    for (const juego of JUEGOS) {
        const tarjeta = document.querySelector<HTMLElement>(`.tarjeta-juego--${juego.id}`);
        if (!tarjeta) {
            continue;
        }

        const progreso = obtenerProgresoJuego(almacenamiento, juego);
        tarjeta.dataset.estado = progreso;
        tarjeta.querySelector("[data-estado-lector]")!.textContent = describirProgreso(progreso);

        if (progreso === "acertado" || progreso === "fallado") {
            completados++;
        }
    }

    const fecha = new Date();
    const dia = fecha.toLocaleDateString("es-AR", { weekday: "long" });
    document.getElementById("fecha-hoy")!.textContent = dia + " " + dosDigitos(fecha.getDate()) + "/" + dosDigitos(fecha.getMonth() + 1);

    const bloque = document.getElementById("progreso-dia")!;
    document.getElementById("progreso-dia-cuenta")!.textContent = completados + " de " + JUEGOS.length;
    bloque.querySelectorAll("i").forEach((tramo, indice) => tramo.classList.toggle("lleno", indice < completados));
    bloque.hidden = false;
}

function iniciarCuentaRegresiva(): void {
    const bloque = document.getElementById("proxima-carrera");

    if (!bloque) {
        return;
    }

    const campo = (id: string) => document.getElementById("proxima-carrera-" + id)!;
    const trazado = campo("trazado") as HTMLImageElement;
    const ganadores = JSON.parse(bloque.dataset.ganadores || "{}") as Record<string, { piloto: string; anio: number }>;
    const resumen = campo("resumen");
    let carrera = null as CarreraConInicio | null;
    let intervalo: number | undefined;
    // El resumen para lectores de pantalla se reescribe solo cuando cambia lo que dice, no cada segundo.
    let frase = "";
    let fraseActual = "";

    function mostrarCarrera(): void {
        carrera = obtenerProximaCarrera(calendarioTC, new Date());
        bloque!.hidden = !carrera;

        if (!carrera) {
            clearInterval(intervalo);
            return;
        }

        const dia = carrera.inicio.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
        campo("fecha").textContent = "Fecha " + carrera.fecha;
        campo("lugar").textContent = carrera.lugar;
        trazado.hidden = !carrera.circuito;
        if (carrera.circuito) {
            trazado.src = urlImagen("circuitos/" + carrera.circuito + ".svg");
        }
        const ganador = ganadores[carrera.fecha];
        campo("ganador").hidden = !ganador;
        if (ganador) {
            campo("ganador-nombre").textContent = ganador.piloto;
            campo("ganador-anio").textContent = String(ganador.anio);
        }
        frase =
            "Fecha " +
            carrera.fecha +
            ", " +
            carrera.lugar +
            ", el " +
            dia +
            "." +
            (ganador ? " La última vez ganó " + ganador.piloto + ", en " + ganador.anio + "." : "");
        fraseActual = "";
    }

    function actualizar(): void {
        // Al largar la carrera, pasa a la siguiente del calendario.
        if (!carrera || Math.floor((carrera.inicio.getTime() - Date.now()) / 1000) <= 0) {
            mostrarCarrera();
            if (!carrera) {
                return;
            }
        }

        const { dias, horas, minutos, segundos } = obtenerTiempoRestante(carrera.inicio, new Date());
        campo("dias").textContent = dosDigitos(dias);
        campo("horas").textContent = dosDigitos(horas);
        campo("minutos").textContent = dosDigitos(minutos);
        campo("segundos").textContent = dosDigitos(segundos);

        const restante = describirTiempoRestante({ dias, horas, minutos, segundos });
        if (restante !== fraseActual) {
            fraseActual = restante;
            resumen.textContent = frase + " " + restante + ".";
        }
    }

    mostrarCarrera();

    if (carrera) {
        actualizar();
        intervalo = window.setInterval(actualizar, 1000);
    }
}

mostrarRachas();
mostrarEstados();
iniciarCuentaRegresiva();
