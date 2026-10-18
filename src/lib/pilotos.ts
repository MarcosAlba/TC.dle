import type { Piloto } from "../data/tipos";
import { normalizarTexto } from "./texto";

/** Los pilotos tienen un único campo "nombre": el apellido es la última palabra. */
export function obtenerApellidoPiloto(piloto: Pick<Piloto, "nombre">): string {
    const partes = String(piloto.nombre || "").trim().split(/\s+/);
    return partes[partes.length - 1] || "";
}

/**
 * Miniatura (pilotos/mini/*.webp) para donde la foto se ve chica: el buscador
 * y la tabla de intentos. Acepta la ruta relativa de `foto` o una URL completa.
 */
export function obtenerImagenMiniPiloto(piloto: Pick<Piloto, "foto">): string {
    return piloto.foto.replace(/(^|\/)pilotos\/([^/]+?)\.[a-z0-9]+$/i, "$1pilotos/mini/$2.webp");
}

export function obtenerIniciales(piloto: Pick<Piloto, "nombre">): string {
    return piloto.nombre
        .split(" ")
        .slice(0, 2)
        .map((parte) => parte.charAt(0))
        .join("");
}

/** Texto donde busca el buscador: el apodo también cuenta ("pechito" encuentra a López). */
export function obtenerTextoBusquedaPiloto(piloto: Pick<Piloto, "nombre" | "apodo">): string {
    return piloto.apodo ? piloto.nombre + " " + piloto.apodo : piloto.nombre;
}

/**
 * Los pilotos actuales corren con autos Nueva Generación: su marca lleva
 * "(NG)" y usa el logo actual. Las leyendas usan el logo clásico, así una
 * leyenda de Ford no coincide con un Ford (NG).
 */
export const LOGOS_MARCAS: Record<string, string> = {
    "Chevrolet (NG)": "chevrolet-logo.jpg",
    "Ford (NG)": "ford-logo.jpg",
    "Torino (NG)": "torino-logo.jpg",
    "Dodge (NG)": "dodge-logo.jpg",
    "Toyota (NG)": "toyota-logo.jpg",
    "BMW (NG)": "bmw-logo.jpg",
    "Mercedez Benz (NG)": "mercedes-logo.jpg",
    Chevrolet: "chevrolet-clasico.png",
    Ford: "ford-clasico.png",
    Torino: "torino-clasico.png",
    Dodge: "dodge-clasico.png",
};

/** Las leyendas que ya fallecieron muestran la edad que tenían al morir. */
export function calcularEdad(piloto: Pick<Piloto, "fechaNacimiento" | "fechaFallecimiento">, ahora: Date = new Date()): number {
    const [anioNacimiento, mesNacimiento, diaNacimiento] = piloto.fechaNacimiento.split("-").map(Number);
    const hoy = piloto.fechaFallecimiento ? new Date(piloto.fechaFallecimiento + "T00:00:00") : ahora;
    let edad = hoy.getFullYear() - anioNacimiento;

    if (hoy < new Date(hoy.getFullYear(), mesNacimiento - 1, diaNacimiento)) {
        edad--;
    }

    return edad;
}

export type EstadoCelda = "coincide" | "cerca" | "no-coincide";

export interface CeldaNumerica {
    valor: number;
    estado: EstadoCelda;
    /** Hacia dónde está el valor buscado; null si coincide. */
    direccion: "mayor" | "menor" | null;
}

export interface Comparacion {
    acerto: boolean;
    marca: boolean;
    equipo: boolean;
    localidad: EstadoCelda;
    campeon: boolean;
    edad: CeldaNumerica;
    debut: CeldaNumerica;
}

function compararNumero(valor: number, buscado: number): CeldaNumerica {
    return {
        valor,
        estado: valor === buscado ? "coincide" : Math.abs(valor - buscado) <= 2 ? "cerca" : "no-coincide",
        direccion: buscado > valor ? "mayor" : buscado < valor ? "menor" : null,
    };
}

/** Qué pista de color le toca a cada dato del piloto intentado frente al secreto. */
export function compararPiloto(intento: Piloto, secreto: Piloto, ahora: Date = new Date()): Comparacion {
    const mismaLocalidad = normalizarTexto(intento.localidad) === normalizarTexto(secreto.localidad);
    const mismaProvincia = normalizarTexto(intento.provincia) === normalizarTexto(secreto.provincia);

    return {
        acerto: intento.id === secreto.id,
        marca: intento.marca === secreto.marca,
        equipo: intento.equipo === secreto.equipo,
        localidad: mismaLocalidad ? "coincide" : mismaProvincia ? "cerca" : "no-coincide",
        campeon: intento.campeonTC === secreto.campeonTC,
        edad: compararNumero(calcularEdad(intento, ahora), calcularEdad(secreto, ahora)),
        debut: compararNumero(intento.anioDebutTC, secreto.anioDebutTC),
    };
}

export const ETIQUETAS_ESTADISTICA = {
    carrerasGanadas: "Carreras ganadas",
    series: "Series ganadas",
    clasificaciones: "Clasificaciones",
    carrerasCorridas: "Carreras corridas",
} as const;

export interface PistaPiloto {
    id: "numero" | "dato" | "estadistica";
    nombre: string;
    /** Intentos fallidos para desbloquearla. */
    intentos: number;
    texto: string | null;
}

/** Las tres fichas de pistas del piloto del día; una cuyo dato no está cargado no tiene texto. */
export function obtenerPistasPiloto(piloto: Piloto): PistaPiloto[] {
    const estadistica = piloto.estadisticaDestacada;

    return [
        {
            id: "numero",
            nombre: "Número de auto",
            intentos: 3,
            texto:
                piloto.numeroAuto === null || piloto.numeroAuto === undefined
                    ? null
                    : (piloto.retirado ? "Corría" : "Corre") + " con el número " + piloto.numeroAuto + ".",
        },
        { id: "dato", nombre: "Dato peculiar", intentos: 5, texto: piloto.datoPeculiar || null },
        {
            id: "estadistica",
            nombre: "Estadística",
            intentos: 7,
            texto: estadistica
                ? (ETIQUETAS_ESTADISTICA[estadistica.tipo] || "Estadística") + ": " + estadistica.valor + "."
                : null,
        },
    ];
}
