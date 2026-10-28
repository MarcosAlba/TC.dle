// Flujo compartido por los juegos de adivinar con buscador (piloto, auto y
// circuito): estado reactivo de la partida, mensajes y validación del intento.
// Lo propio de cada juego (qué se muestra al terminar, la ronda del año, etc.)
// queda en su componente.
import type { ResolucionEntrada } from "../../lib/buscador";
import type { MensajesBusqueda } from "../../lib/mensajes";
import type { EstadoPartida, IdIntento, PartidaDiaria, ResultadoIntento } from "../../lib/partida";

export type TipoMensaje = "" | "error" | "exito" | "info";

export interface Textos extends MensajesBusqueda {
    /** Solo circuito: el autódromo tiene varias variantes. */
    ambiguo?: string;
}

export interface OpcionesJuego<T, Id extends IdIntento> {
    partida: PartidaDiaria<Id>;
    obtenerId: (elemento: T) => Id;
    textos: Textos;
    /** Se llama cuando el intento no vale (para sacudir el campo). */
    alError?: () => void;
}

export function crearJuegoAdivinanza<T, Id extends IdIntento>({ partida, obtenerId, textos, alError }: OpcionesJuego<T, Id>) {
    let estado = $state<EstadoPartida<Id>>(partida.cargar());
    let mensaje = $state<{ texto: string; tipo: TipoMensaje }>({ texto: "", tipo: "" });
    // Lo escrito en el campo no vale: se marca el campo hasta que se vuelva a escribir.
    let entradaInvalida = $state(false);

    function mostrarMensaje(texto: string, tipo: TipoMensaje = "") {
        mensaje = { texto, tipo };
        entradaInvalida = false;
    }

    function rechazar(texto: string): null {
        mensaje = { texto, tipo: "error" };
        entradaInvalida = true;
        alError?.();

        return null;
    }

    /**
     * Qué elemento quiso mandar el jugador, o null (con el mensaje de error
     * puesto) si el intento no vale: vacío, fuera de la lista, ambiguo o repetido.
     */
    function validar(entrada: string, resolucion: ResolucionEntrada<T>): T | null {
        if (estado.terminada) {
            return null;
        }
        if (entrada.trim() === "") {
            return rechazar(textos.vacio);
        }
        if (resolucion.ambiguo && textos.ambiguo) {
            return rechazar(textos.ambiguo);
        }
        if (!resolucion.elemento) {
            return rechazar(textos.noEncontrado);
        }
        if (estado.idsIntentados.includes(obtenerId(resolucion.elemento))) {
            return rechazar(textos.repetido);
        }

        return resolucion.elemento;
    }

    /** Registra el intento en la partida y actualiza el estado reactivo. */
    function jugar(elemento: T): ResultadoIntento {
        const intento = partida.intentar(obtenerId(elemento));
        estado = intento.estado;

        return intento.resultado;
    }

    return {
        get estado() {
            return estado;
        },
        get mensaje() {
            return mensaje;
        },
        get entradaInvalida() {
            return entradaInvalida;
        },
        mostrarMensaje,
        validar,
        jugar,
    };
}
