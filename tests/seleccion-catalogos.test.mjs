// Red de seguridad para cambiar la estructura del sitio: lo que sale cada día
// (piloto, auto, circuito y palabra) tiene que seguir siendo exactamente lo
// mismo, porque la gente comparte y compara el resultado del día.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { calcularSeleccion } from "./ayuda/seleccion.mjs";

const esperado = JSON.parse(
    await readFile(path.join(import.meta.dirname, "fixtures/seleccion-diaria.json"), "utf8")
);
const actual = await calcularSeleccion();
const AYUDA = "Si cambiaste un catálogo a propósito, regeneralo con: node tests/fixtures/generar-seleccion.mjs";

assert.deepEqual(
    actual.algoritmo,
    esperado.algoritmo,
    "El algoritmo de selección diaria cambió: el piloto del día ya no sería el mismo para nadie"
);

for (const [modo, datos] of Object.entries(esperado.modos)) {
    assert.equal(actual.modos[modo].cantidad, datos.cantidad, `${modo}: cambió la cantidad de elementos. ${AYUDA}`);
    assert.equal(actual.modos[modo].huellaCatalogo, datos.huellaCatalogo, `${modo}: cambió el contenido o el orden del catálogo. ${AYUDA}`);
    assert.deepEqual(actual.modos[modo].seleccion, datos.seleccion, `${modo}: cambió qué sale cada día. ${AYUDA}`);
}

process.stdout.write(
    "OK: selección diaria idéntica durante " + esperado.dias + " días en " +
    Object.keys(esperado.modos).length + " modos.\n"
);
