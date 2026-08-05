import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SALIDA = path.resolve("assets/images/circuitos");
const RADIO_METROS = 3600;
const VISTA_ANCHO = 1000;
const VISTA_ALTO = 600;
const MARGEN = 46;

const circuitos = [
    { slug: "balcarce", lat: -37.8809224, lon: -58.2665384, km: 4.592 },
    { slug: "la-plata-sin-chicana", lat: -34.9787752, lon: -58.1800386, km: 4.265 },
    { slug: "la-plata-con-chicana", lat: -34.9787752, lon: -58.1800386, km: 4.4 },
    { slug: "trelew", lat: -43.301533, lon: -65.271497, km: 4.1 },
    { slug: "mendoza-jorge-angel-pena", lat: -33.0613479, lon: -68.498914, km: 4.168 },
    { slug: "rio-cuarto", lat: -33.1795726, lon: -64.3658874, km: 4.047 },
    { slug: "nueve-de-julio", lat: -35.4318111, lon: -60.9160648, km: 4.616 },
    { slug: "buenos-aires-12-sin-chicana", lat: -34.6902485, lon: -58.4530311, km: 5.641 },
    { slug: "rafaela", lat: -31.204342, lon: -61.4793148, km: 4.74 },
    { slug: "parana", lat: -31.7632434, lon: -60.3781226, km: 4.219 },
    { slug: "mar-de-ajo", lat: -36.7081637, lon: -56.7175111, km: 4.695 },
    { slug: "olavarria", lat: -36.859966, lon: -60.2570794, km: 4.066 },
    { slug: "rio-gallegos", lat: -51.6571177, lon: -69.2524898, km: 4.206 },
    { slug: "san-luis", lat: -33.3361158, lon: -66.39464, km: 4.5 },
    { slug: "salta", lat: -24.782211, lon: -65.375017, km: 4.106 },
    { slug: "comodoro-rivadavia", lat: -45.9043283, lon: -67.5449624, km: 4.1 },
    { slug: "posadas", lat: -27.4406616, lon: -55.9269577, km: 4.37 },
    { slug: "termas-largo", lat: -27.5067621, lon: -64.9124835, km: 4.806 },
    { slug: "termas-corto", lat: -27.5067621, lon: -64.9124835, km: 4.43 },
    { slug: "neuquen", lat: -38.8536209, lon: -68.1558282, km: 4.38 },
    { slug: "junin", lat: -34.650449, lon: -61.0190723, km: 4.2 },
    { slug: "toay", lat: -36.7247349, lon: -64.3496821, km: 4.148 },
    { slug: "concepcion-del-uruguay", lat: -32.4535923, lon: -58.3148604, km: 4.279 },
    { slug: "concordia", lat: -31.3082259, lon: -58.0051858, km: 4.7 },
    { slug: "alta-gracia", lat: -31.5763841, lon: -64.3613756, km: 3.85 },
    { slug: "viedma", lat: -40.855007, lon: -63.0162456, km: 4.118 },
    { slug: "la-pedrera", lat: -33.68659444, lon: -65.495275, km: 4.368 },
    { slug: "san-nicolas", lat: -33.3979458, lon: -60.2019811, km: 3.959 },
    { slug: "san-juan-villicum", lat: -31.398452, lon: -68.5683882, km: 4.26 },
    { slug: "rosario", lat: -32.903797, lon: -60.7448324, km: 4.0 },
    { slug: "el-calafate", lat: -50.3239012, lon: -72.1516228, km: 3.8 }
];

const sedesUnicas = Array.from(new Map(circuitos.map((circuito) => [
    `${circuito.lat},${circuito.lon}`,
    circuito
])).values());

function distanciaMetros(a, b) {
    const radioTierra = 6371000;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const diferenciaLat = (b.lat - a.lat) * Math.PI / 180;
    const diferenciaLon = (b.lon - a.lon) * Math.PI / 180;
    const senoLat = Math.sin(diferenciaLat / 2);
    const senoLon = Math.sin(diferenciaLon / 2);
    const valor = senoLat * senoLat + Math.cos(lat1) * Math.cos(lat2) * senoLon * senoLon;

    return 2 * radioTierra * Math.atan2(Math.sqrt(valor), Math.sqrt(1 - valor));
}

function longitudCoordenadas(coordenadas) {
    let total = 0;

    for (let indice = 1; indice < coordenadas.length; indice += 1) {
        total += distanciaMetros(coordenadas[indice - 1], coordenadas[indice]);
    }

    return total;
}

function esMismaCoordenada(a, b) {
    return a && b && Math.abs(a.lat - b.lat) < 1e-8 && Math.abs(a.lon - b.lon) < 1e-8;
}

function estaCercaDeSede(elemento, sede) {
    if (!Array.isArray(elemento.geometry) || elemento.geometry.length === 0) {
        return false;
    }

    const muestra = elemento.geometry[Math.floor(elemento.geometry.length / 2)];
    return distanciaMetros(muestra, sede) < RADIO_METROS * 1.4;
}

function esViaUtil(elemento) {
    const nombre = String(elemento.tags?.name || "");
    const servicio = String(elemento.tags?.service || "");

    return elemento.type === "way" &&
        elemento.tags?.highway === "raceway" &&
        Array.isArray(elemento.geometry) &&
        elemento.geometry.length > 1 &&
        !/box|pit|kart|picodromo|picódromo|drag/i.test(nombre) &&
        !/pit|parking/i.test(servicio);
}

function crearCandidatosCerrados(vias) {
    return vias
        .filter((via) => esMismaCoordenada(via.geometry[0], via.geometry.at(-1)))
        .map((via) => ({
            clave: `way-${via.id}`,
            coordenadas: via.geometry,
            metros: longitudCoordenadas(via.geometry)
        }));
}

function crearCandidatosPorAtajo(vias) {
    const candidatos = [];
    const cerradas = vias.filter((via) => via.nodes?.length > 3 && via.nodes[0] === via.nodes.at(-1));
    const abiertas = vias.filter((via) => via.nodes?.length > 1 && via.nodes[0] !== via.nodes.at(-1));

    for (const base of cerradas) {
        const nodosBase = base.nodes.slice(0, -1);

        for (const atajo of abiertas) {
            const inicio = nodosBase.indexOf(atajo.nodes[0]);
            const fin = nodosBase.indexOf(atajo.nodes.at(-1));
            if (inicio < 0 || fin < 0 || inicio === fin) continue;

            const desde = Math.min(inicio, fin);
            const hasta = Math.max(inicio, fin);
            const atajoOrientado = inicio <= fin ? atajo.geometry : [...atajo.geometry].reverse();
            const tramoDirecto = base.geometry.slice(desde, hasta + 1);
            const tramoExterior = base.geometry.slice(hasta, -1).concat(base.geometry.slice(0, desde + 1));

            for (const [indice, tramo] of [tramoDirecto, tramoExterior].entries()) {
                const coordenadas = atajoOrientado.concat([...tramo].reverse().slice(1));
                if (!esMismaCoordenada(coordenadas[0], coordenadas.at(-1))) coordenadas.push(coordenadas[0]);
                candidatos.push({
                    clave: `shortcut-${base.id}-${atajo.id}-${indice}`,
                    coordenadas,
                    metros: longitudCoordenadas(coordenadas)
                });
            }
        }
    }

    return candidatos;
}

function crearGrafo(vias) {
    const nodos = new Map();
    const aristas = [];
    const clavesAristas = new Set();

    for (const via of vias) {
        if (!Array.isArray(via.nodes) || via.nodes.length !== via.geometry.length) {
            continue;
        }

        for (let indice = 1; indice < via.nodes.length; indice += 1) {
            const a = String(via.nodes[indice - 1]);
            const b = String(via.nodes[indice]);
            const clave = a < b ? `${a}:${b}` : `${b}:${a}`;

            nodos.set(a, via.geometry[indice - 1]);
            nodos.set(b, via.geometry[indice]);

            if (clavesAristas.has(clave)) {
                continue;
            }

            clavesAristas.add(clave);
            aristas.push({
                id: aristas.length,
                a,
                b,
                metros: distanciaMetros(via.geometry[indice - 1], via.geometry[indice])
            });
        }
    }

    const adyacencias = new Map();

    for (const arista of aristas) {
        if (!adyacencias.has(arista.a)) adyacencias.set(arista.a, []);
        if (!adyacencias.has(arista.b)) adyacencias.set(arista.b, []);
        adyacencias.get(arista.a).push({ nodo: arista.b, arista });
        adyacencias.get(arista.b).push({ nodo: arista.a, arista });
    }

    return { nodos, aristas, adyacencias };
}

function caminoMasCorto(grafo, inicio, fin, aristaExcluida) {
    const distancias = new Map([[inicio, 0]]);
    const anteriores = new Map();
    const pendientes = new Set([inicio]);

    while (pendientes.size > 0) {
        let actual = null;
        let mejorDistancia = Infinity;

        for (const nodo of pendientes) {
            const distancia = distancias.get(nodo) ?? Infinity;
            if (distancia < mejorDistancia) {
                actual = nodo;
                mejorDistancia = distancia;
            }
        }

        pendientes.delete(actual);

        if (actual === fin) {
            break;
        }

        for (const vecino of grafo.adyacencias.get(actual) || []) {
            if (vecino.arista.id === aristaExcluida.id) {
                continue;
            }

            const alternativa = mejorDistancia + vecino.arista.metros;
            if (alternativa < (distancias.get(vecino.nodo) ?? Infinity)) {
                distancias.set(vecino.nodo, alternativa);
                anteriores.set(vecino.nodo, actual);
                pendientes.add(vecino.nodo);
            }
        }
    }

    if (!distancias.has(fin)) {
        return null;
    }

    const camino = [fin];
    let actual = fin;

    while (actual !== inicio) {
        actual = anteriores.get(actual);
        if (!actual) return null;
        camino.push(actual);
    }

    camino.reverse();
    return { nodos: camino, metros: distancias.get(fin) };
}

function crearCandidatosGrafo(vias) {
    const grafo = crearGrafo(vias);
    const candidatos = [];
    const claves = new Set();

    for (const arista of grafo.aristas) {
        const camino = caminoMasCorto(grafo, arista.a, arista.b, arista);

        if (!camino || camino.nodos.length < 4) {
            continue;
        }

        const clave = [...new Set(camino.nodos)].sort().join(":");
        if (claves.has(clave)) {
            continue;
        }

        claves.add(clave);
        const ids = camino.nodos.concat(camino.nodos[0]);
        candidatos.push({
            clave: `cycle-${claves.size}`,
            coordenadas: ids.map((id) => grafo.nodos.get(id)),
            metros: camino.metros + arista.metros
        });
    }

    return candidatos;
}

function crearTodosLosCiclos(vias) {
    const grafo = crearGrafo(vias);
    const candidatos = [];
    const claves = new Set();
    const nodosOrdenados = [...grafo.nodos.keys()].sort((a, b) => a.localeCompare(b));
    const maximoCiclos = 12000;

    function explorar(inicio, actual, visitados, camino, aristasCamino, metros) {
        if (candidatos.length >= maximoCiclos) return;

        for (const vecino of grafo.adyacencias.get(actual) || []) {
            const metrosNuevos = metros + vecino.arista.metros;
            if (metrosNuevos > 7500) continue;

            if (vecino.nodo === inicio && camino.length >= 4) {
                const idsAristas = aristasCamino.concat(vecino.arista.id);
                const clave = [...idsAristas].sort((a, b) => a - b).join(":");
                if (claves.has(clave)) continue;
                claves.add(clave);
                const idsNodos = camino.concat(inicio);
                candidatos.push({
                    clave: `all-cycle-${claves.size}`,
                    coordenadas: idsNodos.map((id) => grafo.nodos.get(id)),
                    metros: metrosNuevos
                });
                continue;
            }

            if (visitados.has(vecino.nodo) || vecino.nodo.localeCompare(inicio) < 0) continue;
            visitados.add(vecino.nodo);
            explorar(
                inicio,
                vecino.nodo,
                visitados,
                camino.concat(vecino.nodo),
                aristasCamino.concat(vecino.arista.id),
                metrosNuevos
            );
            visitados.delete(vecino.nodo);
        }
    }

    for (const inicio of nodosOrdenados) {
        explorar(inicio, inicio, new Set([inicio]), [inicio], [], 0);
        if (candidatos.length >= maximoCiclos) break;
    }

    return candidatos;
}

function elegirCandidato(candidatos, kilometrosObjetivo) {
    const objetivo = kilometrosObjetivo * 1000;
    const candidatosValidos = candidatos.filter((candidato) => candidato.metros > 1800 && candidato.metros < 7500);

    candidatosValidos.sort((a, b) => {
        const diferenciaA = Math.abs(a.metros - objetivo);
        const diferenciaB = Math.abs(b.metros - objetivo);
        return diferenciaA - diferenciaB || b.coordenadas.length - a.coordenadas.length;
    });

    return candidatosValidos[0] || null;
}

function crearSvg(circuito, candidato) {
    const latitudMedia = candidato.coordenadas.reduce((total, punto) => total + punto.lat, 0) / candidato.coordenadas.length;
    const factorLon = Math.cos(latitudMedia * Math.PI / 180);
    const proyectados = candidato.coordenadas.map((punto) => ({
        x: punto.lon * factorLon,
        y: -punto.lat
    }));
    const minX = Math.min(...proyectados.map((punto) => punto.x));
    const maxX = Math.max(...proyectados.map((punto) => punto.x));
    const minY = Math.min(...proyectados.map((punto) => punto.y));
    const maxY = Math.max(...proyectados.map((punto) => punto.y));
    const ancho = Math.max(maxX - minX, 1e-8);
    const alto = Math.max(maxY - minY, 1e-8);
    const escala = Math.min((VISTA_ANCHO - MARGEN * 2) / ancho, (VISTA_ALTO - MARGEN * 2) / alto);
    const desplazamientoX = (VISTA_ANCHO - ancho * escala) / 2;
    const desplazamientoY = (VISTA_ALTO - alto * escala) / 2;
    const puntos = proyectados.map((punto) => ({
        x: desplazamientoX + (punto.x - minX) * escala,
        y: desplazamientoY + (punto.y - minY) * escala
    }));
    const recorrido = puntos.map((punto, indice) => {
        const comando = indice === 0 ? "M" : "L";
        return `${comando}${punto.x.toFixed(2)} ${punto.y.toFixed(2)}`;
    }).join(" ") + " Z";

    return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Silueta derivada de datos de OpenStreetMap (ODbL): https://www.openstreetmap.org/copyright -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VISTA_ANCHO} ${VISTA_ALTO}" role="img">
  <title>Silueta de circuito</title>
  <path d="${recorrido}" fill="none" stroke="#ffffff" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
}

async function obtenerDatosOpenStreetMap() {
    const bloques = sedesUnicas.map((sede) => `way(around:${RADIO_METROS},${sede.lat},${sede.lon})["highway"="raceway"];`).join("\n");
    const consulta = `[out:json][timeout:180];(\n${bloques}\n);out body geom;`;
    const respuesta = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "User-Agent": "TCdle/1.0 circuit silhouettes"
        },
        body: new URLSearchParams({ data: consulta })
    });

    if (!respuesta.ok) {
        throw new Error(`Overpass respondió ${respuesta.status}`);
    }

    return respuesta.json();
}

await mkdir(SALIDA, { recursive: true });
const datos = await obtenerDatosOpenStreetMap();
const elementos = Array.from(new Map(datos.elements.map((elemento) => [elemento.id, elemento])).values());
const informe = [];

for (const circuito of circuitos) {
    const vias = elementos.filter(esViaUtil).filter((elemento) => estaCercaDeSede(elemento, circuito));
    const candidatos = crearCandidatosCerrados(vias)
        .concat(crearCandidatosPorAtajo(vias), crearCandidatosGrafo(vias), crearTodosLosCiclos(vias));
    if (process.env.DEPURAR_VARIANTES === "1" && /la-plata|buenos-aires|termas/.test(circuito.slug)) {
        const viasResumen = vias.map((via) => `${via.id}:${via.tags?.name || "sin nombre"}:${(longitudCoordenadas(via.geometry) / 1000).toFixed(3)}`);
        const candidatosResumen = candidatos.map((item) => `${item.clave}:${(item.metros / 1000).toFixed(3)}:${item.coordenadas.length}`);
        process.stdout.write(`\n[${circuito.slug}]\nvias ${viasResumen.join(" | ")}\ncandidatos ${candidatosResumen.join(" | ")}\n`);
    }
    let candidato = elegirCandidato(candidatos, circuito.km);

    if (!candidato) {
        informe.push(`${circuito.slug}: SIN TRAZADO (${vias.length} vías)`);
        continue;
    }

    await writeFile(path.join(SALIDA, `${circuito.slug}.svg`), crearSvg(circuito, candidato), "utf8");
    informe.push(`${circuito.slug}: ${(candidato.metros / 1000).toFixed(3)} km (${candidato.coordenadas.length} puntos)`);
}

process.stdout.write(informe.join("\n") + "\n");
