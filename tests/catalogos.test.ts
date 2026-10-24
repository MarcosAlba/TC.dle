// Catálogos: lo que valida el build y la auditoría de las siluetas de circuito.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import autos from "../src/data/autos.json";
import carreras from "../src/data/carreras.json";
import circuitos from "../src/data/circuitos.json";
import fotosCarreras from "../src/data/fotos-carreras.json";
import palabras from "../src/data/palabras.json";
import pilotos from "../src/data/pilotos.json";
import type { Auto, Carrera, Circuito, FotoCarrera, Piloto } from "../src/data/tipos";
import {
    validarAutos,
    validarCarreras,
    validarCircuitos,
    validarFotosCarreras,
    validarPalabras,
    validarPilotos,
} from "../src/data/validar";

const imagenesCircuitos = path.resolve(import.meta.dirname, "../public/assets/images/circuitos");

describe("validación de los catálogos reales", () => {
    it("pilotos", () => expect(() => validarPilotos(pilotos as Piloto[])).not.toThrow());
    it("autos", () => expect(() => validarAutos(autos as Auto[], pilotos as Piloto[])).not.toThrow());
    it("circuitos", () => expect(() => validarCircuitos(circuitos as Circuito[])).not.toThrow());
    it("palabras", () => expect(() => validarPalabras(palabras)).not.toThrow());
    it("carreras", () => expect(() => validarCarreras(carreras as Carrera[])).not.toThrow());
    it("fotos de las carreras, con su archivo en public", () => {
        expect(() => validarFotosCarreras(fotosCarreras as FotoCarrera[])).not.toThrow();
        for (const foto of fotosCarreras as FotoCarrera[]) {
            const archivo = path.resolve(import.meta.dirname, "../public/assets/images/pilotos-carreras", foto.archivo);
            expect(existsSync(archivo), `falta ${foto.archivo}`).toBe(true);
        }
    });
});

describe("la validación frena datos mal cargados", () => {
    const piloto = pilotos[0] as Piloto;

    it("un id de piloto repetido", () => {
        expect(() => validarPilotos([piloto, piloto])).toThrow(/id repetido/);
    });

    it("una foto fuera de pilotos/", () => {
        expect(() => validarPilotos([{ ...piloto, foto: "autos/x.webp" }])).toThrow(/foto/);
    });

    it("un auto de un piloto que no existe", () => {
        expect(() => validarAutos([{ pilotoId: 99999, archivo: "x.webp", anio: 2020 }], [piloto])).toThrow(/no existe/);
    });

    it("una carrera con posiciones salteadas o un id repetido", () => {
        const resultado = (posicion: number, piloto: string) => ({
            posicion, numero: posicion, piloto, apellido: piloto.split(" ").pop()!, marca: "Ford", vueltas: 25, diferencia: null,
        });
        const carrera = {
            id: "2019-05-rosario", anio: 2019, fechaNro: 5, nombre: "Rosario", circuito: "Rosario",
            fecha: "2019-05-05", resultados: [resultado(1, "Matías Rossi"), resultado(2, "Christian Ledesma")],
        };
        expect(() => validarCarreras([carrera])).not.toThrow();
        expect(() => validarCarreras([carrera, carrera])).toThrow(/id repetido/);
        expect(() =>
            validarCarreras([{ ...carrera, resultados: [resultado(1, "A B"), resultado(3, "C D")] }])
        ).toThrow(/donde iba 2/);
    });

    it("una foto repetida, en otra carpeta o sin origen", () => {
        const foto: FotoCarrera = {
            piloto: "Matías Rodríguez",
            archivo: "rodriguez-matias.webp",
            origenUrl: "https://actc.org.ar/uploads/actc-pilotos/rodriguez-matias/rodriguez-matias-torso.png",
        };
        expect(() => validarFotosCarreras([foto])).not.toThrow();
        expect(() => validarFotosCarreras([foto, foto])).toThrow(/repetido/);
        expect(() => validarFotosCarreras([{ ...foto, archivo: "otra/rodriguez.webp" }])).toThrow(/carpetas/);
        expect(() => validarFotosCarreras([{ ...foto, origenUrl: "" }])).toThrow(/origen/);
    });

    it("una palabra con tilde o repetida", () => {
        expect(() => validarPalabras(["CAMPEÓN"])).toThrow(/A-Z/);
        expect(() => validarPalabras(["FORD", "FORD"])).toThrow(/repetida/);
    });
});

describe("catálogo de circuitos", () => {
    const catalogo = circuitos as Circuito[];

    it("tiene 29 sedes y 31 configuraciones jugables con ids únicos", () => {
        expect(catalogo).toHaveLength(31);
        expect(new Set(catalogo.map(({ sedeId }) => sedeId)).size).toBe(29);
        expect(new Set(catalogo.map(({ id }) => id)).size).toBe(catalogo.length);
    });

    it.each(catalogo.map((circuito) => [circuito.id, circuito] as const))("%s: datos completos y silueta válida", (_id, circuito) => {
        for (const campo of ["id", "sedeId", "nombre", "variante", "ciudad", "provincia", "longitud", "participacionTC", "imagen", "fuente"] as const) {
            expect(typeof circuito[campo], `falta ${campo}`).toBe("string");
            expect(circuito[campo].trim(), `${campo} está vacío`).not.toBe("");
        }

        expect(circuito.aliases.length, "faltan respuestas alternativas").toBeGreaterThan(0);
        expect(() => new URL(circuito.fuente), "fuente inválida").not.toThrow();

        const svg = readFileSync(path.join(imagenesCircuitos, circuito.imagen), "utf8");
        const tieneViewBox = /<svg[^>]+viewBox="(?:-?\d+(?:\.\d+)?\s+){3}\d+(?:\.\d+)?"/i.test(svg);
        const tieneDimensiones = /<svg[^>]+\bwidth="\d+(?:\.\d+)?(?:px|pt)?"[^>]+\bheight="\d+(?:\.\d+)?(?:px|pt)?"/i.test(svg);

        expect(tieneViewBox || tieneDimensiones, "faltan dimensiones SVG válidas").toBe(true);
        expect(svg, "falta la silueta").toMatch(/<path\b/i);
        expect(svg, "contiene información visual no permitida").not.toMatch(/<(?:image|text|foreignObject)\b/i);
    });

    it.each([
        ["la-plata-sin-chicana", "la-plata-con-chicana"],
        ["termas-largo", "termas-corto"],
    ])("las variantes %s y %s no comparten silueta", (a, b) => {
        const hashes = [a, b].map((id) => {
            const circuito = catalogo.find((item) => item.id === id)!;
            return createHash("sha256").update(readFileSync(path.join(imagenesCircuitos, circuito.imagen))).digest("hex");
        });

        expect(hashes[0]).not.toBe(hashes[1]);
    });
});
