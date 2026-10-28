import { describe, expect, it } from "vitest";
import { describirTiempoRestante } from "../src/lib/calendario";
import { mensajesDeBusqueda } from "../src/lib/mensajes";
import { ANIMACION_FILA, describirCelda, describirIntento, duracionRevelado, evaluarIntento } from "../src/lib/wordle";

describe("describirIntento (lo que anuncia el lector tras cada fila del Wordle)", () => {
    it("agrupa las letras por estado, en el orden en que aparecen", () => {
        // Objetivo COPELLO: la P cae en su lugar, la O y la C existen pero en otro lugar, las X no están.
        const estados = evaluarIntento("OCPXXXX", "COPELLO");

        expect(describirIntento("OCPXXXX", estados, 3)).toBe(
            "Intento 3. En su lugar: P. En otra posición: O, C. No están: X, X, X, X."
        );
    });

    it("omite los grupos vacíos", () => {
        expect(describirIntento("XYZ", ["ausente", "ausente", "ausente"], 1)).toBe("Intento 1. No están: X, Y, Z.");
    });

    it("avisa cuando todas las letras están en su lugar", () => {
        expect(describirIntento("COPELLO", evaluarIntento("COPELLO", "COPELLO"), 5)).toBe(
            "Intento 5. Todas las letras en su lugar."
        );
    });

    it("no revela nada que el jugador no haya escrito: solo habla de sus propias letras", () => {
        const texto = describirIntento("AB", ["correcta", "ausente"], 2);

        expect(texto).toBe("Intento 2. En su lugar: A. No están: B.");
    });
});

describe("describirCelda", () => {
    it("dice la letra con su estado, solo la letra si todavía no se evaluó, o 'vacía'", () => {
        expect(describirCelda("R", "presente")).toBe("R, en otra posición");
        expect(describirCelda("T", "correcta")).toBe("T, en su lugar");
        expect(describirCelda("A", "ausente")).toBe("A, no está en la palabra");
        expect(describirCelda("O", null)).toBe("O");
        expect(describirCelda("", null)).toBe("vacía");
    });
});

describe("describirTiempoRestante (próxima carrera)", () => {
    const tiempo = (dias: number, horas: number, minutos: number) => ({ dias, horas, minutos, segundos: 0 });

    it("usa los días mientras falten, con el singular correcto", () => {
        expect(describirTiempoRestante(tiempo(17, 4, 3))).toBe("Faltan 17 días");
        expect(describirTiempoRestante(tiempo(1, 23, 59))).toBe("Falta 1 día");
    });

    it("el último día cuenta en horas y después en minutos, sin decir nunca 0", () => {
        expect(describirTiempoRestante(tiempo(0, 5, 10))).toBe("Faltan 5 horas");
        expect(describirTiempoRestante(tiempo(0, 1, 0))).toBe("Falta 1 hora");
        expect(describirTiempoRestante(tiempo(0, 0, 42))).toBe("Faltan 42 minutos");
        expect(describirTiempoRestante(tiempo(0, 0, 0))).toBe("Falta 1 minuto");
    });
});

describe("mensajesDeBusqueda", () => {
    it("dice lo mismo en todos los juegos y solo cambia el sustantivo", () => {
        expect(mensajesDeBusqueda("piloto")).toEqual({
            vacio: "Escribí o elegí un piloto.",
            noEncontrado: "Ese piloto no está en la lista.",
            repetido: "Ya probaste con ese piloto.",
        });
        expect(mensajesDeBusqueda("circuito").vacio).toBe("Escribí o elegí un circuito.");
    });

    it("no usa 'por favor' ni cambia de verbo entre avisos", () => {
        const { vacio, noEncontrado, repetido } = mensajesDeBusqueda("piloto");

        for (const texto of [vacio, noEncontrado, repetido]) {
            expect(texto).not.toMatch(/por favor/i);
            expect(texto.endsWith(".")).toBe(true);
        }
    });
});

describe("animación del Wordle", () => {
    it("revela una fila en cascada: una palabra de 8 letras tarda menos de 2 s, no los 3,4 s de antes", () => {
        expect(duracionRevelado(8)).toBe(1850);
        expect(duracionRevelado(5)).toBe(1250);
        expect(duracionRevelado(8)).toBeLessThan(8 * 420);
    });

    it("el color cambia justo a la mitad del giro", () => {
        expect(ANIMACION_FILA.giro / 2).toBe(225);
    });
});
