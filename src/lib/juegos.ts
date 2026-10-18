// Los cuatro juegos del día, en el orden en que se sugieren. Las claves de
// partida y los ids son parte del formato guardado en el navegador de quien
// ya jugó (tests/almacenamiento-contrato.test.ts): no se renombran.

export type JuegoId = "piloto" | "auto" | "circuito" | "wordle";

export interface Juego {
    id: JuegoId;
    nombre: string;
    corto: string;
    /** Archivo dentro de /pages: los links compartidos apuntan acá. */
    archivo: string;
    clavePartida: string;
    /** Clave del localStorage que recuerda que hoy ya se vio la introducción. */
    claveIntro: string;
}

export const JUEGOS: readonly Juego[] = [
    {
        id: "piloto",
        nombre: "Adiviná el piloto",
        corto: "Piloto",
        archivo: "adivinar-el-piloto.html",
        clavePartida: "partidaTCdle",
        claveIntro: "tcdleIntroPilotoVista",
    },
    {
        id: "auto",
        nombre: "Adiviná el auto",
        corto: "Auto",
        archivo: "adivinar-el-auto.html",
        clavePartida: "partidaTCdleAuto",
        claveIntro: "tcdleIntroAutoVista",
    },
    {
        id: "circuito",
        nombre: "Adiviná el circuito",
        corto: "Circuito",
        archivo: "adivinar-el-circuito.html",
        clavePartida: "partidaTCdleCircuito",
        claveIntro: "tcdleIntroCircuitoVista",
    },
    {
        id: "wordle",
        nombre: "Wordle del TC",
        corto: "Wordle",
        archivo: "tcdle-wordle.html",
        clavePartida: "partidaTCdleWordle",
        claveIntro: "tcdleIntroWordleVista",
    },
];

export function obtenerJuego(id: JuegoId): Juego {
    const juego = JUEGOS.find((item) => item.id === id);

    if (!juego) {
        throw new Error("Juego desconocido: " + id);
    }

    return juego;
}
