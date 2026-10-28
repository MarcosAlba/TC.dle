// Texto para compartir el resultado del día. Va sin spoilers: solo colores,
// nunca el nombre del piloto, del circuito ni la palabra.
import type { JuegoId } from "./juegos";
import type { Comparacion, EstadoCelda } from "./pilotos";
import type { EstadoLetra } from "./wordle";

export type CeldaCompartir = "verde" | "amarillo" | "negro";

const EMOJIS: Record<CeldaCompartir, string> = { verde: "🟩", amarillo: "🟨", negro: "⬛" };

const NOMBRES_JUEGO: Record<JuegoId, string> = {
    piloto: "Piloto",
    auto: "Auto",
    circuito: "Circuito",
    wordle: "Wordle",
    top10: "Top 10",
};

export interface DatosCompartir {
    juego: JuegoId;
    /** Día de la partida, "AAAA-MM-DD". */
    fecha: string;
    /** Cuántos intentos hicieron falta para ganar; null si no se ganó (se muestra "X"). */
    puntaje: number | null;
    /** Tope del marcador: intentos máximos, o los diez puestos del Top 10. */
    maximo: number;
    /** Días seguidos acertando este juego; con 0 no se muestra. */
    racha: number;
    filas: CeldaCompartir[][];
    /** Dirección del sitio, para que quien lo recibe pueda jugar. */
    url: string;
}

function formatearFecha(fecha: string): string {
    const [, mes, dia] = fecha.split("-");
    return dia + "/" + mes;
}

export function construirTextoCompartir(datos: DatosCompartir): string {
    const marcador = "🏁 " + (datos.puntaje === null ? "X" : datos.puntaje) + "/" + datos.maximo;
    const resumen = datos.racha > 0 ? marcador + " · 🔥 " + datos.racha : marcador;
    const filas = datos.filas.map((fila) => fila.map((celda) => EMOJIS[celda]).join(""));

    return [
        "TCdle · " + NOMBRES_JUEGO[datos.juego] + " · " + formatearFecha(datos.fecha),
        resumen,
        ...filas,
        datos.url,
    ].join("\n");
}

const celdaDeEstado = (estado: EstadoCelda): CeldaCompartir =>
    estado === "coincide" ? "verde" : estado === "cerca" ? "amarillo" : "negro";

const celdaBooleana = (coincide: boolean): CeldaCompartir => (coincide ? "verde" : "negro");

/** Las seis pistas de un intento del piloto, en el orden de la tabla. */
export function filaPiloto(comparacion: Comparacion): CeldaCompartir[] {
    return [
        celdaBooleana(comparacion.marca),
        celdaBooleana(comparacion.equipo),
        celdaDeEstado(comparacion.localidad),
        celdaBooleana(comparacion.campeon),
        celdaDeEstado(comparacion.edad.estado),
        celdaDeEstado(comparacion.debut.estado),
    ];
}

/** Una letra por celda, igual que el tablero del Wordle. */
export function filaWordle(estados: readonly EstadoLetra[]): CeldaCompartir[] {
    return estados.map((estado) => (estado === "correcta" ? "verde" : estado === "presente" ? "amarillo" : "negro"));
}

/** Auto y circuito: una celda por intento, con la última en verde si se ganó. */
export function filaIntentos(intentosUsados: number, acerto: boolean): CeldaCompartir[] {
    return Array.from({ length: intentosUsados }, (_, indice) =>
        acerto && indice === intentosUsados - 1 ? "verde" : "negro"
    );
}

/** Top 10: una celda por puesto, en verde los que se descubrieron. */
export function filaTop10(acertados: readonly number[], puestos: number): CeldaCompartir[] {
    return Array.from({ length: puestos }, (_, indice) => celdaBooleana(acertados.includes(indice + 1)));
}

export type ResultadoCompartir = "compartido" | "copiado" | "cancelado" | "error";

export interface EntornoCompartir {
    /** Menú de compartir del sistema; solo se pasa en celulares y tablets. */
    compartir?: (datos: { text: string }) => Promise<void>;
    copiar?: (texto: string) => Promise<void>;
}

/**
 * Comparte con el menú del sistema si hay uno y, si no (o si falla), copia al
 * portapapeles. Cerrar el menú sin elegir nada no es un error.
 */
export async function compartirTexto(texto: string, entorno: EntornoCompartir): Promise<ResultadoCompartir> {
    if (entorno.compartir) {
        try {
            await entorno.compartir({ text: texto });
            return "compartido";
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return "cancelado";
            }
        }
    }

    if (entorno.copiar) {
        try {
            await entorno.copiar(texto);
            return "copiado";
        } catch {
            return "error";
        }
    }

    return "error";
}
