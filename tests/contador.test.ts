// Contador global: la función de Vercel y el texto que se muestra.
import { afterEach, describe, expect, it, vi } from "vitest";
import { describirConteo } from "../src/lib/contador";
import handler, { LIMITE_POR_DIA } from "../api/contador.js";

function respuesta() {
    const res = { codigo: 0, cuerpo: undefined as unknown, setHeader: vi.fn() };
    return Object.assign(res, {
        status(codigo: number) {
            res.codigo = codigo;
            return this;
        },
        json(cuerpo: unknown) {
            res.cuerpo = cuerpo;
        },
        end() {},
    });
}

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe("contador global", () => {
    it("describe cuántos terminaron y qué porcentaje ganó", () => {
        expect(describirConteo({ jugaron: 1284, ganaron: 783 })).toBe("1.284 lo terminaron hoy · 61 % lo sacó");
        expect(describirConteo({ jugaron: 1, ganaron: 0 })).toBe("1 persona lo terminó hoy · 0 % lo sacó");
        expect(describirConteo({ jugaron: 0, ganaron: 0 })).toBeNull();
        expect(describirConteo(undefined)).toBeNull();
    });

    it("sin la base configurada responde 503 y no rompe", async () => {
        const res = respuesta();
        await handler({ method: "GET", query: { fecha: "2026-11-01" } }, res);
        expect(res.codigo).toBe(503);
    });

    it("suma una partida de hoy y rechaza días viejos o juegos que no existen", async () => {
        vi.stubEnv("KV_REST_API_URL", "https://redis.ejemplo");
        vi.stubEnv("KV_REST_API_TOKEN", "token");
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-01T15:00:00-03:00"));
        const fetch = vi.fn(async (_url: string, _opciones: RequestInit) => new Response(JSON.stringify([{ result: 1 }, { result: 1 }])));
        vi.stubGlobal("fetch", fetch);

        const bien = respuesta();
        await handler({ method: "POST", body: { juego: "piloto", fecha: "2026-11-01", gano: false } }, bien);
        expect(bien.codigo).toBe(204);
        // Primero el límite diario de la conexión (una huella, no la IP) y después la partida.
        const [limite] = JSON.parse(String(fetch.mock.calls[0][1].body));
        expect(limite[0]).toBe("INCR");
        expect(limite[1]).toMatch(/^tcdle:limite:2026-11-01:[0-9a-f]{16}$/);
        expect(JSON.parse(String(fetch.mock.calls[1][1].body))).toEqual([
            ["INCR", "tcdle:2026-11-01:piloto:jugaron"],
            ["EXPIRE", "tcdle:2026-11-01:piloto:jugaron", 40 * 24 * 60 * 60],
        ]);

        for (const cuerpo of [
            { juego: "piloto", fecha: "2026-10-01", gano: true },
            { juego: "truco", fecha: "2026-11-01", gano: true },
            { juego: "piloto", fecha: "2026-11-01", gano: "sí" },
        ]) {
            const mal = respuesta();
            await handler({ method: "POST", body: cuerpo }, mal);
            expect(mal.codigo).toBe(400);
        }
    });

    it("no suma desde otro sitio ni más de la cuenta desde una misma conexión", async () => {
        vi.stubEnv("KV_REST_API_URL", "https://redis.ejemplo");
        vi.stubEnv("KV_REST_API_TOKEN", "token");
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-01T15:00:00-03:00"));
        let usadas = LIMITE_POR_DIA;
        const fetch = vi.fn(async () => new Response(JSON.stringify([{ result: ++usadas }, { result: 1 }])));
        vi.stubGlobal("fetch", fetch);
        const partida = { juego: "grilla", fecha: "2026-11-01", gano: true };

        const ajeno = respuesta();
        await handler({ method: "POST", headers: { origin: "https://otro-sitio.com" }, body: partida }, ajeno);
        expect(ajeno.codigo).toBe(403);
        expect(fetch).not.toHaveBeenCalled();

        const pasado = respuesta();
        await handler({ method: "POST", headers: { origin: "https://tc-dle.vercel.app", "x-real-ip": "1.2.3.4" }, body: partida }, pasado);
        expect(pasado.codigo).toBe(429);
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});
