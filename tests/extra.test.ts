// Juegos de "Más juegos": trayectoria, grilla y conexiones.
import { describirContador } from "../src/lib/intentos";
import { describe, expect, it } from "vitest";
import { carreras, pilotos } from "../src/data";
import {
    CONDICIONES,
    casillerosPosibles,
    candidatosGrupo,
    candidatosTrayectoria,
    gruposPosibles,
    construirFichas,
    contarTemporadasVisibles,
    elegirTrayectoria,
    generarConexiones,
    generarGrilla,
    probarConexion,
    resolverGrilla,
    respuestasCasillero,
    normalizarTiempoGrilla,
    normalizarDificultad,
    semillaDelDia,
    ERRORES_CONEXIONES,
} from "../src/lib/extra";
import { existsSync } from "node:fs";
import { historialPilotos } from "../src/data/catalogo/historial";
import { plantelExtra } from "../src/data/catalogo/plantel-extra";

// Trayectoria usa pilotos.json; la Grilla y Conexiones, el plantel ampliado con su historial.
const fichasTrayectoria = construirFichas(pilotos, carreras);
const fichas = construirFichas(plantelExtra, carreras, historialPilotos);
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
        expect(candidatosTrayectoria(fichasTrayectoria).length).toBeGreaterThan(30);
        for (const dia of DIAS) {
            expect(elegirTrayectoria(fichasTrayectoria, dia).temporadas.length).toBeGreaterThanOrEqual(5);
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

    it("cada día se arma sin repetir condición ni grupo, con dos respuestas por casillero y como mucho dos difíciles", () => {
        for (const dia of DIAS) {
            const grilla = generarGrilla(fichas, "grilla:" + texto(dia));
            const todas = [...grilla.filas, ...grilla.columnas];
            expect(new Set(todas.map((condicion) => condicion.id)).size).toBe(6);
            const grupos = todas.map((condicion) => condicion.grupo).filter(Boolean);
            expect(new Set(grupos).size, texto(dia)).toBe(grupos.length);
            expect(todas.filter((condicion) => condicion.dificultad === 2).length).toBeLessThanOrEqual(2);
            expect(grilla.filas.some((condicion) => condicion.tipo === "provincia")).toBe(false);
            expect(grilla.columnas.some((condicion) => condicion.tipo === "marca")).toBe(false);
            for (const fila of grilla.filas) {
                for (const columna of grilla.columnas) {
                    expect(respuestasCasillero(fichas, fila, columna).length).toBeGreaterThanOrEqual(2);
                }
            }
        }
    });

    it("toda grilla del año se puede completar con nueve pilotos distintos", () => {
        for (let indice = 0; indice < 365; indice++) {
            const fecha = texto(new Date(2026, 10, 1 + indice));
            const grilla = generarGrilla(fichas, "grilla:" + fecha);
            const solucion = resolverGrilla(fichas, grilla);
            expect(solucion, fecha).not.toBeNull();
            expect(new Set(solucion!.values()).size).toBe(9);
            for (const [casillero, id] of solucion!) {
                const ficha = fichas.find((f) => f.id === id)!;
                expect(grilla.filas[Math.floor(casillero / 3)].cumple(ficha) && grilla.columnas[casillero % 3].cumple(ficha)).toBe(true);
            }
        }
    });

    it("cada consigna tiene su insignia, y las que cumplen cinco pilotos o más salen en el año", () => {
        const vistas = new Set<string>();
        for (let indice = 0; indice < 365; indice++) {
            const { filas, columnas } = generarGrilla(fichas, "grilla:" + texto(new Date(2026, 10, 1 + indice)));
            [...filas, ...columnas].forEach((condicion) => vistas.add(condicion.id));
        }
        for (const condicion of CONDICIONES) {
            expect(existsSync(new URL("../src/assets/grilla/" + condicion.insignia + ".svg", import.meta.url)), condicion.insignia).toBe(true);
            // "Del norte" y "Nació afuera" esperan a que el plantel sume pilotos: hoy son 4 y 2.
            if (fichas.filter(condicion.cumple).length >= 5) {
                expect(vistas.has(condicion.id), condicion.id).toBe(true);
            }
        }
    });

    it("el historial suma lo de antes de 2010 y lo de afuera de las finales", () => {
        const consigna = (id: string) => CONDICIONES.find((c) => c.id === id)!;
        const ficha = (nombre: string) => fichas.find((f) => f.nombre === nombre)!;
        // Leyendas sin finales desde 2010: ganan finales y suman marcas.
        expect(consigna("victoria").cumple(ficha("Juan Manuel Fangio"))).toBe(true);
        expect(consigna("marca-Chevrolet").cumple(ficha("Carlos Pairetti"))).toBe(true);
        expect(ficha("Carlos Pairetti").grupo).toBe("leyenda");
        expect(ficha("Guillermo Ortelli").grupo).toBe("ex");
        expect(ficha("Agustín Canapino").grupo).toBe("activo");
        // Títulos, Copa de Oro, familia y exterior.
        expect(consigna("subcampeon").cumple(ficha("Mariano Altuna"))).toBe(true);
        expect(consigna("escuela").cumple(ficha("Agustín Canapino"))).toBe(true);
        expect(consigna("familia").cumple(ficha("Matías Canapino"))).toBe(true);
        expect(consigna("exterior").cumple(ficha("Gastón Mazzacane"))).toBe(true);
        expect(ficha("Mariano Werner").debut).toBe(2008);
        // Los tres que se suman al plantel.
        const ponce = ficha("Gabriel Ponce de León");
        expect(ponce.grupo).toBe("ex");
        expect(consigna("subcampeon").cumple(ponce)).toBe(true);
        expect(consigna("copa-de-oro").cumple(ponce)).toBe(true);
        expect(ponce.victorias).toBeGreaterThan(0);
    });

    it("las consignas nuevas cuentan bien los datos de las finales", () => {
        const werner = fichas.find((ficha) => ficha.nombre === "Mariano Werner")!;
        const podios = carreras.filter((carrera) => carrera.resultados.slice(0, 3).some((r) => r.piloto === "Mariano Werner")).length;
        expect(werner.podios).toBe(podios);
        expect(CONDICIONES.find((c) => c.id === "victorias-10")!.cumple(werner)).toBe(true);
        expect(CONDICIONES.find((c) => c.id === "podio-sin-ganar")!.cumple(werner)).toBe(false);
        // Las leyendas sin finales cargadas no cuentan como "siempre la misma marca".
        const fangio = fichas.find((ficha) => ficha.nombre === "Juan Manuel Fangio")!;
        expect(CONDICIONES.find((c) => c.id === "misma-marca")!.cumple(fangio)).toBe(false);
    });

    it("es la misma grilla para todos el mismo día", () => {
        const a = generarGrilla(fichas, "grilla:2026-11-01");
        const b = generarGrilla(fichas, "grilla:2026-11-01");
        expect([...a.filas, ...a.columnas].map((c) => c.id)).toEqual([...b.filas, ...b.columnas].map((c) => c.id));
    });
});

describe("conexiones", () => {
    it("usa pilotos que corren hoy, salvo el grupo de leyendas, y grupos con al menos cuatro", () => {
        for (const grupo of gruposPosibles(fichas)) {
            expect(candidatosGrupo(grupo, fichas).filter(grupo.cumple).length, grupo.texto).toBeGreaterThanOrEqual(4);
        }
        for (const dia of DIAS) {
            const { grupos, orden } = generarConexiones(fichas, "conexiones:" + texto(dia));
            for (const { grupo, pilotos } of grupos) {
                const esperado = grupo.soloLeyendas ? "leyenda" : "activo";
                expect(pilotos.every((id) => fichas.find((ficha) => ficha.id === id)!.grupo === esperado)).toBe(true);
            }
            expect(orden).toHaveLength(16);
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

    it("salen los grupos nuevos y los números no se comen la semana", () => {
        const veces = new Map<string, number>();
        for (let indice = 0; indice < 365; indice++) {
            const { grupos } = generarConexiones(fichas, "conexiones:" + texto(new Date(2026, 10, 1 + indice)));
            for (const { grupo } of grupos) {
                const tipo = grupo.id.split("-")[0];
                veces.set(tipo, (veces.get(tipo) ?? 0) + 1);
            }
        }
        for (const tipo of ["leyendas", "familia", "exterior", "uno", "marcas", "numero", "sin", "nombre", "nacio"]) {
            expect(veces.get(tipo) ?? 0, tipo).toBeGreaterThan(0);
        }
        // Un tipo con muchos grupos (los números) no sale más que en un tercio de los días.
        expect(veces.get("numero")!).toBeLessThan(365 / 3);
        expect(gruposPosibles(fichas).some((grupo) => grupo.id === "copa-de-oro")).toBe(false);
    });

    it("probar cuatro dice si es un grupo o si erraste por uno", () => {
        const conexiones = generarConexiones(fichas, "conexiones:2026-11-01");
        const [primero, segundo] = conexiones.grupos;

        expect(probarConexion(conexiones, primero.pilotos)).toEqual({ grupo: primero.grupo.id, aUno: false });
        expect(probarConexion(conexiones, [...primero.pilotos.slice(0, 3), segundo.pilotos[0]])).toEqual({ grupo: null, aUno: true });
        expect(probarConexion(conexiones, [...primero.pilotos.slice(0, 2), ...segundo.pilotos.slice(0, 2)])).toEqual({ grupo: null, aUno: false });
    });
});

describe("dificultades de la grilla y conexiones", () => {
    const ids = (g: { filas: { id: string }[]; columnas: { id: string }[] }) => [...g.filas, ...g.columnas].map((c) => c.id);

    it("la normal es la de siempre: no cambia lo que ya salió", () => {
        for (const dia of DIAS.slice(0, 30)) {
            const fecha = texto(dia);
            expect(semillaDelDia("grilla", fecha, "normal")).toBe("grilla:" + fecha);
            expect(ids(generarGrilla(fichas, "grilla:" + fecha, "normal"))).toEqual(ids(generarGrilla(fichas, "grilla:" + fecha)));
            expect(generarConexiones(fichas, "conexiones:" + fecha, "normal").orden).toEqual(generarConexiones(fichas, "conexiones:" + fecha).orden);
        }
        expect(normalizarDificultad("cualquiera")).toBe("normal");
    });

    it("grilla fácil: sin consignas difíciles y con cuatro respuestas por casillero; difícil: dos o más difíciles", () => {
        for (const dia of DIAS) {
            const fecha = texto(dia);
            const facil = generarGrilla(fichas, semillaDelDia("grilla", fecha, "facil"), "facil");
            expect([...facil.filas, ...facil.columnas].every((c) => c.dificultad <= 1)).toBe(true);
            for (const fila of facil.filas) {
                for (const columna of facil.columnas) {
                    expect(respuestasCasillero(fichas, fila, columna).length).toBeGreaterThanOrEqual(4);
                }
            }
            const dificil = generarGrilla(fichas, semillaDelDia("grilla", fecha, "dificil"), "dificil");
            const todas = [...dificil.filas, ...dificil.columnas];
            expect(todas.filter((c) => c.dificultad === 2).length, fecha).toBeGreaterThanOrEqual(2);
            expect(todas.filter((c) => c.dificultad === 0).length).toBeLessThanOrEqual(1);
            expect(resolverGrilla(fichas, facil)).not.toBeNull();
            expect(resolverGrilla(fichas, dificil)).not.toBeNull();
        }
    });

    it("conexiones fácil: sin grupos violeta y 5 errores; difícil: dos violeta o más, ninguno obvio y 3 errores", () => {
        expect(ERRORES_CONEXIONES).toEqual({ facil: 5, normal: 4, dificil: 3 });
        for (const dia of DIAS) {
            const fecha = texto(dia);
            const facil = generarConexiones(fichas, semillaDelDia("conexiones", fecha, "facil"), "facil");
            expect(facil.grupos.every(({ grupo }) => grupo.dificultad <= 2)).toBe(true);
            const dificil = generarConexiones(fichas, semillaDelDia("conexiones", fecha, "dificil"), "dificil");
            expect(dificil.grupos.filter(({ grupo }) => grupo.dificultad === 3).length).toBeGreaterThanOrEqual(2);
            expect(dificil.grupos.every(({ grupo }) => grupo.dificultad >= 1)).toBe(true);
        }
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
