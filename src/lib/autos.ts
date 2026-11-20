import { crearGenerador, crearSemilla } from "./seleccion-diaria";

export const MAXIMO_INTENTOS_AUTO = 8;
/** Desenfoque en px según los intentos usados; al terminar la partida se ve nítida. */
export const NIVELES_DESENFOQUE = [24, 20, 16, 12, 9, 6, 3, 1, 0];
export const PRIMER_ANIO_TC = 1937;
export const CANTIDAD_OPCIONES_ANIO = 5;

/**
 * Modo difícil: la misma foto y el mismo desenfoque, pero en blanco y negro hasta
 * terminar, así los colores de la decoración no lo regalan. Se elige en la introducción.
 */
export const MODOS_AUTO = ["normal", "dificil"] as const;
export type ModoAuto = (typeof MODOS_AUTO)[number];
export const CLAVE_MODO_AUTO = "tcdleAutoModo";
/** Lo dispara la introducción al tocar "Empezar", con el modo en `detail`. */
export const EVENTO_MODO_AUTO = "tcdle:auto-modo";

/** Lo que llega del almacenamiento o de la introducción; lo de antes ("borroso", "detalle") vale como normal. */
export function normalizarModoAuto(valor: unknown): ModoAuto {
    return valor === "dificil" ? "dificil" : "normal";
}

export function obtenerNivelDesenfoque(intentosUsados: number, terminada: boolean): number {
    return terminada ? 0 : NIVELES_DESENFOQUE[Math.min(intentosUsados, NIVELES_DESENFOQUE.length - 1)];
}

/** Variables CSS del marco de la foto para un nivel de desenfoque (y si va en blanco y negro). */
export function obtenerEstiloDesenfoque(nivel: number, gris = false): { desenfoque: string; brillo: string; escala: string; gris: string } {
    return {
        desenfoque: nivel / 16 + "rem",
        brillo: nivel > 12 ? "0.72" : "1",
        escala: nivel > 0 ? "1.08" : "1",
        gris: gris ? "1" : "0",
    };
}

/**
 * Cinco años ordenados: el real y cuatro señuelos a menos de 8 años de
 * distancia, nunca más nuevos que el año tope. El sorteo tiene semilla, así
 * los señuelos son los mismos durante todo el día, incluso al recargar.
 */
export function generarOpcionesAnio(
    anioReal: number,
    semilla: string,
    anioTope: number = new Date().getFullYear()
): number[] {
    const aleatorio = crearGenerador(crearSemilla(semilla));
    const opciones = [anioReal];

    while (opciones.length < CANTIDAD_OPCIONES_ANIO) {
        const desplazamiento = Math.floor(aleatorio() * 16) - 8;
        const candidato = anioReal + desplazamiento;

        if (
            desplazamiento !== 0 &&
            candidato >= PRIMER_ANIO_TC &&
            candidato <= anioTope &&
            !opciones.includes(candidato)
        ) {
            opciones.push(candidato);
        }
    }

    return opciones.sort((a, b) => a - b);
}

