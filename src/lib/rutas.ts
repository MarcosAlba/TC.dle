// URLs del sitio respetando la base de astro.config.mjs (la raíz en Vercel).
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export function ruta(destino: string): string {
    return base + "/" + destino.replace(/^\//, "");
}

/** Imagen dentro de public/assets/images, por ejemplo "pilotos/mini/agustin_canapino.webp". */
export function urlImagen(relativa: string): string {
    return ruta("assets/images/" + relativa);
}

/** Página de un juego: los nombres de archivo son los de los links ya compartidos. */
export function urlJuego(archivo: string): string {
    return ruta("pages/" + archivo);
}

export const urlInicio = (): string => ruta("");

/** Dirección completa del sitio (con dominio), para los textos que se comparten. Solo en el navegador. */
export const urlSitio = (): string => new URL(urlInicio(), location.href).href;
