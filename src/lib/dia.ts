// Resumen del día: el marcador de cada juego terminado hoy, para compartir los
// ocho en un solo mensaje. Se guarda aparte ("tcdleResumenDia") para no tocar
// el formato de las partidas, que fija tests/almacenamiento-contrato.test.ts.
import { leerJson, type Almacenamiento } from "./almacenamiento";
import { MILISEGUNDOS_POR_DIA } from "./fechas";
import { JUEGOS, type JuegoId } from "./juegos";

export const CLAVE_RESUMEN_DIA = "tcdleResumenDia";

/** Día en que salió TCdle: es el #1 del texto que se comparte. */
export const FECHA_LANZAMIENTO = "2026-07-29";

export interface MarcadorJuego {
    /** Intentos que hicieron falta (o puestos descubiertos en el Top 10); null si no se ganó. */
    puntaje: number | null;
    maximo: number;
    gano: boolean;
}

interface ResumenDia {
    fecha: string;
    juegos: Partial<Record<JuegoId, MarcadorJuego>>;
}

const ICONOS: Record<JuegoId, string> = { piloto: "👤", auto: "🚗", circuito: "🗺️", wordle: "🔤", top10: "🏆", trayectoria: "📅", grilla: "🔢", conexiones: "🔗" };

/** Número de TCdle de una fecha "AAAA-MM-DD": el día del lanzamiento es el 1. */
export function obtenerNumeroTCdle(fecha: string): number {
    const aDia = (texto: string) => {
        const [anio, mes, dia] = texto.split("-").map(Number);
        return Date.UTC(anio, mes - 1, dia) / MILISEGUNDOS_POR_DIA;
    };

    return aDia(fecha) - aDia(FECHA_LANZAMIENTO) + 1;
}

export function registrarMarcadorDia(almacenamiento: Almacenamiento, fecha: string, juego: JuegoId, marcador: MarcadorJuego): void {
    const guardado = leerJson<ResumenDia>(almacenamiento, CLAVE_RESUMEN_DIA);
    const resumen: ResumenDia = guardado?.fecha === fecha ? guardado : { fecha, juegos: {} };
    resumen.juegos[juego] = { puntaje: marcador.puntaje, maximo: marcador.maximo, gano: marcador.gano };

    try {
        almacenamiento.setItem(CLAVE_RESUMEN_DIA, JSON.stringify(resumen));
    } catch {
        // Sin almacenamiento no hay resumen del día.
    }
}

/** Los marcadores de hoy en el orden de los juegos; null si falta terminar alguno. */
export function obtenerDiaCompleto(almacenamiento: Almacenamiento, fecha: string): Array<{ juego: JuegoId; marcador: MarcadorJuego }> | null {
    const resumen = leerJson<ResumenDia>(almacenamiento, CLAVE_RESUMEN_DIA);
    if (resumen?.fecha !== fecha) {
        return null;
    }

    const lista = JUEGOS.map((juego) => ({ juego: juego.id, marcador: resumen.juegos[juego.id] }));
    return lista.every((item) => item.marcador) ? (lista as Array<{ juego: JuegoId; marcador: MarcadorJuego }>) : null;
}

const textoMarcador = ({ puntaje, maximo }: MarcadorJuego) => (puntaje === null ? "X" : puntaje) + "/" + maximo;

/** "TCdle #96 🏁 4/5" y un renglón por juego, sin spoilers. */
export function construirTextoDia(fecha: string, dia: Array<{ juego: JuegoId; marcador: MarcadorJuego }>, url: string): string {
    const ganados = dia.filter((item) => item.marcador.gano).length;
    const renglones = dia.map(({ juego, marcador }) => {
        const nombre = JUEGOS.find((item) => item.id === juego)!.corto;
        return ICONOS[juego] + " " + nombre + " " + textoMarcador(marcador);
    });

    return ["TCdle #" + obtenerNumeroTCdle(fecha) + " 🏁 " + ganados + "/" + dia.length, ...renglones, url].join("\n");
}
