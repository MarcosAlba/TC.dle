/** Minúsculas, sin tildes ni signos: "Autódromo N.º 1" -> "autodromo n 1". */
export function normalizarTexto(texto: unknown): string {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[.º°]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .trim()
        .toLowerCase();
}
