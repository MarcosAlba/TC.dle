// Un catálogo por módulo: cada juego importa solo el suyo y no baja los demás.
import datos from "../carreras.json";
import type { Carrera } from "../tipos";

export const carreras = datos as Carrera[];
