// Tema de Halloween: se activa solo del 20/10 al 2/11 y se puede forzar con ?halloween=1/0.
import { afterEach, describe, expect, it, vi } from "vitest";
import { pilotos } from "../src/data";
import { copaDeOro } from "../src/data/copa-de-oro";
import {
    aplicarContrasteInicial,
    aplicarModoInicial,
    aplicarTemaCopaInicial,
    aplicarTemaInicial,
    CLAVE_CONTRASTE,
    CLAVE_MODO,
    CLAVE_SIN_COPA,
} from "../src/lib/inicio-pagina";

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

describe("alto contraste", () => {
    function contraste(guardado: string | null | Error) {
        const documentElement = { dataset: {} as Record<string, string> };
        vi.stubGlobal("document", { documentElement });
        vi.stubGlobal("localStorage", {
            getItem: (clave: string) => {
                if (guardado instanceof Error) {
                    throw guardado;
                }
                return clave === CLAVE_CONTRASTE ? guardado : null;
            },
        });
        aplicarContrasteInicial();
        return documentElement.dataset.contraste;
    }

    it("se prende solo si la persona lo eligió", () => {
        expect(contraste("alto")).toBe("alto");
        expect(contraste(null)).toBeUndefined();
    });

    it("sin localStorage se ve con los colores de siempre", () => {
        expect(contraste(new Error("bloqueado"))).toBeUndefined();
    });

    it("la clave que lee antes del primer pintado es la que guarda el botón", () => {
        // aplicarContrasteInicial se inserta como texto y no puede usar la constante.
        expect(aplicarContrasteInicial.toString()).toContain(JSON.stringify(CLAVE_CONTRASTE));
    });
});

describe("tema de la Copa de Oro", () => {
    function copa(fecha: Date, busqueda = "", temaPrevio?: string) {
        vi.useFakeTimers();
        vi.setSystemTime(fecha);
        const documentElement = { dataset: (temaPrevio ? { tema: temaPrevio } : {}) as Record<string, string> };
        const sesion = new Map<string, string>();
        vi.stubGlobal("window", { location: { search: busqueda } });
        vi.stubGlobal("document", { documentElement });
        vi.stubGlobal("sessionStorage", {
            getItem: (clave: string) => sesion.get(clave) ?? null,
            setItem: (clave: string, valor: string) => sesion.set(clave, valor),
        });
        aplicarTemaCopaInicial("2026-11-03", "2026-12-06");
        return documentElement.dataset.tema;
    }

    it.each([
        [new Date(2026, 10, 2), undefined],
        [new Date(2026, 10, 3), "copa-oro"],
        [new Date(2026, 11, 6, 23, 0), "copa-oro"],
        [new Date(2026, 11, 7), undefined],
    ])("el %s el tema es %s", (fecha, esperado) => {
        expect(copa(fecha)).toBe(esperado);
    });

    it("si la persona lo apagó en Apariencia se ve rojo, salvo que lo fuerce ?copa=1", () => {
        vi.stubGlobal("localStorage", { getItem: (clave: string) => (clave === CLAVE_SIN_COPA ? "1" : null) });
        expect(copa(new Date(2026, 10, 20))).toBeUndefined();
        expect(copa(new Date(2026, 10, 20), "?copa=1")).toBe("copa-oro");
    });

    it("Halloween le gana si los dos caen el mismo día", () => {
        expect(copa(new Date(2026, 10, 10), "", "halloween")).toBe("halloween");
    });

    it("?copa=1 lo prende fuera de fecha y ?copa=0 lo apaga", () => {
        expect(copa(new Date(2026, 5, 1), "?copa=1")).toBe("copa-oro");
        expect(copa(new Date(2026, 10, 20), "?copa=0")).toBeUndefined();
    });

    it("las fechas y los pilotos de la temporada están bien cargados", () => {
        expect(copaDeOro.desde < copaDeOro.hasta).toBe(true);
        expect(new Set(copaDeOro.pilotos).size).toBe(copaDeOro.pilotos.length);
        for (const id of copaDeOro.pilotos) {
            expect(pilotos.find((piloto) => piloto.id === id && !piloto.retirado), "piloto " + id).toBeDefined();
        }
    });
});

describe("modo claro u oscuro", () => {
    function modo(guardado: string | null, sistemaClaro: boolean) {
        const documentElement = { dataset: {} as Record<string, string> };
        vi.stubGlobal("document", { documentElement });
        vi.stubGlobal("localStorage", { getItem: (clave: string) => (clave === CLAVE_MODO ? guardado : null) });
        vi.stubGlobal("window", { matchMedia: () => ({ matches: sistemaClaro, addEventListener: () => {} }) });
        aplicarModoInicial();
        return documentElement.dataset.modo;
    }

    it("sin elección sigue al sistema", () => {
        expect(modo(null, true)).toBe("claro");
        expect(modo(null, false)).toBe("oscuro");
    });

    it("lo elegido le gana al sistema", () => {
        expect(modo("oscuro", true)).toBe("oscuro");
        expect(modo("claro", false)).toBe("claro");
    });

    it("un valor guardado raro cuenta como automático", () => {
        expect(modo("rosa", true)).toBe("claro");
    });

    it("las claves que leen los scripts del primer pintado son las que guarda el menú", () => {
        expect(aplicarModoInicial.toString()).toContain(JSON.stringify(CLAVE_MODO));
        expect(aplicarTemaCopaInicial.toString()).toContain(JSON.stringify(CLAVE_SIN_COPA));
    });
});
