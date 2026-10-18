// Calcula la selección diaria con el código actual del sitio. Lo usan el test
// que compara contra el fixture y el script que lo regenera.
import { createHash } from "node:crypto";
import autos from "../../src/data/autos.json";
import circuitos from "../../src/data/circuitos.json";
import palabras from "../../src/data/palabras.json";
import pilotos from "../../src/data/pilotos.json";
import { filtrarPalabrasJugables } from "../../src/lib/wordle";
import { obtenerSeleccionDiaria } from "../../src/lib/seleccion-diaria";

const FECHA_INICIO = [2026, 0, 1];
const DIAS = 730;
const CLAVES = ["pilotos", "autos", "circuitos", "wordle"];
const CANTIDADES = [1, 2, 3, 10, 31, 56, 65, 98, 109];

interface Modo {
    elementos: unknown[];
    etiqueta: (elemento: any) => string;
}

// La etiqueta de cada modo es lo que identifica al elemento en el fixture:
// el id del piloto, el nombre de archivo del auto, el id del circuito y la palabra.
export const modos: Record<string, Modo> = {
    pilotos: { elementos: pilotos, etiqueta: (piloto) => String(piloto.id) },
    autos: { elementos: autos, etiqueta: (auto) => auto.archivo },
    circuitos: { elementos: circuitos, etiqueta: (circuito) => circuito.id },
    wordle: { elementos: filtrarPalabrasJugables(palabras), etiqueta: (palabra) => palabra },
};

function fechaDelDia(numero: number): Date {
    return new Date(FECHA_INICIO[0], FECHA_INICIO[1], FECHA_INICIO[2] + numero, 12);
}

export function calcularSeleccion() {
    const resultado = {
        desde: "2026-01-01",
        dias: DIAS,
        algoritmo: {} as Record<string, unknown[]>,
        modos: {} as Record<string, { cantidad: number; huellaCatalogo: string; primeros: string[]; seleccion: number[] }>,
    };

    for (const cantidad of CANTIDADES) {
        const elementos = Array.from({ length: cantidad }, (_, indice) => indice);
        for (const clave of [...CLAVES, "otra"]) {
            resultado.algoritmo[`${clave}:${cantidad}`] = Array.from({ length: 60 }, (_, dia) =>
                obtenerSeleccionDiaria(elementos, clave, fechaDelDia(dia))
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
                const elegido = obtenerSeleccionDiaria(modo.elementos, nombre, fechaDelDia(dia));
                return modo.elementos.indexOf(elegido);
            }),
        };
    }

    return resultado;
}
