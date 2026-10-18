import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";

// El sitio se publica como página de proyecto de GitHub Pages
// (https://marcosalba.github.io/TC.dle/), por eso la base no es la raíz.
// Con un dominio propio o un repo "usuario.github.io" alcanza con
// SITIO_BASE=/ y SITIO_URL=https://mi-dominio.com al construir.
const base = process.env.SITIO_BASE ?? "/TC.dle";
const site = process.env.SITIO_URL ?? "https://marcosalba.github.io";

export default defineConfig({
    site,
    base,
    // "file" genera pages/adivinar-el-piloto.html tal cual, así los links
    // que ya se compartieron siguen funcionando sin redirecciones.
    build: { format: "file" },
    trailingSlash: "ignore",
    integrations: [svelte()],
    devToolbar: { enabled: false },
});
