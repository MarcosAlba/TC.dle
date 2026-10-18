// Contrato de lo que el sitio guarda en localStorage. Quien ya jugó tiene estos
// datos en su navegador: si una versión nueva los lee distinto o los escribe
// con otro formato, se pierden partidas y rachas. Este test fija el formato
// exacto para poder cambiar la estructura del proyecto sin romper a nadie.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const raiz = path.resolve(import.meta.dirname, "..");
const contexto = { window: {} };
vm.runInNewContext(await readFile(path.join(raiz, "assets/js/tcdle.js"), "utf8"), contexto);
const TCdle = contexto.window.TCdle;

function crearAlmacenamiento() {
    const datos = new Map();
    return {
        getItem: (clave) => datos.get(clave) ?? null,
        setItem: (clave, valor) => datos.set(clave, valor),
        removeItem: (clave) => datos.delete(clave),
        datos
    };
}

const hoy = TCdle.obtenerFechaLocal();
const ayer = TCdle.obtenerFechaLocal(new Date(Date.now() - TCdle.MILISEGUNDOS_POR_DIA));

// 1. Las claves y los ids de cada modo no pueden cambiar de nombre.
assert.deepEqual(
    Array.from(TCdle.JUEGOS, ({ id, clavePartida }) => [id, clavePartida]),
    [
        ["piloto", "partidaTCdle"],
        ["auto", "partidaTCdleAuto"],
        ["circuito", "partidaTCdleCircuito"],
        ["wordle", "partidaTCdleWordle"]
    ],
    "Cambiaron las claves de partida guardadas en el navegador"
);

// 2. Lo que se escribe: formato y orden de campos exactos.
contexto.window.localStorage = crearAlmacenamiento();
const almacenamiento = contexto.window.localStorage;
const piloto = TCdle.crearJuegoDiario({
    almacenamiento,
    clave: "partidaTCdle",
    fecha: "2026-10-17",
    objetivoId: 3,
    idsValidos: [1, 2, 3, 4]
});
piloto.intentar(1);
assert.equal(
    almacenamiento.getItem("partidaTCdle"),
    '{"version":2,"fecha":"2026-10-17","objetivoId":3,"idsIntentados":[1],"terminada":false}'
);
piloto.intentar(3);
assert.equal(
    almacenamiento.getItem("partidaTCdle"),
    '{"version":2,"fecha":"2026-10-17","objetivoId":3,"idsIntentados":[1,3],"terminada":true}'
);
assert.equal(
    almacenamiento.getItem("rachasTCdle"),
    '{"piloto":{"fecha":"2026-10-17","racha":1}}',
    "Cambió el formato de las rachas"
);

const wordle = TCdle.crearJuegoDiario({
    almacenamiento,
    clave: "partidaTCdleWordle",
    fecha: "2026-10-17",
    objetivoId: "FORD",
    validarId: (id) => typeof id === "string",
    maximoIntentos: 5
});
wordle.intentar("RAID");
assert.equal(
    almacenamiento.getItem("partidaTCdleWordle"),
    '{"version":2,"fecha":"2026-10-17","objetivoId":"FORD","idsIntentados":["RAID"],"terminada":false}',
    "El Wordle guarda las palabras como texto"
);

const anio = TCdle.crearDatoDiario({ almacenamiento, clave: "partidaTCdleAutoAnio", fecha: "2026-10-17" });
anio.guardar(2015);
assert.equal(
    almacenamiento.getItem("partidaTCdleAutoAnio"),
    '{"fecha":"2026-10-17","valor":2015}',
    "Cambió el formato de la respuesta del año"
);

// 3. Lo que ya está guardado se sigue leyendo: partidas de hoy en cada modo y rachas.
contexto.window.localStorage = crearAlmacenamiento();
const guardadas = contexto.window.localStorage;
guardadas.setItem("partidaTCdle", JSON.stringify({ version: 2, fecha: hoy, objetivoId: 7, idsIntentados: [2, 7], terminada: true }));
guardadas.setItem("partidaTCdleAuto", JSON.stringify({ version: 2, fecha: hoy, objetivoId: 4, idsIntentados: [1, 2, 3, 5, 6, 7, 8, 9], terminada: true }));
guardadas.setItem("partidaTCdleCircuito", JSON.stringify({ version: 2, fecha: hoy, objetivoId: "rafaela", idsIntentados: ["parana"], terminada: false }));
guardadas.setItem("partidaTCdleWordle", JSON.stringify({ version: 2, fecha: ayer, objetivoId: "FORD", idsIntentados: ["FORD"], terminada: true }));
guardadas.setItem("rachasTCdle", JSON.stringify({
    piloto: { fecha: hoy, racha: 12 },
    auto: { fecha: ayer, racha: 3 },
    circuito: { fecha: "2020-01-01", racha: 9 }
}));

const estados = Object.fromEntries(TCdle.obtenerEstadoJuegos().map(({ id, estado, racha }) => [id, { estado, racha }]));
assert.deepEqual(estados, {
    piloto: { estado: "acertado", racha: 12 },
    auto: { estado: "fallado", racha: 3 },
    circuito: { estado: "pendiente", racha: 0 },
    wordle: { estado: "pendiente", racha: 0 }
});

// 4. La portada recuerda con la fecha en texto si ya se vio la intro del modo.
const elementos = { intro: { hidden: false }, contenido: { hidden: true } };
guardadas.setItem("tcdleIntroPilotoVista", hoy);
assert.equal(
    TCdle.aplicarVisibilidadIntro({ clave: "tcdleIntroPilotoVista", almacenamiento: guardadas, ...elementos }),
    true
);
assert.deepEqual(elementos, { intro: { hidden: true }, contenido: { hidden: false } });
guardadas.setItem("tcdleIntroPilotoVista", ayer);
assert.equal(
    TCdle.aplicarVisibilidadIntro({ clave: "tcdleIntroPilotoVista", almacenamiento: guardadas, ...elementos }),
    false,
    "La intro se vuelve a mostrar cada día"
);

process.stdout.write("OK: formato de localStorage (partidas, rachas, año e intros) fijado.\n");
