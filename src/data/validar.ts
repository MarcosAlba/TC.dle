// Validación de los catálogos. Se corre al construir el sitio (ver index.ts)
// y en los tests, así un dato mal cargado frena el deploy.
import {
    LARGO_MAXIMO_PALABRA,
    LARGO_MINIMO_PALABRA,
    type Auto,
    type Circuito,
    type Palabra,
    type Piloto,
} from "./tipos";

const TIPOS_ESTADISTICA = ["carrerasGanadas", "series", "clasificaciones", "carrerasCorridas"];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function exigir(condicion: boolean, mensaje: string): asserts condicion {
    if (!condicion) {
        throw new Error("Catálogo inválido: " + mensaje);
    }
}

function esTextoNoVacio(valor: unknown): valor is string {
    return typeof valor === "string" && valor.trim() !== "";
}

export function validarPilotos(pilotos: Piloto[]): void {
    const ids = new Set<number>();

    for (const piloto of pilotos) {
        const donde = `piloto ${piloto.id} (${piloto.nombre})`;
        exigir(Number.isInteger(piloto.id), `${donde}: id entero`);
        exigir(!ids.has(piloto.id), `${donde}: id repetido`);
        ids.add(piloto.id);

        for (const campo of ["nombre", "marca", "equipo", "localidad", "provincia", "foto"] as const) {
            exigir(esTextoNoVacio(piloto[campo]), `${donde}: falta ${campo}`);
        }
        exigir(FECHA.test(piloto.fechaNacimiento), `${donde}: fechaNacimiento AAAA-MM-DD`);
        exigir(
            piloto.fechaFallecimiento === undefined || FECHA.test(piloto.fechaFallecimiento),
            `${donde}: fechaFallecimiento AAAA-MM-DD`
        );
        exigir(typeof piloto.campeonTC === "boolean", `${donde}: campeonTC booleano`);
        exigir(Number.isInteger(piloto.anioDebutTC), `${donde}: anioDebutTC entero`);
        exigir(piloto.numeroAuto === null || Number.isInteger(piloto.numeroAuto), `${donde}: numeroAuto`);
        exigir(piloto.datoPeculiar === null || esTextoNoVacio(piloto.datoPeculiar), `${donde}: datoPeculiar`);

        const estadistica = piloto.estadisticaDestacada;
        exigir(
            estadistica === null ||
                (TIPOS_ESTADISTICA.includes(estadistica.tipo) && Number.isFinite(estadistica.valor)),
            `${donde}: estadisticaDestacada`
        );
        exigir(/^pilotos\/[^/]+\.(webp|avif)$/.test(piloto.foto), `${donde}: foto dentro de pilotos/`);
    }
}

export function validarAutos(autos: Auto[], pilotos: Piloto[]): void {
    const idsPilotos = new Set(pilotos.map((piloto) => piloto.id));
    const archivos = new Set<string>();

    for (const auto of autos) {
        exigir(idsPilotos.has(auto.pilotoId), `auto ${auto.archivo}: pilotoId ${auto.pilotoId} no existe`);
        exigir(esTextoNoVacio(auto.archivo), "auto sin archivo");
        exigir(!archivos.has(auto.archivo), `auto ${auto.archivo}: archivo repetido`);
        archivos.add(auto.archivo);
        exigir(auto.anio === null || Number.isInteger(auto.anio), `auto ${auto.archivo}: anio`);
    }
}

export function validarCircuitos(circuitos: Circuito[]): void {
    const ids = new Set<string>();

    for (const circuito of circuitos) {
        const donde = `circuito ${circuito.id}`;
        exigir(!ids.has(circuito.id), `${donde}: id repetido`);
        ids.add(circuito.id);

        for (const campo of [
            "id", "sedeId", "nombre", "variante", "ciudad", "provincia", "longitud", "participacionTC", "imagen", "fuente",
        ] as const) {
            exigir(esTextoNoVacio(circuito[campo]), `${donde}: falta ${campo}`);
        }
        exigir(circuito.aliases.length > 0, `${donde}: faltan respuestas alternativas`);
        exigir(circuito.aliases.every(esTextoNoVacio), `${donde}: alias vacío`);
        exigir(circuito.imagen.endsWith(".svg"), `${donde}: la silueta es un SVG`);
        exigir(URL.canParse(circuito.fuente), `${donde}: fuente inválida`);
    }
}

export function validarPalabras(palabras: Palabra[]): void {
    const vistas = new Set<string>();

    for (const palabra of palabras) {
        exigir(/^[A-ZÑ]+$/.test(palabra), `"${palabra}" debe ser solo A-Z/Ñ en mayúsculas`);
        exigir(
            palabra.length >= LARGO_MINIMO_PALABRA && palabra.length <= LARGO_MAXIMO_PALABRA,
            `"${palabra}" debe tener entre ${LARGO_MINIMO_PALABRA} y ${LARGO_MAXIMO_PALABRA} letras`
        );
        exigir(!vistas.has(palabra), `palabra repetida: ${palabra}`);
        vistas.add(palabra);
    }
}
