// Calcula la selección diaria con el código actual del sitio. Lo usan el test
// que compara contra el fixture y el script que lo regenera.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const raiz = path.resolve(import.meta.dirname, "../..");
const FECHA_INICIO = [2026, 0, 1];
const DIAS = 730;
const CLAVES = ["pilotos", "autos", "circuitos", "wordle"];
const CANTIDADES = [1, 2, 3, 10, 31, 56, 65, 98, 109];

function crearContexto() {
    return vm.createContext({
        window: {},
        URL,
        document: { currentScript: { src: "http://localhost/assets/js/catalogo.js" } }
    });
}

async function ejecutar(contexto, archivo, expresion) {
    const codigo = await readFile(path.join(raiz, "public/assets/js", archivo), "utf8");
    vm.runInContext(codigo, contexto);
    return expresion ? vm.runInContext(expresion, contexto) : undefined;
}

export async function cargarModos() {
    const contexto = crearContexto();
    await ejecutar(contexto, "seleccion-diaria.js");
    const pilotos = await ejecutar(contexto, "pilotos.js", "pilotos");
    await ejecutar(contexto, "autos.js");
    await ejecutar(contexto, "circuitos.js");
    const palabras = await ejecutar(contexto, "palabras-tc.js", "palabrasTC");
    // Mismo filtro que tcdle-wordle.js (LONGITUD_MINIMA = 4, LONGITUD_MAXIMA = 8).
    const palabrasValidas = palabras.filter((item) => item.palabra.length >= 4 && item.palabra.length <= 8);

    return {
        obtener: contexto.window.seleccionDiaria.obtener,
        modos: {
            pilotos: { elementos: pilotos, etiqueta: (p) => String(p.id) },
            autos: { elementos: contexto.window.autosTC, etiqueta: (a) => a.archivo },
            circuitos: { elementos: contexto.window.circuitosTC, etiqueta: (c) => c.id },
            wordle: { elementos: palabrasValidas, etiqueta: (p) => p.id }
        }
    };
}

function fechaDelDia(numero) {
    return new Date(FECHA_INICIO[0], FECHA_INICIO[1], FECHA_INICIO[2] + numero, 12);
}

export async function calcularSeleccion() {
    const { obtener, modos } = await cargarModos();
    const resultado = { desde: "2026-01-01", dias: DIAS, algoritmo: {}, modos: {} };

    for (const cantidad of CANTIDADES) {
        const elementos = Array.from({ length: cantidad }, (_, indice) => indice);
        for (const clave of [...CLAVES, "otra"]) {
            resultado.algoritmo[`${clave}:${cantidad}`] = Array.from(
                { length: 60 },
                (_, dia) => obtener(elementos, clave, fechaDelDia(dia))
            );
        }
    }

    for (const [nombre, modo] of Object.entries(modos)) {
        const etiquetas = modo.elementos.map(modo.etiqueta);
        resultado.modos[nombre] = {
            cantidad: etiquetas.length,
            huellaCatalogo: createHash("sha256").update(etiquetas.join("\n")).digest("hex"),
            primeros: etiquetas.slice(0, 3),
            seleccion: Array.from({ length: DIAS }, (_, dia) => {
                const elegido = obtener(modo.elementos, nombre, fechaDelDia(dia));
                return modo.elementos.indexOf(elegido);
            })
        };
    }

    return resultado;
}
