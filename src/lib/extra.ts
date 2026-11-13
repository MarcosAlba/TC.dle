// Lógica de los juegos de "Más juegos" (trayectoria, grilla y conexiones). Todo
// sale de pilotos.json y de las finales de carreras.json; la ficha de cada
// piloto se arma al construir el sitio (así la página no baja las 246 finales)
// y el desafío de cada día se sortea en el navegador con semilla.
import type { Carrera, Piloto } from "../data/tipos";
import { crearGenerador, crearSemilla, obtenerSeleccionDiaria } from "./seleccion-diaria";
import { copaDeOro } from "../data/copa-de-oro";
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
    /** Todas las marcas con las que corrió: la de hoy más las de cada final desde 2010. */
    marcas: string[];
    /** Lugares donde ganó una final desde 2010 ("Rafaela", "Buenos Aires"...). */
    ganoEn: string[];
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

export function construirFichas(pilotos: readonly Piloto[], carreras: readonly Carrera[]): FichaPiloto[] {
    const porId = new Map<number, { victorias: number; temporadas: Map<number, Temporada>; marcas: Set<string>; ganoEn: Set<string> }>();
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
            const datos = porId.get(piloto.id) ?? { victorias: 0, temporadas: new Map(), marcas: new Set(), ganoEn: new Set() };
            datos.marcas.add(limpiarMarca(resultado.marca));
            if (resultado.posicion === 1) {
                datos.victorias++;
                datos.ganoEn.add(LUGAR_CIRCUITO[carrera.circuito] ?? carrera.circuito);
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
            marcas: [...new Set([limpiarMarca(piloto.marca), ...(datos?.marcas ?? [])])],
            ganoEn: [...(datos?.ganoEn ?? [])].sort(),
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
     * Lo que muestra el casillero de la consigna en la grilla: el logo de la marca
     * o un símbolo corto ("SF", "2015+"), y debajo el rótulo en pocas palabras.
     */
    logo?: string;
    simbolo?: string;
    rotulo: string;
    /** Marca, provincia o logro: en la grilla filas y columnas no repiten condición. */
    tipo: "marca" | "provincia" | "logro";
    cumple: (ficha: FichaPiloto) => boolean;
}

const MARCAS = ["Ford", "Chevrolet", "Torino", "Dodge", "Toyota"];
/**
 * Cómo se nombra cada marca en Conexiones: por el auto. Chevrolet va en pasado
 * porque incluye pilotos que dejaron de correr y siguen cargados con el Camaro.
 */
const GRUPOS_MARCA: Record<string, string> = {
    Ford: "Corren con Mustang",
    Chevrolet: "Corrieron con Camaro",
    Torino: "Corren con Torino NG",
    Dodge: "Corren con Dodge Challenger",
    Toyota: "Corren con Toyota",
};
const PROVINCIAS = ["Buenos Aires", "Santa Fe", "Córdoba", "Entre Ríos"];
const SIGLAS_PROVINCIA: Record<string, string> = { "Buenos Aires": "BA", "Santa Fe": "SF", Córdoba: "CBA", "Entre Ríos": "ER" };
/** En Conexiones Buenos Aires no sirve de grupo: son dos de cada tres pilotos. */
const PROVINCIAS_CONEXIONES = PROVINCIAS.filter((provincia) => provincia !== "Buenos Aires");

export const CONDICIONES: readonly Condicion[] = [
    ...MARCAS.map(
        (marca): Condicion => ({
            id: "marca-" + marca,
            texto: "Corre o corrió con " + marca,
            logo: "marcas/" + marca.toLowerCase() + "-logo.jpg",
            rotulo: "Corrió con " + marca,
            tipo: "marca",
            cumple: (f) => f.marcas.includes(marca),
        })
    ),
    ...PROVINCIAS.map(
        (provincia): Condicion => ({
            id: "prov-" + provincia,
            texto: "De " + provincia,
            simbolo: SIGLAS_PROVINCIA[provincia],
            rotulo: "De " + provincia,
            tipo: "provincia",
            cumple: (f) => f.provincia === provincia,
        })
    ),
    { id: "campeon", texto: "Campeón de TC", simbolo: "Nº 1", rotulo: "Campeón de TC", tipo: "logro", cumple: (f) => f.campeon },
    { id: "victorias-5", texto: "Ganó 5 finales o más desde 2010", simbolo: "5+", rotulo: "5 finales ganadas", tipo: "logro", cumple: (f) => f.victorias >= 5 },
    { id: "victoria", texto: "Ganó una final desde 2010", simbolo: "1+", rotulo: "Ganó una final", tipo: "logro", cumple: (f) => f.victorias >= 1 },
    { id: "debut-viejo", texto: "Debutó antes de 2010", simbolo: "-2010", rotulo: "Debut antes de 2010", tipo: "logro", cumple: (f) => f.debut < 2010 },
    { id: "debut-nuevo", texto: "Debutó en 2015 o después", simbolo: "2015+", rotulo: "Debut desde 2015", tipo: "logro", cumple: (f) => f.debut >= 2015 },
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

/** Casilleros (0 a 8, por filas) donde encaja un piloto: cumple su fila y su columna. */
export const casillerosPosibles = (grilla: Grilla, ficha: FichaPiloto) =>
    [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((indice) => grilla.filas[Math.floor(indice / 3)].cumple(ficha) && grilla.columnas[indice % 3].cumple(ficha));

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
    /** 0 (más fácil) a 3: ordena los cuatro grupos del día, y ese orden elige el color. */
    dificultad: number;
    cumple: (ficha: FichaPiloto) => boolean;
}

/** Solo pilotos que corren hoy: una leyenda en blanco y negro entre los actuales delataría su grupo. */
export const pilotosConexiones = (fichas: readonly FichaPiloto[]) => fichas.filter((ficha) => !ficha.retirado);

/**
 * Todos los grupos que pueden salir, con al menos cuatro pilotos actuales cada uno.
 * Son datos que un hincha puede razonar mirando a los pilotos: marca, equipo,
 * provincia, título, Copa de Oro, año de debut y dónde ganaron.
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

    const grupos: GrupoConexion[] = [
        ...MARCAS.map((marca) => ({ id: "marca-" + marca, texto: GRUPOS_MARCA[marca], dificultad: 0, cumple: (f: FichaPiloto) => f.marca === marca })),
        ...PROVINCIAS_CONEXIONES.map((provincia) => ({ id: "prov-" + provincia, texto: "Nacidos en " + provincia, dificultad: 1, cumple: (f: FichaPiloto) => f.provincia === provincia })),
        { id: "campeones", texto: "Campeones de TC", dificultad: 1, cumple: (f: FichaPiloto) => f.campeon },
        ...equipos.map((equipo) => ({ id: "equipo-" + equipo, texto: "Corren en " + equipo, dificultad: 2, cumple: (f: FichaPiloto) => f.equipo === equipo })),
        { id: "copa-de-oro", texto: "Copa de Oro " + copaDeOro.temporada, dificultad: 2, cumple: (f: FichaPiloto) => copaDeOro.pilotos.includes(f.id) },
        ...debuts.map((anio) => ({ id: "debut-" + anio, texto: "Debutaron en el TC en " + anio, dificultad: 3, cumple: (f: FichaPiloto) => f.debut === anio })),
        ...lugares.map((lugar) => ({ id: "gano-" + lugar, texto: "Ganaron una final en " + lugar, dificultad: 3, cumple: (f: FichaPiloto) => f.ganoEn.includes(lugar) })),
    ];
    return grupos.filter((grupo) => fichas.filter(grupo.cumple).length >= 4);
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
    fichas = pilotosConexiones(fichas);

    for (let intento = 0; intento < 4000; intento++) {
        // Cuatro grupos de tipos distintos (nunca dos de marca o dos de circuito),
        // ordenados de más fácil a más difícil: el orden elige el color al resolverlos.
        const grupos: GrupoConexion[] = [];
        for (const grupo of mezclar(posibles)) {
            if (grupos.length < 4 && !grupos.some((otro) => familiaGrupo(otro) === familiaGrupo(grupo))) {
                grupos.push(grupo);
            }
        }
        grupos.sort((a, b) => a.dificultad - b.dificultad);

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

/** "marca", "prov", "equipo", "debut", "gano"...: el tipo de dato del grupo. */
const familiaGrupo = (grupo: GrupoConexion) => grupo.id.split("-")[0];

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
