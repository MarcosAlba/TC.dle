// Copias de las imágenes de los juegos con un nombre que no delata la respuesta,
// en public/assets/images/ocultas (no se commitean: se arman antes de cada build y
// de `npm run dev`). Ver src/lib/nombre-oculto.js.
//
//   - autos/: la foto tal cual y dos versiones chicas para el celular, de 640 y
//     1280 px de ancho. El modo Auto las ofrece con srcset y cada pantalla baja la
//     que necesita en vez de la de 1920 px.
//   - circuitos/: la silueta tal cual.
//
//   node scripts/variantes-autos.mjs
//
// Es idempotente: solo arma las que faltan o las que quedaron más viejas que la original.
import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { CARPETA_OCULTAS, rutaOculta } from "../src/lib/nombre-oculto.js";

const RAIZ = path.resolve(import.meta.dirname, "../public/assets/images");
export const ANCHOS_AUTOS = [640, 1280];
// Calidad pensada para una foto que casi siempre se ve borrosa: alcanza y pesa poco.
const CALIDAD = { 640: 78, 1280: 82 };

sharp.concurrency(2);
await mkdir(path.join(RAIZ, CARPETA_OCULTAS), { recursive: true });

/** true si `destino` falta o es más viejo que `origen`. */
async function hayQueArmar(origen, destino) {
    const fechaOrigen = (await stat(origen)).mtimeMs;
    const existente = await stat(destino).catch(() => null);
    return !existente || existente.mtimeMs < fechaOrigen;
}

let hechas = 0;

const fotos = (await readdir(path.join(RAIZ, "autos"))).filter((archivo) => archivo.endsWith(".webp"));
for (const archivo of fotos) {
    const relativa = "autos/" + archivo;
    const origen = path.join(RAIZ, relativa);
    const copia = path.join(RAIZ, rutaOculta(relativa));
    if (await hayQueArmar(origen, copia)) {
        await copyFile(origen, copia);
        hechas++;
    }
    for (const ancho of ANCHOS_AUTOS) {
        const destino = path.join(RAIZ, rutaOculta(relativa, "-" + ancho));
        if (await hayQueArmar(origen, destino)) {
            await sharp(origen).resize({ width: ancho, withoutEnlargement: true }).webp({ quality: CALIDAD[ancho], effort: 5 }).toFile(destino);
            hechas++;
        }
    }
}

const siluetas = (await readdir(path.join(RAIZ, "circuitos"))).filter((archivo) => archivo.endsWith(".svg"));
for (const archivo of siluetas) {
    const relativa = "circuitos/" + archivo;
    const destino = path.join(RAIZ, rutaOculta(relativa));
    if (await hayQueArmar(path.join(RAIZ, relativa), destino)) {
        await copyFile(path.join(RAIZ, relativa), destino);
        hechas++;
    }
}

console.log(
    `Imágenes ocultas: ${hechas} nuevas (${fotos.length} autos, anchos ${ANCHOS_AUTOS.join(" y ")} px; ${siluetas.length} circuitos).`
);
