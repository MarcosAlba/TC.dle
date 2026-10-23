// Baja el catálogo de finales del TC desde el repo tcdle-resultados a
// src/data/carreras.json. Usa un tag fijo (no una rama) para que lo que sale
// cada día no cambie solo: para subir de versión se cambia ETIQUETA y se corre
// `npm run carreras` (o `npm run carreras -- <etiqueta>`). El JSON resultante
// se commitea, así el build no depende de la red.
import { writeFile } from "node:fs/promises";
import path from "node:path";

const REPO = "MarcosAlba/tcdle-resultados";
const ETIQUETA = "datos-v1";

const etiqueta = process.argv[2] ?? ETIQUETA;
const url = `https://raw.githubusercontent.com/${REPO}/${etiqueta}/datos/carreras-tc.json`;
const destino = path.resolve(import.meta.dirname, "../src/data/carreras.json");

const respuesta = await fetch(url);
if (!respuesta.ok) {
    console.error(`No se pudo bajar ${url} (${respuesta.status})`);
    process.exit(1);
}
const catalogo = await respuesta.json();
if (catalogo.version !== 1 || !Array.isArray(catalogo.carreras)) {
    console.error("El catálogo no tiene el formato esperado (version 1): hay que actualizar TCdle.");
    process.exit(1);
}

await writeFile(destino, JSON.stringify(catalogo.carreras, null, 2) + "\n");
console.log(`${catalogo.carreras.length} carreras (${etiqueta}, generado ${catalogo.generado}) en ${destino}`);
