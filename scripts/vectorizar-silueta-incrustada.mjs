// Convierte una silueta SVG que lleva una imagen PNG incrustada a un trazado
// vectorial equivalente, sin cambiar la forma.
//
//   node scripts/vectorizar-silueta-incrustada.mjs balcarce la-plata-con-chicana ...
//
// Se usó para balcarce, la-plata-con-chicana y rio-gallegos, que eran una foto
// de 800-960 px en escala de grises (líneas blancas sobre negro) usada como
// máscara. La imagen pesaba entre 150 y 300 KB por silueta y el test de
// circuitos no admite imágenes dentro de los SVG.
//
// Cómo lo hace: sigue el contorno de las líneas blancas al 50 % de gris
// (marching squares con interpolación de subpíxel) y lo simplifica con una
// tolerancia de 0,1 px de la imagen original. El resultado se dibuja con la
// misma transformación que tenía la imagen. Antes de escribir compara el
// resultado contra la imagen y aborta si difieren más de un 0,5 % de píxeles.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const CARPETA = path.resolve(import.meta.dirname, "../assets/images/circuitos");
const UMBRAL = 127.5;
const TOLERANCIA_PX = 0.1;
const DIFERENCIA_MAXIMA = 0.001;

function trazarContornos(valores, ancho, alto) {
    const puntos = new Map();
    const vecinos = new Map();
    const en = (x, y) => valores[y * ancho + x];

    function punto(tipo, x, y) {
        const clave = `${tipo}${x},${y}`;
        if (!puntos.has(clave)) {
            const a = en(x, y);
            const b = tipo === "h" ? en(x + 1, y) : en(x, y + 1);
            const f = (UMBRAL - a) / (b - a);
            puntos.set(clave, tipo === "h" ? [x + f, y] : [x, y + f]);
        }
        return clave;
    }

    function unir(a, b) {
        for (const [desde, hasta] of [[a, b], [b, a]]) {
            if (!vecinos.has(desde)) vecinos.set(desde, []);
            vecinos.get(desde).push(hasta);
        }
    }

    for (let y = 0; y < alto - 1; y++) {
        for (let x = 0; x < ancho - 1; x++) {
            const tl = en(x, y) >= UMBRAL;
            const tr = en(x + 1, y) >= UMBRAL;
            const br = en(x + 1, y + 1) >= UMBRAL;
            const bl = en(x, y + 1) >= UMBRAL;
            const caso = (tl << 3) | (tr << 2) | (br << 1) | bl;
            if (caso === 0 || caso === 15) continue;

            const arriba = () => punto("h", x, y);
            const derecha = () => punto("v", x + 1, y);
            const abajo = () => punto("h", x, y + 1);
            const izquierda = () => punto("v", x, y);
            const segmentos = {
                1: [[izquierda, abajo]], 2: [[abajo, derecha]], 3: [[izquierda, derecha]],
                4: [[arriba, derecha]], 6: [[arriba, abajo]], 7: [[arriba, izquierda]],
                8: [[arriba, izquierda]], 9: [[arriba, abajo]], 11: [[arriba, derecha]],
                12: [[izquierda, derecha]], 13: [[abajo, derecha]], 14: [[izquierda, abajo]]
            };
            let lista = segmentos[caso];
            if (caso === 5 || caso === 10) {
                const centro = (en(x, y) + en(x + 1, y) + en(x + 1, y + 1) + en(x, y + 1)) / 4 >= UMBRAL;
                const separados = caso === 5 ? [[arriba, derecha], [izquierda, abajo]] : [[arriba, izquierda], [abajo, derecha]];
                const unidos = caso === 5 ? [[arriba, izquierda], [abajo, derecha]] : [[arriba, derecha], [izquierda, abajo]];
                lista = centro ? unidos : separados;
            }
            for (const [primero, segundo] of lista) {
                unir(primero(), segundo());
            }
        }
    }

    const visitados = new Set();
    const lazos = [];
    for (const inicio of vecinos.keys()) {
        if (visitados.has(inicio)) continue;
        const lazo = [];
        let anterior = null;
        let actual = inicio;
        while (actual !== undefined && !visitados.has(actual)) {
            visitados.add(actual);
            lazo.push(puntos.get(actual));
            const [a, b] = vecinos.get(actual);
            const siguiente = a !== anterior ? a : b;
            anterior = actual;
            actual = siguiente;
        }
        if (lazo.length > 3) lazos.push(lazo);
    }
    return lazos;
}

function distanciaASegmento(p, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const largo = dx * dx + dy * dy;
    const t = largo === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / largo));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function simplificarAbierta(puntos, tolerancia) {
    if (puntos.length < 3) return puntos;
    let maxima = 0;
    let indice = 0;
    for (let i = 1; i < puntos.length - 1; i++) {
        const d = distanciaASegmento(puntos[i], puntos[0], puntos.at(-1));
        if (d > maxima) { maxima = d; indice = i; }
    }
    if (maxima <= tolerancia) return [puntos[0], puntos.at(-1)];
    const izquierda = simplificarAbierta(puntos.slice(0, indice + 1), tolerancia);
    const derecha = simplificarAbierta(puntos.slice(indice), tolerancia);
    return izquierda.slice(0, -1).concat(derecha);
}

function simplificarCerrada(lazo, tolerancia) {
    // Se parte el lazo en dos mitades por los puntos más alejados entre sí.
    let mitad = 0;
    let lejos = 0;
    for (let i = 1; i < lazo.length; i++) {
        const d = Math.hypot(lazo[i][0] - lazo[0][0], lazo[i][1] - lazo[0][1]);
        if (d > lejos) { lejos = d; mitad = i; }
    }
    const primera = simplificarAbierta(lazo.slice(0, mitad + 1), tolerancia);
    const segunda = simplificarAbierta(lazo.slice(mitad).concat([lazo[0]]), tolerancia);
    return primera.slice(0, -1).concat(segunda.slice(0, -1));
}

function aTrazado(lazos) {
    const n = (valor) => String(Math.round(valor * 100) / 100);
    return lazos
        .map((lazo) => "M" + lazo.map(([x, y]) => `${n(x)} ${n(y)}`).join("L") + "Z")
        .join("");
}

async function vectorizar(slug) {
    const ruta = path.join(CARPETA, slug + ".svg");
    const svg = await readFile(ruta, "utf8");
    const incrustadas = [...svg.matchAll(/xlink:href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/g)];
    if (incrustadas.length === 0) {
        process.stdout.write(`${slug}: ya es vectorial, no se toca.\n`);
        return;
    }

    const png = Buffer.from(incrustadas[0][1], "base64");
    const { data, info } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true });
    const { width: ancho, height: alto } = info;

    // Borde negro de 1 px para que todos los contornos queden cerrados.
    const conBorde = new Float32Array((ancho + 2) * (alto + 2));
    for (let y = 0; y < alto; y++) {
        for (let x = 0; x < ancho; x++) {
            conBorde[(y + 1) * (ancho + 2) + x + 1] = data[y * ancho + x];
        }
    }
    const lazos = trazarContornos(conBorde, ancho + 2, alto + 2)
        // -1 por el borde agregado y +0.5 porque el valor de un píxel está en su centro.
        .map((lazo) => simplificarCerrada(lazo.map(([x, y]) => [x - 0.5, y - 0.5]), TOLERANCIA_PX));
    const trazado = aTrazado(lazos);

    // Verificación: dibujar el trazado y compararlo con la imagen original.
    const dibujo = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}"><rect width="100%" height="100%" fill="#000"/><path d="${trazado}" fill="#fff" fill-rule="evenodd"/></svg>`;
    const dibujado = await sharp(Buffer.from(dibujo)).greyscale().raw().toBuffer();
    // Píxeles claramente blancos en uno y claramente negros en el otro: solo
    // aparecen si el contorno se corrió más de medio píxel. El borde suavizado
    // (antialiasing) no cuenta, porque se ve igual con cualquiera de los dos.
    let distintos = 0;
    let silueta = 0;
    for (let i = 0; i < data.length; i++) {
        if (data[i] > 200) silueta += 1;
        if ((data[i] > 200 && dibujado[i] < 55) || (data[i] < 55 && dibujado[i] > 200)) {
            distintos += 1;
        }
    }
    const diferencia = distintos / silueta;
    if (diferencia > DIFERENCIA_MAXIMA) {
        throw new Error(`${slug}: el trazado difiere ${(diferencia * 100).toFixed(2)} % de la imagen original, no se escribe`);
    }

    // La imagen se dibujaba con la última transformación del archivo (la del grupo visible).
    const matrices = [...svg.matchAll(/transform="(matrix\([^)]+\))"/g)];
    const matriz = matrices.at(-1)[1];
    const raiz = svg.match(/<svg[^>]*>/)[0];
    const ancho_svg = raiz.match(/\swidth="([^"]+)"/)[1];
    const alto_svg = raiz.match(/\sheight="([^"]+)"/)[1];
    const viewBox = raiz.match(/viewBox="([^"]+)"/)[1];
    const salida = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho_svg}" height="${alto_svg}" viewBox="${viewBox}" role="img"><title>Silueta de circuito</title><g transform="${matriz}"><path d="${trazado}" fill="#ffffff" fill-rule="evenodd"/></g></svg>\n`;
    await writeFile(ruta, salida, "utf8");
    process.stdout.write(
        `${slug}: ${Math.round(svg.length / 1024)} KB -> ${Math.round(salida.length / 1024)} KB, ` +
        `${lazos.length} contornos, píxeles que cambian de forma: ${(diferencia * 100).toFixed(3)} %.\n`
    );
}

for (const slug of process.argv.slice(2)) {
    await vectorizar(slug);
}
