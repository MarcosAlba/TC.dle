import type { Piloto } from "../../data/tipos";
import type { Comparacion } from "../../lib/pilotos";

export interface FilaPiloto {
    id: number;
    piloto: Piloto;
    comparacion: Comparacion;
    /** Las filas que se juegan en vivo animan; las que se cargan de la partida guardada no. */
    animada: boolean;
    /** Cuántas de las seis celdas con pista ya se mostraron. */
    reveladas: number;
}
