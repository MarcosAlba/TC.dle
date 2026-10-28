import type { Carrera } from "../data/calendario";
import type { Carrera as CarreraCorrida } from "../data/tipos";

export interface CarreraConInicio extends Carrera {
    inicio: Date;
}

export interface GanadorAnterior {
    piloto: string;
    anio: number;
}

/** Quién ganó la última final en ese circuito antes de la fecha dada (AAAA-MM-DD). */
export function obtenerUltimoGanador(
    carreras: readonly CarreraCorrida[],
    circuito: string,
    antesDe: string
): GanadorAnterior | null {
    const ultima = carreras
        .filter((carrera) => carrera.circuito === circuito && carrera.fecha < antesDe)
        .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    const ganador = ultima?.resultados.find((resultado) => resultado.posicion === 1);

    return ganador ? { piloto: ganador.piloto, anio: ultima.anio } : null;
}

/** Primera carrera que todavía no largó, o null si no queda ninguna. */
export function obtenerProximaCarrera(calendario: readonly Carrera[], ahora: Date): CarreraConInicio | null {
    return (
        calendario
            .map((entrada) => ({ ...entrada, inicio: new Date(entrada.largada) }))
            .filter((entrada) => entrada.inicio > ahora)
            .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())[0] ?? null
    );
}

export interface TiempoRestante {
    dias: number;
    horas: number;
    minutos: number;
    segundos: number;
}

export function obtenerTiempoRestante(inicio: Date, ahora: Date): TiempoRestante {
    const restante = Math.max(0, Math.floor((inicio.getTime() - ahora.getTime()) / 1000));

    return {
        dias: Math.floor(restante / 86400),
        horas: Math.floor((restante % 86400) / 3600),
        minutos: Math.floor((restante % 3600) / 60),
        segundos: restante % 60,
    };
}

/** "Faltan 17 días", "Falta 1 día" o, en el último día, las horas o los minutos que quedan. */
export function describirTiempoRestante({ dias, horas, minutos }: TiempoRestante): string {
    const [cantidad, unidad] = dias > 0 ? [dias, "día"] : horas > 0 ? [horas, "hora"] : [Math.max(minutos, 1), "minuto"];

    return cantidad === 1 ? "Falta 1 " + unidad : "Faltan " + cantidad + " " + unidad + "s";
}
