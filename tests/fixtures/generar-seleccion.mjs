// Regenera tests/fixtures/seleccion-diaria.json con el código actual.
// Correr SOLO cuando se cambia un catálogo a propósito: sumar, sacar o
// reordenar elementos cambia qué sale cada día para todos los jugadores.
//   node tests/fixtures/generar-seleccion.mjs
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { calcularSeleccion } from "../ayuda/seleccion.mjs";

const destino = path.join(import.meta.dirname, "seleccion-diaria.json");
await writeFile(destino, JSON.stringify(await calcularSeleccion()) + "\n");
process.stdout.write("Fixture regenerado: " + destino + "\n");
