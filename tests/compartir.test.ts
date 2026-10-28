import { describe, expect, it } from "vitest";
import {
    compartirTexto,
    construirTextoCompartir,
    filaIntentos,
    filaPiloto,
    filaTop10,
    filaWordle,
} from "../src/lib/compartir";
import type { Comparacion } from "../src/lib/pilotos";

const URL_SITIO = "https://tc-dle.vercel.app/";

describe("construirTextoCompartir", () => {
    it("arma el encabezado, el marcador con la racha, las filas y la dirección", () => {
        const texto = construirTextoCompartir({
            juego: "auto",
            fecha: "2026-10-27",
            puntaje: 4,
            maximo: 6,
            racha: 12,
            filas: [filaIntentos(4, true)],
            url: URL_SITIO,
        });

        expect(texto).toBe(["TCdle · Auto · 27/10", "🏁 4/6 · 🔥 12", "⬛⬛⬛🟩", URL_SITIO].join("\n"));
    });

    it("marca la X cuando no se ganó y omite la racha en cero", () => {
        const texto = construirTextoCompartir({
            juego: "circuito",
            fecha: "2026-01-05",
            puntaje: null,
            maximo: 6,
            racha: 0,
            filas: [filaIntentos(6, false)],
            url: URL_SITIO,
        });

        expect(texto.split("\n")[1]).toBe("🏁 X/6");
        expect(texto.split("\n")[0]).toBe("TCdle · Circuito · 05/01");
    });

    it("no incluye nada que adelante la respuesta", () => {
        const texto = construirTextoCompartir({
            juego: "wordle",
            fecha: "2026-10-27",
            puntaje: 2,
            maximo: 6,
            racha: 1,
            filas: [filaWordle(["correcta", "ausente", "presente"]), filaWordle(["correcta", "correcta", "correcta"])],
            url: URL_SITIO,
        });

        // Entre el marcador y la dirección solo hay cuadraditos: ninguna letra de la palabra.
        const filas = texto.split("\n").slice(2, -1);
        expect(filas).toEqual(["🟩⬛🟨", "🟩🟩🟩"]);
    });
});

describe("filas por juego", () => {
    const comparacion = (parcial: Partial<Comparacion>): Comparacion => ({
        acerto: false,
        marca: false,
        equipo: false,
        localidad: "no-coincide",
        campeon: false,
        edad: { valor: 30, estado: "no-coincide", direccion: "mayor" },
        debut: { valor: 2010, estado: "no-coincide", direccion: "menor" },
        ...parcial,
    });

    it("el piloto usa seis celdas, una por pista, en el orden de la tabla", () => {
        const fila = filaPiloto(
            comparacion({
                marca: true,
                localidad: "cerca",
                edad: { valor: 30, estado: "cerca", direccion: "mayor" },
                debut: { valor: 2010, estado: "coincide", direccion: null },
            })
        );

        expect(fila).toEqual(["verde", "negro", "amarillo", "negro", "amarillo", "verde"]);
    });

    it("acertar el piloto deja la fila toda en verde", () => {
        const fila = filaPiloto(
            comparacion({
                acerto: true,
                marca: true,
                equipo: true,
                localidad: "coincide",
                campeon: true,
                edad: { valor: 30, estado: "coincide", direccion: null },
                debut: { valor: 2010, estado: "coincide", direccion: null },
            })
        );

        expect(fila).toEqual(Array(6).fill("verde"));
    });

    it("auto y circuito: una celda por intento y la última en verde solo si se ganó", () => {
        expect(filaIntentos(3, true)).toEqual(["negro", "negro", "verde"]);
        expect(filaIntentos(3, false)).toEqual(["negro", "negro", "negro"]);
        expect(filaIntentos(1, true)).toEqual(["verde"]);
    });

    it("el top 10 marca en verde solo los puestos descubiertos", () => {
        expect(filaTop10([1, 3, 10], 10)).toEqual([
            "verde",
            "negro",
            "verde",
            "negro",
            "negro",
            "negro",
            "negro",
            "negro",
            "negro",
            "verde",
        ]);
    });
});

describe("compartirTexto", () => {
    it("usa el menú del sistema cuando está disponible", async () => {
        const enviados: string[] = [];
        const resultado = await compartirTexto("hola", {
            compartir: async ({ text }) => void enviados.push(text),
            copiar: async () => {
                throw new Error("no debería copiar");
            },
        });

        expect(resultado).toBe("compartido");
        expect(enviados).toEqual(["hola"]);
    });

    it("cerrar el menú sin elegir no es un error ni copia nada", async () => {
        let copio = false;
        const resultado = await compartirTexto("hola", {
            compartir: async () => {
                throw new DOMException("cancelado", "AbortError");
            },
            copiar: async () => void (copio = true),
        });

        expect(resultado).toBe("cancelado");
        expect(copio).toBe(false);
    });

    it("si el menú falla por otra razón, copia al portapapeles", async () => {
        const copiados: string[] = [];
        const resultado = await compartirTexto("hola", {
            compartir: async () => {
                throw new Error("no soportado");
            },
            copiar: async (texto) => void copiados.push(texto),
        });

        expect(resultado).toBe("copiado");
        expect(copiados).toEqual(["hola"]);
    });

    it("sin menú copia, y si copiar falla o no hay forma de hacerlo avisa el error", async () => {
        expect(await compartirTexto("x", { copiar: async () => {} })).toBe("copiado");
        expect(
            await compartirTexto("x", {
                copiar: async () => {
                    throw new Error("bloqueado");
                },
            })
        ).toBe("error");
        expect(await compartirTexto("x", {})).toBe("error");
    });
});
