// Un catálogo por módulo: cada juego importa solo el suyo y no baja los demás.
import datos from "../palabras.json";
import type { Palabra } from "../tipos";

export const palabras = datos as Palabra[];
