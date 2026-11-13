export interface ResumenIntentos {
    terminada: boolean;
    intentosUsados: number;
    maximoIntentos: number;
}

export interface ContadorIntentos {
    texto: string;
    /** Número del intento en curso (o el último jugado si la partida terminó). */
    numero: number;
    /** Cantidad total de intentos de la partida. */
    maximo: number;
    /** Queda un solo intento: es el único momento en que el contador se ve. */
    ultimo: boolean;
}

/**
 * Contador de intentos: el texto es para el lector de pantalla; a la vista se
 * muestra como una fila de marcas (components/MarcasIntentos.svelte).
 */
export function describirContador(partida: ResumenIntentos): ContadorIntentos {
    const numero = Math.min(
        Math.max(partida.terminada ? partida.intentosUsados : partida.intentosUsados + 1, 1),
        partida.maximoIntentos
    );
    const ultimo = !partida.terminada && partida.maximoIntentos > 1 && numero === partida.maximoIntentos;

    return {
        texto: ultimo ? "Último intento" : "Intento " + numero + " de " + partida.maximoIntentos,
        numero,
        maximo: partida.maximoIntentos,
        ultimo,
    };
}

export const palabraIntentos = (cantidad: number): string => (cantidad === 1 ? "intento" : "intentos");
