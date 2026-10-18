// Contrato de lo que el sitio guarda en localStorage. Quien ya jugó tiene estos
// datos en su navegador: si una versión nueva los lee distinto o los escribe
// con otro formato, se pierden partidas y rachas. Este test fija el formato
// exacto para poder cambiar la estructura del proyecto sin romper a nadie.
import { describe, expect, it } from "vitest";
import { crearAlmacenamientoEnMemoria } from "../src/lib/almacenamiento";
import { crearDatoDiario } from "../src/lib/dato-diario";
import { MILISEGUNDOS_POR_DIA, obtenerFechaLocal } from "../src/lib/fechas";
import { JUEGOS } from "../src/lib/juegos";
import { crearPartidaDiaria } from "../src/lib/partida";
import { obtenerEstadoJuegos } from "../src/lib/rachas";
import { aplicarIntroInicial } from "../src/lib/inicio-pagina";
import { introVista, marcarIntroVista } from "../src/lib/intro";

const hoy = obtenerFechaLocal();
const ayer = obtenerFechaLocal(new Date(Date.now() - MILISEGUNDOS_POR_DIA));

describe("contrato de localStorage", () => {
    it("las claves y los ids de cada modo no pueden cambiar de nombre", () => {
        expect(JUEGOS.map(({ id, clavePartida }) => [id, clavePartida]), "Cambiaron las claves de partida guardadas en el navegador").toEqual([
            ["piloto", "partidaTCdle"],
            ["auto", "partidaTCdleAuto"],
            ["circuito", "partidaTCdleCircuito"],
            ["wordle", "partidaTCdleWordle"],
        ]);
        expect(JUEGOS.map(({ claveIntro }) => claveIntro)).toEqual([
            "tcdleIntroPilotoVista",
            "tcdleIntroAutoVista",
            "tcdleIntroCircuitoVista",
            "tcdleIntroWordleVista",
        ]);
    });

    describe("lo que se escribe: formato y orden de campos exactos", () => {
        const almacenamiento = crearAlmacenamientoEnMemoria();

        it("la partida del piloto y la racha", () => {
            const piloto = crearPartidaDiaria({
                almacenamiento,
                clave: "partidaTCdle",
                fecha: "2026-10-17",
                objetivoId: 3,
                idsValidos: [1, 2, 3, 4],
            });
            piloto.intentar(1);
            expect(almacenamiento.getItem("partidaTCdle")).toBe(
                '{"version":2,"fecha":"2026-10-17","objetivoId":3,"idsIntentados":[1],"terminada":false}'
            );
            piloto.intentar(3);
            expect(almacenamiento.getItem("partidaTCdle")).toBe(
                '{"version":2,"fecha":"2026-10-17","objetivoId":3,"idsIntentados":[1,3],"terminada":true}'
            );
            expect(almacenamiento.getItem("rachasTCdle"), "Cambió el formato de las rachas").toBe(
                '{"piloto":{"fecha":"2026-10-17","racha":1}}'
            );
        });

        it("el Wordle guarda las palabras como texto", () => {
            const wordle = crearPartidaDiaria<string>({
                almacenamiento,
                clave: "partidaTCdleWordle",
                fecha: "2026-10-17",
                objetivoId: "FORD",
                validarId: (id) => typeof id === "string",
                maximoIntentos: 5,
            });
            wordle.intentar("RAID");
            expect(almacenamiento.getItem("partidaTCdleWordle")).toBe(
                '{"version":2,"fecha":"2026-10-17","objetivoId":"FORD","idsIntentados":["RAID"],"terminada":false}'
            );
        });

        it("la respuesta del año del auto", () => {
            crearDatoDiario({ almacenamiento, clave: "partidaTCdleAutoAnio", fecha: "2026-10-17" }).guardar(2015);
            expect(almacenamiento.getItem("partidaTCdleAutoAnio"), "Cambió el formato de la respuesta del año").toBe(
                '{"fecha":"2026-10-17","valor":2015}'
            );
        });
    });

    it("lo que ya está guardado se sigue leyendo: partidas de hoy en cada modo y rachas", () => {
        const guardadas = crearAlmacenamientoEnMemoria();
        guardadas.setItem("partidaTCdle", JSON.stringify({ version: 2, fecha: hoy, objetivoId: 7, idsIntentados: [2, 7], terminada: true }));
        guardadas.setItem(
            "partidaTCdleAuto",
            JSON.stringify({ version: 2, fecha: hoy, objetivoId: 4, idsIntentados: [1, 2, 3, 5, 6, 7, 8, 9], terminada: true })
        );
        guardadas.setItem(
            "partidaTCdleCircuito",
            JSON.stringify({ version: 2, fecha: hoy, objetivoId: "rafaela", idsIntentados: ["parana"], terminada: false })
        );
        guardadas.setItem(
            "partidaTCdleWordle",
            JSON.stringify({ version: 2, fecha: ayer, objetivoId: "FORD", idsIntentados: ["FORD"], terminada: true })
        );
        guardadas.setItem(
            "rachasTCdle",
            JSON.stringify({
                piloto: { fecha: hoy, racha: 12 },
                auto: { fecha: ayer, racha: 3 },
                circuito: { fecha: "2020-01-01", racha: 9 },
            })
        );

        const estados = Object.fromEntries(obtenerEstadoJuegos(guardadas).map(({ id, estado, racha }) => [id, { estado, racha }]));

        expect(estados).toEqual({
            piloto: { estado: "acertado", racha: 12 },
            auto: { estado: "fallado", racha: 3 },
            circuito: { estado: "pendiente", racha: 0 },
            wordle: { estado: "pendiente", racha: 0 },
        });
    });

    describe("la introducción de cada modo recuerda con la fecha en texto si ya se vio", () => {
        it("se muestra cada día", () => {
            const guardadas = crearAlmacenamientoEnMemoria();

            expect(introVista(guardadas, "tcdleIntroPilotoVista", hoy)).toBe(false);
            marcarIntroVista(guardadas, "tcdleIntroPilotoVista", hoy);
            expect(guardadas.getItem("tcdleIntroPilotoVista")).toBe(hoy);
            expect(introVista(guardadas, "tcdleIntroPilotoVista", hoy)).toBe(true);
            guardadas.setItem("tcdleIntroPilotoVista", ayer);
            expect(introVista(guardadas, "tcdleIntroPilotoVista", hoy), "La intro se vuelve a mostrar cada día").toBe(false);
        });

        it("el script del head lee el mismo formato antes del primer pintado", () => {
            const clases = new Set<string>();
            const datos = new Map([["tcdleIntroPilotoVista", hoy]]);
            const entorno = {
                localStorage: { getItem: (clave: string) => datos.get(clave) ?? null },
                document: { documentElement: { classList: { add: (clase: string) => clases.add(clase) } } },
            };
            const ejecutar = new Function("localStorage", "document", `(${aplicarIntroInicial})("tcdleIntroPilotoVista");`);

            ejecutar(entorno.localStorage, entorno.document);
            expect([...clases]).toEqual(["intro-vista"]);

            clases.clear();
            datos.set("tcdleIntroPilotoVista", ayer);
            ejecutar(entorno.localStorage, entorno.document);
            expect([...clases]).toEqual([]);
        });
    });
});
