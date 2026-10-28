// Logo de la portada: la frenada se ve una vez por sesión; después aparece ya terminado.
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { dejarLogoQuieto } from "../src/lib/inicio-pagina";

const raiz = path.resolve(import.meta.dirname, "..");

function ejecutar(sesion: Map<string, string>, conAlmacenamiento = true) {
    const logos = [{ src: "https://tc-dle.vercel.app/assets/images/tcdle-logo-frenada.svg" }, { src: "https://tc-dle.vercel.app/assets/images/tcdle-logo-frenada-halloween.svg" }];

    vi.stubGlobal("document", { querySelectorAll: () => logos });
    vi.stubGlobal(
        "sessionStorage",
        conAlmacenamiento
            ? {
                  getItem: (clave: string) => sesion.get(clave) ?? null,
                  setItem: (clave: string, valor: string) => sesion.set(clave, valor),
              }
            : {
                  getItem: () => {
                      throw new Error("bloqueado");
                  },
                  setItem: () => {
                      throw new Error("bloqueado");
                  },
              }
    );
    dejarLogoQuieto();

    return logos.map((logo) => logo.src);
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("logo de la portada", () => {
    it("la primera vez de la sesión no toca el logo: se ve la frenada completa", () => {
        const sesion = new Map<string, string>();
        const [normal, halloween] = ejecutar(sesion);

        expect(normal).toBe("https://tc-dle.vercel.app/assets/images/tcdle-logo-frenada.svg");
        expect(halloween).toBe("https://tc-dle.vercel.app/assets/images/tcdle-logo-frenada-halloween.svg");
        expect(sesion.get("tcdleLogoVisto")).toBe("1");
    });

    it("desde la segunda vez pide los dos logos terminados (#visto)", () => {
        const sesion = new Map([["tcdleLogoVisto", "1"]]);
        const [normal, halloween] = ejecutar(sesion);

        expect(normal).toBe("https://tc-dle.vercel.app/assets/images/tcdle-logo-frenada.svg#visto");
        expect(halloween).toBe("https://tc-dle.vercel.app/assets/images/tcdle-logo-frenada-halloween.svg#visto");
    });

    it("no apila #visto si se vuelve a ejecutar", () => {
        const sesion = new Map([["tcdleLogoVisto", "1"]]);
        const logos = ejecutar(sesion);

        expect(logos[0].match(/#visto/g)).toHaveLength(1);
    });

    it("sin sessionStorage el logo se anima siempre, sin romper la página", () => {
        const [normal] = ejecutar(new Map(), false);

        expect(normal).toBe("https://tc-dle.vercel.app/assets/images/tcdle-logo-frenada.svg");
    });
});

describe("SVG del logo", () => {
    it.each(["tcdle-logo-frenada.svg", "tcdle-logo-frenada-halloween.svg"])("%s tiene el ancla #visto que lo deja terminado", (archivo) => {
        const svg = readFileSync(path.join(raiz, "public/assets/images", archivo), "utf8");

        expect(svg).toMatch(/<g id="visto"\s*\/>/);
        expect(svg).toMatch(/#visto:target ~ \* \{ --tcdle-t0: -10s; \}/);
    });
});
