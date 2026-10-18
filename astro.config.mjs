import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";

// El sitio se publica en Vercel (https://tc-dle.vercel.app), que lo sirve desde
// la raíz: la base es "/". Para publicarlo como página de proyecto de GitHub
// Pages (https://marcosalba.github.io/TC.dle/) se construye con
// SITIO_BASE=/TC.dle y SITIO_URL=https://marcosalba.github.io.
const base = process.env.SITIO_BASE ?? "/";
const site = process.env.SITIO_URL ?? "https://tc-dle.vercel.app";

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
