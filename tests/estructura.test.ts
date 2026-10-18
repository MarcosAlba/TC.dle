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
        expect(leer("src/components/ModalResultado.svelte")).toMatch(/SiguienteJuego/);
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
