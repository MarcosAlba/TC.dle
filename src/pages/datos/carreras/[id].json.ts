// Una final por archivo (/datos/carreras/<id>.json): el Top 10 baja solo la del
// día en vez de las 246 finales desde 2010 juntas.
import type { APIRoute, GetStaticPaths } from "astro";
import { carreras } from "../../../data";
import type { Carrera } from "../../../data/tipos";

export const getStaticPaths = (() => carreras.map((carrera) => ({ params: { id: carrera.id }, props: { carrera } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ carrera: Carrera }> = ({ props }) =>
    new Response(JSON.stringify(props.carrera), { headers: { "Content-Type": "application/json; charset=utf-8" } });
