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
