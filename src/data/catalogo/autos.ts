// Un catálogo por módulo: cada juego importa solo el suyo y no baja los demás.
import datos from "../autos.json";
import type { Auto } from "../tipos";

export const autos = datos as Auto[];
