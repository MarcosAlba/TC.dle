// Los avisos de error del buscador, con la misma voz en todos los juegos: solo
// cambia el sustantivo ("piloto", "circuito").

export interface MensajesBusqueda {
    /** El campo está vacío. */
    vacio: string;
    /** Lo escrito no coincide con nada de la lista. */
    noEncontrado: string;
    /** Ya se probó con ese. */
    repetido: string;
}

export function mensajesDeBusqueda(sustantivo: string): MensajesBusqueda {
    return {
        vacio: "Escribí o elegí un " + sustantivo + ".",
        noEncontrado: "Ese " + sustantivo + " no está en la lista.",
        repetido: "Ya probaste con ese " + sustantivo + ".",
    };
}
