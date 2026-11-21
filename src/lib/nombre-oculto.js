// Nombre de archivo que no delata la respuesta. Las fotos de los autos se llaman
// "piloto_año.webp" y las siluetas "circuito.svg": con mirar la pestaña Red o el
// `src` en "Inspeccionar" se sabía la respuesta. scripts/variantes-autos.mjs copia
// cada imagen de los juegos a public/assets/images/ocultas/ con este nombre, y el
// juego arma la misma URL en el navegador.
//
// Es JavaScript (no TypeScript) para que lo use también el script de Node.

/** Carpeta, dentro de public/assets/images, con las copias de nombre oculto. */
export const CARPETA_OCULTAS = "ocultas";

/**
 * 16 caracteres hexadecimales a partir de la ruta relativa de la imagen
 * (por ejemplo "autos/norberto_fontana_2003.webp"). Dos FNV-1a de 32 bits con
 * distinto punto de partida: no es criptográfico, solo tiene que no leerse.
 * @param {string} relativa
 * @returns {string}
 */
export function nombreOculto(relativa) {
    const texto = "tcdle:" + relativa;
    let a = 0x811c9dc5;
    let b = 0x01000193 ^ 0x5bd1e995;
    for (let indice = 0; indice < texto.length; indice++) {
        const codigo = texto.charCodeAt(indice);
        a = Math.imul(a ^ codigo, 0x01000193);
        b = Math.imul(b ^ codigo, 0x01000193) ^ (a >>> 13);
    }
    return (a >>> 0).toString(16).padStart(8, "0") + (b >>> 0).toString(16).padStart(8, "0");
}

/**
 * Ruta (relativa a public/assets/images) de la copia oculta de una imagen.
 * `sufijo` va antes de la extensión, como "-640" en las variantes de los autos.
 * @param {string} relativa
 * @param {string} [sufijo]
 * @returns {string}
 */
export function rutaOculta(relativa, sufijo = "") {
    const extension = relativa.slice(relativa.lastIndexOf("."));
    return CARPETA_OCULTAS + "/" + nombreOculto(relativa) + sufijo + extension;
}
