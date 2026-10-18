// Regenera tests/fixtures/seleccion-diaria.json con el código actual.
// Correr SOLO cuando se cambia un catálogo a propósito: sumar, sacar o
// reordenar elementos cambia qué sale cada día para todos los jugadores.
//   node tests/fixtures/generar-seleccion.mjs
import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import path from "node:path";

// El cálculo está en TypeScript (tests/ayuda/calcular-seleccion.ts): se
// empaqueta al vuelo y se importa como módulo.
const { outputFiles } = await build({
    entryPoints: [path.join(import.meta.dirname, "../ayuda/calcular-seleccion.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
});
const { calcularSeleccion } = await import("data:text/javascript;base64," + Buffer.from(outputFiles[0].text).toString("base64"));

const destino = path.join(import.meta.dirname, "seleccion-diaria.json");
await writeFile(destino, JSON.stringify(calcularSeleccion()) + "\n");
process.stdout.write("Fixture regenerado: " + destino + "\n");
