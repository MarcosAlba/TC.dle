// Juegos de "Más juegos": trayectoria, grilla y conexiones.
import { describirContador } from "../src/lib/intentos";
import { describe, expect, it } from "vitest";
import { carreras, pilotos } from "../src/data";
import {
    CONDICIONES,
    casillerosPosibles,
    candidatosTrayectoria,
    gruposPosibles,
    construirFichas,
    contarTemporadasVisibles,
    elegirTrayectoria,
    generarConexiones,
    generarGrilla,
    probarConexion,
    respuestasCasillero,
    normalizarTiempoGrilla,
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
    it("«Corre o corrió con» cuenta las marcas de todas sus finales, no solo la de hoy", () => {
        const rossi = fichas.find((ficha) => ficha.nombre === "Matias Rossi")!;
        const chevrolet = CONDICIONES.find((condicion) => condicion.id === "marca-Chevrolet")!;

        expect(rossi.marca).toBe("Toyota");
        expect(chevrolet.cumple(rossi)).toBe(true);
    });

    it("un piloto se ubica solo en los casilleros cuya fila y columna cumple", () => {
        const grilla = generarGrilla(fichas, "grilla:2026-11-10");
        for (const ficha of fichas) {
            for (const indice of casillerosPosibles(grilla, ficha)) {
                expect(grilla.filas[Math.floor(indice / 3)].cumple(ficha) && grilla.columnas[indice % 3].cumple(ficha)).toBe(true);
            }
        }
    });

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
    it("solo usa pilotos que corren hoy y grupos con al menos cuatro de ellos", () => {
        for (const grupo of gruposPosibles(fichas)) {
            expect(fichas.filter((ficha) => !ficha.retirado && grupo.cumple(ficha)).length, grupo.texto).toBeGreaterThanOrEqual(4);
        }
        for (const dia of DIAS) {
            const { grupos, orden } = generarConexiones(fichas, "conexiones:" + texto(dia));
            expect(orden.every((id) => !fichas.find((ficha) => ficha.id === id)!.retirado)).toBe(true);
            // Nunca dos grupos del mismo tipo (dos marcas, dos circuitos...), y del más fácil al más difícil.
            expect(new Set(grupos.map(({ grupo }) => grupo.id.split("-")[0])).size).toBe(4);
            expect(grupos.map(({ grupo }) => grupo.dificultad)).toEqual([...grupos.map(({ grupo }) => grupo.dificultad)].sort((a, b) => a - b));
        }
    });

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

describe("tiempo de la grilla y marcas de intentos", () => {
    it("solo valen los tiempos ofrecidos; cualquier otro es sin tiempo", () => {
        expect(normalizarTiempoGrilla(30)).toBe(30);
        expect(normalizarTiempoGrilla(120)).toBe(120);
        expect(normalizarTiempoGrilla(45)).toBeNull();
        expect(normalizarTiempoGrilla("60")).toBeNull();
        expect(normalizarTiempoGrilla(undefined)).toBeNull();
    });

    it("el contador sabe cuántas marcas dibujar y cuál es la del intento en curso", () => {
        expect(describirContador({ terminada: false, intentosUsados: 2, maximoIntentos: 8 })).toEqual({
            texto: "Intento 3 de 8",
            numero: 3,
            maximo: 8,
            ultimo: false,
        });
        expect(describirContador({ terminada: false, intentosUsados: 7, maximoIntentos: 8 }).ultimo).toBe(true);
    });
});
