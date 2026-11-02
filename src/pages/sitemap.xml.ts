// Sitemap para los buscadores: la portada, el archivo y una página por juego.
import type { APIRoute } from "astro";
import { JUEGOS } from "../lib/juegos";

export const GET: APIRoute = ({ site }) => {
    const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
    const paginas = ["", "archivo.html", "acerca.html", ...JUEGOS.map((juego) => "pages/" + juego.archivo)];
    const urls = paginas.map((pagina) => `    <url><loc>${new URL(base + pagina, site).href}</loc></url>`).join("\n");

    return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
};
