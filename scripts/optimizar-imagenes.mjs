// Optimiza las fotos de assets/images sin pérdida visible.
//
//   node scripts/optimizar-imagenes.mjs            convierte y reemplaza
//   node scripts/optimizar-imagenes.mjs --simular  solo informa, no escribe
//
// Qué hace:
//   - autos/: convierte a WebP real los JPEG y PNG (varios llevaban extensión
//     .webp pero eran JPEG/PNG). Los WebP que ya lo son se dejan como están:
//     volver a comprimirlos solo les quitaría calidad.
//   - ejemplos/ y tcdle-logo.png: imágenes que se cargan en todas las páginas.
//     El logo original se conserva (lo usan páginas de prueba); las páginas del
//     juego cargan tcdle-logo.webp.
//   - pilotos/: convierte los PNG a WebP y genera una miniatura en
//     pilotos/mini/ para el buscador y la tabla, donde la foto se ve chica.
//
// Garantía de calidad: cada imagen se codifica con la calidad más baja que
// cumpla una exigencia de PSNR contra la original (40 dB en autos, 44 dB en
// pilotos; por encima de 40 dB la diferencia no se distingue a simple vista).
// Si ninguna calidad razonable la cumple, usa la máxima y lo avisa.
//
// Es idempotente: lo que ya es WebP no se vuelve a tocar, así que se puede
// correr cada vez que se suma una foto nueva (.jpg, .png, etc.).
import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RAIZ = path.resolve(import.meta.dirname, "../assets/images");
const SIMULAR = process.argv.includes("--simular");
sharp.concurrency(1);

const AUTOS = { carpeta: "autos", exigenciaDb: 40, ladoMaximo: 1920 };
// Las fotos se ven a 760 px de ancho como mucho, 1520 px con el escalado de
// pantallas grandes: 1920 px deja margen sin cargar píxeles que nadie ve.
// La miniatura se ve a menos de 160 px y es una copia reducida, no la foto: se le
// pide menos (38 dB) y nunca se guarda sin pérdida, para que siga siendo chica.
const PILOTOS = { carpeta: "pilotos", exigenciaDb: 44, ladoMaximo: 1000, mini: 240, exigenciaMiniDb: 38 };
const SIMULTANEAS = 3;

// Imágenes sueltas que se cargan en todas las páginas. El logo se ve a 112 px (448 px
// como mucho con pantalla grande y densidad doble), así que 800 px sobra.
const EJEMPLOS = { carpeta: "ejemplos", exigenciaDb: 44, ladoMaximo: 1200 };
const LOGO = { carpeta: ".", exigenciaDb: 44, ladoMaximo: 800, solo: ["tcdle-logo.png"], conservarOriginal: true };

const CALIDAD_MINIMA = 90;
const CALIDAD_MAXIMA = 98;
const EXTENSIONES_ENTRADA = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".tif", ".tiff"]);

function psnrPremultiplicado(a, b) {
    let errorRgb = 0;
    for (let i = 0; i < a.length; i += 4) {
        const alfaA = a[i + 3] / 255;
        const alfaB = b[i + 3] / 255;
        for (let canal = 0; canal < 3; canal++) {
            const diferencia = a[i + canal] * alfaA - b[i + canal] * alfaB;
            errorRgb += diferencia * diferencia;
        }
        const diferenciaAlfa = a[i + 3] - b[i + 3];
        errorRgb += diferenciaAlfa * diferenciaAlfa;
    }
    return errorRgb === 0 ? 99 : 10 * Math.log10((255 * 255) / (errorRgb / a.length));
}

function codificar(imagen, calidad, esfuerzo = 6) {
    return imagen.clone().webp({ quality: calidad, alphaQuality: 100, smartSubsample: true, effort: esfuerzo }).toBuffer();
}

async function medir(buffer, referencia) {
    const decodificada = await sharp(buffer).ensureAlpha().raw().toBuffer();
    return psnrPremultiplicado(referencia, decodificada);
}

async function elegirCalidad(imagen, referencia, exigenciaDb, bytesOriginal, permitirSinPerdida = true) {
    // Búsqueda binaria de la calidad más baja que cumple la exigencia.
    let bajo = CALIDAD_MINIMA;
    let alto = CALIDAD_MAXIMA;
    let mejor = null;

    // La búsqueda usa un esfuerzo bajo (rápido); la calidad elegida se vuelve a
    // codificar al máximo esfuerzo y se verifica de nuevo.
    while (bajo <= alto) {
        const medio = Math.floor((bajo + alto) / 2);
        const db = await medir(await codificar(imagen, medio, 2), referencia);

        if (db >= exigenciaDb) {
            mejor = medio;
            alto = medio - 1;
        } else {
            bajo = medio + 1;
        }
    }

    for (let calidad = mejor; calidad !== null && calidad <= CALIDAD_MAXIMA; calidad++) {
        const buffer = await codificar(imagen, calidad);
        const db = await medir(buffer, referencia);
        if (db >= exigenciaDb) {
            return { buffer, calidad, db, cumple: true };
        }
    }

    // Ninguna calidad cumple: si sin pérdida pesa menos que el original, es la
    // opción que no cambia ni un píxel.
    const sinPerdida = permitirSinPerdida ? await imagen.clone().webp({ lossless: true, effort: 6 }).toBuffer() : null;
    if (permitirSinPerdida && sinPerdida.length < bytesOriginal) {
        return { buffer: sinPerdida, calidad: "sin pérdida", db: 99, cumple: true };
    }

    const buffer = await codificar(imagen, CALIDAD_MAXIMA);
    return { buffer, calidad: CALIDAD_MAXIMA, db: await medir(buffer, referencia), cumple: false };
}

async function prepararOriginal(contenido, ladoMaximo) {
    // rotate() aplica la orientación EXIF, que al guardar sin metadatos se perdería.
    const base = sharp(contenido).rotate();
    const { width, height } = await base.metadata();
    const redimensionar = Math.max(width, height) > ladoMaximo;
    const imagen = redimensionar
        ? base.resize({ width: ladoMaximo, height: ladoMaximo, fit: "inside", kernel: "lanczos3" })
        : base;
    // La referencia es lo que la imagen valdría sin recomprimir (ya con el tamaño final).
    const referencia = await imagen.clone().ensureAlpha().raw().toBuffer();
    return { imagen, referencia };
}

async function escribir(destino, buffer) {
    if (SIMULAR) {
        return;
    }
    const temporal = destino + ".tmp";
    await writeFile(temporal, buffer);
    await rename(temporal, destino);
}

const resumen = { archivos: 0, antes: 0, despues: 0, omitidos: 0, avisos: [], dbMinimo: Infinity };

function registrar(nombre, antes, despues, calidad, db, cumple) {
    resumen.archivos += 1;
    resumen.antes += antes;
    resumen.despues += despues;
    resumen.dbMinimo = Math.min(resumen.dbMinimo, db);
    if (!cumple) {
        resumen.avisos.push(`${nombre}: ${db.toFixed(1)} dB incluso con calidad ${calidad}`);
    }
}

async function procesarCarpeta(config) {
    const carpeta = path.join(RAIZ, config.carpeta);
    const nombres = (await readdir(carpeta, { withFileTypes: true }))
        .filter((entrada) => entrada.isFile() && EXTENSIONES_ENTRADA.has(path.extname(entrada.name).toLowerCase()))
        .map((entrada) => entrada.name)
        .filter((nombre) => !config.solo || config.solo.includes(nombre));

    await enParalelo(nombres, async (nombre) => {
        const origen = path.join(carpeta, nombre);
        const contenido = await readFile(origen);
        const { format } = await sharp(contenido).metadata();
        const base = path.parse(nombre).name;
        const destino = path.join(carpeta, base + ".webp");

        // La miniatura sale de la foto original; si la foto ya estaba optimizada solo
        // se genera cuando falta, para no recomprimir una miniatura ya hecha.
        const yaOptimizada = format === "webp" || format === "heif";
        const archivoMini = config.mini && path.join(carpeta, "mini", base + ".webp");
        if (config.mini && (!yaOptimizada || !(await existe(archivoMini)))) {
            const { imagen, referencia } = await prepararMini(contenido, config.mini);
            const mini = await elegirCalidad(imagen, referencia, config.exigenciaMiniDb ?? config.exigenciaDb, contenido.length, false);
            await escribir(archivoMini, mini.buffer);
            registrar("mini/" + base, 0, mini.buffer.length, mini.calidad, mini.db, mini.cumple);
        }

        if (yaOptimizada) {
            resumen.omitidos += 1;
            return;
        }

        const { imagen, referencia } = await prepararOriginal(contenido, config.ladoMaximo);
        const elegido = await elegirCalidad(imagen, referencia, config.exigenciaDb, contenido.length);
        await escribir(destino, elegido.buffer);
        if (!SIMULAR && destino !== origen && !config.conservarOriginal) {
            await rm(origen);
        }
        registrar(nombre, contenido.length, elegido.buffer.length, elegido.calidad, elegido.db, elegido.cumple);
        process.stdout.write(`${nombre}: ${Math.round(contenido.length / 1024)} KB -> ${Math.round(elegido.buffer.length / 1024)} KB (${typeof elegido.calidad === "number" ? "q" + elegido.calidad : elegido.calidad}, ${elegido.db.toFixed(1)} dB)\n`);
    });
}

async function enParalelo(lista, tarea) {
    const pendientes = lista.slice();
    await Promise.all(Array.from({ length: SIMULTANEAS }, async () => {
        while (pendientes.length > 0) {
            await tarea(pendientes.shift());
        }
    }));
}

async function existe(ruta) {
    return readFile(ruta).then(() => true, () => false);
}

async function prepararMini(contenido, lado) {
    const imagen = sharp(contenido).rotate().resize({ width: lado, height: lado, fit: "inside", kernel: "lanczos3" });
    const referencia = await imagen.clone().ensureAlpha().raw().toBuffer();
    return { imagen, referencia };
}

if (!SIMULAR) {
    await mkdir(path.join(RAIZ, "pilotos", "mini"), { recursive: true });
}
await procesarCarpeta(AUTOS);
await procesarCarpeta(PILOTOS);
await procesarCarpeta(EJEMPLOS);
await procesarCarpeta(LOGO);

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
process.stdout.write(
    `\n${SIMULAR ? "[simulación] " : ""}Convertidas: ${resumen.archivos} (omitidas por ser WebP: ${resumen.omitidos}).\n` +
    `Originales convertidos: ${mb(resumen.antes)} MB -> ${mb(resumen.despues)} MB (incluye miniaturas nuevas).\n` +
    `PSNR mínimo logrado: ${resumen.dbMinimo.toFixed(1)} dB.\n`
);
if (resumen.avisos.length > 0) {
    process.stdout.write("Avisos:\n" + resumen.avisos.map((aviso) => "  " + aviso).join("\n") + "\n");
}
