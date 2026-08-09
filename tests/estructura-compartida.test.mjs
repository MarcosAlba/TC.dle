import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const raiz = path.resolve(import.meta.dirname, "..");
const paginas = [
    "adivinar-el-piloto.html",
    "adivinar-el-auto.html",
    "adivinar-el-circuito.html"
];

for (const pagina of paginas) {
    const html = await readFile(path.join(raiz, "pages", pagina), "utf8");
    for (const clase of [
        "encabezado-juego",
        "logo-juego",
        "presentacion-juego",
        "panel-intento",
        "panel-intento__cabecera",
        "panel-intento__contenido",
        "fila-busqueda",
        "buscador",
        "buscador__sugerencias",
        "boton-intentar",
        "mensaje-juego"
    ]) {
        assert.match(html, new RegExp(`class="[^"]*\\b${clase}\\b`), `${pagina}: falta ${clase}`);
    }

    assert.match(html, /juego-compartido\.css/, `${pagina}: falta el CSS compartido`);
    const nucleo = html.indexOf("tcdle.js");
    const seleccion = html.indexOf("seleccion-diaria.js");
    assert.ok(nucleo >= 0 && nucleo < seleccion, `${pagina}: el núcleo debe cargar antes de la selección`);
    assert.doesNotMatch(html, /buscador-pilotos|controles-temporales/, `${pagina}: referencia obsoleta`);
}

const archivosModo = [
    "assets/js/juego.js",
    "assets/js/adivinar-el-auto.js",
    "assets/js/adivinar-el-circuito.js"
];
for (const archivo of archivosModo) {
    const contenido = await readFile(path.join(raiz, archivo), "utf8");
    assert.doesNotMatch(contenido, /\blocalStorage\b|\bsetInterval\b|JSON\.parse/, `${archivo}: duplica infraestructura diaria`);
}

process.stdout.write("OK: estructura, recursos y responsabilidades compartidas.\n");
