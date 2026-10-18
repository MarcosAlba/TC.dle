/** Lo mínimo que se usa de localStorage: así los tests pasan uno en memoria. */
export interface Almacenamiento {
    getItem(clave: string): string | null;
    setItem(clave: string, valor: string): void;
    removeItem(clave: string): void;
}

export function crearAlmacenamientoEnMemoria(): Almacenamiento & { datos: Map<string, string> } {
    const datos = new Map<string, string>();

    return {
        datos,
        getItem: (clave) => datos.get(clave) ?? null,
        setItem: (clave, valor) => void datos.set(clave, valor),
        removeItem: (clave) => void datos.delete(clave),
    };
}

let respaldo: Almacenamiento | undefined;

/**
 * localStorage del navegador. Si el acceso falla (cookies bloqueadas, algunos
 * modos privados) se juega igual con un almacenamiento en memoria: el
 * progreso dura hasta recargar la página en vez de romper el juego.
 */
export function obtenerAlmacenamiento(): Almacenamiento {
    try {
        const local = globalThis.localStorage;
        local.getItem("tcdle:prueba");
        return local;
    } catch {
        respaldo ??= crearAlmacenamientoEnMemoria();
        return respaldo;
    }
}

/** Lee un JSON guardado; null si no existe, está corrupto o no hay acceso. */
export function leerJson<T = unknown>(almacenamiento: Almacenamiento, clave: string): T | null {
    try {
        const contenido = almacenamiento.getItem(clave);
        return contenido ? (JSON.parse(contenido) as T) : null;
    } catch {
        return null;
    }
}
