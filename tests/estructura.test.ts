// Estructura compartida de las páginas y los juegos: cada juego se arma con las
// mismas piezas (encabezado, presentación, panel de intento, buscador) y no
// repite infraestructura que ya vive en src/lib o en los componentes comunes.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { JUEGOS } from "../src/lib/juegos";

const raiz = path.resolve(import.meta.dirname, "..");
const leer = (relativa: string) => readFileSync(path.join(raiz, relativa), "utf8");
const PAGINAS = readdirSync(path.join(raiz, "src/pages/pages")).filter((archivo) => archivo.endsWith(".astro") && !archivo.startsWith("["));
const JUEGOS_CON_BUSCADOR = ["Piloto", "Auto", "Circuito"];
const clasesDe = (...fuentes: string[]) => fuentes.join("\n");

describe("páginas de juego", () => {
    it("hay una por juego y mantienen el nombre de archivo de los links compartidos", () => {
        expect(PAGINAS.map((archivo) => archivo.replace(".astro", ".html")).sort()).toEqual(JUEGOS.map((juego) => juego.archivo).sort());
    });

    it.each(PAGINAS)("%s usa el layout de juego, la presentación y un único componente en el cliente", (pagina) => {
        const fuente = leer("src/pages/pages/" + pagina);

        expect(fuente, "falta el layout compartido").toMatch(/import PaginaJuego from "..\/..\/layouts\/PaginaJuego.astro"/);
        expect(fuente, "falta la presentación").toMatch(/class="[^"]*\bpresentacion-juego\b/);
        expect(fuente, "falta la introducción").toMatch(/slot="intro"/);
        expect(fuente.match(/client:only="svelte"/g), "debe haber un solo componente de juego").toHaveLength(1);
        expect(fuente, "referencia obsoleta").not.toMatch(/buscador-pilotos|controles-temporales/);
    });

    it("el layout de juego trae el encabezado, el CSS compartido y la alternancia intro/juego", () => {
        const layout = leer("src/layouts/PaginaJuego.astro");
        const encabezado = leer("src/components/EncabezadoJuego.astro");

        expect(layout).toMatch(/juego\.css/);
        expect(layout).toMatch(/EncabezadoJuego/);
        expect(layout).toMatch(/intro-bloque/);
        expect(layout).toMatch(/contenido-juego/);
        expect(encabezado).toMatch(/class="encabezado-juego"/);
        expect(encabezado).toMatch(/class="logo-juego"/);
    });

    it("la base carga el script inicial (tema e introducción) antes de los estilos de la página", () => {
        const base = leer("src/layouts/Pagina.astro");

        expect(base).toMatch(/aplicarTemaInicial/);
        expect(base).toMatch(/aplicarIntroInicial/);
        expect(base.indexOf('<script is:inline')).toBeLessThan(base.indexOf("<body"));
    });
});

describe("piezas compartidas", () => {
    it("el panel de intento y el buscador traen las clases que usa el CSS común", () => {
        const fuentes = clasesDe(leer("src/components/PanelIntento.svelte"), leer("src/components/Buscador.svelte"));

        for (const clase of [
            "panel-intento",
            "panel-intento__contenido",
            "fila-busqueda",
            "buscador",
            "buscador__sugerencias",
            "buscador__opcion",
            "boton-intentar",
        ]) {
            expect(fuentes, `falta ${clase}`).toMatch(new RegExp(`["'\\s]${clase}["'\\s]`));
        }
    });

    it.each(JUEGOS_CON_BUSCADOR)("%s usa el panel de intento y el buscador compartidos y muestra mensajes", (juego) => {
        const fuente = leer(`src/games/${juego}.svelte`);

        expect(fuente).toMatch(/import PanelIntento from "..\/components\/PanelIntento.svelte"/);
        expect(fuente).toMatch(/import Buscador from "..\/components\/Buscador.svelte"/);
        expect(fuente).toMatch(/mensaje-juego/);
    });

    it("todos los juegos con resultado final usan el modal y la cuenta regresiva compartidos", () => {
        for (const juego of ["Auto", "Circuito", "Wordle"]) {
            expect(leer(`src/games/${juego}.svelte`)).toMatch(/import ModalResultado from "..\/components\/ModalResultado.svelte"/);
        }
        expect(leer("src/components/ModalResultado.svelte")).toMatch(/CuentaRegresiva/);
        // El modal ofrece racha, compartir y el siguiente juego a través de AccionesResultado.
        expect(leer("src/components/ModalResultado.svelte")).toMatch(/AccionesResultado/);
        expect(leer("src/components/AccionesResultado.svelte")).toMatch(/SiguienteJuego/);
        expect(leer("src/components/AccionesResultado.svelte")).toMatch(/BotonCompartir/);
    });

    it("el piloto, que muestra el resultado dentro de la página, ofrece las mismas acciones", () => {
        expect(leer("src/games/Piloto.svelte")).toMatch(/AccionesResultado/);
    });
});

describe("responsabilidades", () => {
    const juegos = readdirSync(path.join(raiz, "src/games"), { recursive: true, encoding: "utf8" }).filter((archivo) =>
        /\.(svelte|ts)$/.test(archivo)
    );

    it("hay juegos para revisar", () => {
        expect(juegos.length).toBeGreaterThanOrEqual(4);
    });

    it.each(juegos)("%s no duplica la infraestructura diaria (almacenamiento, relojes, JSON)", (archivo) => {
        expect(leer("src/games/" + archivo), "va en src/lib").not.toMatch(/\blocalStorage\b|\bsetInterval\b|JSON\.parse/);
    });
});

describe("pantallas táctiles", () => {
    const hojas = readdirSync(path.join(raiz, "src/styles")).filter((archivo) => archivo.endsWith(".css"));
    // La vista previa de autos es una herramienta interna; la pista abierta solo conserva su estilo al pasar el mouse.
    const permitidos = [/vista-previa-/, /\.pista--activa:hover/];

    it.each(hojas)("%s: el :hover solo vale con mouse (en el celular quedaba pegado y tapaba colores)", (hoja) => {
        const lineas = leer("src/styles/" + hoja).split(/\r?\n/);

        lineas.forEach((linea, indice) => {
            if (!linea.includes(":hover") || permitidos.some((permitido) => permitido.test(hoja) || permitido.test(linea))) {
                return;
            }

            const cercanas = lineas.slice(Math.max(0, indice - 3), indice + 1).join("\n");
            expect(cercanas, hoja + ":" + (indice + 1) + " " + linea.trim()).toContain("@media (hover: hover)");
        });
    });

    it("el celular recibe la base táctil: sin recuadro al tocar, sin espera de doble toque y con la barra del color del sitio", () => {
        const base = leer("src/styles/base.css");
        const pagina = leer("src/layouts/Pagina.astro");

        expect(base).toMatch(/-webkit-tap-highlight-color: transparent/);
        expect(base).toMatch(/touch-action: manipulation/);
        expect(base).toMatch(/min-height: 100dvh/);
        expect(pagina).toMatch(/name="theme-color"/);
        expect(pagina).toMatch(/viewport-fit=cover/);
    });
});

describe("íconos compartidos", () => {
    const lee = (ruta: string) => readFileSync(ruta, "utf8");

    it("el sprite define los íconos y la página lo incluye", () => {
        const sprite = lee("src/components/Iconos.astro");
        for (const id of ["icono-cerrar", "icono-avanzar", "bandera-cuadros"]) {
            expect(sprite).toContain(`id="${id}"`);
        }
        expect(lee("src/layouts/Pagina.astro")).toContain("<Iconos />");
    });

    it("los componentes usan los íconos que existen en el sprite", () => {
        const sprite = lee("src/components/Iconos.astro");
        const usados = [
            ...lee("src/components/ModalResultado.svelte").matchAll(/href="#(icono-[a-z]+)"/g),
            ...lee("src/components/SiguienteJuego.svelte").matchAll(/href="#(icono-[a-z]+)"/g),
            ...lee("src/components/BotonCompartir.svelte").matchAll(/href="#(icono-[a-z]+)"/g),
        ];
        expect(usados.length).toBeGreaterThan(0);
        for (const [, id] of usados) {
            expect(sprite).toContain(`id="${id}"`);
        }
    });
});

describe("acciones al terminar", () => {
    const lee = (ruta: string) => readFileSync(ruta, "utf8");

    it("el resultado no repite la racha: va solo en el texto que se comparte", () => {
        const acciones = lee("src/components/AccionesResultado.svelte");
        expect(acciones).not.toContain("resultado-racha");
        expect(acciones).toContain("armarTexto(racha)");
    });

    it("en el piloto, los botones van fuera del bloque (que recorta el chanfle)", () => {
        const piloto = lee("src/games/Piloto.svelte");
        const bloque = piloto.slice(piloto.indexOf("<section"), piloto.indexOf("</section>"));
        expect(bloque).not.toContain("<AccionesResultado");
        expect(piloto).toContain("resultado-final__acciones");
    });

    it("el Top 10 se rinde manteniendo apretado, sin un segundo paso", () => {
        const top10 = lee("src/games/Top10.svelte");
        expect(top10).toContain("<BotonMantener");
        expect(top10).not.toContain("confirmandoRendirse");
    });
});
