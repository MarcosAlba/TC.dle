// Estadísticas del pop up de fin de partida: salen del historial por día y de la distribución.
import { describe, expect, it } from "vitest";
import { crearAlmacenamientoEnMemoria } from "../src/lib/almacenamiento";
import { registrarHistorial } from "../src/lib/dia-juego";
import { calcularEstadisticas, CLAVE_DISTRIBUCION, registrarDistribucion } from "../src/lib/estadisticas";
import { registrarResultadoRacha } from "../src/lib/rachas";

function jugar(almacenamiento: ReturnType<typeof crearAlmacenamientoEnMemoria>, fecha: string, puntaje: number | null, maximo = 8) {
    const gano = puntaje !== null;
    registrarHistorial(almacenamiento, fecha, "circuito", gano);
    registrarResultadoRacha(almacenamiento, "partidaTCdleCircuito", fecha, gano);
    registrarDistribucion(almacenamiento, "circuito", { puntaje, maximo, gano });
}

describe("estadísticas por juego", () => {
    it("cuenta jugadas, ganadas, porcentaje, racha y mejor racha", () => {
        const almacenamiento = crearAlmacenamientoEnMemoria();
        jugar(almacenamiento, "2026-11-01", 2);
        jugar(almacenamiento, "2026-11-02", 3);
        jugar(almacenamiento, "2026-11-03", 1);
        jugar(almacenamiento, "2026-11-04", null);
        jugar(almacenamiento, "2026-11-05", 2);

        const e = calcularEstadisticas(almacenamiento, "circuito", "2026-11-05", { puntaje: 2, maximo: 8, gano: true });
        expect([e.jugadas, e.ganadas, e.porcentaje, e.racha, e.mejorRacha]).toEqual([5, 4, 80, 1, 3]);
    });

    it("un día salteado corta la mejor racha", () => {
        const almacenamiento = crearAlmacenamientoEnMemoria();
        jugar(almacenamiento, "2026-11-01", 2);
        jugar(almacenamiento, "2026-11-02", 2);
        jugar(almacenamiento, "2026-11-04", 2);

        expect(calcularEstadisticas(almacenamiento, "circuito", "2026-11-04").mejorRacha).toBe(2);
    });

    it("la distribución por intentos va de 1 al máximo más X, y marca la partida actual", () => {
        const almacenamiento = crearAlmacenamientoEnMemoria();
        jugar(almacenamiento, "2026-11-01", 2);
        jugar(almacenamiento, "2026-11-02", 2);
        jugar(almacenamiento, "2026-11-03", null);

        const { barras, tipo } = calcularEstadisticas(almacenamiento, "circuito", "2026-11-03", { puntaje: null, maximo: 8, gano: false });
        expect(tipo).toBe("intentos");
        expect(barras.map((barra) => barra.etiqueta)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "X"]);
        expect(barras.find((barra) => barra.etiqueta === "2")?.cantidad).toBe(2);
        expect(barras.filter((barra) => barra.actual).map((barra) => barra.etiqueta)).toEqual(["X"]);
    });

    it("la grilla y el Top 10 se miden en puntos, de 0 al máximo", () => {
        const almacenamiento = crearAlmacenamientoEnMemoria();
        registrarHistorial(almacenamiento, "2026-11-01", "grilla", false);
        registrarDistribucion(almacenamiento, "grilla", { puntaje: 6, maximo: 9, gano: false });

        const { barras, tipo } = calcularEstadisticas(almacenamiento, "grilla", "2026-11-01", { puntaje: 6, maximo: 9, gano: false });
        expect(tipo).toBe("puntos");
        expect(barras).toHaveLength(10);
        expect(barras[6]).toEqual({ etiqueta: "6", cantidad: 1, actual: true });
    });

    it("sin datos todo da cero y la clave nueva no pisa a las demás", () => {
        const almacenamiento = crearAlmacenamientoEnMemoria();
        const e = calcularEstadisticas(almacenamiento, "wordle", "2026-11-01");
        expect([e.jugadas, e.porcentaje, e.racha, e.mejorRacha, e.barras.length]).toEqual([0, 0, 0, 0, 1]);
        expect(CLAVE_DISTRIBUCION).toBe("tcdleDistribucion");
    });
});
