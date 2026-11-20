// Fichas de los pilotos para los juegos de "Más juegos", en un archivo aparte en
// vez de dentro del HTML de cada página (pesaban unos 190 KB por página):
//   /datos/fichas-plantel.json  Grilla y Conexiones (plantel ampliado con su historial)
//   /datos/fichas-pilotos.json  Campaña (solo pilotos.json, así no cambia el piloto del día)
import type { APIRoute, GetStaticPaths } from "astro";
import { carreras, pilotos } from "../../data";
import { historialPilotos } from "../../data/catalogo/historial";
import { plantelExtra } from "../../data/catalogo/plantel-extra";
import { construirFichas } from "../../lib/extra";

export const getStaticPaths = (() => [
    { params: { archivo: "fichas-plantel.json" }, props: { fichas: construirFichas(plantelExtra, carreras, historialPilotos) } },
    { params: { archivo: "fichas-pilotos.json" }, props: { fichas: construirFichas(pilotos, carreras) } },
]) satisfies GetStaticPaths;

export const GET: APIRoute<{ fichas: unknown }> = ({ props }) =>
    new Response(JSON.stringify(props.fichas), { headers: { "Content-Type": "application/json; charset=utf-8" } });
