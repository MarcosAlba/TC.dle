// Versiones chicas de las fotos de autos para el celular: 640 y 1280 px de ancho,
// en public/assets/images/autos-variantes (no se commitean: se arman antes de cada
// build y de `npm run dev`). El modo Auto las ofrece con srcset y cada pantalla baja
// la que necesita en vez de la de 1920 px.
//
//   node scripts/variantes-autos.mjs
//
// Es idempotente: solo arma las que faltan o las que quedaron más viejas que la foto.
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const RAIZ = path.resolve(import.meta.dirname, "../public/assets/images");
const ORIGEN = path.join(RAIZ, "autos");
const DESTINO = path.join(RAIZ, "autos-variantes");
export const ANCHOS_AUTOS = [640, 1280];
// Calidad pensada para una foto que casi siempre se ve borrosa: alcanza y pesa poco.
const CALIDAD = { 640: 78, 1280: 82 };

sharp.concurrency(2);
await mkdir(DESTINO, { recursive: true });

const fotos = (await readdir(ORIGEN)).filter((archivo) => archivo.endsWith(".webp"));
let hechas = 0;
for (const archivo of fotos) {
    const origen = path.join(ORIGEN, archivo);
    const fechaOrigen = (await stat(origen)).mtimeMs;
    for (const ancho of ANCHOS_AUTOS) {
        const destino = path.join(DESTINO, archivo.replace(/\.webp$/, "-" + ancho + ".webp"));
        const existente = await stat(destino).catch(() => null);
        if (existente && existente.mtimeMs >= fechaOrigen) {
            continue;
        }
        await sharp(origen).resize({ width: ancho, withoutEnlargement: true }).webp({ quality: CALIDAD[ancho], effort: 5 }).toFile(destino);
        hechas++;
    }
}
console.log(`Variantes de autos: ${hechas} nuevas (${fotos.length} fotos, anchos ${ANCHOS_AUTOS.join(" y ")} px).`);
