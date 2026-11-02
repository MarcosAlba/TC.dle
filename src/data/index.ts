// Todos los catálogos juntos: para el build (que los valida acá abajo), los tests y las
// herramientas. Los juegos importan cada uno de data/catalogo/ para no bajar los ajenos.
export { autos } from "./catalogo/autos";
export { carreras } from "./catalogo/carreras";
export { circuitos } from "./catalogo/circuitos";
export { fotosCarreras } from "./catalogo/fotos-carreras";
export { palabras } from "./catalogo/palabras";
export { pilotos } from "./catalogo/pilotos";
import { autos } from "./catalogo/autos";
import { carreras } from "./catalogo/carreras";
import { circuitos } from "./catalogo/circuitos";
import { fotosCarreras } from "./catalogo/fotos-carreras";
import { palabras } from "./catalogo/palabras";
import { pilotos } from "./catalogo/pilotos";

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
