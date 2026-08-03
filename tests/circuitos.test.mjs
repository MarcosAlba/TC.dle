import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const raiz = path.resolve(import.meta.dirname, "..");
const contexto = { window: {} };
vm.runInNewContext(
    await readFile(path.join(raiz, "assets/js/circuitos.js"), "utf8"),
    contexto
);

const catalogo = contexto.window.circuitosTC;
assert.ok(Array.isArray(catalogo), "El catálogo debe ser un array");
assert.equal(catalogo.length, 33, "Deben existir 33 configuraciones jugables");
assert.equal(new Set(catalogo.map(({ sedeId }) => sedeId)).size, 30, "Deben existir 30 sedes");
assert.equal(new Set(catalogo.map(({ id }) => id)).size, catalogo.length, "Los identificadores deben ser únicos");

for (const circuito of catalogo) {
    for (const campo of ["id", "sedeId", "nombre", "variante", "ciudad", "provincia", "longitud", "participacionTC", "imagen", "fuente"]) {
        assert.equal(typeof circuito[campo], "string", `${circuito.id}: falta ${campo}`);
        assert.ok(circuito[campo].trim(), `${circuito.id}: ${campo} está vacío`);
    }

    assert.ok(Array.isArray(circuito.aliases) && circuito.aliases.length > 0, `${circuito.id}: faltan respuestas alternativas`);
    assert.doesNotThrow(() => new URL(circuito.fuente), `${circuito.id}: fuente inválida`);

    const svg = await readFile(path.join(raiz, "assets/images/circuitos", circuito.imagen), "utf8");
    assert.match(svg, /<svg[^>]+viewBox="0 0 1000 600"/i, `${circuito.id}: viewBox inválido`);
    assert.match(svg, /<path\b/i, `${circuito.id}: falta la silueta`);
    assert.doesNotMatch(svg, /<(?:image|text|foreignObject)\b/i, `${circuito.id}: contiene información visual no permitida`);
}

for (const variantes of [
    ["la-plata-sin-chicana", "la-plata-con-chicana"],
    ["buenos-aires-12-sin-chicana", "buenos-aires-12-con-chicana"],
    ["termas-largo", "termas-corto"]
]) {
    const hashes = [];
    for (const id of variantes) {
        const circuito = catalogo.find((item) => item.id === id);
        const contenido = await readFile(path.join(raiz, "assets/images/circuitos", circuito.imagen));
        hashes.push(createHash("sha256").update(contenido).digest("hex"));
    }
    assert.notEqual(hashes[0], hashes[1], `${variantes.join(" / ")}: las variantes no pueden compartir silueta`);
}

process.stdout.write("OK: 30 sedes, 33 configuraciones y 33 SVG auditados.\n");
