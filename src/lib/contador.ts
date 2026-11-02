// Contador global (api/contador.js): suma cada partida terminada hoy y lee
// cuánta gente jugó y ganó. Si la función no está (npm run dev) o no tiene la
// base configurada, todo falla en silencio y el sitio sigue igual.
import type { JuegoId } from "./juegos";
import { ruta } from "./rutas";

export interface ConteoJuego {
    jugaron: number;
    ganaron: number;
}

const URL_CONTADOR = () => ruta("api/contador");

export function sumarPartida(juego: JuegoId, fecha: string, gano: boolean): Promise<void> {
    return fetch(URL_CONTADOR(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ juego, fecha, gano }),
        keepalive: true,
    })
        .then(() => undefined)
        .catch(() => undefined);
}

export async function leerConteo(fecha: string): Promise<Partial<Record<JuegoId, ConteoJuego>> | null> {
    try {
        const respuesta = await fetch(URL_CONTADOR() + "?fecha=" + fecha);
        return respuesta.ok ? await respuesta.json() : null;
    } catch {
        return null;
    }
}

/** "1.284 terminaron hoy · 61 % lo sacó"; null si todavía no hay datos. */
export function describirConteo(conteo: ConteoJuego | undefined): string | null {
    if (!conteo || conteo.jugaron < 1) {
        return null;
    }

    const porcentaje = Math.round((100 * conteo.ganaron) / conteo.jugaron);
    const personas = conteo.jugaron === 1 ? "1 persona lo terminó hoy" : conteo.jugaron.toLocaleString("es-AR") + " lo terminaron hoy";
    return personas + " · " + porcentaje + " % lo sacó";
}
