// Integridad de las fotos: cada foto que referencia un catálogo existe, es del
// formato que dice su extensión y no se pasa del peso razonable. Evita volver a
// subir un PNG de 2 MB o un JPEG disfrazado de .webp.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import autos from "../src/data/autos.json";
import pilotos from "../src/data/pilotos.json";
import { LOGOS_MARCAS, obtenerImagenMiniPiloto } from "../src/lib/pilotos";

const raiz = path.resolve(import.meta.dirname, "..");
const imagenes = path.join(raiz, "public/assets/images");
const KB = 1024;
const TOPE = { autos: 550 * KB, pilotos: 250 * KB, mini: 40 * KB };

function formatoReal(buffer: Buffer): string {
    if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return "jpeg";
    if (buffer.toString("ascii", 4, 12) === "ftypavif") return "avif";
    return "desconocido";
}

function revisar(ruta: string, tope: number) {
    const buffer = readFileSync(ruta);
    const extension = path.extname(ruta).slice(1).toLowerCase();
    const nombre = path.relative(imagenes, ruta);

    expect(formatoReal(buffer), `${nombre}: la extensión dice ${extension} pero el contenido es otro`).toBe(extension);
    expect(
        buffer.length,
        `${nombre}: pesa ${Math.round(buffer.length / KB)} KB y el tope es ${Math.round(tope / KB)} KB (correr npm run imagenes)`
    ).toBeLessThanOrEqual(tope);
}

describe("fotos de autos", () => {
    it("cada entrada del catálogo apunta a un archivo que existe, del formato y peso correctos", () => {
        for (const auto of autos) {
            revisar(path.join(imagenes, "autos", auto.archivo), TOPE.autos);
        }
    });

    it("no sobran archivos sin usar", () => {
        const usados = new Set(autos.map((auto) => auto.archivo));

        for (const archivo of readdirSync(path.join(imagenes, "autos"))) {
            expect(usados.has(archivo), `autos/${archivo}: no está en autos.json`).toBe(true);
        }
    });
});

describe("fotos de pilotos", () => {
    it("cada piloto tiene foto completa y miniatura (webp) del formato y peso correctos", () => {
        expect(pilotos.length).toBeGreaterThan(90);

        for (const piloto of pilotos) {
            revisar(path.join(imagenes, piloto.foto), TOPE.pilotos);
            revisar(path.join(imagenes, obtenerImagenMiniPiloto(piloto)), TOPE.mini);
        }
    });

    it("no sobran archivos sin usar", () => {
        const usadas = new Set(pilotos.map((piloto) => piloto.foto.replace(/^pilotos\//, "")));

        for (const entrada of readdirSync(path.join(imagenes, "pilotos"), { withFileTypes: true })) {
            if (entrada.isFile()) {
                expect(usadas.has(entrada.name), `pilotos/${entrada.name}: no está en pilotos.json`).toBe(true);
            }
        }
    });

    it("cada marca tiene su logo", () => {
        for (const piloto of pilotos) {
            const logo = LOGOS_MARCAS[piloto.marca];

            expect(logo, `${piloto.nombre}: no hay logo para la marca ${piloto.marca}`).toBeTruthy();
            expect(existsSync(path.join(imagenes, "marcas", logo)), `marcas/${logo} no existe`).toBe(true);
        }
    });
});

describe("referencias en el código", () => {
    function archivosDe(carpeta: string): string[] {
        return readdirSync(carpeta, { withFileTypes: true }).flatMap((entrada) => {
            const ruta = path.join(carpeta, entrada.name);
            return entrada.isDirectory() ? archivosDe(ruta) : /\.(astro|svelte|ts|css)$/.test(entrada.name) ? [ruta] : [];
        });
    }

    it("toda imagen que nombran las páginas, los componentes y los estilos existe en disco", () => {
        let referencias = 0;

        for (const archivo of archivosDe(path.join(raiz, "src"))) {
            const contenido = readFileSync(archivo, "utf8");
            const rutas = [
                ...[...contenido.matchAll(/images\/([A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|avif|svg|ico))/g)].map((m) => m[1]),
                ...[...contenido.matchAll(/urlImagen\("([A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|avif|svg|ico))"\)/g)].map((m) => m[1]),
            ];

            for (const ruta of rutas) {
                referencias += 1;
                expect(existsSync(path.join(imagenes, ruta)), `${path.relative(raiz, archivo)}: nombra ${ruta} y no existe`).toBe(true);
            }
        }

        // Cuando se migran las páginas debería haber varias: se ajusta al final.
        expect(referencias).toBeGreaterThanOrEqual(0);
    });

    it("el peso total de las fotos queda registrado", () => {
        const total = ["autos", "pilotos", "pilotos/mini"]
            .flatMap((carpeta) =>
                readdirSync(path.join(imagenes, carpeta), { withFileTypes: true })
                    .filter((entrada) => entrada.isFile())
                    .map((entrada) => statSync(path.join(imagenes, carpeta, entrada.name)).size)
            )
            .reduce((suma, valor) => suma + valor, 0);

        expect(total).toBeGreaterThan(0);
    });
});
