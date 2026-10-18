/*
 * Esquema de los catálogos. Estos tipos son la documentación de los datos:
 * si un JSON no los cumple, `validar.ts` frena el build y los tests.
 *
 * IMPORTANTE: el piloto, el auto, el circuito y la palabra de cada día salen
 * de mezclar cada catálogo con una semilla que depende de su ORDEN y su
 * CANTIDAD. Sumar, sacar o reordenar elementos cambia lo que sale cada día
 * para todos los jugadores (tests/seleccion-catalogos.test.ts lo avisa).
 * Para sumar uno sin romper nada de lo que ya salió hay que regenerar el
 * fixture a propósito: `node tests/fixtures/generar-seleccion.mjs`.
 */

/** "carrerasGanadas" > "series" > "clasificaciones" > "carrerasCorridas": se usa el primero que tenga sentido. */
export type TipoEstadistica = "carrerasGanadas" | "series" | "clasificaciones" | "carrerasCorridas";

export interface EstadisticaDestacada {
    tipo: TipoEstadistica;
    valor: number;
}

/**
 * Marcas con su logo en public/assets/images/marcas (ver LOGOS_MARCAS en
 * src/lib/pilotos.ts). Los pilotos actuales llevan "(NG)" (Nueva Generación)
 * y usan el logo actual; las leyendas van sin "(NG)" y usan el logo clásico,
 * salvo que su último auto haya sido de la Nueva Generación.
 */
export interface Piloto {
    /** Único y estable: es lo que se guarda en la partida. */
    id: number;
    nombre: string;
    /** También se busca: "pechito" encuentra a José María López. */
    apodo?: string;
    marca: string;
    /** Último equipo; sin equipo formal, "Estructura propia". */
    equipo: string;
    localidad: string;
    provincia: string;
    /** AAAA-MM-DD */
    fechaNacimiento: string;
    /** AAAA-MM-DD. Si falleció, la edad se muestra al morir, con †. */
    fechaFallecimiento?: string;
    campeonTC: boolean;
    anioDebutTC: number;
    /** Leyendas que ya no corren: la pista del número dice "Corría con…". */
    retirado?: boolean;
    /** Foto, relativa a public/assets/images. La miniatura está en pilotos/mini/<nombre>.webp. */
    foto: string;
    /** Pistas extra del modo piloto: null mientras no se cargue el dato (no se muestra la pista). */
    numeroAuto: number | null;
    datoPeculiar: string | null;
    estadisticaDestacada: EstadisticaDestacada | null;
}

/**
 * Un auto sorteable del modo Auto. Para sumar una temporada de un piloto se
 * agrega una entrada con el mismo pilotoId, otro archivo y su año.
 * La etiqueta que fija la selección diaria es `archivo`: no se renombra.
 */
export interface Auto {
    /** Piloto de pilotos.json que hay que adivinar. */
    pilotoId: number;
    /** Imagen dentro de public/assets/images/autos. */
    archivo: string;
    /** Año del diseño de ese auto: habilita la ronda extra del año. */
    anio: number | null;
}

/** Una configuración jugable de un autódromo (las variantes que cambian la silueta van separadas). */
export interface Circuito {
    id: string;
    /** Agrupa las variantes de un mismo autódromo. */
    sedeId: string;
    nombre: string;
    /** "Circuito principal" o el nombre de la variante. */
    variante: string;
    /** Respuestas alternativas que también se aceptan. */
    aliases: string[];
    ciudad: string;
    provincia: string;
    longitud: string;
    participacionTC: string;
    /** SVG dentro de public/assets/images/circuitos. */
    imagen: string;
    fuente: string;
}

/**
 * Palabras del Wordle del TC: solo letras A-Z o Ñ en mayúsculas, sin tildes
 * ni espacios, de 4 a 8 letras, sin repetir. La palabra es su propio id.
 */
export type Palabra = string;

export const LARGO_MINIMO_PALABRA = 4;
export const LARGO_MAXIMO_PALABRA = 8;
