// Top 10 de la carrera: adivinar quiénes terminaron entre los diez primeros de
// una final del TC. La pista de cada puesto es el logo de la marca con la que
// corrió ese día, salvo que en la introducción se elija jugar sin marcas.
// Intentos ilimitados: se gana completando los diez y se pierde al rendirse o,
// con el cronómetro, al llegar a cero. La partida se guarda en
// "partidaTCdleTop10" y las opciones del día en "tcdleTop10Opciones".
import type { Carrera, FotoCarrera, Piloto, ResultadoCarrera } from "../data/tipos";
import { leerJson, type Almacenamiento } from "./almacenamiento";
import { obtenerFechaLocal } from "./fechas";
import { obtenerImagenMiniPiloto } from "./pilotos";
import { registrarResultadoRacha } from "./rachas";
import { normalizarTexto } from "./texto";

export const PUESTOS = 10;

/**
 * Logo de cada marca tal como la escribe la ACTC (en public/assets/images/marcas).
 * Las marcas solas son la era clásica; las que nombran el modelo son la Nueva
 * Generación (2024 en adelante) y usan el logo actual.
 */
export const LOGOS_MARCAS_CARRERA: Record<string, string> = {
    Ford: "ford-clasico.png",
    Chevrolet: "chevrolet-clasico.png",
    Dodge: "dodge-clasico.png",
    Torino: "torino-clasico.png",
    "Ford (Mustang)": "ford-logo.jpg",
    "Chevrolet (Camaro)": "chevrolet-logo.jpg",
    "Dodge (Challenger)": "dodge-logo.jpg",
    "Torino (Torino NG)": "torino-logo.jpg",
    Toyota: "toyota-logo.jpg",
    "Mercedes Benz": "mercedes-logo.jpg",
    "B M W": "bmw-logo.jpg",
};

/** Ruta relativa a public/assets/images, o null si la marca no tiene logo. */
export function obtenerLogoMarca(marca: string): string | null {
    const archivo = LOGOS_MARCAS_CARRERA[marca];
    return archivo ? "marcas/" + archivo : null;
}

/** Nombre de la marca para mostrar y para lectores de pantalla: "Ford (Mustang)" -> "Ford". */
export function obtenerNombreMarca(marca: string): string {
    return marca === "B M W" ? "BMW" : marca.replace(/\s*\(.*\)$/, "");
}

/** Solo las finales con al menos diez clasificados se pueden jugar. */
export function obtenerCarrerasJugables(carreras: readonly Carrera[]): Carrera[] {
    return carreras.filter((carrera) => carrera.resultados.length >= PUESTOS);
}

export function obtenerTop10(carrera: Carrera): ResultadoCarrera[] {
    return carrera.resultados.slice(0, PUESTOS);
}

/** El id de un piloto de los resultados es su nombre normalizado. */
export function obtenerIdPilotoCarrera(nombre: string): string {
    return normalizarTexto(nombre);
}

export interface PilotoCarrera {
    id: string;
    nombre: string;
}

/**
 * Todos los pilotos que corrieron alguna final, sin repetir y en orden
 * alfabético: es lo que ofrece el buscador. Nombrar a uno que corrió pero no
 * entró al top 10 cuenta como error y dice en qué puesto llegó.
 */
export function obtenerPilotosDeCarreras(carreras: readonly Carrera[]): PilotoCarrera[] {
    const porId = new Map<string, PilotoCarrera>();

    for (const carrera of carreras) {
        for (const { piloto } of carrera.resultados) {
            const id = obtenerIdPilotoCarrera(piloto);
            if (!porId.has(id)) {
                porId.set(id, { id, nombre: piloto });
            }
        }
    }

    return [...porId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Piloto del catálogo con el mismo nombre, para mostrar su foto; null si no está. */
export function buscarPilotoCatalogo(nombre: string, pilotos: readonly Piloto[]): Piloto | null {
    const id = obtenerIdPilotoCarrera(nombre);
    return pilotos.find((piloto) => obtenerIdPilotoCarrera(piloto.nombre) === id) ?? null;
}

/** Para los pilotos sin foto en el catálogo ni en la ACTC. */
export const FOTO_SILUETA = "silueta-piloto.webp";

/**
 * Foto chica de un piloto de las carreras, relativa a public/assets/images:
 * la miniatura del catálogo si la tiene, si no la de la ACTC que trajo el
 * scraper (pilotos-carreras/) y, si tampoco, la silueta genérica.
 */
export function obtenerFotoPilotoCarrera(nombre: string, pilotos: readonly Piloto[], fotos: readonly FotoCarrera[]): string {
    const delCatalogo = buscarPilotoCatalogo(nombre, pilotos);
    if (delCatalogo) {
        return obtenerImagenMiniPiloto(delCatalogo);
    }
    const id = obtenerIdPilotoCarrera(nombre);
    const foto = fotos.find((item) => obtenerIdPilotoCarrera(item.piloto) === id);

    return foto ? "pilotos-carreras/" + foto.archivo : FOTO_SILUETA;
}

/** "Juan Martín Trucco" -> nombre "Juan Martín" y apellido "Trucco" (el apellido viene de la ACTC). */
export function separarNombre(resultado: Pick<ResultadoCarrera, "piloto" | "apellido">): { nombre: string; apellido: string } {
    const nombre = resultado.piloto.endsWith(resultado.apellido)
        ? resultado.piloto.slice(0, -resultado.apellido.length).trim()
        : "";

    return { nombre, apellido: resultado.apellido };
}

/* ---------- Opciones que se eligen en la introducción ---------- */

export const CLAVE_OPCIONES_TOP10 = "tcdleTop10Opciones";
/** Lo dispara la introducción al tocar "Empezar", con las opciones en `detail`. */
export const EVENTO_OPCIONES_TOP10 = "tcdle:top10-opciones";
export const SEGUNDOS_CRONOMETRO = 120;

export interface OpcionesTop10 {
    /** Mostrar el logo de la marca de cada puesto como pista. */
    marcas: boolean;
    /** null: sin límite de tiempo. */
    limiteSegundos: number | null;
    /** Cuándo se tocó "Empezar" (ms), para que el reloj siga al recargar. */
    inicio: number;
}

interface OpcionesTop10Guardadas extends OpcionesTop10 {
    fecha: string;
}

/** Si nunca se eligieron (la introducción ya se había visto), se juega como siempre. */
export const OPCIONES_TOP10_POR_DEFECTO: OpcionesTop10 = { marcas: true, limiteSegundos: null, inicio: 0 };

export function guardarOpcionesTop10(
    almacenamiento: Almacenamiento,
    eleccion: { marcas: boolean; cronometro: boolean },
    fecha: string = obtenerFechaLocal(),
    ahora: number = Date.now()
): OpcionesTop10 {
    const opciones: OpcionesTop10 = {
        marcas: eleccion.marcas,
        limiteSegundos: eleccion.cronometro ? SEGUNDOS_CRONOMETRO : null,
        inicio: ahora,
    };
    try {
        almacenamiento.setItem(CLAVE_OPCIONES_TOP10, JSON.stringify({ fecha, ...opciones }));
    } catch {
        // Sin almacenamiento valen igual para esta visita (viajan en el evento).
    }

    return opciones;
}

/** Opciones elegidas hoy, o null si todavía no se tocó "Empezar". */
export function leerOpcionesTop10(almacenamiento: Almacenamiento, fecha: string = obtenerFechaLocal()): OpcionesTop10 | null {
    const guardadas = leerJson<OpcionesTop10Guardadas>(almacenamiento, CLAVE_OPCIONES_TOP10);
    if (!guardadas || guardadas.fecha !== fecha || typeof guardadas.marcas !== "boolean" || !Number.isFinite(guardadas.inicio)) {
        return null;
    }

    return {
        marcas: guardadas.marcas,
        limiteSegundos: guardadas.limiteSegundos === null ? null : Number(guardadas.limiteSegundos) || null,
        inicio: guardadas.inicio,
    };
}

/** Segundos que quedan del cronómetro (0 si se terminó), o null si no hay límite. */
export function obtenerSegundosRestantes(opciones: OpcionesTop10, ahora: number = Date.now()): number | null {
    if (opciones.limiteSegundos === null) {
        return null;
    }

    return Math.max(0, Math.ceil(opciones.limiteSegundos - (ahora - opciones.inicio) / 1000));
}

/** 95 -> "1:35". */
export function formatearCronometro(segundos: number): string {
    return Math.floor(segundos / 60) + ":" + String(segundos % 60).padStart(2, "0");
}

export type ResultadoIntentoTop10 =
    | { tipo: "acierto"; posicion: number }
    /** posicion: dónde llegó si corrió esa final; null si no la corrió. */
    | { tipo: "error"; posicion: number | null }
    | { tipo: "repetido" | "invalido" | "bloqueada" };

export interface EstadoTop10 {
    fecha: string;
    carreraId: string;
    /** Ids en el orden en que se intentaron. */
    intentos: string[];
    /** Posiciones (1 a 10) ya adivinadas. */
    acertados: number[];
    errores: number;
    rendido: boolean;
    /** Se terminó el cronómetro de 2 minutos. */
    sinTiempo: boolean;
    terminada: boolean;
    gano: boolean;
    opciones: OpcionesTop10;
}

interface PartidaTop10Guardada {
    version: 1;
    fecha: string;
    carreraId: string;
    intentos: string[];
    rendido: boolean;
    sinTiempo: boolean;
    terminada: boolean;
    gano: boolean;
}

export interface ConfiguracionTop10 {
    almacenamiento: Almacenamiento;
    clave: string;
    carrera: Carrera;
    /** Ids que acepta el buscador (obtenerPilotosDeCarreras). */
    idsValidos: readonly string[];
    fecha?: string;
    opciones?: OpcionesTop10;
    /** Reloj inyectable para los tests. */
    ahora?: () => number;
}

export function crearPartidaTop10(configuracion: ConfiguracionTop10) {
    const { almacenamiento, clave, carrera } = configuracion;
    const fecha = configuracion.fecha ?? obtenerFechaLocal();
    const ahora = configuracion.ahora ?? Date.now;
    const idsValidos = new Set(configuracion.idsValidos);
    const posiciones = new Map(carrera.resultados.map((resultado) => [obtenerIdPilotoCarrera(resultado.piloto), resultado.posicion]));
    let opciones = configuracion.opciones ?? OPCIONES_TOP10_POR_DEFECTO;
    let intentos: string[] = [];
    let rendido = false;
    let sinTiempo = false;

    const posicionDe = (id: string) => posiciones.get(id) ?? null;
    const esAcierto = (id: string) => {
        const posicion = posicionDe(id);
        return posicion !== null && posicion <= PUESTOS;
    };

    function estado(): EstadoTop10 {
        const acertados = intentos.filter(esAcierto).map((id) => posicionDe(id)!).sort((a, b) => a - b);
        const gano = acertados.length === PUESTOS;

        return {
            fecha,
            carreraId: carrera.id,
            intentos: intentos.slice(),
            acertados,
            errores: intentos.length - acertados.length,
            rendido,
            sinTiempo,
            terminada: gano || rendido || sinTiempo,
            gano,
            opciones,
        };
    }

    function guardar(): void {
        const { terminada, gano } = estado();
        const partida: PartidaTop10Guardada = { version: 1, fecha, carreraId: carrera.id, intentos, rendido, sinTiempo, terminada, gano };
        try {
            almacenamiento.setItem(clave, JSON.stringify(partida));
        } catch {
            // Sin almacenamiento se juega igual; no se recuerda al recargar.
        }
    }

    function registrarSiTermino(): void {
        const actual = estado();
        if (actual.terminada) {
            registrarResultadoRacha(almacenamiento, clave, fecha, actual.gano);
        }
    }

    function cargar(): EstadoTop10 {
        const guardada = leerJson<PartidaTop10Guardada>(almacenamiento, clave);

        if (!guardada || guardada.fecha !== fecha || guardada.carreraId !== carrera.id || !Array.isArray(guardada.intentos)) {
            if (guardada) {
                almacenamiento.removeItem(clave);
            }
            return estado();
        }

        intentos = guardada.intentos.filter((id, indice, lista) => idsValidos.has(id) && lista.indexOf(id) === indice);
        rendido = Boolean(guardada.rendido);
        sinTiempo = Boolean(guardada.sinTiempo);
        registrarSiTermino();

        // Si se cerró la página con el reloj corriendo, al volver ya puede haberse terminado.
        return revisarTiempo();
    }

    /** Opciones elegidas en la introducción; valen solo antes del primer intento. */
    function configurar(nuevas: OpcionesTop10): EstadoTop10 {
        if (intentos.length === 0 && !estado().terminada) {
            opciones = nuevas;
        }

        return estado();
    }

    /** Termina la partida si el cronómetro llegó a cero. */
    function revisarTiempo(): EstadoTop10 {
        if (!estado().terminada && obtenerSegundosRestantes(opciones, ahora()) === 0) {
            sinTiempo = true;
            guardar();
            registrarSiTermino();
        }

        return estado();
    }

    function intentar(id: string): { resultado: ResultadoIntentoTop10; estado: EstadoTop10 } {
        revisarTiempo();
        if (estado().terminada) {
            return { resultado: { tipo: "bloqueada" }, estado: estado() };
        }
        if (!idsValidos.has(id)) {
            return { resultado: { tipo: "invalido" }, estado: estado() };
        }
        if (intentos.includes(id)) {
            return { resultado: { tipo: "repetido" }, estado: estado() };
        }

        intentos.push(id);
        guardar();
        registrarSiTermino();

        const posicion = posicionDe(id);
        const resultado: ResultadoIntentoTop10 =
            posicion !== null && posicion <= PUESTOS ? { tipo: "acierto", posicion } : { tipo: "error", posicion };

        return { resultado, estado: estado() };
    }

    function rendirse(): EstadoTop10 {
        if (!estado().terminada) {
            rendido = true;
            guardar();
            registrarSiTermino();
        }

        return estado();
    }

    return { cargar, configurar, estado, intentar, revisarTiempo, rendirse };
}

export type PartidaTop10 = ReturnType<typeof crearPartidaTop10>;
