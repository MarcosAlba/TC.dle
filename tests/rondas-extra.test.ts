// Ronda extra del número (piloto) y modo detalle (auto).
import { describe, expect, it } from "vitest";
import { NIVELES_ZOOM, obtenerEstiloDetalle } from "../src/lib/autos";
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

describe("modo detalle del auto", () => {
    it("el zoom baja con cada error y al terminar se ve entera", () => {
        const escalas = NIVELES_ZOOM.map((_, intentos) => Number(obtenerEstiloDetalle(intentos, false, "s").escala));

        expect(escalas).toEqual([...escalas].sort((a, b) => b - a));
        expect(obtenerEstiloDetalle(3, true, "s").escala).toBe("1");
        expect(obtenerEstiloDetalle(0, false, "s").desenfoque).toBe("0rem");
    });

    it("el punto del zoom es el mismo todo el día y cerca del centro", () => {
        const { origen } = obtenerEstiloDetalle(0, false, "detalle:2026-11-01:auto.webp");
        const [x, y] = origen.split(" ").map(parseFloat);

        expect(obtenerEstiloDetalle(5, false, "detalle:2026-11-01:auto.webp").origen).toBe(origen);
        expect(x).toBeGreaterThanOrEqual(40);
        expect(x).toBeLessThanOrEqual(60);
        expect(y).toBeGreaterThanOrEqual(45);
        expect(y).toBeLessThanOrEqual(65);
    });
});
