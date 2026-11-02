// Un catálogo por módulo: cada juego importa solo el suyo y no baja los demás.
import datos from "../fotos-carreras.json";
import type { FotoCarrera } from "../tipos";

export const fotosCarreras = datos as FotoCarrera[];
