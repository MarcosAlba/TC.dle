// Contador global: cuánta gente terminó cada juego hoy y cuánta lo sacó.
// Función de Vercel (carpeta /api, aparte del sitio de Astro). Guarda en Upstash
// Redis por su API REST, sin dependencias: se conecta desde el Marketplace de
// Vercel, que carga KV_REST_API_URL y KV_REST_API_TOKEN. Sin esas variables
// responde 503 y el sitio simplemente no muestra los números.
//
// POST /api/contador  { juego, fecha, gano }  suma una partida terminada.
// GET  /api/contador?fecha=AAAA-MM-DD          { piloto: { jugaron, ganaron }, ... }
//
// Para que no se puedan inflar los números con un script: el POST solo se acepta
// desde el propio sitio (cabecera Origin) y cada conexión suma como mucho
// LIMITE_POR_DIA partidas por día. La IP no se guarda: se usa una huella que
// cambia cada día y vence sola.
import { createHash } from "node:crypto";

const JUEGOS = ["piloto", "auto", "circuito", "wordle", "top10", "trayectoria", "grilla", "conexiones"];
const DIAS_GUARDADOS = 40 * 24 * 60 * 60;
// Ocho juegos por persona y margen para varias personas detrás de la misma conexión (una casa, un trabajo).
export const LIMITE_POR_DIA = 40;
const UN_DIA = 24 * 60 * 60;

/** El sitio publicado, sus versiones de prueba en Vercel y el servidor local. */
function origenPermitido(origen) {
    try {
        const { hostname } = new URL(origen);
        return (
            hostname === "tc-dle.vercel.app" ||
            hostname === process.env.VERCEL_URL ||
            hostname === process.env.VERCEL_BRANCH_URL ||
            hostname === "localhost" ||
            hostname === "127.0.0.1"
        );
    } catch {
        return false;
    }
}

/** Huella de la conexión para el límite diario: no permite recuperar la IP y cambia con la fecha. */
function huella(req, fecha) {
    const encabezados = req.headers ?? {};
    const ip = String(encabezados["x-real-ip"] ?? encabezados["x-forwarded-for"] ?? "").split(",")[0].trim() || "desconocida";
    return createHash("sha256").update(fecha + ":" + ip).digest("hex").slice(0, 16);
}

/** Fecha de hoy en Argentina: el único día que se puede sumar (más ayer, por quien juega pasada la medianoche). */
function fechasValidas() {
    const ahora = Date.now();
    const formato = (ms) => new Date(ms - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return [formato(ahora), formato(ahora - 24 * 60 * 60 * 1000)];
}

async function redis(comandos) {
    const respuesta = await fetch(process.env.KV_REST_API_URL + "/pipeline", {
        method: "POST",
        headers: { Authorization: "Bearer " + process.env.KV_REST_API_TOKEN },
        body: JSON.stringify(comandos),
    });
    if (!respuesta.ok) {
        throw new Error("Redis respondió " + respuesta.status);
    }
    return (await respuesta.json()).map((item) => item.result);
}

const clave = (fecha, juego, campo) => `tcdle:${fecha}:${juego}:${campo}`;

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        res.status(503).json({ error: "Contador sin configurar" });
        return;
    }

    try {
        if (req.method === "POST") {
            const datos = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
            const { juego, fecha, gano } = datos;
            if (!JUEGOS.includes(juego) || !fechasValidas().includes(fecha) || typeof gano !== "boolean") {
                res.status(400).json({ error: "Partida inválida" });
                return;
            }
            const origen = req.headers?.origin;
            if (origen && !origenPermitido(origen)) {
                res.status(403).json({ error: "Origen no permitido" });
                return;
            }

            const claveLimite = `tcdle:limite:${fecha}:${huella(req, fecha)}`;
            const [usadas] = await redis([
                ["INCR", claveLimite],
                ["EXPIRE", claveLimite, UN_DIA],
            ]);
            if (Number(usadas) > LIMITE_POR_DIA) {
                res.status(429).json({ error: "Demasiadas partidas desde esta conexión" });
                return;
            }

            const comandos = [
                ["INCR", clave(fecha, juego, "jugaron")],
                ["EXPIRE", clave(fecha, juego, "jugaron"), DIAS_GUARDADOS],
            ];
            if (gano) {
                comandos.push(["INCR", clave(fecha, juego, "ganaron")], ["EXPIRE", clave(fecha, juego, "ganaron"), DIAS_GUARDADOS]);
            }
            await redis(comandos);
            res.status(204).end();
            return;
        }

        if (req.method === "GET") {
            const fecha = String(req.query.fecha ?? "");
            if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                res.status(400).json({ error: "Fecha inválida" });
                return;
            }

            const valores = await redis(JUEGOS.flatMap((juego) => [["GET", clave(fecha, juego, "jugaron")], ["GET", clave(fecha, juego, "ganaron")]]));
            const resultado = Object.fromEntries(
                JUEGOS.map((juego, indice) => [juego, { jugaron: Number(valores[indice * 2] ?? 0), ganaron: Number(valores[indice * 2 + 1] ?? 0) }])
            );
            // Unos segundos de caché en Vercel: muchos jugadores, pocas consultas a Redis.
            res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
            res.status(200).json(resultado);
            return;
        }

        res.setHeader("Allow", "GET, POST");
        res.status(405).end();
    } catch {
        res.status(502).json({ error: "No se pudo leer el contador" });
    }
}
