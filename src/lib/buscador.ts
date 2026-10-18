// Búsqueda del buscador de pilotos y circuitos, sin DOM.
import { normalizarTexto } from "./texto";

export interface ConfiguracionBusqueda<T> {
    elementos: readonly T[];
    obtenerEtiqueta: (elemento: T) => string;
    /** Texto donde se busca; por defecto la etiqueta. */
    obtenerTextoBusqueda?: (elemento: T) => string;
    /** Texto corto (el apellido): con una sola letra se mira solo este. */
    obtenerTextoCorto?: (elemento: T) => string;
    /** Textos que valen como respuesta exacta; por defecto la etiqueta. */
    obtenerValoresExactos?: (elemento: T) => string[];
    estaExcluido?: (elemento: T) => boolean;
    minimoCaracteres?: number;
    limite?: number;
}

export function obtenerMinimoCaracteres<T>(configuracion: ConfiguracionBusqueda<T>): number {
    return configuracion.minimoCaracteres === undefined ? 2 : configuracion.minimoCaracteres;
}

/**
 * Coincide cuando cada palabra de la consulta arranca alguna palabra del texto:
 * "al" encuentra "Alvarez" pero no "Gonzalez", y "roberto mou" sigue
 * encontrando "Autodromo Roberto Mouras".
 */
export function coincidePorPrefijo(texto: string, consultaNormalizada: string): boolean {
    const palabras = normalizarTexto(texto).split(" ");

    return consultaNormalizada.split(" ").every((termino) => palabras.some((palabra) => palabra.startsWith(termino)));
}

export function buscarElementos<T>(configuracion: ConfiguracionBusqueda<T>, consulta: string): T[] {
    const consultaNormalizada = normalizarTexto(consulta);

    if (consultaNormalizada.length < obtenerMinimoCaracteres(configuracion)) {
        return [];
    }

    const { obtenerEtiqueta, obtenerTextoCorto } = configuracion;
    const obtenerTextoBusqueda = configuracion.obtenerTextoBusqueda ?? obtenerEtiqueta;
    const estaExcluido = configuracion.estaExcluido ?? (() => false);
    const limite = configuracion.limite || 8;
    // Con una sola letra solo miramos el texto corto (el apellido del piloto),
    // para que "a" traiga a Alvarez y no a Agustin Canapino.
    const soloTextoCorto = Boolean(obtenerTextoCorto) && consultaNormalizada.length === 1;

    function coincideTextoCorto(elemento: T): boolean {
        return Boolean(obtenerTextoCorto) && coincidePorPrefijo(obtenerTextoCorto!(elemento), consultaNormalizada);
    }

    return configuracion.elementos
        .filter((elemento) => {
            if (estaExcluido(elemento)) {
                return false;
            }

            return soloTextoCorto
                ? coincideTextoCorto(elemento)
                : coincidePorPrefijo(obtenerTextoBusqueda(elemento), consultaNormalizada);
        })
        .sort((a, b) => {
            const etiquetaA = normalizarTexto(obtenerEtiqueta(a));
            const etiquetaB = normalizarTexto(obtenerEtiqueta(b));
            const cortoA = coincideTextoCorto(a) ? 0 : 1;
            const cortoB = coincideTextoCorto(b) ? 0 : 1;
            const empiezaA = etiquetaA.startsWith(consultaNormalizada) ? 0 : 1;
            const empiezaB = etiquetaB.startsWith(consultaNormalizada) ? 0 : 1;

            return cortoA - cortoB || empiezaA - empiezaB || etiquetaA.localeCompare(etiquetaB, "es");
        })
        .slice(0, limite);
}

export interface ResolucionEntrada<T> {
    elemento: T | null;
    /** Hay más de una coincidencia exacta (un autódromo con varios trazados). */
    ambiguo: boolean;
}

/**
 * Qué elemento quiso mandar el jugador: el que eligió de la lista si el texto
 * sigue igual, el único que coincide exacto, o la primera sugerencia a la
 * vista, así Enter y el botón Intentar mandan lo que se está viendo.
 */
export function resolverEntrada<T>(
    configuracion: ConfiguracionBusqueda<T>,
    entrada: string,
    seleccionado: T | null,
    sugerencias: readonly T[]
): ResolucionEntrada<T> {
    const texto = normalizarTexto(entrada);
    const obtenerValoresExactos =
        configuracion.obtenerValoresExactos ?? ((elemento: T) => [configuracion.obtenerEtiqueta(elemento)]);

    if (seleccionado && normalizarTexto(configuracion.obtenerEtiqueta(seleccionado)) === texto) {
        return { elemento: seleccionado, ambiguo: false };
    }

    const coincidencias = configuracion.elementos.filter((elemento) =>
        obtenerValoresExactos(elemento).map(normalizarTexto).includes(texto)
    );

    if (coincidencias.length > 0) {
        return {
            elemento: coincidencias.length === 1 ? coincidencias[0] : null,
            ambiguo: coincidencias.length > 1,
        };
    }

    return { elemento: sugerencias[0] ?? null, ambiguo: false };
}
