// Historial de cada piloto del plantel de la Grilla y Conexiones, sacado de
// fuentes (ACTC, Wikipedia y prensa): lo que no está en las finales desde 2010.
// Solo se usa al construir el sitio, para armar las fichas.
import datos from "../historial-pilotos.json";

/** Lo que se sabe de la carrera de un piloto más allá de las finales desde 2010. */
export interface HistorialPiloto {
    id: number;
    /** Marcas con las que corrió el TC (toda la carrera para las leyendas, antes de 2010 para el resto). */
    marcas: string[];
    /** Victorias en finales de toda su carrera, si se conocen (leyendas y ex pilotos). */
    victoriasTotales: number | null;
    /** Victorias en finales antes de 2010 (las de después salen de carreras.json). */
    victoriasAntes2010: number;
    /** Años en que fue subcampeón del TC (tabla oficial de la ACTC). */
    subcampeon: number[];
    /** Títulos en TC Pista, TC Mouras o TC Pista Mouras ("TC Pista 2008"). */
    escuela: string[];
    /** Años en que clasificó a la Copa de Oro, de 2008 a 2025. */
    copaDeOro: number[];
    /** Ids de parientes que también están en el plantel. */
    familia: number[];
    /** Corrió fuera de Argentina (F1, IndyCar, WTCC, Dakar, 24 Horas de Daytona...). */
    exterior: boolean;
    formula1: boolean;
}

export const historialPilotos = datos as HistorialPiloto[];
