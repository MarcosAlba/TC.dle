import { crearGenerador, crearSemilla } from "./seleccion-diaria";

export const MAXIMO_INTENTOS_AUTO = 8;
/** Desenfoque en px según los intentos usados; al terminar la partida se ve nítida. */
export const NIVELES_DESENFOQUE = [24, 20, 16, 12, 9, 6, 3, 1, 0];
export const PRIMER_ANIO_TC = 1937;
export const CANTIDAD_OPCIONES_ANIO = 5;

export function obtenerNivelDesenfoque(intentosUsados: number, terminada: boolean): number {
    return terminada ? 0 : NIVELES_DESENFOQUE[Math.min(intentosUsados, NIVELES_DESENFOQUE.length - 1)];
}

/** Variables CSS del marco de la foto para un nivel de desenfoque. */
export function obtenerEstiloDesenfoque(nivel: number): { desenfoque: string; brillo: string; escala: string } {
    return {
        desenfoque: nivel / 16 + "rem",
        brillo: nivel > 12 ? "0.72" : "1",
        escala: nivel > 0 ? "1.08" : "1",
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

/** Modo detalle: zoom sobre un punto de la foto que se aleja con cada error. */
export const NIVELES_ZOOM = [2.6, 2.25, 1.95, 1.7, 1.5, 1.32, 1.18, 1.06, 1];

/** Variables CSS del marco en modo detalle; el punto del zoom sale de la semilla del día. */
export function obtenerEstiloDetalle(
    intentosUsados: number,
    terminada: boolean,
    semilla: string
): { desenfoque: string; brillo: string; escala: string; origen: string } {
    const aleatorio = crearGenerador(crearSemilla(semilla));
    // Cerca del centro: en las fotos el auto casi siempre está ahí (los bordes suelen ser tribuna o pista).
    const x = Math.round(40 + aleatorio() * 20);
    const y = Math.round(45 + aleatorio() * 20);
    const escala = terminada ? 1 : NIVELES_ZOOM[Math.min(intentosUsados, NIVELES_ZOOM.length - 1)];

    return { desenfoque: "0rem", brillo: "1", escala: String(escala), origen: x + "% " + y + "%" };
}
