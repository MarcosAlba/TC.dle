// Resumen del día: los cinco marcadores en un solo mensaje.
import { describe, expect, it } from "vitest";
import { crearAlmacenamientoEnMemoria } from "../src/lib/almacenamiento";
import { CLAVE_RESUMEN_DIA, construirTextoDia, obtenerDiaCompleto, obtenerNumeroTCdle, registrarMarcadorDia } from "../src/lib/dia";
import { JUEGOS } from "../src/lib/juegos";

const FECHA = "2026-11-01";

describe("resumen del día", () => {
    it("el número de TCdle cuenta desde el lanzamiento", () => {
        expect(obtenerNumeroTCdle("2026-07-29")).toBe(1);
        expect(obtenerNumeroTCdle("2026-07-30")).toBe(2);
        expect(obtenerNumeroTCdle(FECHA)).toBe(96);
    });

    it("está completo recién con los cinco juegos de hoy", () => {
        const almacenamiento = crearAlmacenamientoEnMemoria();

        JUEGOS.slice(0, -1).forEach((juego) => registrarMarcadorDia(almacenamiento, FECHA, juego.id, { puntaje: 2, maximo: 8, gano: true }));
        expect(obtenerDiaCompleto(almacenamiento, FECHA)).toBeNull();

        registrarMarcadorDia(almacenamiento, FECHA, "top10", { puntaje: 7, maximo: 10, gano: false });
        expect(obtenerDiaCompleto(almacenamiento, FECHA)?.map((item) => item.juego)).toEqual(JUEGOS.map((juego) => juego.id));
    });

    it("un resumen de otro día no cuenta y se reemplaza al registrar uno nuevo", () => {
        const almacenamiento = crearAlmacenamientoEnMemoria();
        JUEGOS.forEach((juego) => registrarMarcadorDia(almacenamiento, "2026-10-31", juego.id, { puntaje: 1, maximo: 8, gano: true }));

        expect(obtenerDiaCompleto(almacenamiento, FECHA)).toBeNull();

        registrarMarcadorDia(almacenamiento, FECHA, "piloto", { puntaje: 3, maximo: 8, gano: true });
        expect(JSON.parse(almacenamiento.getItem(CLAVE_RESUMEN_DIA)!)).toEqual({
            fecha: FECHA,
            juegos: { piloto: { puntaje: 3, maximo: 8, gano: true } },
        });
    });

    it("el texto no tiene spoilers: número de día, un renglón por juego y la dirección", () => {
        const texto = construirTextoDia(
            FECHA,
            [
                { juego: "piloto", marcador: { puntaje: 3, maximo: 8, gano: true } },
                { juego: "auto", marcador: { puntaje: 1, maximo: 8, gano: true } },
                { juego: "circuito", marcador: { puntaje: null, maximo: 8, gano: false } },
                { juego: "wordle", marcador: { puntaje: 4, maximo: 6, gano: true } },
                { juego: "top10", marcador: { puntaje: 7, maximo: 10, gano: false } },
            ],
            "https://tc-dle.vercel.app/"
        );

        expect(texto.split("\n")).toEqual([
            "TCdle #96 🏁 3/5",
            "👤 Piloto 3/8",
            "🚗 Auto 1/8",
            "🗺️ Circuito X/8",
            "🔤 Wordle 4/6",
            "🏆 Top 10 7/10",
            "https://tc-dle.vercel.app/",
        ]);
    });
});
