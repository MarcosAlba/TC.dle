// Plantel de la Grilla y Conexiones: los pilotos de pilotos.json más los que se
// suman solo a estos juegos (pilotos-extra.json, ids desde 100). pilotos.json no
// se toca para que no cambie el piloto del día del modo Adiviná el piloto.
import datosExtra from "../pilotos-extra.json";
import type { Piloto } from "../tipos";
import { pilotos } from "./pilotos";

export const pilotosExtra = datosExtra as Piloto[];
export const plantelExtra: Piloto[] = [...pilotos, ...pilotosExtra];
