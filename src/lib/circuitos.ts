import type { Circuito } from "../data/tipos";
import { normalizarTexto } from "./texto";

/** "Autódromo X — Variante", con la ciudad entre paréntesis si otro circuito se llamaría igual. */
export function obtenerEtiquetaCircuito(circuito: Circuito, circuitos: readonly Circuito[]): string {
    const etiquetaRepetida = circuitos.some(
        (item) => item.id !== circuito.id && item.nombre === circuito.nombre && item.variante === circuito.variante
    );
    const ubicacion = etiquetaRepetida ? " (" + circuito.ciudad + ")" : "";
    const variante = circuito.variante === "Circuito principal" ? "" : " — " + circuito.variante;

    return circuito.nombre + variante + ubicacion;
}

export function obtenerTextoBusquedaCircuito(circuito: Circuito): string {
    return [circuito.nombre, circuito.variante, circuito.ciudad, circuito.provincia, ...circuito.aliases]
        .map(normalizarTexto)
        .join(" ");
}

export function obtenerValoresExactosCircuito(circuito: Circuito, circuitos: readonly Circuito[]): string[] {
    return [obtenerEtiquetaCircuito(circuito, circuitos), circuito.nombre, ...circuito.aliases];
}

/** El autódromo tiene más de una configuración jugable: el historial muestra cuál era. */
export function tieneVariantes(circuito: Circuito, circuitos: readonly Circuito[]): boolean {
    return circuitos.some((item) => item.id !== circuito.id && item.sedeId === circuito.sedeId);
}

export function obtenerDetalleCircuito(circuito: Circuito): string {
    return circuito.variante === "Circuito principal" ? circuito.ciudad : circuito.variante + " · " + circuito.ciudad;
}

/** La punta de Argentina a la otra (La Quiaca–Ushuaia): con esto la cercanía va de 0 a 100. */
const DISTANCIA_MAXIMA_KM = 3700;

const DIRECCIONES = ["norte", "noreste", "este", "sudeste", "sur", "sudoeste", "oeste", "noroeste"] as const;

export interface PistaUbicacion {
    /** Kilómetros en línea recta, redondeados. 0 si es el mismo autódromo. */
    km: number;
    /** Rumbo desde el intento hacia el circuito del día, en grados (0 = norte, 90 = este). */
    grados: number;
    direccion: (typeof DIRECCIONES)[number];
    /** 100 es el mismo lugar; 0, la otra punta del país. */
    cercania: number;
    mismaSede: boolean;
}

const radianes = (grados: number) => (grados * Math.PI) / 180;

/** Distancia y dirección de un intento al circuito del día, como Worldle. */
export function calcularPistaUbicacion(intento: Circuito, objetivo: Circuito): PistaUbicacion {
    const mismaSede = intento.sedeId === objetivo.sedeId;
    const desde = intento.coordenadas;
    const hasta = objetivo.coordenadas;
    const fi1 = radianes(desde.lat);
    const fi2 = radianes(hasta.lat);
    const deltaLat = radianes(hasta.lat - desde.lat);
    const deltaLon = radianes(hasta.lon - desde.lon);

    // Haversine sobre una esfera de 6371 km: alcanza para una pista.
    const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(fi1) * Math.cos(fi2) * Math.sin(deltaLon / 2) ** 2;
    const km = mismaSede ? 0 : Math.round(2 * 6371 * Math.asin(Math.sqrt(h)));
    const y = Math.sin(deltaLon) * Math.cos(fi2);
    const x = Math.cos(fi1) * Math.sin(fi2) - Math.sin(fi1) * Math.cos(fi2) * Math.cos(deltaLon);
    const grados = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);

    return {
        km,
        grados,
        direccion: DIRECCIONES[Math.round(grados / 45) % 8],
        cercania: Math.max(0, Math.round(100 * (1 - km / DISTANCIA_MAXIMA_KM))),
        mismaSede,
    };
}
