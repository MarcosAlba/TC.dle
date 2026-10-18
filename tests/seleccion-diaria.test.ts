import { describe, expect, it } from "vitest";
import { obtenerSeleccionDiaria as obtener } from "../src/lib/seleccion-diaria";

const crearFecha = (numeroDeDia: number) => new Date(2026, 0, 1 + numeroDeDia, 12);

describe("selección diaria", () => {
    it.each([31, 56, 65])("recorre un catálogo de %i sin repetir y recién entonces reinicia", (cantidad) => {
        const elementos = Array.from({ length: cantidad }, (_, indice) => indice);
        const seleccionados = Array.from({ length: cantidad }, (_, dia) =>
            obtener(elementos, "prueba-" + cantidad, crearFecha(dia))
        );

        expect(new Set(seleccionados).size, `No debe haber repeticiones durante ${cantidad} días`).toBe(cantidad);
        expect(
            obtener(elementos, "prueba-" + cantidad, crearFecha(0)),
            "La rotación debe reiniciarse sólo después de recorrer todo el catálogo"
        ).toBe(obtener(elementos, "prueba-" + cantidad, crearFecha(cantidad)));
    });

    const elementos = Array.from({ length: 65 }, (_, indice) => indice);
    const primerosPilotos = Array.from({ length: 20 }, (_, dia) => obtener(elementos, "pilotos", crearFecha(dia)));

    it("es estable para la misma fecha", () => {
        const fecha = crearFecha(10);
        expect(obtener(elementos, "pilotos", fecha)).toBe(obtener(elementos, "pilotos", fecha));
    });

    it("no recorre los ids en orden", () => {
        expect(
            primerosPilotos.some((piloto, indice) => indice > 0 && piloto !== (primerosPilotos[indice - 1]! + 1) % elementos.length)
        ).toBe(true);
    });

    it("cada modo tiene su propia mezcla", () => {
        expect(primerosPilotos).not.toEqual(
            Array.from({ length: 20 }, (_, dia) => obtener(elementos, "autos", crearFecha(dia)))
        );
    });

    it("con un catálogo vacío devuelve null", () => {
        expect(obtener([], "vacio", crearFecha(10))).toBeNull();
    });
});
