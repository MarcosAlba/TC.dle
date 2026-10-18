import { LARGO_MAXIMO_PALABRA, LARGO_MINIMO_PALABRA } from "../data/tipos";

export type EstadoLetra = "correcta" | "presente" | "ausente";

export const PRIORIDAD_ESTADO: Record<EstadoLetra, number> = { ausente: 0, presente: 1, correcta: 2 };

export const FILAS_TECLADO: readonly (readonly string[])[] = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BORRAR"],
];

/** Evaluación pura de un intento contra la palabra objetivo (letras repetidas incluidas). */
export function evaluarIntento(intento: string, objetivo: string): EstadoLetra[] {
    const letrasIntento = intento.split("");
    const letrasObjetivo = objetivo.split("");
    const resultado: EstadoLetra[] = new Array(letrasIntento.length).fill("ausente");
    const disponibles: (string | null)[] = letrasObjetivo.slice();

    letrasIntento.forEach((letra, indice) => {
        if (letra === letrasObjetivo[indice]) {
            resultado[indice] = "correcta";
            disponibles[indice] = null;
        }
    });

    letrasIntento.forEach((letra, indice) => {
        if (resultado[indice] === "correcta") {
            return;
        }

        const posicion = disponibles.indexOf(letra);
        if (posicion !== -1) {
            resultado[indice] = "presente";
            disponibles[posicion] = null;
        }
    });

    return resultado;
}

/** Palabras que entran en el tablero (la selección diaria se hace sobre estas). */
export function filtrarPalabrasJugables(palabras: readonly string[]): string[] {
    return palabras.filter((palabra) => palabra.length >= LARGO_MINIMO_PALABRA && palabra.length <= LARGO_MAXIMO_PALABRA);
}

/** Mejor estado conocido de cada letra, para pintar el teclado (una letra nunca baja de estado). */
export function mejorarEstadoTecla(
    actual: EstadoLetra | undefined,
    nuevo: EstadoLetra
): EstadoLetra {
    return actual && PRIORIDAD_ESTADO[actual] >= PRIORIDAD_ESTADO[nuevo] ? actual : nuevo;
}

/** Cualquier combinación de letras A-Z/Ñ del largo de la palabra del día es un intento válido. */
export function esIntentoValido(id: unknown, largo: number): boolean {
    return typeof id === "string" && id.length === largo && /^[A-ZÑ]+$/.test(id);
}
