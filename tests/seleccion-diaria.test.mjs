import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const raiz = path.resolve(import.meta.dirname, "..");
const contexto = { window: {} };

vm.runInNewContext(
    await readFile(path.join(raiz, "assets/js/seleccion-diaria.js"), "utf8"),
    contexto
);

const { obtener } = contexto.window.seleccionDiaria;

function crearFecha(numeroDeDia) {
    const fecha = new Date(2026, 0, 1 + numeroDeDia, 12);

    return vm.runInNewContext(
        `new Date(${fecha.getFullYear()}, ${fecha.getMonth()}, ${fecha.getDate()}, 12)`,
        contexto
    );
}

for (const cantidad of [31, 56, 65]) {
    const elementos = Array.from({ length: cantidad }, (_, indice) => indice);
    const seleccionados = Array.from({ length: cantidad }, (_, dia) =>
        obtener(elementos, "prueba-" + cantidad, crearFecha(dia))
    );

    assert.equal(
        new Set(seleccionados).size,
        cantidad,
        `No debe haber repeticiones durante ${cantidad} días`
    );
    assert.equal(
        obtener(elementos, "prueba-" + cantidad, crearFecha(0)),
        obtener(elementos, "prueba-" + cantidad, crearFecha(cantidad)),
        "La rotación debe reiniciarse sólo después de recorrer todo el catálogo"
    );
}

const elementos = Array.from({ length: 65 }, (_, indice) => indice);
const fecha = crearFecha(10);
assert.equal(obtener(elementos, "pilotos", fecha), obtener(elementos, "pilotos", fecha));
const primerosPilotos = Array.from(
    { length: 20 },
    (_, dia) => obtener(elementos, "pilotos", crearFecha(dia))
);
assert.ok(
    primerosPilotos.some(function (piloto, indice) {
        return indice > 0 && piloto !== (primerosPilotos[indice - 1] + 1) % elementos.length;
    }),
    "La selección no debe recorrer los IDs en orden"
);
assert.notDeepEqual(
    primerosPilotos,
    Array.from({ length: 20 }, (_, dia) => obtener(elementos, "autos", crearFecha(dia))),
    "Cada modo debe tener su propia mezcla"
);
assert.equal(obtener([], "vacio", fecha), null);

process.stdout.write("OK: selección diaria mezclada, estable y sin repeticiones recientes.\n");
