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
    { id: "PISTA", palabra: "PISTA" },
    { id: "BOXES", palabra: "BOXES" },
    { id: "MOTOR", palabra: "MOTOR" },
    { id: "PODIO", palabra: "PODIO" },
    { id: "ROSSI", palabra: "ROSSI" },
    { id: "DODGE", palabra: "DODGE" },
    { id: "VUELTA", palabra: "VUELTA" },
    { id: "CHOQUE", palabra: "CHOQUE" },
    { id: "WERNER", palabra: "WERNER" },
    { id: "PERNIA", palabra: "PERNIA" },
    { id: "TOYOTA", palabra: "TOYOTA" },
    { id: "URCERA", palabra: "URCERA" },
    { id: "PARANA", palabra: "PARANA" },
    { id: "CARRERA", palabra: "CARRERA" },
    { id: "BANDERA", palabra: "BANDERA" },
    { id: "LARGADA", palabra: "LARGADA" },
    { id: "RAFAELA", palabra: "RAFAELA" },
    { id: "ARDUSSO", palabra: "ARDUSSO" },
    { id: "LEDESMA", palabra: "LEDESMA" },
    { id: "SANTERO", palabra: "SANTERO" }
];

window.palabrasTC = palabrasTC;
