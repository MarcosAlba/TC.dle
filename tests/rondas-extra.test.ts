// Ronda extra del número (piloto) y modo difícil (auto).
import { describe, expect, it } from "vitest";
import { normalizarModoAuto, obtenerEstiloDesenfoque, obtenerNivelDesenfoque } from "../src/lib/autos";
import { generarOpcionesNumero } from "../src/lib/pilotos";

describe("ronda extra del número", () => {
    it("cinco números distintos, ordenados, con el real entre ellos", () => {
        const opciones = generarOpcionesNumero(172, [1, 2, 3, 4, 5, 6, 7, 8, 172], "numero:2026-10-24:5");

        expect(opciones).toHaveLength(5);
        expect(opciones).toContain(172);
        expect(new Set(opciones).size).toBe(5);
        expect(opciones).toEqual([...opciones].sort((a, b) => a - b));
    });

    it("con la misma semilla salen las mismas opciones todo el día", () => {
        const otros = Array.from({ length: 60 }, (_, indice) => indice + 1);
        expect(generarOpcionesNumero(10, otros, "x")).toEqual(generarOpcionesNumero(10, otros, "x"));
    });

    it("si hay pocos números, ofrece los que hay", () => {
        expect(generarOpcionesNumero(7, [7, 3], "y")).toEqual([3, 7]);
    });
});

describe("modo difícil del auto", () => {
    it("es el mismo desenfoque que el normal, solo que en blanco y negro", () => {
        for (let intentos = 0; intentos < 9; intentos++) {
            const nivel = obtenerNivelDesenfoque(intentos, false);
            const normal = obtenerEstiloDesenfoque(nivel);
            const dificil = obtenerEstiloDesenfoque(nivel, true);
            expect({ ...dificil, gris: "0" }).toEqual(normal);
            expect(dificil.gris).toBe("1");
        }
    });

    it("los modos viejos (borroso, detalle) valen como normal", () => {
        expect(normalizarModoAuto("dificil")).toBe("dificil");
        expect(normalizarModoAuto("detalle")).toBe("normal");
        expect(normalizarModoAuto("borroso")).toBe("normal");
        expect(normalizarModoAuto(null)).toBe("normal");
    });
});
