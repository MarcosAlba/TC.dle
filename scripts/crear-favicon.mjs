// Crea public/assets/images/tc-dle.ico como un ICO de verdad (varias medidas), a partir
// de una imagen cuadrada. El archivo anterior era un PNG de 1254x1254 px con
// extensión .ico (664 KB) para un ícono que se ve a 16-32 px.
//
//   node scripts/crear-favicon.mjs ruta/al/original.png
//
// Cada medida se guarda como PNG dentro del contenedor ICO, que todos los
// navegadores modernos aceptan. Se reduce con Lanczos desde el original.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const origen = process.argv[2];
if (!origen) {
    throw new Error("Uso: node scripts/crear-favicon.mjs ruta/al/original.png");
}
const DESTINO = path.resolve(import.meta.dirname, "../public/assets/images/tc-dle.ico");
const MEDIDAS = [16, 32, 48, 64, 128, 256];

const imagenes = [];
for (const lado of MEDIDAS) {
    imagenes.push(await sharp(await readFile(origen))
        .resize({ width: lado, height: lado, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: "lanczos3" })
        .png({ compressionLevel: 9, effort: 10 })
        .toBuffer());
}

const cabecera = Buffer.alloc(6 + 16 * imagenes.length);
cabecera.writeUInt16LE(0, 0);
cabecera.writeUInt16LE(1, 2);
cabecera.writeUInt16LE(imagenes.length, 4);
let desplazamiento = cabecera.length;
imagenes.forEach((png, indice) => {
    const lado = MEDIDAS[indice];
    const entrada = 6 + 16 * indice;
    cabecera[entrada] = lado === 256 ? 0 : lado;
    cabecera[entrada + 1] = lado === 256 ? 0 : lado;
    cabecera.writeUInt16LE(1, entrada + 4);
    cabecera.writeUInt16LE(32, entrada + 6);
    cabecera.writeUInt32LE(png.length, entrada + 8);
    cabecera.writeUInt32LE(desplazamiento, entrada + 12);
    desplazamiento += png.length;
});

await writeFile(DESTINO, Buffer.concat([cabecera, ...imagenes]));
process.stdout.write(`tc-dle.ico: ${MEDIDAS.join(", ")} px, ${Math.round(desplazamiento / 1024)} KB\n`);
