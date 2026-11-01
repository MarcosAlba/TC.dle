// Atajos de teclado de las páginas de juego (en PC). La decisión de qué hace
// cada tecla es pura para poder probarla; el script del encabezado la ejecuta.
import { JUEGOS, type JuegoId } from "./juegos";

export type AccionAtajo =
    | { tipo: "buscar" }
    | { tipo: "ayuda" }
    | { tipo: "copiar" }
    | { tipo: "ir"; juego: JuegoId };

export interface TeclaAtajo {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    /** La tecla se apretó escribiendo en un campo de texto. */
    escribiendo: boolean;
}

/** null si la tecla no es un atajo (o si se está escribiendo: ahí cada letra es del campo). */
export function accionDeTecla(tecla: TeclaAtajo): AccionAtajo | null {
    if (tecla.ctrlKey || tecla.metaKey || tecla.altKey || tecla.escribiendo) {
        return null;
    }

    if (tecla.key === "/") {
        return { tipo: "buscar" };
    }
    if (tecla.key === "?") {
        return { tipo: "ayuda" };
    }
    if (tecla.key === "c" || tecla.key === "C") {
        return { tipo: "copiar" };
    }

    const numero = Number(tecla.key);
    if (Number.isInteger(numero) && numero >= 1 && numero <= JUEGOS.length) {
        return { tipo: "ir", juego: JUEGOS[numero - 1].id };
    }

    return null;
}
