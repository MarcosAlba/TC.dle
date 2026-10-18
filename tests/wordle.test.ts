import { describe, expect, it } from "vitest";
import palabras from "../src/data/palabras.json";
import { esIntentoValido, evaluarIntento, filtrarPalabrasJugables, mejorarEstadoTecla } from "../src/lib/wordle";

describe("catálogo de palabras", () => {
    it("no está vacío y cada palabra cumple el formato", () => {
        expect(palabras.length).toBeGreaterThan(0);

        for (const palabra of palabras) {
            expect(palabra, `"${palabra}" debe ser sólo A-Z/Ñ en mayúsculas`).toMatch(/^[A-ZÑ]+$/);
            expect(palabra.length, `"${palabra}" debe tener entre 4 y 8 letras`).toBeGreaterThanOrEqual(4);
            expect(palabra.length, `"${palabra}" debe tener entre 4 y 8 letras`).toBeLessThanOrEqual(8);
        }
    });

    it("no repite palabras", () => {
        expect(new Set(palabras).size).toBe(palabras.length);
    });

    it("todas entran en el tablero", () => {
        expect(filtrarPalabrasJugables(palabras)).toEqual(palabras);
    });
});

describe("evaluarIntento", () => {
    it("palabra exacta: todas las letras correctas", () => {
        expect(evaluarIntento("TOYOTA", "TOYOTA")).toEqual(Array(6).fill("correcta"));
    });

    it("sin letras en común", () => {
        expect(evaluarIntento("MOTOR", "PISTA")).toEqual(["ausente", "ausente", "presente", "ausente", "ausente"]);
    });

    it("letra presente pero en otra posición", () => {
        expect(evaluarIntento("ARDER", "PADRE")).toEqual([
            "presente", // A está en PADRE, no en la posición 0
            "presente", // R está en PADRE, no en la posición 1
            "correcta", // D coincide en posición 2
            "presente", // E está en PADRE, no en la posición 3
            "ausente", // la segunda "R" del intento ya no tiene "R" disponible en PADRE
        ]);
    });

    // Letra repetida en el intento (dos "R") pero el objetivo sólo tiene una:
    // sólo una aparición se marca, la otra queda ausente en vez de marcarse dos veces.
    it("una letra repetida en el intento se marca tantas veces como tiene el objetivo", () => {
        const resultado = evaluarIntento("CARRO", "CORAL");
        const marcadasR = resultado.filter((estado, indice) => "CARRO"[indice] === "R" && estado !== "ausente").length;

        expect(resultado.filter((estado) => estado !== "ausente").length).toBeLessThanOrEqual("CARRO".length);
        expect(marcadasR).toBe("CORAL".split("").filter((letra) => letra === "R").length);
    });

    it("prioriza la letra en su lugar antes que la presente", () => {
        expect(evaluarIntento("AABB", "BBAA")).toEqual(["presente", "presente", "presente", "presente"]);
        expect(evaluarIntento("ALLA", "AXLA")).toEqual(["correcta", "ausente", "correcta", "correcta"]);
    });
});

describe("teclado e intentos", () => {
    it("una letra nunca baja de estado", () => {
        expect(mejorarEstadoTecla(undefined, "presente")).toBe("presente");
        expect(mejorarEstadoTecla("correcta", "presente")).toBe("correcta");
        expect(mejorarEstadoTecla("presente", "correcta")).toBe("correcta");
        expect(mejorarEstadoTecla("presente", "ausente")).toBe("presente");
    });

    it("cualquier combinación de letras del largo correcto es válida", () => {
        expect(esIntentoValido("RAID", 4)).toBe(true);
        expect(esIntentoValido("AÑOS", 4)).toBe(true);
        expect(esIntentoValido("RAI", 4)).toBe(false);
        expect(esIntentoValido("raid", 4)).toBe(false);
        expect(esIntentoValido("RA1D", 4)).toBe(false);
        expect(esIntentoValido(1234, 4)).toBe(false);
    });
});
