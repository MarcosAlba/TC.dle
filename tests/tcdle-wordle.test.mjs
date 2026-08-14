import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const raiz = path.resolve(import.meta.dirname, "..");

const contextoPalabras = { window: {} };
vm.runInNewContext(
    await readFile(path.join(raiz, "assets/js/palabras-tc.js"), "utf8"),
    contextoPalabras
);
const palabrasTC = contextoPalabras.window.palabrasTC;

assert.ok(Array.isArray(palabrasTC) && palabrasTC.length > 0, "el catálogo no debe estar vacío");

const idsVistos = new Set();
const palabrasVistas = new Set();

for (const entrada of palabrasTC) {
    assert.match(entrada.palabra, /^[A-ZÑ]+$/, `"${entrada.palabra}" debe ser sólo A-Z/Ñ en mayúsculas`);
    assert.ok(
        entrada.palabra.length >= 4 && entrada.palabra.length <= 8,
        `"${entrada.palabra}" debe tener entre 4 y 8 letras`
    );
    assert.equal(entrada.id, entrada.palabra, `"${entrada.palabra}": id debe ser igual a la palabra`);
    assert.ok(!idsVistos.has(entrada.id), `id duplicado: ${entrada.id}`);
    assert.ok(!palabrasVistas.has(entrada.palabra), `palabra duplicada: ${entrada.palabra}`);
    idsVistos.add(entrada.id);
    palabrasVistas.add(entrada.palabra);
}

const contextoWordle = { window: {} };
vm.runInNewContext(
    await readFile(path.join(raiz, "assets/js/tcdle-wordle.js"), "utf8"),
    contextoWordle
);
const evaluarIntentoOriginal = contextoWordle.window.TCdleWordle.evaluarIntento;
// El resultado viene de otro realm (vm.runInNewContext), así que lo pasamos
// por Array.from para poder comparar contra arrays "normales" con deepEqual.
function evaluarIntento(intento, objetivo) {
    return Array.from(evaluarIntentoOriginal(intento, objetivo));
}

// Palabra exacta: todas las letras correctas.
assert.deepEqual(evaluarIntento("TOYOTA", "TOYOTA"), Array(6).fill("correcta"));

// Ninguna letra en común.
assert.deepEqual(evaluarIntento("MOTOR", "PISTA"), ["ausente", "ausente", "presente", "ausente", "ausente"]);

// Letra presente pero en otra posición.
assert.deepEqual(evaluarIntento("ARDER", "PADRE"), [
    "presente", // A está en PADRE, no en la posición 0
    "presente", // R está en PADRE, no en la posición 1
    "correcta", // D coincide en posición 2
    "presente", // E está en PADRE, no en la posición 3
    "ausente"   // la segunda "R" del intento ya no tiene "R" disponible en PADRE
]);

// Letra repetida en el intento (dos "R") pero el objetivo sólo tiene una:
// sólo una aparición se marca (la que coincide en posición), la otra queda
// ausente en vez de marcarse dos veces como presente/correcta.
const resultadoRepetida = evaluarIntento("CARRO", "CORAL");
const cantidadNoAusentes = resultadoRepetida.filter((estado) => estado !== "ausente").length;
const cantidadRenObjetivo = "CORAL".split("").filter((letra) => letra === "R").length;
const cantidadRenIntentoMarcadas = resultadoRepetida.filter((estado, indice) => "CARRO"[indice] === "R" && estado !== "ausente").length;
assert.ok(cantidadNoAusentes <= "CARRO".length);
assert.equal(cantidadRenIntentoMarcadas, cantidadRenObjetivo);

process.stdout.write("OK: catálogo de palabras y evaluación del Wordle del TC.\n");
