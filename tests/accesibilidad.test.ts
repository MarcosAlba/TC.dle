import { describe, expect, it } from "vitest";
import { describirTiempoRestante } from "../src/lib/calendario";
import { describirCelda, describirIntento, evaluarIntento } from "../src/lib/wordle";

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
