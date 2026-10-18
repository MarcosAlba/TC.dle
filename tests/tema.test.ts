// Tema de Halloween: se activa solo del 20/10 al 2/11 y se puede forzar con ?halloween=1/0.
import { afterEach, describe, expect, it, vi } from "vitest";
import { aplicarTemaInicial } from "../src/lib/inicio-pagina";

function ejecutar(fecha: Date, busqueda = "", sesion = new Map<string, string>()) {
    vi.useFakeTimers();
    vi.setSystemTime(fecha);
    const documentElement = { dataset: {} as Record<string, string> };

    vi.stubGlobal("window", { location: { search: busqueda } });
    vi.stubGlobal("document", { documentElement });
    vi.stubGlobal("sessionStorage", {
        getItem: (clave: string) => sesion.get(clave) ?? null,
        setItem: (clave: string, valor: string) => sesion.set(clave, valor),
    });
    aplicarTemaInicial();

    return { tema: documentElement.dataset.tema, sesion };
}

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe("tema de Halloween", () => {
    it.each([
        [new Date(2026, 9, 19), undefined],
        [new Date(2026, 9, 20), "halloween"],
        [new Date(2026, 9, 31), "halloween"],
        [new Date(2026, 10, 2), "halloween"],
        [new Date(2026, 10, 3), undefined],
    ])("en la temporada (%s) el tema es %s", (fecha, esperado) => {
        expect(ejecutar(fecha).tema).toBe(esperado);
    });

    it("?halloween=1 lo prende fuera de fecha y queda prendido en la pestaña", () => {
        const { tema, sesion } = ejecutar(new Date(2026, 5, 1), "?halloween=1");

        expect(tema).toBe("halloween");
        expect(ejecutar(new Date(2026, 5, 1), "", sesion).tema).toBe("halloween");
    });

    it("?halloween=0 lo apaga en plena temporada", () => {
        const { tema, sesion } = ejecutar(new Date(2026, 9, 25), "?halloween=0");

        expect(tema).toBeUndefined();
        expect(ejecutar(new Date(2026, 9, 25), "", sesion).tema).toBeUndefined();
    });

    it("sin sessionStorage vale el parámetro de la página", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 1));
        const documentElement = { dataset: {} as Record<string, string> };
        vi.stubGlobal("window", { location: { search: "?halloween=1" } });
        vi.stubGlobal("document", { documentElement });
        vi.stubGlobal("sessionStorage", {
            getItem: () => {
                throw new Error("bloqueado");
            },
            setItem: () => {
                throw new Error("bloqueado");
            },
        });

        aplicarTemaInicial();

        expect(documentElement.dataset.tema).toBe("halloween");
    });
});
