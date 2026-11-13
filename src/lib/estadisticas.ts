// Estadísticas de cada juego para el pop up de fin de partida: partidas jugadas,
// ganadas, porcentaje, racha y mejor racha (salen del historial por día) y la
// distribución de resultados ("en cuántos intentos" o "cuántos puntos"), que se
// guarda aparte en "tcdleDistribucion" desde que existe este pop up.
import { leerJson, type Almacenamiento } from "./almacenamiento";
import type { MarcadorJuego } from "./dia";
import { leerHistorial } from "./dia-juego";
import { obtenerFechaAnterior } from "./fechas";
import type { JuegoId } from "./juegos";
import { obtenerRacha } from "./rachas";

export const CLAVE_DISTRIBUCION = "tcdleDistribucion";

/** Juegos que se miden en puntos (de 0 al máximo) y no en intentos para ganar. */
const JUEGOS_POR_PUNTOS: readonly JuegoId[] = ["top10", "grilla"];

interface Distribucion {
    /** Resultado → cuántas veces: "1".."8" (o los puntos) y "X" para las perdidas. */
    cuentas: Record<string, number>;
    /** Máximo del último marcador (el Wordle cambia con el largo de la palabra). */
    maximo: number;
}

type Distribuciones = Partial<Record<JuegoId, Distribucion>>;

export const claveResultado = (marcador: Pick<MarcadorJuego, "puntaje">) => (marcador.puntaje === null ? "X" : String(marcador.puntaje));

/** Suma el resultado de una partida recién terminada (una sola vez por día: lo decide registrarHistorial). */
export function registrarDistribucion(almacenamiento: Almacenamiento, juego: JuegoId, marcador: MarcadorJuego): void {
    const todas = leerJson<Distribuciones>(almacenamiento, CLAVE_DISTRIBUCION) ?? {};
    const actual = todas[juego] ?? { cuentas: {}, maximo: marcador.maximo };
    const clave = claveResultado(marcador);
    actual.cuentas[clave] = (actual.cuentas[clave] ?? 0) + 1;
    actual.maximo = marcador.maximo;
    todas[juego] = actual;

    try {
        almacenamiento.setItem(CLAVE_DISTRIBUCION, JSON.stringify(todas));
    } catch {
        // Sin almacenamiento no hay distribución que recordar.
    }
}

export interface Barra {
    etiqueta: string;
    cantidad: number;
    /** Es el resultado de la partida que se está mirando. */
    actual: boolean;
}

export interface Estadisticas {
    jugadas: number;
    ganadas: number;
    porcentaje: number;
    racha: number;
    mejorRacha: number;
    tipo: "intentos" | "puntos";
    barras: Barra[];
}

/** Días seguidos ganados más largos del historial. */
function calcularMejorRacha(dias: Array<[string, boolean]>): number {
    let mejor = 0;
    let actual = 0;
    let anterior: string | null = null;

    for (const [fecha, gano] of dias) {
        if (!gano) {
            actual = 0;
        } else {
            actual = anterior !== null && obtenerFechaAnterior(fecha) === anterior && actual > 0 ? actual + 1 : 1;
        }
        mejor = Math.max(mejor, actual);
        anterior = fecha;
    }

    return mejor;
}

export function calcularEstadisticas(
    almacenamiento: Almacenamiento,
    juego: JuegoId,
    fecha: string,
    marcadorActual: MarcadorJuego | null = null
): Estadisticas {
    const historial = leerHistorial(almacenamiento);
    const dias = Object.keys(historial)
        .filter((dia) => historial[dia]?.[juego])
        .sort()
        .map((dia): [string, boolean] => [dia, historial[dia][juego] === "acertado"]);
    const jugadas = dias.length;
    const ganadas = dias.filter(([, gano]) => gano).length;
    const distribucion = (leerJson<Distribuciones>(almacenamiento, CLAVE_DISTRIBUCION) ?? {})[juego];
    const maximo = marcadorActual?.maximo ?? distribucion?.maximo ?? 0;
    const tipo = JUEGOS_POR_PUNTOS.includes(juego) ? "puntos" : "intentos";
    const claves =
        tipo === "puntos"
            ? Array.from({ length: maximo + 1 }, (_, valor) => String(valor))
            : [...Array.from({ length: maximo }, (_, indice) => String(indice + 1)), "X"];
    const actual = marcadorActual ? claveResultado(marcadorActual) : null;

    return {
        jugadas,
        ganadas,
        porcentaje: jugadas === 0 ? 0 : Math.round((ganadas / jugadas) * 100),
        racha: obtenerRacha(almacenamiento, juego, fecha),
        mejorRacha: calcularMejorRacha(dias),
        tipo,
        barras: claves.map((clave) => ({ etiqueta: clave, cantidad: distribucion?.cuentas[clave] ?? 0, actual: clave === actual })),
    };
}
