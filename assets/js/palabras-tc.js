/**
 * Catálogo de palabras del Wordle del TC.
 *
 * Cada palabra es un objeto { id, palabra }:
 *   - id: igual a "palabra" (sirve para persistencia y comparaciones).
 *   - palabra: SOLO letras A-Z (o Ñ), en MAYÚSCULAS, sin espacios, sin
 *     tildes ni otros signos, de 5 a 7 letras. Pensadas para relacionarse
 *     con el Turismo Carretera: pilotos, marcas, equipos, circuitos,
 *     vocabulario de carreras, etc.
 *
 * Para sumar una palabra nueva alcanza con agregar una línea con el mismo
 * formato, por ejemplo:
 *   { id: "PALABRA", palabra: "PALABRA" },
 *
 * Reglas rápidas:
 *   - Sin acentos: "CAMPEON" en vez de "CAMPEÓN" (usar TCdle.normalizarTexto
 *     como referencia si hay dudas de cómo queda una palabra con tildes).
 *   - La Ñ sí está permitida (el tablero y el teclado la soportan).
 *   - No repetir palabras ni ids.
 *   - `tests/tcdle-wordle.test.mjs` valida automáticamente el formato de
 *     esta lista (longitud 5-7, sin acentos/espacios, sin duplicados).
 *
 * Agregá acá las palabras que quieras que salgan en el juego 👇
 */
const palabrasTC = [
    { id: "TETI", palabra: "TETI" },
    { id: "FAIN", palabra: "FAIN" },
    { id: "GINI", palabra: "GINI" },
    { id: "GURI", palabra: "GURI" },
    { id: "FORD", palabra: "FORD" },
    { id: "DOSE", palabra: "DOSE" },
    { id: "AZAR", palabra: "AZAR" },
    { id: "SILVA", palabra: "SILVA" },
    { id: "LANDA", palabra: "LANDA" },
    { id: "VERNA", palabra: "VERNA" },
    { id: "LOPEZ", palabra: "LOPEZ" },
    { id: "PONTE", palabra: "PONTE" },
    { id: "ACUNA", palabra: "ACUNA" },
    { id: "RAMOS", palabra: "RAMOS" },
    { id: "ALAUX", palabra: "ALAUX" },
    { id: "ROSSI", palabra: "ROSSI" },
    { id: "DODGE", palabra: "DODGE" },
    { id: "JAKOS", palabra: "JAKOS" },
    { id: "LUGON", palabra: "LUGON" },
    { id: "ALTUNA", palabra: "ALTUNA" },
    { id: "TODINO", palabra: "TODINO" },
    { id: "BARRIO", palabra: "BARRIO" },
    { id: "VIEDMA", palabra: "VIEDMA" },
    { id: "GALVEZ", palabra: "GALVEZ" },
    { id: "FANGIO", palabra: "FANGIO" },
    { id: "TORINO", palabra: "TORINO" },
    { id: "DIANDA", palabra: "DIANDA" },
    { id: "ABELLA", palabra: "ABELLA" },
    { id: "MOURAS", palabra: "MOURAS" },
    { id: "WERNER", palabra: "WERNER" },
    { id: "PERNIA", palabra: "PERNIA" },
    { id: "TOYOTA", palabra: "TOYOTA" },
    { id: "URCERA", palabra: "URCERA" },
    { id: "PARANA", palabra: "PARANA" },
    { id: "GUERRA", palabra: "GUERRA" },
    { id: "TANONI", palabra: "TANONI" },
    { id: "UGALDE", palabra: "UGALDE" },
    { id: "SAVINO", palabra: "SAVINO" },
    { id: "CHAPUR", palabra: "CHAPUR" },
    { id: "AGRELO", palabra: "AGRELO" },
    { id: "TRUCCO", palabra: "TRUCCO" },
    { id: "OLMEDO", palabra: "OLMEDO" },
    { id: "COPELLO", palabra: "COPELLO" },
    { id: "FONTANA", palabra: "FONTANA" },
    { id: "BESSONE", palabra: "BESSONE" },
    { id: "RISATTI", palabra: "RISATTI" },
    { id: "SPATARO", palabra: "SPATARO" },
    { id: "MORRESI", palabra: "MORRESI" },
    { id: "DIPALMA", palabra: "DIPALMA" },
    { id: "PALAZZO", palabra: "PALAZZO" },
    { id: "EBARLIN", palabra: "EBARLIN" },
    { id: "FRITLER", palabra: "FRITLER" },
    { id: "ORTELLI", palabra: "ORTELLI" },
    { id: "RAFAELA", palabra: "RAFAELA" },
    { id: "ARDUSSO", palabra: "ARDUSSO" },
    { id: "LEDESMA", palabra: "LEDESMA" },
    { id: "SANTERO", palabra: "SANTERO" },
    { id: "GIANINI", palabra: "GIANINI" },
    { id: "AVENTIN", palabra: "AVENTIN" },
    { id: "MANGONI", palabra: "MANGONI" },
    { id: "AGUIRRE", palabra: "AGUIRRE" },
    { id: "TROSSET", palabra: "TROSSET" },
    { id: "ALVAREZ", palabra: "ALVAREZ" },
    { id: "VAZQUEZ", palabra: "VAZQUEZ" },
    { id: "LOVALVO", palabra: "LOVALVO" },
    { id: "SATRIANO", palabra: "SATRIANO" },
    { id: "BALCARCE", palabra: "BALCARCE" },
    { id: "MORIATIS", palabra: "MORIATIS" },
    { id: "TRAVERSO", palabra: "TRAVERSO" },
    { id: "CANAPINO", palabra: "CANAPINO" },
    { id: "MARTINEZ", palabra: "MARTINEZ" },
    { id: "OYHANART", palabra: "OYHANART" },
    { id: "CIANTINI", palabra: "CIANTINI" },
    { id: "ANGELINI", palabra: "ANGELINI" },
    { id: "FALASCHI", palabra: "FALASCHI" },
    { id: "LAMBIRIS", palabra: "LAMBIRIS" },
    { id: "GIROLAMI", palabra: "GIROLAMI" },
];

window.palabrasTC = palabrasTC;
