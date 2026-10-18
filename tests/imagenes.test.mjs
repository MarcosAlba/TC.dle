// Integridad de las fotos: cada foto que referencia un catálogo existe, es del
// formato que dice su extensión y no se pasa del peso razonable. Evita volver a
// subir un PNG de 2 MB o un JPEG disfrazado de .webp.
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const raiz = path.resolve(import.meta.dirname, "..");
const imagenes = path.join(raiz, "assets/images");
const KB = 1024;
const TOPE = {
    autos: 550 * KB,
    pilotos: 250 * KB,
    mini: 40 * KB
};

const contexto = vm.createContext({
    window: {},
    URL,
    document: { currentScript: { src: "http://localhost/assets/js/catalogo.js" } }
});
for (const archivo of ["pilotos.js", "autos.js"]) {
    vm.runInContext(await readFile(path.join(raiz, "assets/js", archivo), "utf8"), contexto);
}
const pilotos = vm.runInContext("pilotos", contexto);
const autos = contexto.window.autosTC;

function formatoReal(buffer) {
    if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return "jpeg";
    if (buffer.toString("ascii", 4, 12) === "ftypavif") return "avif";
    return "desconocido";
}

async function revisar(ruta, tope) {
    const buffer = await readFile(ruta);
    const extension = path.extname(ruta).slice(1).toLowerCase();
    const real = formatoReal(buffer);
    const nombre = path.relative(imagenes, ruta);

    assert.equal(real, extension, `${nombre}: la extensión dice ${extension} pero el contenido es ${real}`);
    assert.ok(buffer.length <= tope, `${nombre}: pesa ${Math.round(buffer.length / KB)} KB y el tope es ${Math.round(tope / KB)} KB (correr npm run imagenes)`);
}

// Autos: cada entrada del catálogo apunta a un archivo que existe.
for (const auto of autos) {
    await revisar(path.join(imagenes, "autos", auto.archivo), TOPE.autos);
}

// Pilotos: foto completa y miniatura (webp) para cada uno que tiene foto local
// (en imagenResultado o, en algunos, en imagen; las URL de actc.org.ar no cuentan).
const fotoLocal = (piloto) => [piloto.imagenResultado, piloto.imagen].find((foto) => foto && foto.includes("/pilotos/"));
let conFoto = 0;
for (const piloto of pilotos) {
    const foto = fotoLocal(piloto);
    if (!foto) continue;
    conFoto += 1;
    const archivo = foto.replace(/^.*\/pilotos\//, "");
    await revisar(path.join(imagenes, "pilotos", archivo), TOPE.pilotos);
    const base = path.parse(archivo).name;
    await revisar(path.join(imagenes, "pilotos", "mini", base + ".webp"), TOPE.mini);
}
assert.ok(conFoto > 90, "Se esperaban fotos locales para casi todos los pilotos");

// No sobran archivos sin usar en las carpetas de fotos.
const usadosAutos = new Set(autos.map((auto) => auto.archivo));
for (const archivo of await readdir(path.join(imagenes, "autos"))) {
    assert.ok(usadosAutos.has(archivo), `autos/${archivo}: no está en el catálogo autos.js`);
}
const usadosPilotos = new Set(
    pilotos.filter(fotoLocal).map((piloto) => fotoLocal(piloto).replace(/^.*\/pilotos\//, ""))
);
for (const entrada of await readdir(path.join(imagenes, "pilotos"), { withFileTypes: true })) {
    if (entrada.isFile()) {
        assert.ok(usadosPilotos.has(entrada.name), `pilotos/${entrada.name}: no está en pilotos.js`);
    }
}

// Toda imagen que nombran las páginas, los estilos y los scripts existe en disco.
async function archivosDe(carpeta, extensiones) {
    const entradas = await readdir(path.join(raiz, carpeta), { withFileTypes: true });
    return entradas.filter((e) => e.isFile() && extensiones.test(e.name)).map((e) => path.join(carpeta, e.name));
}
const fuentes = [
    "index.html",
    ...(await archivosDe("pages", /\.html$/)),
    ...(await archivosDe("assets/css", /\.css$/)),
    ...(await archivosDe("assets/js", /\.js$/))
];
let referencias = 0;
for (const fuente of fuentes) {
    const contenido = await readFile(path.join(raiz, fuente), "utf8");
    for (const [, ruta] of contenido.matchAll(/images\/([A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|avif|svg|ico))/g)) {
        referencias += 1;
        await stat(path.join(imagenes, ruta)).catch(() => assert.fail(`${fuente}: nombra images/${ruta} y no existe`));
    }
}
assert.ok(referencias > 20, "Se esperaban más referencias a imágenes");

const total = (await Promise.all(
    ["autos", "pilotos", "pilotos/mini"].map(async (carpeta) => {
        const archivos = (await readdir(path.join(imagenes, carpeta), { withFileTypes: true })).filter((e) => e.isFile());
        return (await Promise.all(archivos.map((e) => stat(path.join(imagenes, carpeta, e.name))))).reduce((suma, s) => suma + s.size, 0);
    })
)).reduce((suma, valor) => suma + valor, 0);
process.stdout.write(`OK: ${autos.length} autos y ${conFoto} pilotos con foto y miniatura (${(total / KB / KB).toFixed(1)} MB en total).\n`);
