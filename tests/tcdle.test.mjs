import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const raiz = path.resolve(import.meta.dirname, "..");
const contexto = { window: {} };
vm.runInNewContext(await readFile(path.join(raiz, "assets/js/tcdle.js"), "utf8"), contexto);
const TCdle = contexto.window.TCdle;

assert.equal(TCdle.normalizarTexto("  Autódromo N.º 1  "), "autodromo n 1");
assert.equal(TCdle.obtenerFechaLocal(new Date(2026, 7, 7, 23)), "2026-08-07");
assert.equal(TCdle.obtenerTiempoHastaMedianoche(new Date(2026, 7, 7, 23, 59, 50)), "00:00:10");

const elementos = [
    { id: 1, nombre: "Agustín Canapino" },
    { id: 2, nombre: "Mauricio Lambiris" },
    { id: 3, nombre: "Matías Canapino" }
];
const encontrados = TCdle.buscarElementos({
    elementos,
    obtenerEtiqueta: (item) => item.nombre,
    obtenerTextoBusqueda: (item) => item.nombre,
    estaExcluido: (item) => item.id === 3
}, "cana");
assert.deepEqual(Array.from(encontrados, (item) => item.id), [1]);

function crearAlmacenamiento() {
    const datos = new Map();
    return {
        getItem: (clave) => datos.get(clave) ?? null,
        setItem: (clave, valor) => datos.set(clave, valor),
        removeItem: (clave) => datos.delete(clave),
        datos
    };
}

const almacenamiento = crearAlmacenamiento();
const juego = TCdle.crearJuegoDiario({
    almacenamiento,
    clave: "partida",
    fecha: "2026-08-07",
    objetivoId: 3,
    idsValidos: [1, 2, 3, 4],
    maximoIntentos: 3
});

assert.equal(juego.intentar(99).resultado, "invalida");
assert.equal(juego.intentar(1).resultado, "incorrecta");
assert.equal(juego.intentar(1).resultado, "repetida");
assert.equal(juego.intentar(3).resultado, "correcta");
assert.equal(juego.intentar(2).resultado, "bloqueada");
assert.deepEqual(Array.from(juego.estado().idsIntentados), [1, 3]);

// validarId permite aceptar intentos que no salen de un catálogo fijo
// (por ejemplo, el Wordle acepta cualquier palabra del largo correcto).
const juegoValidador = TCdle.crearJuegoDiario({
    almacenamiento: crearAlmacenamiento(),
    clave: "partidaLibre",
    fecha: "2026-08-07",
    objetivoId: "GATOX",
    maximoIntentos: 3,
    validarId: (id) => typeof id === "string" && id.length === 5
});

assert.equal(juegoValidador.intentar("MAL").resultado, "invalida");
assert.equal(juegoValidador.intentar("PERRO").resultado, "incorrecta");
assert.equal(juegoValidador.intentar("PERRO").resultado, "repetida");
assert.equal(juegoValidador.intentar("GATOX").resultado, "correcta");

// Al recargar, validarId también filtra qué intentos guardados son válidos.
const almacenamientoValidador = crearAlmacenamiento();
almacenamientoValidador.setItem("partidaRestaurada", JSON.stringify({
    version: 2,
    fecha: "2026-08-07",
    objetivoId: "GATOX",
    idsIntentados: ["PERRO", "MAL", "GATOX"],
    terminada: true
}));
const juegoRestaurado = TCdle.crearJuegoDiario({
    almacenamiento: almacenamientoValidador,
    clave: "partidaRestaurada",
    fecha: "2026-08-07",
    objetivoId: "GATOX",
    maximoIntentos: 3,
    validarId: (id) => typeof id === "string" && id.length === 5
});
assert.deepEqual(Array.from(juegoRestaurado.cargar().idsIntentados), ["PERRO", "GATOX"]);

const juegoAgotado = TCdle.crearJuegoDiario({
    almacenamiento: crearAlmacenamiento(),
    clave: "agotada",
    fecha: "2026-08-07",
    objetivoId: 4,
    idsValidos: [1, 2, 3, 4],
    maximoIntentos: 2
});
assert.equal(juegoAgotado.intentar(1).resultado, "incorrecta");
assert.equal(juegoAgotado.intentar(2).resultado, "agotada");

const legado = crearAlmacenamiento();
legado.setItem("pilotos", JSON.stringify({
    fecha: "Fri Aug 07 2026",
    cantidadIntentos: 4,
    pilotosIntentados: [1, 1, 2, 999]
}));
const juegoMigrado = TCdle.crearJuegoDiario({
    almacenamiento: legado,
    clave: "pilotos",
    fecha: "2026-08-07",
    objetivoId: 3,
    idsValidos: [1, 2, 3],
    migrar: (datos) => TCdle.migrarPartida(datos, {
        campoIntentos: "pilotosIntentados",
        objetivoActual: 3,
        maximoIntentos: 8
    })
});
assert.deepEqual(Array.from(juegoMigrado.cargar().idsIntentados), [1, 2]);
assert.equal(JSON.parse(legado.getItem("pilotos")).version, 2);

const autoLegado = TCdle.migrarPartida({
    fecha: "Fri Aug 07 2026",
    autoPilotoId: 7,
    idsIntentados: [2, 7],
    terminada: true
}, {
    campoObjetivo: "autoPilotoId",
    objetivoActual: 7,
    maximoIntentos: 8
});
assert.equal(autoLegado.fecha, "2026-08-07");
assert.equal(autoLegado.objetivoId, 7);
assert.equal(autoLegado.terminada, true);

const circuitoLegado = TCdle.migrarPartida({
    fecha: "2026-08-07",
    circuitoId: "rafaela",
    idsIntentados: ["parana"]
}, {
    campoObjetivo: "circuitoId",
    objetivoActual: "rafaela",
    maximoIntentos: 8
});
assert.equal(circuitoLegado.objetivoId, "rafaela");
assert.deepEqual(Array.from(circuitoLegado.idsIntentados), ["parana"]);

for (const contenido of ["{", JSON.stringify({ fecha: "2026-08-06" })]) {
    const corrupto = crearAlmacenamiento();
    corrupto.setItem("partida", contenido);
    const nuevo = TCdle.crearJuegoDiario({
        almacenamiento: corrupto,
        clave: "partida",
        fecha: "2026-08-07",
        objetivoId: 1,
        idsValidos: [1]
    });
    assert.equal(nuevo.cargar().intentosUsados, 0);
    assert.equal(corrupto.getItem("partida"), null);
}

process.stdout.write("OK: núcleo compartido, búsqueda, partidas y migraciones.\n");
