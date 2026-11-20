// Lógica de los juegos de "Más juegos" (trayectoria, grilla y conexiones). Todo
// sale de pilotos.json y de las finales de carreras.json; la ficha de cada
// piloto se arma al construir el sitio (así la página no baja las 246 finales)
// y el desafío de cada día se sortea en el navegador con semilla.
import type { Carrera, Piloto } from "../data/tipos";
import { crearGenerador, crearSemilla, obtenerSeleccionDiaria } from "./seleccion-diaria";
import { copaDeOro } from "../data/copa-de-oro";
import type { Almacenamiento } from "./almacenamiento";
import { buscarPilotoCatalogo } from "./top10";
import type { HistorialPiloto } from "../data/catalogo/historial";

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
    /** Activo en 2026, ex piloto reciente (corrió finales desde 2010) o leyenda (antes de 2010). */
    grupo: "activo" | "ex" | "leyenda";
    nacimiento: number;
    numero: number | null;
    /** Finales ganadas desde 2010 (las que hay en carreras.json). */
    victorias: number;
    /** Victorias en finales de toda su carrera: las de desde 2010 más las de antes, si se conocen. */
    victoriasCarrera: number;
    /** Podios en finales desde 2010, contando las victorias. */
    podios: number;
    /** Finales corridas desde 2010. */
    finales: number;
    /** Año de su primera victoria en el TC, si fue desde 2010 (null si ganó antes o nunca ganó). */
    primeraVictoria: number | null;
    /** Cada número que usó en una final desde 2010 y en cuántas temporadas distintas. */
    numeros: { numero: number; temporadas: number }[];
    /** Primera final de cada año en la que corrió, en orden. */
    temporadas: Temporada[];
    /** Todas las marcas con las que corrió: la de hoy más las de cada final desde 2010. */
    marcas: string[];
    /** Lugares donde ganó una final desde 2010 ("Rafaela", "Buenos Aires"...). */
    ganoEn: string[];
    /** Años en que fue subcampeón del TC. */
    subcampeon: number[];
    /** Títulos en TC Pista, TC Mouras o TC Pista Mouras. */
    escuela: string[];
    /** Años en que clasificó a la Copa de Oro (2008 en adelante, con la de hoy). */
    copaDeOro: number[];
    /** Ids de parientes que también están en el plantel. */
    familia: number[];
    exterior: boolean;
    formula1: boolean;
}

/** "Ford (Mustang)" → "Ford"; unifica cómo escriben la ACTC y pilotos.json algunas marcas. */
export const limpiarMarca = (marca: string) => {
    const base = marca.replace(/\s*\(.*\)\s*$/, "").trim();
    return base === "B M W" ? "BMW" : base === "Mercedez Benz" ? "Mercedes Benz" : base;
};

/** El lugar de cada autódromo de carreras.json, como lo diría un hincha. */
export const LUGAR_CIRCUITO: Record<string, string> = {
    "Rotonda de Mar de Ajó": "Mar de Ajó",
    "Juan Manuel Fangio": "Balcarce",
    "Oscar y Juan Gálvez": "Buenos Aires",
    "Parque Provincia de Neuquén": "Neuquén",
    "Termas de Río Hondo - Largo": "Termas de Río Hondo",
    "Termas de Rio Hondo - Corto": "Termas de Río Hondo",
    "Autódromo Ciudad de Rafaela": "Rafaela",
    Rosamonte: "Posadas",
    "Parque Ciudad de Río Cuarto": "Río Cuarto",
    "Martín Miguel de Güemes- Salta": "Salta",
    "Ciudad de Nueve de Julio": "9 de Julio",
    "Mar y Valle": "Trelew",
    "Hermanos Emiliozzi - Largo": "Olavarría",
    "Ciudad de Paraná - Entre Ríos": "Paraná",
    "Roberto José Mouras - La Plata": "La Plata",
    "Rosendo Hernández- San Luis": "San Luis",
    "Eusebio Marcilla": "Junín",
    "José Muñiz - Santa Cruz": "Río Gallegos",
    "Jorge Angel Pena-San Martin-Mendoza": "San Martín (Mendoza)",
    "Autódromo Pcia. de La Pampa": "Toay",
    "Gral. San Martín": "Comodoro Rivadavia",
    "Concordia - Entre Rios": "Concordia",
    "Concepción del Uruguay -  Entre Rios": "Concepción del Uruguay",
    "Oscar Cabalén Córdoba": "Alta Gracia",
    Viedma: "Viedma",
    "La Pedrera": "San Luis (La Pedrera)",
    "San Juan Villicum 1": "San Juan",
    "San Juan Villicum - 2": "San Juan",
    "Ciudad San Nicolás - Buenos Aires": "San Nicolás",
    "Rosario- Santa Fe": "Rosario",
    "Autódromo Enrique “Quique” Freile": "El Calafate",
};

/**
 * La ficha de cada piloto: las finales desde 2010 (carreras.json) más su historial
 * de fuentes (historial-pilotos.json), que suma lo de antes de 2010 y lo de afuera de las finales.
 */
export function construirFichas(pilotos: readonly Piloto[], carreras: readonly Carrera[], historial: readonly HistorialPiloto[] = []): FichaPiloto[] {
    const porId = new Map<
        number,
        {
            victorias: number;
            podios: number;
            finales: number;
            primeraVictoria: number | null;
            temporadas: Map<number, Temporada>;
            marcas: Set<string>;
            ganoEn: Set<string>;
            numeros: Map<number, Set<number>>;
        }
    >();
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
            const datos = porId.get(piloto.id) ?? {
                victorias: 0,
                podios: 0,
                finales: 0,
                primeraVictoria: null,
                temporadas: new Map(),
                marcas: new Set(),
                ganoEn: new Set(),
                numeros: new Map(),
            };
            datos.finales++;
            datos.marcas.add(limpiarMarca(resultado.marca));
            if (resultado.posicion <= 3) {
                datos.podios++;
            }
            if (resultado.numero > 0) {
                const anios = datos.numeros.get(resultado.numero) ?? new Set<number>();
                anios.add(carrera.anio);
                datos.numeros.set(resultado.numero, anios);
            }
            if (resultado.posicion === 1) {
                datos.primeraVictoria ??= carrera.anio;
                datos.victorias++;
                datos.ganoEn.add(LUGAR_CIRCUITO[carrera.circuito] ?? carrera.circuito);
            }
            if (!datos.temporadas.has(carrera.anio)) {
                datos.temporadas.set(carrera.anio, { anio: carrera.anio, marca: resultado.marca, numero: resultado.numero });
            }
            porId.set(piloto.id, datos);
        }
    }

    const historialDe = new Map(historial.map((h) => [h.id, h]));

    return pilotos.map((piloto) => {
        const datos = porId.get(piloto.id);
        const h = historialDe.get(piloto.id);
        const victorias = datos?.victorias ?? 0;
        const copa = [...(h?.copaDeOro ?? []), ...(copaDeOro.pilotos.includes(piloto.id) ? [copaDeOro.temporada] : [])];
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
            grupo: !piloto.retirado ? "activo" : datos ? "ex" : "leyenda",
            nacimiento: Number(piloto.fechaNacimiento.slice(0, 4)),
            numero: piloto.numeroAuto,
            victorias,
            victoriasCarrera: Math.max(victorias + (h?.victoriasAntes2010 ?? 0), h?.victoriasTotales ?? 0),
            podios: datos?.podios ?? 0,
            finales: datos?.finales ?? 0,
            // Si ya había ganado antes de 2010, su primera victoria no es la primera de carreras.json.
            primeraVictoria: (h?.victoriasAntes2010 ?? 0) > 0 || (h?.victoriasTotales ?? 0) > victorias ? null : (datos?.primeraVictoria ?? null),
            numeros: datos ? [...datos.numeros].map(([numero, anios]) => ({ numero, temporadas: anios.size })).sort((a, b) => a.numero - b.numero) : [],
            temporadas: datos ? [...datos.temporadas.values()].sort((a, b) => a.anio - b.anio) : [],
            marcas: [...new Set([limpiarMarca(piloto.marca), ...(datos?.marcas ?? []), ...(h?.marcas ?? [])])],
            ganoEn: [...(datos?.ganoEn ?? [])].sort(),
            subcampeon: h?.subcampeon ?? [],
            escuela: h?.escuela ?? [],
            copaDeOro: [...new Set(copa)].sort((a, b) => a - b),
            familia: h?.familia ?? [],
            exterior: h?.exterior ?? false,
            formula1: h?.formula1 ?? false,
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
    /**
     * Lo que muestra el casillero de la consigna en la grilla: la insignia de
     * src/assets/grilla (sin el .svg) y debajo el rótulo en pocas palabras. El
     * logo y el símbolo quedan de respaldo si la insignia no está.
     */
    insignia: string;
    logo?: string;
    simbolo?: string;
    rotulo: string;
    /** Marca, provincia o logro: las marcas van solo en filas y las provincias solo en columnas. */
    tipo: "marca" | "provincia" | "logro";
    /** Condiciones del mismo grupo no salen el mismo día (dos debuts, dos autódromos, dos de victorias...). */
    grupo?: string;
    /** 0 fácil, 1 media, 2 difícil: cada grilla lleva como mucho dos difíciles. */
    dificultad: 0 | 1 | 2;
    cumple: (ficha: FichaPiloto) => boolean;
}

const MARCAS = ["Ford", "Chevrolet", "Torino", "Dodge", "Toyota"];
/**
 * Cómo se nombra cada marca en Conexiones: por el auto que usan hoy, porque el
 * grupo mira la marca actual y no las de temporadas anteriores.
 */
const GRUPOS_MARCA: Record<string, string> = {
    Ford: "Corren con Mustang",
    Chevrolet: "Corren con Camaro",
    Torino: "Corren con Torino NG",
    Dodge: "Corren con Dodge Challenger",
    Toyota: "Corren con Toyota",
};
const PROVINCIAS = ["Buenos Aires", "Santa Fe", "Córdoba", "Entre Ríos"];
const SIGLAS_PROVINCIA: Record<string, string> = { "Buenos Aires": "BA", "Santa Fe": "SF", Córdoba: "CBA", "Entre Ríos": "ER" };
const INSIGNIAS_PROVINCIA: Record<string, string> = { "Buenos Aires": "buenos-aires", "Santa Fe": "santa-fe", Córdoba: "cordoba", "Entre Ríos": "entre-rios" };
/** En Conexiones Buenos Aires no sirve de grupo: son dos de cada tres pilotos. */
const PROVINCIAS_CONEXIONES = PROVINCIAS.filter((provincia) => provincia !== "Buenos Aires");

export const PATAGONIA = ["Neuquén", "Río Negro", "Chubut", "Santa Cruz", "Tierra del Fuego"];
export const NORTE = ["Jujuy", "Salta", "Tucumán", "Catamarca", "Santiago del Estero", "La Rioja", "Formosa", "Chaco", "Misiones", "Corrientes"];
const PROVINCIAS_ARGENTINAS = [...PROVINCIAS, ...PATAGONIA, ...NORTE, "Ciudad de Buenos Aires", "Mendoza", "San Juan", "San Luis", "La Pampa"];

/** Autódromos con tantos ganadores como el Gálvez: [lugar en LUGAR_CIRCUITO, insignia, rótulo]. */
const AUTODROMOS: Array<[string, string, string]> = [
    ["Buenos Aires", "galvez", "Ganó en el Gálvez"],
    ["Neuquén", "gano-en-neuquen", "Ganó en Neuquén"],
    ["Rafaela", "gano-en-rafaela", "Ganó en Rafaela"],
    ["San Juan", "gano-en-san-juan", "Ganó en San Juan"],
    ["Termas de Río Hondo", "gano-en-termas", "Ganó en Termas"],
    ["Toay", "gano-en-toay", "Ganó en Toay"],
    ["Paraná", "gano-en-parana", "Ganó en Paraná"],
    ["Posadas", "gano-en-posadas", "Ganó en Posadas"],
    ["Concepción del Uruguay", "gano-en-concepcion", "Ganó en C. del Uruguay"],
    ["La Plata", "gano-en-la-plata", "Ganó en La Plata"],
];

/** Lo que se sabe de sus marcas alcanza para decir "siempre la misma": corrió al menos tres temporadas desde 2010. */
const conHistorial = (f: FichaPiloto) => f.temporadas.length >= 3;

export const CONDICIONES: readonly Condicion[] = [
    // Marcas (solo filas)
    ...MARCAS.map(
        (marca): Condicion => ({
            id: "marca-" + marca,
            texto: "Corre o corrió con " + marca,
            insignia: "marca-" + marca.toLowerCase(),
            logo: "marcas/" + marca.toLowerCase() + "-logo.jpg",
            rotulo: "Corrió con " + marca,
            tipo: "marca",
            dificultad: 0,
            cumple: (f) => f.marcas.includes(marca),
        })
    ),
    {
        id: "tres-marcas",
        texto: "Corrió con 3 marcas o más",
        insignia: "tres-marcas",
        rotulo: "3 marcas o más",
        tipo: "marca",
        grupo: "cantidad-marcas",
        dificultad: 1,
        cumple: (f) => f.marcas.length >= 3,
    },
    {
        id: "misma-marca",
        texto: "Siempre corrió con la misma marca (desde 2010)",
        insignia: "misma-marca",
        rotulo: "Siempre la misma marca",
        tipo: "marca",
        grupo: "cantidad-marcas",
        dificultad: 2,
        cumple: (f) => conHistorial(f) && f.marcas.length === 1,
    },

    // Origen (solo columnas)
    ...PROVINCIAS.map(
        (provincia): Condicion => ({
            id: "prov-" + provincia,
            texto: "De " + provincia,
            insignia: INSIGNIAS_PROVINCIA[provincia],
            simbolo: SIGLAS_PROVINCIA[provincia],
            rotulo: "De " + provincia,
            tipo: "provincia",
            grupo: provincia === "Buenos Aires" ? "bonaerense" : undefined,
            dificultad: provincia === "Buenos Aires" ? 0 : 1,
            cumple: (f) => f.provincia === provincia,
        })
    ),
    {
        id: "no-buenos-aires",
        texto: "No es de la provincia de Buenos Aires",
        insignia: "no-buenos-aires",
        rotulo: "No es de Buenos Aires",
        tipo: "provincia",
        grupo: "bonaerense",
        dificultad: 1,
        cumple: (f) => f.provincia !== "Buenos Aires",
    },
    {
        id: "patagonia",
        texto: "De la Patagonia (Neuquén, Río Negro, Chubut, Santa Cruz o Tierra del Fuego)",
        insignia: "patagonia",
        rotulo: "De la Patagonia",
        tipo: "provincia",
        dificultad: 2,
        cumple: (f) => PATAGONIA.includes(f.provincia),
    },
    {
        id: "norte",
        texto: "Del norte (NOA o NEA: Salta, Tucumán, Chaco, Misiones…)",
        insignia: "norte",
        rotulo: "Del norte",
        tipo: "provincia",
        dificultad: 2,
        cumple: (f) => NORTE.includes(f.provincia),
    },
    {
        id: "extranjero",
        texto: "Nació fuera de Argentina",
        insignia: "extranjero",
        rotulo: "Nació afuera",
        tipo: "provincia",
        dificultad: 2,
        cumple: (f) => !PROVINCIAS_ARGENTINAS.includes(f.provincia),
    },

    // Títulos y victorias (las finales se cuentan desde 2010)
    { id: "campeon", texto: "Campeón de TC", insignia: "campeon", simbolo: "Nº 1", rotulo: "Campeón de TC", tipo: "logro", dificultad: 0, cumple: (f) => f.campeon },
    {
        id: "victoria",
        texto: "Ganó una final de TC",
        insignia: "gano-final",
        simbolo: "1+",
        rotulo: "Ganó una final",
        tipo: "logro",
        grupo: "victorias",
        dificultad: 0,
        cumple: (f) => f.victoriasCarrera >= 1,
    },
    {
        id: "victorias-5",
        texto: "Ganó 5 finales de TC o más",
        insignia: "gano-5",
        simbolo: "5+",
        rotulo: "5 finales ganadas",
        tipo: "logro",
        grupo: "victorias",
        dificultad: 1,
        cumple: (f) => f.victoriasCarrera >= 5,
    },
    {
        id: "victorias-10",
        texto: "Ganó 10 finales de TC o más",
        insignia: "gano-10",
        rotulo: "10 finales ganadas",
        tipo: "logro",
        grupo: "victorias",
        dificultad: 2,
        cumple: (f) => f.victoriasCarrera >= 10,
    },
    {
        id: "podio-sin-ganar",
        texto: "Subió al podio en una final desde 2010 y nunca ganó una final de TC",
        insignia: "podio-sin-ganar",
        rotulo: "Podio sin ganar",
        tipo: "logro",
        grupo: "victorias",
        dificultad: 2,
        cumple: (f) => f.podios > 0 && f.victoriasCarrera === 0,
    },
    ...AUTODROMOS.map(
        ([lugar, insignia, rotulo]): Condicion => ({
            id: insignia === "galvez" ? "gano-en-galvez" : insignia,
            texto: rotulo + " (una final desde 2010)",
            insignia,
            rotulo,
            tipo: "logro",
            grupo: "autodromo",
            dificultad: 1,
            cumple: (f) => f.ganoEn.includes(lugar),
        })
    ),

    // Más allá de las finales (historial de fuentes)
    {
        id: "subcampeon",
        texto: "Fue subcampeón del TC",
        insignia: "subcampeon",
        rotulo: "Subcampeón de TC",
        tipo: "logro",
        grupo: "titulos",
        dificultad: 2,
        cumple: (f) => f.subcampeon.length > 0,
    },
    {
        id: "escuela",
        texto: "Campeón de TC Pista, TC Mouras o TC Pista Mouras",
        insignia: "tc-pista",
        rotulo: "Campeón TC Pista/Mouras",
        tipo: "logro",
        grupo: "titulos",
        dificultad: 2,
        cumple: (f) => f.escuela.length > 0,
    },
    {
        id: "copa-de-oro",
        texto: "Clasificó a la Copa de Oro (desde 2008)",
        insignia: "copa-de-oro",
        rotulo: "Clasificó a Copa de Oro",
        tipo: "logro",
        grupo: "copa",
        dificultad: 1,
        cumple: (f) => f.copaDeOro.length > 0,
    },
    {
        id: "familia",
        texto: "Padre, hijo, hermano, tío o sobrino de otro piloto del juego",
        insignia: "familia",
        rotulo: "Familia de pilotos",
        tipo: "logro",
        grupo: "familia",
        dificultad: 2,
        cumple: (f) => f.familia.length > 0,
    },
    {
        id: "exterior",
        texto: "Corrió fuera de Argentina: Fórmula 1, IndyCar, WTCC, Dakar, 24 Horas de Daytona…",
        insignia: "exterior",
        rotulo: "F1 o el exterior",
        tipo: "logro",
        grupo: "exterior",
        dificultad: 1,
        cumple: (f) => f.exterior,
    },

    // Época
    {
        id: "debut-2000",
        texto: "Debutó en el TC antes de 2000",
        insignia: "debut-2000",
        rotulo: "Debut antes de 2000",
        tipo: "logro",
        grupo: "debut",
        dificultad: 1,
        cumple: (f) => f.debut < 2000,
    },
    {
        id: "debut-viejo",
        texto: "Debutó en el TC antes de 2010",
        insignia: "debut-2010",
        simbolo: "-2010",
        rotulo: "Debut antes de 2010",
        tipo: "logro",
        grupo: "debut",
        dificultad: 0,
        cumple: (f) => f.debut < 2010,
    },
    {
        id: "debut-nuevo",
        texto: "Debutó en el TC en 2015 o después",
        insignia: "debut-2015",
        simbolo: "2015+",
        rotulo: "Debut desde 2015",
        tipo: "logro",
        grupo: "debut",
        dificultad: 0,
        cumple: (f) => f.debut >= 2015,
    },
    {
        id: "debut-2020",
        texto: "Debutó en el TC en 2020 o después",
        insignia: "debut-2020",
        rotulo: "Debut desde 2020",
        tipo: "logro",
        grupo: "debut",
        dificultad: 0,
        cumple: (f) => f.debut >= 2020,
    },
    {
        id: "nacio-2000",
        texto: "Nació en el año 2000 o después",
        insignia: "nacio-2000",
        rotulo: "Nació desde 2000",
        tipo: "logro",
        grupo: "nacimiento",
        dificultad: 1,
        cumple: (f) => f.nacimiento >= 2000,
    },

    // Números (los de las finales desde 2010)
    {
        id: "numero-1",
        texto: "Usó el número 1 en una final desde 2010",
        insignia: "numero-1",
        rotulo: "Usó el número 1",
        tipo: "logro",
        grupo: "numero",
        dificultad: 1,
        cumple: (f) => f.numeros.some((n) => n.numero === 1),
    },
    {
        id: "un-digito",
        texto: "Usó un número del 2 al 9 en una final desde 2010",
        insignia: "un-digito",
        rotulo: "Número de un dígito",
        tipo: "logro",
        grupo: "numero",
        dificultad: 1,
        cumple: (f) => f.numeros.some((n) => n.numero >= 2 && n.numero <= 9),
    },
    {
        id: "mismo-numero",
        texto: "Usó el mismo número en 5 temporadas o más desde 2010",
        insignia: "mismo-numero",
        rotulo: "Mismo número 5 años",
        tipo: "logro",
        grupo: "numero",
        dificultad: 2,
        cumple: (f) => f.numeros.some((n) => n.temporadas >= 5),
    },
];

export interface Grilla {
    filas: Condicion[];
    columnas: Condicion[];
}

/** Tiempo de la grilla, elegido en la introducción: sin límite o 30, 60 o 120 segundos. */
export const TIEMPOS_GRILLA = [null, 30, 60, 120] as const;
export type TiempoGrilla = (typeof TIEMPOS_GRILLA)[number];
export const CLAVE_TIEMPO_GRILLA = "tcdleGrillaTiempo";
/** Lo dispara la introducción al tocar "Empezar", con los segundos (o null) en `detail`. */
export const EVENTO_TIEMPO_GRILLA = "tcdle:grilla-tiempo";

/** Lo que se lee del almacenamiento: solo vale si es uno de los tiempos ofrecidos. */
export function normalizarTiempoGrilla(valor: unknown): TiempoGrilla {
    return TIEMPOS_GRILLA.includes(valor as TiempoGrilla) ? (valor as TiempoGrilla) : null;
}

// ---------- Dificultad de la Grilla y Conexiones ----------

/** Se elige en la introducción y vale todo el día: cada dificultad tiene su propio desafío. */
export const DIFICULTADES = ["facil", "normal", "dificil"] as const;
export type Dificultad = (typeof DIFICULTADES)[number];
export const CLAVE_DIFICULTAD_GRILLA = "tcdleGrillaDificultad";
export const CLAVE_DIFICULTAD_CONEXIONES = "tcdleConexionesDificultad";
/** Lo dispara la introducción de Conexiones al tocar "Empezar", con la dificultad en `detail`. */
export const EVENTO_DIFICULTAD_CONEXIONES = "tcdle:conexiones-dificultad";
export const NOMBRES_DIFICULTAD: Record<Dificultad, string> = { facil: "Fácil", normal: "Normal", dificil: "Difícil" };

export function normalizarDificultad(valor: unknown): Dificultad {
    return DIFICULTADES.includes(valor as Dificultad) ? (valor as Dificultad) : "normal";
}

/** La última dificultad elegida en la introducción (la guarda su script al tocar "Empezar"). */
export function leerDificultadGuardada(almacenamiento: Pick<Almacenamiento, "getItem">, clave: string): Dificultad {
    try {
        return normalizarDificultad(almacenamiento.getItem(clave));
    } catch {
        return "normal";
    }
}

/** Semilla del desafío del día: la normal es la de siempre, así no cambia lo que ya salió. */
export const semillaDelDia = (juego: string, fecha: string, dificultad: Dificultad) =>
    dificultad === "normal" ? juego + ":" + fecha : juego + ":" + fecha + ":" + dificultad;

/**
 * Qué consignas entran en cada dificultad de la Grilla. Fácil: solo fáciles y
 * medias, con muchas respuestas por casillero. Difícil: al menos dos difíciles,
 * como mucho una fácil y casilleros con pocas respuestas.
 */
const REGLAS_GRILLA: Record<Dificultad, { nivelMaximo: number; dificiles: [number, number]; facilesMaximo: number; minimoRespuestas: number }> = {
    facil: { nivelMaximo: 1, dificiles: [0, 0], facilesMaximo: 6, minimoRespuestas: 4 },
    normal: { nivelMaximo: 2, dificiles: [0, 2], facilesMaximo: 6, minimoRespuestas: 2 },
    dificil: { nivelMaximo: 2, dificiles: [2, 4], facilesMaximo: 1, minimoRespuestas: 2 },
};

/** Casilleros (0 a 8, por filas) donde encaja un piloto: cumple su fila y su columna. */
export const casillerosPosibles = (grilla: Grilla, ficha: FichaPiloto) =>
    [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((indice) => grilla.filas[Math.floor(indice / 3)].cumple(ficha) && grilla.columnas[indice % 3].cumple(ficha));

/** Pilotos que valen en un casillero. */
export const respuestasCasillero = (fichas: readonly FichaPiloto[], fila: Condicion, columna: Condicion) =>
    fichas.filter((ficha) => fila.cumple(ficha) && columna.cumple(ficha));

/**
 * Un piloto distinto para cada casillero de `casilleros` (emparejamiento por
 * caminos de aumento), sin usar los de `excluir`; null si no alcanza. Devuelve
 * el id elegido para cada casillero pedido.
 */
export function resolverGrilla(
    fichas: readonly FichaPiloto[],
    grilla: Grilla,
    casilleros: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8],
    excluir: ReadonlySet<number> = new Set()
): Map<number, number> | null {
    const opciones = new Map(
        casilleros.map((indice) => [
            indice,
            respuestasCasillero(fichas, grilla.filas[Math.floor(indice / 3)], grilla.columnas[indice % 3])
                .map((ficha) => ficha.id)
                .filter((id) => !excluir.has(id)),
        ])
    );
    const casilleroDe = new Map<number, number>();
    const asignar = (casillero: number, vistos: Set<number>): boolean => {
        for (const id of opciones.get(casillero)!) {
            if (vistos.has(id)) {
                continue;
            }
            vistos.add(id);
            const otro = casilleroDe.get(id);
            if (otro === undefined || asignar(otro, vistos)) {
                casilleroDe.set(id, casillero);
                return true;
            }
        }
        return false;
    };
    for (const casillero of casilleros) {
        if (!asignar(casillero, new Set())) {
            return null;
        }
    }
    return new Map([...casilleroDe].map(([id, casillero]) => [casillero, id]));
}

/**
 * Grilla del día: filas de marcas y logros, columnas de provincias y logros, sin
 * repetir condición ni grupo, con la cantidad de consignas difíciles y de
 * respuestas por casillero de su dificultad, y siempre completable con nueve
 * pilotos distintos.
 */
export function generarGrilla(fichas: readonly FichaPiloto[], semilla: string, dificultad: Dificultad = "normal"): Grilla {
    const reglas = REGLAS_GRILLA[dificultad];
    const aleatorio = crearGenerador(crearSemilla(semilla));
    const elegir = <T,>(lista: readonly T[], cantidad: number) => {
        const copia = [...lista];
        const elegidos: T[] = [];
        while (elegidos.length < cantidad && copia.length > 0) {
            elegidos.push(copia.splice(Math.floor(aleatorio() * copia.length), 1)[0]);
        }
        return elegidos;
    };
    const disponibles = CONDICIONES.filter((condicion) => condicion.dificultad <= reglas.nivelMaximo);
    const paraFilas = disponibles.filter((condicion) => condicion.tipo !== "provincia");
    const paraColumnas = disponibles.filter((condicion) => condicion.tipo !== "marca");
    const repiteGrupo = (elegidas: Condicion[]) => {
        const grupos = elegidas.map((condicion) => condicion.grupo).filter(Boolean);
        return new Set(grupos).size !== grupos.length;
    };
    const [minimoDificiles, maximoDificiles] = reglas.dificiles;

    for (let intento = 0; intento < 8000; intento++) {
        const filas = elegir(paraFilas, 3);
        const columnas = elegir(
            paraColumnas.filter((condicion) => !filas.includes(condicion)),
            3
        );
        const todas = [...filas, ...columnas];
        const dificiles = todas.filter((condicion) => condicion.dificultad === 2).length;
        const faciles = todas.filter((condicion) => condicion.dificultad === 0).length;
        if (repiteGrupo(todas) || dificiles < minimoDificiles || dificiles > maximoDificiles || faciles > reglas.facilesMaximo) {
            continue;
        }
        const grilla = { filas, columnas };
        const alcanza = filas.every((fila) => columnas.every((columna) => respuestasCasillero(fichas, fila, columna).length >= reglas.minimoRespuestas));
        if (alcanza && resolverGrilla(fichas, grilla)) {
            return grilla;
        }
    }

    throw new Error("No se pudo armar una grilla con " + semilla);
}

// ---------- Conexiones: 16 pilotos en 4 grupos ----------

export interface GrupoConexion {
    id: string;
    texto: string;
    /** 0 (más fácil) a 3: ordena los cuatro grupos del día, y ese orden elige el color. */
    dificultad: number;
    /** El grupo de leyendas sale de las leyendas; todos los demás, de los pilotos que corren hoy. */
    soloLeyendas?: boolean;
    cumple: (ficha: FichaPiloto) => boolean;
}

/** Solo pilotos que corren hoy: una leyenda en blanco y negro entre los actuales delataría su grupo. */
export const pilotosConexiones = (fichas: readonly FichaPiloto[]) => fichas.filter((ficha) => !ficha.retirado);
/** Las leyendas (antes de 2010) solo salen juntas, en su propio grupo. */
const leyendasConexiones = (fichas: readonly FichaPiloto[]) => fichas.filter((ficha) => ficha.grupo === "leyenda");
/** De dónde salen los cuatro pilotos de un grupo. */
export const candidatosGrupo = (grupo: GrupoConexion, fichas: readonly FichaPiloto[]) =>
    grupo.soloLeyendas ? leyendasConexiones(fichas) : pilotosConexiones(fichas);

/** "Nicolas" y "Nicolás" son el mismo nombre de pila. */
const nombreDePila = (ficha: FichaPiloto) =>
    ficha.nombre
        .split(" ")[0]
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
/** Cómo se muestra un nombre de pila: con tilde si alguno de los pilotos lo escribe así ("Nicolás"). */
const nombreParaMostrar = (fichas: readonly FichaPiloto[], nombre: string) =>
    fichas
        .filter((ficha) => nombreDePila(ficha) === nombre)
        .map((ficha) => ficha.nombre.split(" ")[0])
        .sort((a, b) => b.length - a.length || b.localeCompare(a))
        .find((escrito) => escrito !== nombre) ?? nombre;
const MINIMO_FINALES_SIN_GANAR = 100;

/**
 * Todos los grupos que pueden salir, con al menos cuatro pilotos cada uno. Son
 * datos que un hincha puede razonar mirando a los pilotos, de los más obvios
 * (marca, campeones) a los más rebuscados (nombre de pila, año de nacimiento).
 */
export function gruposPosibles(todas: readonly FichaPiloto[]): GrupoConexion[] {
    const fichas = pilotosConexiones(todas);
    const conAlMenosCuatro = <T,>(valores: T[], cumple: (ficha: FichaPiloto, valor: T) => boolean) =>
        [...new Set(valores)].filter((valor) => fichas.filter((ficha) => cumple(ficha, valor)).length >= 4).sort();

    const equipos = conAlMenosCuatro(
        fichas.map((f) => f.equipo).filter((equipo) => equipo !== "Estructura propia"),
        (f, equipo) => f.equipo === equipo
    );
    const debuts = conAlMenosCuatro(fichas.map((f) => f.debut), (f, anio) => f.debut === anio);
    const lugares = conAlMenosCuatro(fichas.flatMap((f) => f.ganoEn), (f, lugar) => f.ganoEn.includes(lugar));
    const primeras = conAlMenosCuatro(
        fichas.map((f) => f.primeraVictoria).filter((anio): anio is number => anio !== null),
        (f, anio) => f.primeraVictoria === anio
    );
    const numeros = conAlMenosCuatro(
        fichas.flatMap((f) => f.numeros.map((n) => n.numero)).filter((numero) => numero > 1),
        (f, numero) => f.numeros.some((n) => n.numero === numero)
    );
    const nombres = conAlMenosCuatro(fichas.map(nombreDePila), (f, nombre) => nombreDePila(f) === nombre);
    const nacimientos = conAlMenosCuatro(fichas.map((f) => f.nacimiento), (f, anio) => f.nacimiento === anio);
    const temporadaActual = Math.max(...fichas.map((f) => f.debut));

    const grupos: GrupoConexion[] = [
        // Fáciles (amarillo)
        ...MARCAS.map((marca) => ({ id: "marca-" + marca, texto: GRUPOS_MARCA[marca], dificultad: 0, cumple: (f: FichaPiloto) => f.marca === marca })),
        { id: "campeones", texto: "Campeones de TC", dificultad: 0, cumple: (f: FichaPiloto) => f.campeon },
        {
            id: "leyendas",
            texto: "Leyendas del TC (corrieron antes de 2010)",
            dificultad: 0,
            soloLeyendas: true,
            cumple: (f: FichaPiloto) => f.grupo === "leyenda",
        },
        // Medias (verde)
        ...PROVINCIAS_CONEXIONES.map((provincia) => ({
            id: "prov-" + provincia,
            texto: "Nacidos en " + provincia,
            dificultad: 1,
            cumple: (f: FichaPiloto) => f.provincia === provincia,
        })),
        ...equipos.map((equipo) => ({ id: "equipo-" + equipo, texto: "Corren en " + equipo, dificultad: 1, cumple: (f: FichaPiloto) => f.equipo === equipo })),
        { id: "familia", texto: "Tienen un pariente que también corrió el TC", dificultad: 1, cumple: (f: FichaPiloto) => f.familia.length > 0 },
        { id: "exterior", texto: "Corrieron fuera de Argentina (F1, IndyCar, WTCC, Dakar…)", dificultad: 1, cumple: (f: FichaPiloto) => f.exterior },
        // Difíciles (azul); los debutantes del año van con los fáciles.
        ...debuts.map((anio) =>
            anio === temporadaActual
                ? { id: "debut-" + anio, texto: "Debutantes " + anio, dificultad: 0, cumple: (f: FichaPiloto) => f.debut === anio }
                : { id: "debut-" + anio, texto: "Debutaron en el TC en " + anio, dificultad: 2, cumple: (f: FichaPiloto) => f.debut === anio }
        ),
        ...lugares.map((lugar) => ({
            id: "gano-" + lugar,
            texto: "Ganaron una final " + (lugar === "Buenos Aires" ? "en el Gálvez" : "en " + lugar) + " (desde 2010)",
            dificultad: 2,
            cumple: (f: FichaPiloto) => f.ganoEn.includes(lugar),
        })),
        { id: "uno", texto: "Usaron el número 1 (desde 2010)", dificultad: 2, cumple: (f: FichaPiloto) => f.numeros.some((n) => n.numero === 1) },
        { id: "marcas", texto: "Corrieron con 4 marcas distintas o más", dificultad: 2, cumple: (f: FichaPiloto) => f.marcas.length >= 4 },
        // Muy difíciles (violeta)
        ...primeras.map((anio) => ({
            id: "primera-" + anio,
            texto: "Ganaron su primera final en " + anio,
            dificultad: 3,
            cumple: (f: FichaPiloto) => f.primeraVictoria === anio,
        })),
        ...numeros.map((numero) => ({
            id: "numero-" + numero,
            texto: "Usaron el número " + numero + " (desde 2010)",
            dificultad: 3,
            cumple: (f: FichaPiloto) => f.numeros.some((n) => n.numero === numero),
        })),
        {
            id: "sin-ganar",
            texto: "Corrieron más de " + MINIMO_FINALES_SIN_GANAR + " finales y nunca ganaron",
            dificultad: 3,
            cumple: (f: FichaPiloto) => f.finales > MINIMO_FINALES_SIN_GANAR && f.victoriasCarrera === 0,
        },
        ...nombres.map((nombre) => ({ id: "nombre-" + nombre, texto: "Se llaman " + nombreParaMostrar(fichas, nombre), dificultad: 3, cumple: (f: FichaPiloto) => nombreDePila(f) === nombre })),
        ...nacimientos.map((anio) => ({ id: "nacio-" + anio, texto: "Nacieron en " + anio, dificultad: 3, cumple: (f: FichaPiloto) => f.nacimiento === anio })),
    ];
    return grupos.filter((grupo) => candidatosGrupo(grupo, todas).filter(grupo.cumple).length >= 4);
}

export interface Conexiones {
    grupos: Array<{ grupo: GrupoConexion; pilotos: number[] }>;
    /** Los 16 ids mezclados, como se muestran al empezar. */
    orden: number[];
}

/** Cuatro grupos de cuatro donde cada piloto encaja en un solo grupo de los cuatro. */
export function generarConexiones(fichas: readonly FichaPiloto[], semilla: string, dificultad: Dificultad = "normal"): Conexiones {
    const aleatorio = crearGenerador(crearSemilla(semilla));
    const mezclar = <T,>(lista: readonly T[]) => {
        const copia = [...lista];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(aleatorio() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    };
    // Fácil: sin los grupos más rebuscados (violeta). Difícil: sin los obvios (marca, campeones…).
    const posibles = gruposPosibles(fichas).filter((grupo) =>
        dificultad === "facil" ? grupo.dificultad <= 2 : dificultad === "dificil" ? grupo.dificultad >= 1 : true
    );
    // Por tipo de grupo: así "Usaron el número X", que son muchos, no salen casi todos los días.
    const porFamilia = new Map<string, GrupoConexion[]>();
    for (const grupo of posibles) {
        porFamilia.set(familiaGrupo(grupo), [...(porFamilia.get(familiaGrupo(grupo)) ?? []), grupo]);
    }
    const familias = [...porFamilia.values()];

    for (let intento = 0; intento < 4000; intento++) {
        // Cuatro tipos distintos (nunca dos de marca o dos de circuito) y un grupo de
        // cada uno, ordenados de más fácil a más difícil: el orden elige el color al resolverlos.
        const grupos = mezclar(familias)
            .slice(0, 4)
            .map((familia) => familia[Math.floor(aleatorio() * familia.length)]);
        grupos.sort((a, b) => a.dificultad - b.dificultad);
        // Difícil: al menos dos grupos de los más rebuscados.
        if (dificultad === "dificil" && grupos.filter((grupo) => grupo.dificultad === 3).length < 2) {
            continue;
        }

        const usados = new Set<number>();
        const elegidos: Conexiones["grupos"] = [];
        for (const grupo of grupos) {
            const exclusivos = candidatosGrupo(grupo, fichas).filter(
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

/** "marca", "prov", "equipo", "debut", "gano"...: el tipo de dato del grupo. */
const familiaGrupo = (grupo: GrupoConexion) => grupo.id.split("-")[0];

export const MAXIMO_ERRORES_CONEXIONES = 4;
/** Errores permitidos según la dificultad: uno más en fácil, uno menos en difícil. */
export const ERRORES_CONEXIONES: Record<Dificultad, number> = { facil: 5, normal: MAXIMO_ERRORES_CONEXIONES, dificil: 3 };

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
