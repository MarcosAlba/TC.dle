// Pista de distancia y dirección del modo Circuito.
import { describe, expect, it } from "vitest";
import { circuitos } from "../src/data";
import { calcularPistaUbicacion } from "../src/lib/circuitos";

const porSede = (sedeId: string) => circuitos.find((item) => item.sedeId === sedeId)!;

describe("pista de ubicación del circuito", () => {
    it("mide la distancia en línea recta y redondeada", () => {
        // Gálvez (Buenos Aires) a Rosario: unos 280 km.
        const pista = calcularPistaUbicacion(porSede("buenos-aires"), porSede("rosario"));

        expect(pista.km).toBeGreaterThan(250);
        expect(pista.km).toBeLessThan(310);
        expect(Number.isInteger(pista.km)).toBe(true);
    });

    it("la dirección va del intento hacia el circuito del día", () => {
        expect(calcularPistaUbicacion(porSede("buenos-aires"), porSede("salta")).direccion).toBe("noroeste");
        expect(calcularPistaUbicacion(porSede("salta"), porSede("buenos-aires")).direccion).toBe("sudeste");
        expect(calcularPistaUbicacion(porSede("rafaela"), porSede("el-calafate")).direccion).toMatch(/^su/);
    });

    it("otro trazado del mismo autódromo está a 0 km y con cercanía 100", () => {
        const variantes = circuitos.filter((item) => item.sedeId === "la-plata");
        expect(variantes.length).toBeGreaterThan(1);

        const pista = calcularPistaUbicacion(variantes[0], variantes[1]);
        expect(pista).toMatchObject({ km: 0, cercania: 100, mismaSede: true });
    });

    it("la cercanía baja con la distancia y nunca sale de 0 a 100", () => {
        const cerca = calcularPistaUbicacion(porSede("concordia"), porSede("concepcion-del-uruguay"));
        const lejos = calcularPistaUbicacion(porSede("salta"), porSede("rio-gallegos"));

        expect(cerca.cercania).toBeGreaterThan(lejos.cercania);
        for (const a of circuitos) {
            for (const b of circuitos) {
                const { cercania } = calcularPistaUbicacion(a, b);
                expect(cercania).toBeGreaterThanOrEqual(0);
                expect(cercania).toBeLessThanOrEqual(100);
            }
        }
    });

    it("cada circuito tiene coordenadas dentro de Argentina", () => {
        for (const item of circuitos) {
            expect(item.coordenadas.lat, item.id).toBeLessThan(-21);
            expect(item.coordenadas.lon, item.id).toBeLessThan(-53);
        }
    });
});
