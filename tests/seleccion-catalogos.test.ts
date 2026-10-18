// Red de seguridad para cambiar la estructura del sitio: lo que sale cada día
// (piloto, auto, circuito y palabra) tiene que seguir siendo exactamente lo
// mismo, porque la gente comparte y compara el resultado del día.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { calcularSeleccion } from "./ayuda/calcular-seleccion";

const esperado = JSON.parse(readFileSync(path.join(import.meta.dirname, "fixtures/seleccion-diaria.json"), "utf8"));
const actual = calcularSeleccion();
const AYUDA = "Si cambiaste un catálogo a propósito, regeneralo con: node tests/fixtures/generar-seleccion.mjs";

describe("selección diaria fijada por el fixture", () => {
    it("el algoritmo no cambia: el piloto del día seguiría siendo el mismo para todos", () => {
        expect(actual.algoritmo).toEqual(esperado.algoritmo);
    });

    for (const [modo, datos] of Object.entries<any>(esperado.modos)) {
        describe(modo, () => {
            it("mantiene la cantidad de elementos", () => {
                expect(actual.modos[modo].cantidad, AYUDA).toBe(datos.cantidad);
            });

            it("mantiene el contenido y el orden del catálogo", () => {
                expect(actual.modos[modo].huellaCatalogo, AYUDA).toBe(datos.huellaCatalogo);
            });

            it(`elige lo mismo cada día durante ${esperado.dias} días`, () => {
                expect(actual.modos[modo].seleccion, AYUDA).toEqual(datos.seleccion);
            });
        });
    }
});
