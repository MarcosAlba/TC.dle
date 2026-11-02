// Lógica de los juegos de "Más juegos" (trayectoria, grilla y conexiones). Todo
// sale de pilotos.json y de las finales de carreras.json; la ficha de cada
// piloto se arma al construir el sitio (así la página no baja las 246 finales)
// y el desafío de cada día se sortea en el navegador con semilla.
import type { Carrera, Piloto } from "../data/tipos";
import { crearGenerador, crearSemilla, obtenerSeleccionDiaria } from "./seleccion-diaria";
import { buscarPilotoCatalogo } from "./top10";

export interface Temporada {
    anio: number;
    /** Marca como la escribe la ACTC ("Ford", "Ford (Mustang)"...): da el logo de la época. */
    marca: string;
    numero: number;
}

/** Lo que usan los tres juegos de cada piloto de pilotos.json. */
export interface FichaPiloto {
    id: number;
    nombre: string;
    foto: string;
    /** Marca sin el "(NG)": Ford, Chevrolet, Torino, Dodge, Toyota... */
    marca: string;
    provincia: string;
    equipo: string;
    campeon: boolean;
    debut: number;
    retirado: boolean;
    nacimiento: number;
    numero: number | null;
    /** Finales ganadas desde 2010 (las que hay en carreras.json). */
    victorias: number;
    /** Primera final de cada año en la que corrió, en orden. */
    temporadas: Temporada[];
}

const limpiarMarca = (marca: string) => marca.replace(/\s*\(.*\)\s*$/, "").trim();

export function construirFichas(pilotos: readonly Piloto[], carreras: readonly Carrera[]): FichaPiloto[] {
    const porId = new Map<number, { victorias: number; temporadas: Map<number, Temporada> }>();
    const cache = new Map<string, Piloto | null>();
    const ordenadas = [...carreras].sort((a, b) => a.fecha.localeCompare(b.fecha));

    for (const carrera of ordenadas) {
        for (const resultado of carrera.resultados) {
            if (!cache.has(resultado.piloto)) {
                cache.set(resultado.piloto, buscarPilotoCatalogo(resultado.piloto, pilotos));
            }
            const piloto = cache.get(resultado.piloto);
            if (!piloto) {
                continue;
            }
            const datos = porId.get(piloto.id) ?? { victorias: 0, temporadas: new Map() };
            if (resultado.posicion === 1) {
                datos.victorias++;
            }
            if (!datos.temporadas.has(carrera.anio)) {
                datos.temporadas.set(carrera.anio, { anio: carrera.anio, marca: resultado.marca, numero: resultado.numero });
            }
            porId.set(piloto.id, datos);
        }
    }

    return pilotos.map((piloto) => {
        const datos = porId.get(piloto.id);
        return {
            id: piloto.id,
            nombre: piloto.nombre,
            foto: piloto.foto,
            marca: limpiarMarca(piloto.marca),
            provincia: piloto.provincia,
            equipo: piloto.equipo,
            campeon: piloto.campeonTC,
            debut: piloto.anioDebutTC,
            retirado: Boolean(piloto.retirado),
            nacimiento: Number(piloto.fechaNacimiento.slice(0, 4)),
            numero: piloto.numeroAuto,
            victorias: datos?.victorias ?? 0,
            temporadas: datos ? [...datos.temporadas.values()].sort((a, b) => a.anio - b.anio) : [],
        };
    });
}

// ---------- Trayectoria: marca y número de cada temporada ----------

export const MAXIMO_INTENTOS_TRAYECTORIA = 6;
const MINIMO_TEMPORADAS = 5;

/** Pilotos con campaña suficiente para el juego, en orden fijo (el de pilotos.json). */
export const candidatosTrayectoria = (fichas: readonly FichaPiloto[]) => fichas.filter((ficha) => ficha.temporadas.length >= MINIMO_TEMPORADAS);

export function elegirTrayectoria(fichas: readonly FichaPiloto[], fecha: Date): FichaPiloto {
    return obtenerSeleccionDiaria(candidatosTrayectoria(fichas), "trayectoria", fecha)!;
}

/** Arranca con tres temporadas y cada error destapa dos más; al terminar se ven todas. */
export function contarTemporadasVisibles(total: number, errores: number, terminada: boolean): number {
    return terminada ? total : Math.min(total, 3 + 2 * errores);
}

// ---------- Condiciones de la grilla y grupos de conexiones ----------

export interface Condicion {
    id: string;
    texto: string;
    /** Marca, provincia o logro: en la grilla filas y columnas no repiten condición. */
    tipo: "marca" | "provincia" | "logro";
    cumple: (ficha: FichaPiloto) => boolean;
}

const MARCAS = ["Ford", "Chevrolet", "Torino", "Dodge", "Toyota"];
const PROVINCIAS = ["Buenos Aires", "Santa Fe", "Córdoba", "Entre Ríos"];

export const CONDICIONES: readonly Condicion[] = [
    ...MARCAS.map((marca): Condicion => ({ id: "marca-" + marca, texto: "Corre o corrió con " + marca, tipo: "marca", cumple: (f) => f.marca === marca })),
    ...PROVINCIAS.map((provincia): Condicion => ({ id: "prov-" + provincia, texto: "De " + provincia, tipo: "provincia", cumple: (f) => f.provincia === provincia })),
    { id: "campeon", texto: "Campeón de TC", tipo: "logro", cumple: (f) => f.campeon },
    { id: "victorias-5", texto: "Ganó 5 finales o más desde 2010", tipo: "logro", cumple: (f) => f.victorias >= 5 },
    { id: "victoria", texto: "Ganó una final desde 2010", tipo: "logro", cumple: (f) => f.victorias >= 1 },
    { id: "debut-viejo", texto: "Debutó antes de 2010", tipo: "logro", cumple: (f) => f.debut < 2010 },
    { id: "debut-nuevo", texto: "Debutó en 2015 o después", tipo: "logro", cumple: (f) => f.debut >= 2015 },
];

export interface Grilla {
    filas: Condicion[];
    columnas: Condicion[];
}

export const MAXIMO_INTENTOS_GRILLA = 9;

/** Pilotos que valen en un casillero. */
export const respuestasCasillero = (fichas: readonly FichaPiloto[], fila: Condicion, columna: Condicion) =>
    fichas.filter((ficha) => fila.cumple(ficha) && columna.cumple(ficha));

/**
 * Grilla del día: filas de marcas y logros, columnas de provincias y logros, sin
 * repetir condición, y cada uno de los nueve casilleros con al menos dos respuestas.
 */
export function generarGrilla(fichas: readonly FichaPiloto[], semilla: string): Grilla {
    const aleatorio = crearGenerador(crearSemilla(semilla));
    const elegir = <T,>(lista: readonly T[], cantidad: number) => {
        const copia = [...lista];
        const elegidos: T[] = [];
        while (elegidos.length < cantidad && copia.length > 0) {
            elegidos.push(copia.splice(Math.floor(aleatorio() * copia.length), 1)[0]);
        }
        return elegidos;
    };
    const paraFilas = CONDICIONES.filter((condicion) => condicion.tipo !== "provincia");
    const paraColumnas = CONDICIONES.filter((condicion) => condicion.tipo !== "marca");

    for (let intento = 0; intento < 2000; intento++) {
        const filas = elegir(paraFilas, 3);
        const columnas = elegir(
            paraColumnas.filter((condicion) => !filas.includes(condicion)),
            3
        );
        const valida = filas.every((fila) => columnas.every((columna) => respuestasCasillero(fichas, fila, columna).length >= 2));
        if (valida) {
            return { filas, columnas };
        }
    }

    throw new Error("No se pudo armar una grilla con " + semilla);
}

// ---------- Conexiones: 16 pilotos en 4 grupos ----------

export interface GrupoConexion {
    id: string;
    texto: string;
    /** 0 (más fácil) a 3: elige el color del grupo al resolverlo. */
    dificultad: number;
    cumple: (ficha: FichaPiloto) => boolean;
}

export function gruposPosibles(fichas: readonly FichaPiloto[]): GrupoConexion[] {
    const equipos = [...new Set(fichas.filter((f) => !f.retirado).map((f) => f.equipo))].filter(
        (equipo) => equipo !== "Estructura propia" && fichas.filter((f) => !f.retirado && f.equipo === equipo).length >= 4
    );

    return [
        ...MARCAS.map((marca) => ({ id: "marca-" + marca, texto: "Corren o corrieron con " + marca, dificultad: 0, cumple: (f: FichaPiloto) => f.marca === marca })),
        ...PROVINCIAS.map((provincia) => ({ id: "prov-" + provincia, texto: "Nacidos en " + provincia, dificultad: 1, cumple: (f: FichaPiloto) => f.provincia === provincia })),
        { id: "campeones", texto: "Campeones de TC", dificultad: 1, cumple: (f: FichaPiloto) => f.campeon },
        ...equipos.map((equipo) => ({ id: "equipo-" + equipo, texto: "Corren en " + equipo, dificultad: 2, cumple: (f: FichaPiloto) => !f.retirado && f.equipo === equipo })),
        { id: "un-digito", texto: "Corren con número de un dígito", dificultad: 2, cumple: (f: FichaPiloto) => !f.retirado && f.numero !== null && f.numero < 10 },
        { id: "nacidos-2000", texto: "Nacidos en 2000 o después", dificultad: 3, cumple: (f: FichaPiloto) => f.nacimiento >= 2000 },
        { id: "nacidos-80", texto: "Nacidos en los 80", dificultad: 3, cumple: (f: FichaPiloto) => f.nacimiento >= 1980 && f.nacimiento < 1990 },
        { id: "debut-viejo", texto: "Debutaron antes de 2000", dificultad: 3, cumple: (f: FichaPiloto) => f.debut < 2000 },
    ].filter((grupo) => fichas.filter(grupo.cumple).length >= 4);
}

export interface Conexiones {
    grupos: Array<{ grupo: GrupoConexion; pilotos: number[] }>;
    /** Los 16 ids mezclados, como se muestran al empezar. */
    orden: number[];
}

/** Cuatro grupos de cuatro donde cada piloto encaja en un solo grupo de los cuatro. */
export function generarConexiones(fichas: readonly FichaPiloto[], semilla: string): Conexiones {
    const aleatorio = crearGenerador(crearSemilla(semilla));
    const mezclar = <T,>(lista: readonly T[]) => {
        const copia = [...lista];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(aleatorio() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    };
    const posibles = gruposPosibles(fichas);

    for (let intento = 0; intento < 2000; intento++) {
        // Un grupo de cada dificultad, para que haya uno fácil y uno difícil.
        const grupos = [0, 1, 2, 3].map((nivel) => mezclar(posibles.filter((grupo) => grupo.dificultad === nivel))[0]).filter(Boolean);
        if (grupos.length < 4) {
            continue;
        }

        const usados = new Set<number>();
        const elegidos: Conexiones["grupos"] = [];
        for (const grupo of grupos) {
            const exclusivos = fichas.filter(
                (ficha) => !usados.has(ficha.id) && grupo.cumple(ficha) && grupos.every((otro) => otro === grupo || !otro.cumple(ficha))
            );
            if (exclusivos.length < 4) {
                break;
            }
            const cuatro = mezclar(exclusivos).slice(0, 4).map((ficha) => ficha.id);
            cuatro.forEach((id) => usados.add(id));
            elegidos.push({ grupo, pilotos: cuatro });
        }

        if (elegidos.length === 4) {
            return { grupos: elegidos, orden: mezclar(elegidos.flatMap((item) => item.pilotos)) };
        }
    }

    throw new Error("No se pudieron armar las conexiones con " + semilla);
}

export const MAXIMO_ERRORES_CONEXIONES = 4;

/** Resultado de probar cuatro pilotos: el grupo acertado, "a uno" si tres son del mismo grupo, o nada. */
export function probarConexion(conexiones: Conexiones, seleccion: readonly number[]): { grupo: string | null; aUno: boolean } {
    for (const { grupo, pilotos } of conexiones.grupos) {
        const enGrupo = seleccion.filter((id) => pilotos.includes(id)).length;
        if (enGrupo === 4) {
            return { grupo: grupo.id, aUno: false };
        }
        if (enGrupo === 3) {
            return { grupo: null, aUno: true };
        }
    }
    return { grupo: null, aUno: false };
}
