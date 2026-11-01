// Atajos de teclado de las páginas de juego.
import { describe, expect, it } from "vitest";
import { accionDeTecla } from "../src/lib/atajos";
import { JUEGOS } from "../src/lib/juegos";

const tecla = (key: string, extra: Partial<Parameters<typeof accionDeTecla>[0]> = {}) =>
    accionDeTecla({ key, escribiendo: false, ...extra });

describe("atajos de teclado", () => {
    it("/ va al buscador, ? abre la ayuda y C copia el resultado", () => {
        expect(tecla("/")).toEqual({ tipo: "buscar" });
        expect(tecla("?")).toEqual({ tipo: "ayuda" });
        expect(tecla("c")).toEqual({ tipo: "copiar" });
        expect(tecla("C")).toEqual({ tipo: "copiar" });
    });

    it("los números van a cada juego en el orden de las pestañas", () => {
        JUEGOS.forEach((juego, indice) => {
            expect(tecla(String(indice + 1))).toEqual({ tipo: "ir", juego: juego.id });
        });
        expect(tecla("0")).toBeNull();
        expect(tecla(String(JUEGOS.length + 1))).toBeNull();
    });

    it("escribiendo en un campo o con Ctrl, Cmd o Alt no hay atajos", () => {
        expect(tecla("c", { escribiendo: true })).toBeNull();
        expect(tecla("/", { escribiendo: true })).toBeNull();
        expect(tecla("c", { ctrlKey: true })).toBeNull();
        expect(tecla("1", { metaKey: true })).toBeNull();
        expect(tecla("2", { altKey: true })).toBeNull();
    });

    it("el resto de las teclas sigue de largo (el Wordle usa las letras)", () => {
        expect(tecla("a")).toBeNull();
        expect(tecla("Enter")).toBeNull();
        expect(tecla("Backspace")).toBeNull();
    });
});
