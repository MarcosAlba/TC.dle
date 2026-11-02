// Un catálogo por módulo: cada juego importa solo el suyo y no baja los demás.
import datos from "../pilotos.json";
import type { Piloto } from "../tipos";

export const pilotos = datos as Piloto[];
