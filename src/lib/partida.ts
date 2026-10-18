// Partida diaria de un juego: intentos, resultado y guardado en localStorage.
// El formato guardado es el de siempre (versión 2) y está fijado por
// tests/almacenamiento-contrato.test.ts: quien ya jugó no pierde progreso.
import type { Almacenamiento } from "./almacenamiento";
import { obtenerFechaLocal } from "./fechas";
import { registrarResultadoRacha } from "./rachas";

export type IdIntento = number | string;

export type ResultadoIntento = "correcta" | "incorrecta" | "agotada" | "repetida" | "invalida" | "bloqueada";

export interface EstadoPartida<Id extends IdIntento = IdIntento> {
    fecha: string;
    objetivoId: Id | null;
    idsIntentados: Id[];
    intentosUsados: number;
    intentosRestantes: number;
    acerto: boolean;
    terminada: boolean;
    maximoIntentos: number;
}

/** Lo que se guarda y lo que devuelve `migrar`. */
export interface PartidaGuardada<Id extends IdIntento = IdIntento> {
    version?: number;
    fecha: string;
    objetivoId?: Id | null;
    idsIntentados: Id[];
    terminada: boolean;
}

export interface ConfiguracionPartida<Id extends IdIntento> {
    almacenamiento: Almacenamiento;
    clave: string;
    fecha?: string;
    objetivoId: Id | null;
    /** Catálogo cerrado de intentos válidos (piloto, auto, circuito). */
    idsValidos?: readonly Id[];
    /** Alternativa a idsValidos: el Wordle acepta cualquier palabra del largo correcto. */
    validarId?: (id: unknown) => boolean;
    maximoIntentos?: number;
    /** Adapta partidas guardadas con formatos anteriores. */
    migrar?: (datos: Record<string, unknown>, contexto: { fecha: string; objetivoId: Id | null }) => PartidaGuardada<Id> | null;
}

interface ConfiguracionMigracion {
    campoIntentos?: string;
    campoObjetivo?: string;
    objetivoActual: IdIntento | null;
    maximoIntentos: number;
}

/** Pasa partidas guardadas con el formato viejo (sin version) al actual. */
export function migrarPartida(datos: Record<string, any>, configuracion: ConfiguracionMigracion): PartidaGuardada<any> {
    if (datos.version === 2) {
        return datos as PartidaGuardada<any>;
    }

    const idsIntentados: IdIntento[] = datos[configuracion.campoIntentos || "idsIntentados"] || [];
    const objetivoGuardado = configuracion.campoObjetivo ? datos[configuracion.campoObjetivo] : undefined;
    const objetivoId = objetivoGuardado === undefined ? configuracion.objetivoActual : objetivoGuardado;
    const fechaGuardada = String(datos.fecha || "");
    const fechaInterpretada = /^\d{4}-\d{2}-\d{2}$/.test(fechaGuardada) ? null : new Date(fechaGuardada);
    const fecha =
        fechaInterpretada && !Number.isNaN(fechaInterpretada.getTime())
            ? obtenerFechaLocal(fechaInterpretada)
            : fechaGuardada;

    return {
        fecha,
        objetivoId,
        idsIntentados,
        terminada:
            Boolean(datos.terminada) ||
            (configuracion.objetivoActual !== null && idsIntentados.includes(configuracion.objetivoActual)) ||
            Number(datos.cantidadIntentos) >= configuracion.maximoIntentos,
    };
}

export function crearPartidaDiaria<Id extends IdIntento>(configuracion: ConfiguracionPartida<Id>) {
    const { almacenamiento, clave, objetivoId } = configuracion;
    const maximoIntentos = configuracion.maximoIntentos || 8;
    const fecha = configuracion.fecha || obtenerFechaLocal();
    const idsValidos = new Set<IdIntento>(configuracion.idsValidos || []);
    // Por defecto un intento es válido si está en idsValidos (catálogos
    // cerrados). Un modo puede pasar su propia validarId para aceptar intentos
    // que no salen de un catálogo fijo (el Wordle acepta cualquier combinación
    // de letras del largo correcto).
    const validarId = configuracion.validarId ?? ((id: unknown) => idsValidos.has(id as IdIntento));
    let idsIntentados: Id[] = [];
    let terminada = false;

    function estado(): EstadoPartida<Id> {
        return {
            fecha,
            objetivoId,
            idsIntentados: idsIntentados.slice(),
            intentosUsados: idsIntentados.length,
            intentosRestantes: Math.max(0, maximoIntentos - idsIntentados.length),
            acerto: objetivoId !== null && idsIntentados.includes(objetivoId),
            terminada,
            maximoIntentos,
        };
    }

    function guardar(): void {
        almacenamiento.setItem(
            clave,
            JSON.stringify({ version: 2, fecha, objetivoId, idsIntentados, terminada })
        );
    }

    function limpiarGuardado(): void {
        almacenamiento.removeItem(clave);
    }

    function cargar(): EstadoPartida<Id> {
        const contenido = almacenamiento.getItem(clave);
        if (!contenido) {
            return estado();
        }

        try {
            const original = JSON.parse(contenido);
            const partida: PartidaGuardada<Id> | null = configuracion.migrar
                ? configuracion.migrar(original, { fecha, objetivoId })
                : original;

            if (
                !partida ||
                partida.fecha !== fecha ||
                (partida.objetivoId !== undefined && partida.objetivoId !== objetivoId) ||
                !Array.isArray(partida.idsIntentados)
            ) {
                limpiarGuardado();
                return estado();
            }

            idsIntentados = partida.idsIntentados
                .filter((id, indice, lista) => validarId(id) && lista.indexOf(id) === indice)
                .slice(0, maximoIntentos);
            terminada =
                Boolean(partida.terminada) &&
                ((objetivoId !== null && idsIntentados.includes(objetivoId)) || idsIntentados.length >= maximoIntentos);

            if (original.version !== 2) {
                guardar();
            }
            // Partidas terminadas antes de que existieran las rachas.
            if (terminada) {
                registrarResultadoRacha(
                    almacenamiento,
                    clave,
                    fecha,
                    objetivoId !== null && idsIntentados.includes(objetivoId)
                );
            }
        } catch {
            limpiarGuardado();
        }

        return estado();
    }

    function intentar(id: Id): { resultado: ResultadoIntento; estado: EstadoPartida<Id> } {
        if (terminada) {
            return { resultado: "bloqueada", estado: estado() };
        }
        if (!validarId(id)) {
            return { resultado: "invalida", estado: estado() };
        }
        if (idsIntentados.includes(id)) {
            return { resultado: "repetida", estado: estado() };
        }

        idsIntentados.push(id);
        let resultado: ResultadoIntento = "incorrecta";
        if (id === objetivoId) {
            resultado = "correcta";
            terminada = true;
        } else if (idsIntentados.length >= maximoIntentos) {
            resultado = "agotada";
            terminada = true;
        }
        guardar();
        if (terminada) {
            registrarResultadoRacha(almacenamiento, clave, fecha, resultado === "correcta");
        }

        return { resultado, estado: estado() };
    }

    return { cargar, estado, guardar, intentar, limpiarGuardado };
}

export type PartidaDiaria<Id extends IdIntento = IdIntento> = ReturnType<typeof crearPartidaDiaria<Id>>;
