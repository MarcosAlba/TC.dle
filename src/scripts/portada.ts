// Portada: racha de cada juego sobre su tarjeta y cuenta regresiva a la
// próxima carrera. No usa Svelte: es DOM mínimo y la portada queda liviana.
import { calendarioTC } from "../data/calendario";
import { obtenerAlmacenamiento } from "../lib/almacenamiento";
import { obtenerProximaCarrera, obtenerTiempoRestante, type CarreraConInicio } from "../lib/calendario";
import { JUEGOS } from "../lib/juegos";
import { obtenerRacha } from "../lib/rachas";
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

function iniciarCuentaRegresiva(): void {
    const bloque = document.getElementById("proxima-carrera");

    if (!bloque) {
        return;
    }

    const campo = (id: string) => document.getElementById("proxima-carrera-" + id)!;
    const trazado = campo("trazado") as HTMLImageElement;
    let carrera = null as CarreraConInicio | null;
    let intervalo: number | undefined;

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
        bloque!.setAttribute("aria-label", "Próxima carrera: fecha " + carrera.fecha + " en " + carrera.lugar + ", el " + dia);
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
    }

    mostrarCarrera();

    if (carrera) {
        actualizar();
        intervalo = window.setInterval(actualizar, 1000);
    }
}

mostrarRachas();
iniciarCuentaRegresiva();
