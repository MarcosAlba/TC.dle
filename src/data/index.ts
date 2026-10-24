import autosJson from "./autos.json";
import carrerasJson from "./carreras.json";
import circuitosJson from "./circuitos.json";
import fotosCarrerasJson from "./fotos-carreras.json";
import palabrasJson from "./palabras.json";
import pilotosJson from "./pilotos.json";
import type { Auto, Carrera, Circuito, FotoCarrera, Palabra, Piloto } from "./tipos";

export const pilotos = pilotosJson as Piloto[];
export const autos = autosJson as Auto[];
export const circuitos = circuitosJson as Circuito[];
export const palabras: Palabra[] = palabrasJson;
export const carreras = carrerasJson as Carrera[];
export const fotosCarreras = fotosCarrerasJson as FotoCarrera[];

export type { Auto, Carrera, Circuito, FotoCarrera, Palabra, Piloto } from "./tipos";

// Al construir (y en dev) se valida; este bloque no llega al navegador.
if (import.meta.env.SSR) {
    const { validarAutos, validarCarreras, validarCircuitos, validarFotosCarreras, validarPalabras, validarPilotos } = await import(
        "./validar"
    );
    validarPilotos(pilotos);
    validarAutos(autos, pilotos);
    validarCircuitos(circuitos);
    validarPalabras(palabras);
    validarCarreras(carreras);
    validarFotosCarreras(fotosCarreras);
}
