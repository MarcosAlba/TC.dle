// Un catálogo por módulo: cada juego importa solo el suyo y no baja los demás.
import datos from "../circuitos.json";
import type { Circuito } from "../tipos";

export const circuitos = datos as Circuito[];
