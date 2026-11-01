// Archivo: jugar un día anterior con ?dia=AAAA-MM-DD sin pisar la partida de hoy.
import { describe, expect, it } from "vitest";
import { crearAlmacenamientoEnMemoria } from "../src/lib/almacenamiento";
import { claveDelDia, conDia, leerDiaJuego, leerHistorial, registrarHistorial } from "../src/lib/dia-juego";
import { crearPartidaDiaria } from "../src/lib/partida";
import { CLAVE_RACHAS } from "../src/lib/rachas";

const HOY = new Date(2026, 10, 1, 15, 0);

describe("día que se juega", () => {
    it("sin ?dia se juega hoy", () => {
        expect(leerDiaJuego("", HOY)).toMatchObject({ fecha: "2026-11-01", esArchivo: false });
    });

    it("un día anterior desde el lanzamiento es del archivo", () => {
        const dia = leerDiaJuego("?dia=2026-10-26", HOY);

        expect(dia).toMatchObject({ fecha: "2026-10-26", esArchivo: true });
        expect(dia.fechaSeleccion.getDate()).toBe(26);
        expect(leerDiaJuego("?dia=2026-07-29", HOY).esArchivo).toBe(true);
    });

    it.each(["2026-11-01", "2026-11-02", "2026-07-28", "2026-02-30", "ayer", "2026-1-5"])("?dia=%s no vale y se juega hoy", (pedido) => {
        expect(leerDiaJuego("?dia=" + pedido, HOY)).toMatchObject({ fecha: "2026-11-01", esArchivo: false });
    });

    it("el archivo guarda en otra clave y los links conservan el día", () => {
        const dia = leerDiaJuego("?dia=2026-10-26", HOY);

        expect(claveDelDia("partidaTCdle", dia)).toBe("partidaTCdleArchivo");
        expect(claveDelDia("partidaTCdle", leerDiaJuego("", HOY))).toBe("partidaTCdle");
        expect(conDia("/pages/tcdle-wordle.html", dia)).toBe("/pages/tcdle-wordle.html?dia=2026-10-26");
    });

    it("una partida del archivo no toca la de hoy ni la racha", () => {
        const almacenamiento = crearAlmacenamientoEnMemoria();
        const dia = leerDiaJuego("?dia=2026-10-26", HOY);
        const partida = crearPartidaDiaria<number>({
            almacenamiento,
            clave: claveDelDia("partidaTCdle", dia),
            fecha: dia.fecha,
            objetivoId: 3,
            idsValidos: [1, 2, 3],
        });

        partida.cargar();
        partida.intentar(3);

        expect(almacenamiento.getItem("partidaTCdle")).toBeNull();
        expect(almacenamiento.getItem(CLAVE_RACHAS)).toBeNull();
        expect(JSON.parse(almacenamiento.getItem("partidaTCdleArchivo")!)).toMatchObject({ fecha: "2026-10-26", terminada: true });
    });

    it("el historial junta los resultados de cada día", () => {
        const almacenamiento = crearAlmacenamientoEnMemoria();
        registrarHistorial(almacenamiento, "2026-10-26", "piloto", true);
        registrarHistorial(almacenamiento, "2026-10-26", "wordle", false);
        registrarHistorial(almacenamiento, "2026-10-27", "auto", true);

        expect(leerHistorial(almacenamiento)).toEqual({
            "2026-10-26": { piloto: "acertado", wordle: "fallado" },
            "2026-10-27": { auto: "acertado" },
        });
    });
});
