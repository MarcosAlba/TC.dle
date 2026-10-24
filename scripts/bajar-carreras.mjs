// Baja del repo tcdle-resultados el catálogo de finales del TC
// (src/data/carreras.json) y las fotos de la ACTC de los pilotos de esas
// carreras que no están en pilotos.json (public/assets/images/pilotos-carreras
// y src/data/fotos-carreras.json).
//
// Usa un tag fijo (no una rama) para que lo que sale cada día no cambie solo:
// para subir de versión se cambia ETIQUETA y se corre `npm run carreras` (o
// `npm run carreras -- <etiqueta>`). Para probar antes de publicar el tag:
// `npm run carreras -- --desde ../tcdle-resultados`. Todo lo bajado se
// commitea, así el build no depende de la red.
import { readFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const REPO = "MarcosAlba/tcdle-resultados";
const ETIQUETA = "datos-v2";

const raiz = path.resolve(import.meta.dirname, "..");
const argumentos = process.argv.slice(2);
const indiceDesde = argumentos.indexOf("--desde");
const desde = indiceDesde === -1 ? null : path.resolve(argumentos[indiceDesde + 1]);
const etiqueta = desde ? null : (argumentos[0] ?? ETIQUETA);
const carpetaFotos = path.join(raiz, "public/assets/images/pilotos-carreras");

/** Un archivo del repo: del tag en GitHub o de la carpeta local. */
async function leer(relativa, binario = false) {
    if (desde) {
        return binario ? readFile(path.join(desde, relativa)) : JSON.parse(await readFile(path.join(desde, relativa), "utf8"));
    }
    const url = `https://raw.githubusercontent.com/${REPO}/${etiqueta}/${relativa}`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
        throw new Error(`No se pudo bajar ${url} (${respuesta.status})`);
    }
    return binario ? Buffer.from(await respuesta.arrayBuffer()) : respuesta.json();
}

// Mismo criterio que normalizarTexto (src/lib/texto.ts) para cruzar nombres.
const normalizar = (texto) =>
    String(texto || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[.º°]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .trim()
        .toLowerCase();

try {
    const catalogo = await leer("datos/carreras-tc.json");
    if (catalogo.version !== 1 || !Array.isArray(catalogo.carreras)) {
        throw new Error("El catálogo no tiene el formato esperado (version 1): hay que actualizar TCdle.");
    }
    await writeFile(path.join(raiz, "src/data/carreras.json"), JSON.stringify(catalogo.carreras, null, 2) + "\n");
    console.log(`${catalogo.carreras.length} carreras (${etiqueta ?? desde}, generado ${catalogo.generado})`);

    const fotos = await leer("datos/fotos-pilotos.json");
    if (fotos.version !== 1 || !Array.isArray(fotos.fotos)) {
        throw new Error("Las fotos no tienen el formato esperado (version 1): hay que actualizar TCdle.");
    }
    // Los pilotos del catálogo ya tienen su foto (y su miniatura): no se duplican.
    const pilotos = JSON.parse(await readFile(path.join(raiz, "src/data/pilotos.json"), "utf8"));
    const conFotoPropia = new Set(pilotos.map((piloto) => normalizar(piloto.nombre)));
    const faltantes = fotos.fotos.filter((foto) => !conFotoPropia.has(normalizar(foto.piloto)));

    // La carpeta queda con exactamente las fotos del catálogo: se borran las que ya no vienen.
    await rm(carpetaFotos, { recursive: true, force: true });
    await mkdir(carpetaFotos, { recursive: true });
    for (const foto of faltantes) {
        await writeFile(path.join(carpetaFotos, foto.archivo), await leer("datos/fotos/" + foto.archivo, true));
    }
    await writeFile(path.join(raiz, "src/data/fotos-carreras.json"), JSON.stringify(faltantes, null, 2) + "\n");
    console.log(`${faltantes.length} fotos de pilotos sin foto propia en ${path.relative(raiz, carpetaFotos)}`);
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
}
