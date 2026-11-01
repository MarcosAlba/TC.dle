// Copa de Oro (los playoffs del TC). Se carga a mano cada temporada: los
// pilotos que la juegan y desde cuándo hasta cuándo se ve el tema dorado del
// sitio. Mientras el tema está prendido, esos pilotos llevan un distintivo en
// el buscador y en la tabla del modo piloto.

export interface CopaDeOro {
    temporada: number;
    /** "AAAA-MM-DD" (hora local): el tema dorado se ve de `desde` a `hasta`, ambos incluidos. */
    desde: string;
    hasta: string;
    /** Ids de pilotos.json. */
    pilotos: number[];
    fuente: string;
}

export const copaDeOro: CopaDeOro = {
    temporada: 2026,
    // Arranca cuando termina Halloween y llega hasta la final en La Plata.
    desde: "2026-11-03",
    hasta: "2026-12-06",
    // Santero, Chapur, Werner, A. Canapino, Fritzler, Di Palma, Dianda, Rossi,
    // Castellano, Lambiris, Palazzo, Ledesma, Landa, Faín, Urcera y Gianini.
    pilotos: [23, 28, 8, 1, 65, 11, 57, 47, 38, 2, 48, 9, 36, 33, 64, 19],
    fuente: "https://tiempos.actc.org.ar/copa-de-oro-tc/campeonato?year=2026",
};

export const juegaCopaDeOro = (pilotoId: number): boolean => copaDeOro.pilotos.includes(pilotoId);
