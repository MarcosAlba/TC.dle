// Juegos de "Más juegos": trayectoria, grilla y conexiones.
import { describe, expect, it } from "vitest";
import { carreras, pilotos } from "../src/data";
import {
    candidatosTrayectoria,
    construirFichas,
    contarTemporadasVisibles,
    elegirTrayectoria,
    generarConexiones,
    generarGrilla,
    probarConexion,
    respuestasCasillero,
} from "../src/lib/extra";

const fichas = construirFichas(pilotos, carreras);
const DIAS = Array.from({ length: 120 }, (_, indice) => new Date(2026, 10, 1 + indice));
const texto = (fecha: Date) => fecha.toISOString().slice(0, 10);

describe("fichas de pilotos", () => {
    it("cuenta victorias y temporadas desde las finales", () => {
        const werner = fichas.find((ficha) => ficha.nombre === "Mariano Werner")!;

        expect(werner.victorias).toBe(carreras.filter((carrera) => carrera.resultados[0].piloto === "Mariano Werner").length);
        expect(werner.temporadas.length).toBeGreaterThan(5);
        expect(werner.temporadas.map((temporada) => temporada.anio)).toEqual([...werner.temporadas.map((t) => t.anio)].sort((a, b) => a - b));
    });
});

describe("trayectoria", () => {
    it("hay pilotos de sobra y el del día tiene al menos cinco temporadas", () => {
        expect(candidatosTrayectoria(fichas).length).toBeGreaterThan(30);
        for (const dia of DIAS) {
            expect(elegirTrayectoria(fichas, dia).temporadas.length).toBeGreaterThanOrEqual(5);
        }
    });

    it("arranca con tres temporadas, destapa dos por error y al final todas", () => {
        expect(contarTemporadasVisibles(10, 0, false)).toBe(3);
        expect(contarTemporadasVisibles(10, 2, false)).toBe(7);
        expect(contarTemporadasVisibles(10, 5, false)).toBe(10);
        expect(contarTemporadasVisibles(10, 0, true)).toBe(10);
    });
});

describe("grilla", () => {
    it("cada día se arma, sin repetir condición y con al menos dos respuestas por casillero", () => {
        for (const dia of DIAS) {
            const { filas, columnas } = generarGrilla(fichas, "grilla:" + texto(dia));
            expect(new Set([...filas, ...columnas].map((condicion) => condicion.id)).size).toBe(6);
            for (const fila of filas) {
                for (const columna of columnas) {
                    expect(respuestasCasillero(fichas, fila, columna).length).toBeGreaterThanOrEqual(2);
                }
            }
        }
    });

    it("es la misma grilla para todos el mismo día", () => {
        const a = generarGrilla(fichas, "grilla:2026-11-01");
        const b = generarGrilla(fichas, "grilla:2026-11-01");
        expect([...a.filas, ...a.columnas].map((c) => c.id)).toEqual([...b.filas, ...b.columnas].map((c) => c.id));
    });
});

describe("conexiones", () => {
    it("cada día son 16 pilotos distintos y cada uno encaja en un solo grupo de los cuatro", () => {
        for (const dia of DIAS) {
            const { grupos, orden } = generarConexiones(fichas, "conexiones:" + texto(dia));
            expect(new Set(orden).size).toBe(16);
            for (const id of orden) {
                const ficha = fichas.find((item) => item.id === id)!;
                expect(grupos.filter(({ grupo }) => grupo.cumple(ficha))).toHaveLength(1);
            }
        }
    });

    it("probar cuatro dice si es un grupo o si erraste por uno", () => {
        const conexiones = generarConexiones(fichas, "conexiones:2026-11-01");
        const [primero, segundo] = conexiones.grupos;

        expect(probarConexion(conexiones, primero.pilotos)).toEqual({ grupo: primero.grupo.id, aUno: false });
        expect(probarConexion(conexiones, [...primero.pilotos.slice(0, 3), segundo.pilotos[0]])).toEqual({ grupo: null, aUno: true });
        expect(probarConexion(conexiones, [...primero.pilotos.slice(0, 2), ...segundo.pilotos.slice(0, 2)])).toEqual({ grupo: null, aUno: false });
    });
});
