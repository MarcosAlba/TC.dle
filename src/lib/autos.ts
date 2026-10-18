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
