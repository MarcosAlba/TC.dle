import type { Carrera } from "../data/calendario";

export interface CarreraConInicio extends Carrera {
    inicio: Date;
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
