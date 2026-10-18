// Flujo compartido por los juegos de adivinar con buscador (piloto, auto y
// circuito): estado reactivo de la partida, mensajes y validación del intento.
// Lo propio de cada juego (qué se muestra al terminar, la ronda del año, etc.)
// queda en su componente.
import type { ResolucionEntrada } from "../../lib/buscador";
import type { EstadoPartida, IdIntento, PartidaDiaria, ResultadoIntento } from "../../lib/partida";

export type TipoMensaje = "" | "error" | "exito" | "info";

export interface Textos {
    /** "Ingresá o elegí un piloto." */
    vacio: string;
    /** "Ese piloto no está en la lista." */
    noEncontrado: string;
    /** "Ya intentaste con ese piloto." */
    repetido: string;
    /** Solo circuito: el autódromo tiene varias variantes. */
    ambiguo?: string;
}

export interface OpcionesJuego<T, Id extends IdIntento> {
    partida: PartidaDiaria<Id>;
    obtenerId: (elemento: T) => Id;
    textos: Textos;
}

export function crearJuegoAdivinanza<T, Id extends IdIntento>({ partida, obtenerId, textos }: OpcionesJuego<T, Id>) {
    let estado = $state<EstadoPartida<Id>>(partida.cargar());
    let mensaje = $state<{ texto: string; tipo: TipoMensaje }>({ texto: "", tipo: "" });

    function mostrarMensaje(texto: string, tipo: TipoMensaje = "") {
        mensaje = { texto, tipo };
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
            mostrarMensaje(textos.vacio, "error");
            return null;
        }
        if (resolucion.ambiguo && textos.ambiguo) {
            mostrarMensaje(textos.ambiguo, "error");
            return null;
        }
        if (!resolucion.elemento) {
            mostrarMensaje(textos.noEncontrado, "error");
            return null;
        }
        if (estado.idsIntentados.includes(obtenerId(resolucion.elemento))) {
            mostrarMensaje(textos.repetido, "error");
            return null;
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
        mostrarMensaje,
        validar,
        jugar,
    };
}
