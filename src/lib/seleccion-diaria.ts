// Selección diaria: todos los jugadores ven el mismo elemento el mismo día.
// El catálogo se mezcla con una semilla fija (clave + cantidad) y cada día
// toma la posición siguiente de esa mezcla. Cambiar el algoritmo, el orden o
// la cantidad de un catálogo cambia lo que sale: ver tests/fixtures.
import { MILISEGUNDOS_POR_DIA } from "./fechas";

/** FNV-1a de 32 bits. También se usa para otros sorteos con semilla (opciones del año). */
export function crearSemilla(texto: string): number {
    let semilla = 2166136261;

    for (let indice = 0; indice < texto.length; indice++) {
        semilla ^= texto.charCodeAt(indice);
        semilla = Math.imul(semilla, 16777619);
    }

    return semilla >>> 0;
}

/** Mulberry32: generador pseudoaleatorio determinístico a partir de una semilla. */
export function crearGenerador(semillaInicial: number): () => number {
    let semilla = semillaInicial;

    return function () {
        semilla += 0x6d2b79f5;
        let resultado = semilla;
        resultado = Math.imul(resultado ^ (resultado >>> 15), resultado | 1);
        resultado ^= resultado + Math.imul(resultado ^ (resultado >>> 7), resultado | 61);
        return ((resultado ^ (resultado >>> 14)) >>> 0) / 4294967296;
    };
}

export function crearOrdenMezclado(cantidad: number, clave: string): number[] {
    const orden = Array.from({ length: cantidad }, (_, indice) => indice);
    const aleatorio = crearGenerador(crearSemilla(clave + ":" + cantidad));

    for (let indice = orden.length - 1; indice > 0; indice--) {
        const intercambio = Math.floor(aleatorio() * (indice + 1));
        const temporal = orden[indice];
        orden[indice] = orden[intercambio];
        orden[intercambio] = temporal;
    }

    return orden;
}

export function obtenerNumeroDeDia(fecha: Date): number {
    const fechaUtc = Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

    return Math.floor(fechaUtc / MILISEGUNDOS_POR_DIA);
}

/** Elemento del día, o null si el catálogo está vacío. */
export function obtenerSeleccionDiaria<T>(elementos: readonly T[], clave: string, fecha: Date = new Date()): T | null {
    if (!Array.isArray(elementos) || elementos.length === 0) {
        return null;
    }

    const orden = crearOrdenMezclado(elementos.length, String(clave));
    const posicion = obtenerNumeroDeDia(fecha) % orden.length;

    return elementos[orden[posicion]];
}
