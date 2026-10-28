// Portada en PC: estado del día de cada juego y último ganador en el circuito de la próxima carrera.
import { describe, expect, it } from "vitest";
import { carreras } from "../src/data";
import { calendarioTC } from "../src/data/calendario";
import { crearAlmacenamientoEnMemoria } from "../src/lib/almacenamiento";
import { obtenerUltimoGanador } from "../src/lib/calendario";
import { obtenerJuego } from "../src/lib/juegos";
import { obtenerProgresoJuego } from "../src/lib/rachas";

const HOY = "2026-10-28";

function conPartida(clave: string, partida: object) {
    const almacenamiento = crearAlmacenamientoEnMemoria();
    almacenamiento.setItem(clave, JSON.stringify(partida));
    return almacenamiento;
}

describe("progreso del día en la portada", () => {
    it("sin partida de hoy está sin jugar", () => {
        const almacenamiento = conPartida("partidaTCdle", { fecha: "2026-10-27", objetivoId: 1, idsIntentados: [1], terminada: true });
        expect(obtenerProgresoJuego(almacenamiento, obtenerJuego("piloto"), HOY)).toBe("pendiente");
    });

    it("con intentos y sin terminar está en curso", () => {
        const almacenamiento = conPartida("partidaTCdleAuto", { fecha: HOY, objetivoId: 5, idsIntentados: [1, 2, 3], terminada: false });
        expect(obtenerProgresoJuego(almacenamiento, obtenerJuego("auto"), HOY)).toBe("en-curso");
    });

    it("terminado se ve como resuelto, aunque tenga intentos", () => {
        const almacenamiento = conPartida("partidaTCdleCircuito", { fecha: HOY, objetivoId: 9, idsIntentados: [4, 9], terminada: true });
        expect(obtenerProgresoJuego(almacenamiento, obtenerJuego("circuito"), HOY)).toBe("acertado");
    });

    it("el Top 10 guarda los intentos con otro nombre", () => {
        const almacenamiento = conPartida("partidaTCdleTop10", {
            version: 1,
            fecha: HOY,
            carreraId: "x",
            intentos: ["Rossi", "Werner"],
            rendido: false,
            sinTiempo: false,
            terminada: false,
            gano: false,
        });
        expect(obtenerProgresoJuego(almacenamiento, obtenerJuego("top10"), HOY)).toBe("en-curso");
    });
});

describe("último ganador en el circuito de la próxima carrera", () => {
    it("cada circuito del calendario existe en los resultados", () => {
        const circuitos = new Set(carreras.map((carrera) => carrera.circuito));
        for (const carrera of calendarioTC) {
            if (carrera.circuitoResultados) {
                expect(circuitos, carrera.lugar).toContain(carrera.circuitoResultados);
            }
        }
    });

    it("toma la última final antes de la fecha, no la de ese día", () => {
        const ganador = obtenerUltimoGanador(carreras, "Roberto José Mouras - La Plata", "2026-12-06");
        const finales = carreras.filter((carrera) => carrera.circuito === "Roberto José Mouras - La Plata" && carrera.fecha < "2026-12-06");
        const ultima = finales.sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

        expect(ganador).toEqual({ piloto: ultima.resultados[0].piloto, anio: ultima.anio });
        expect(obtenerUltimoGanador(carreras, "Roberto José Mouras - La Plata", "2000-01-01")).toBeNull();
    });
});
