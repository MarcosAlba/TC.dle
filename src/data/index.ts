import autosJson from "./autos.json";
import circuitosJson from "./circuitos.json";
import palabrasJson from "./palabras.json";
import pilotosJson from "./pilotos.json";
import type { Auto, Circuito, Palabra, Piloto } from "./tipos";

export const pilotos = pilotosJson as Piloto[];
export const autos = autosJson as Auto[];
export const circuitos = circuitosJson as Circuito[];
export const palabras: Palabra[] = palabrasJson;

export type { Auto, Circuito, Palabra, Piloto } from "./tipos";

// Al construir (y en dev) se valida; este bloque no llega al navegador.
if (import.meta.env.SSR) {
    const { validarAutos, validarCircuitos, validarPalabras, validarPilotos } = await import("./validar");
    validarPilotos(pilotos);
    validarAutos(autos, pilotos);
    validarCircuitos(circuitos);
    validarPalabras(palabras);
}
