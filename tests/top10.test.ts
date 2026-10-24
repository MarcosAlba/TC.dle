// Top 10 de la carrera: logos, pilotos del buscador y la partida diaria.
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import carreras from "../src/data/carreras.json";
import pilotos from "../src/data/pilotos.json";
import type { Carrera, FotoCarrera, Piloto } from "../src/data/tipos";
import { crearAlmacenamientoEnMemoria } from "../src/lib/almacenamiento";
import { obtenerEstadoJuegos } from "../src/lib/rachas";
import {
    buscarPilotoCatalogo,
    crearPartidaTop10,
    FOTO_SILUETA,
    formatearCronometro,
    guardarOpcionesTop10,
    leerOpcionesTop10,
    obtenerSegundosRestantes,
    obtenerCarrerasJugables,
    obtenerFotoPilotoCarrera,
    obtenerIdPilotoCarrera,
    obtenerLogoMarca,
    obtenerNombreMarca,
    obtenerPilotosDeCarreras,
    separarNombre,
} from "../src/lib/top10";

const catalogo = carreras as Carrera[];
const imagenes = path.resolve(import.meta.dirname, "../public/assets/images");
const rosario = catalogo.find((carrera) => carrera.id === "2019-05-rosario")!;
const id = obtenerIdPilotoCarrera;

describe("datos del top 10", () => {
    it("toda marca de las carreras tiene un logo que existe", () => {
        const marcas = new Set(catalogo.flatMap((carrera) => carrera.resultados.map((resultado) => resultado.marca)));

        for (const marca of marcas) {
            const logo = obtenerLogoMarca(marca);
            expect(logo, `falta el logo de "${marca}"`).not.toBeNull();
            expect(existsSync(path.join(imagenes, logo!)), `no existe ${logo}`).toBe(true);
        }
    });

    it("usa el logo de la era de cada carrera", () => {
        expect(obtenerLogoMarca("Ford")).toBe("marcas/ford-clasico.png");
        expect(obtenerLogoMarca("Ford (Mustang)")).toBe("marcas/ford-logo.jpg");
        expect(obtenerNombreMarca("Torino (Torino NG)")).toBe("Torino");
        expect(obtenerNombreMarca("B M W")).toBe("BMW");
    });

    it("solo se juegan finales con diez clasificados o más", () => {
        const jugables = obtenerCarrerasJugables(catalogo);

        expect(jugables.length).toBeGreaterThan(200);
        expect(jugables.every((carrera) => carrera.resultados.length >= 10)).toBe(true);
    });

    it("el buscador ofrece cada piloto una sola vez", () => {
        const lista = obtenerPilotosDeCarreras(catalogo);

        expect(new Set(lista.map((piloto) => piloto.id)).size).toBe(lista.length);
        expect(lista.find((piloto) => piloto.id === "matias rossi")?.nombre).toBe("Matías Rossi");
    });

    it("cruza con el catálogo de pilotos para la foto, sin tildes de por medio", () => {
        expect(buscarPilotoCatalogo("Matías Rossi", pilotos as Piloto[])?.foto).toBe("pilotos/matias_rossi.webp");
        expect(buscarPilotoCatalogo("Piloto Inventado", pilotos as Piloto[])).toBeNull();
    });

    it("usa la foto del catálogo, si no la de la ACTC y, si no, la silueta", () => {
        const deCarrera: FotoCarrera = {
            piloto: "Matías Rodríguez",
            archivo: "rodriguez-matias.webp",
            origenUrl: "https://actc.org.ar/",
        };

        expect(obtenerFotoPilotoCarrera("Matías Rossi", pilotos as Piloto[], [deCarrera])).toBe("pilotos/mini/matias_rossi.webp");
        expect(obtenerFotoPilotoCarrera("Matias Rodriguez", pilotos as Piloto[], [deCarrera])).toBe("pilotos-carreras/rodriguez-matias.webp");
        expect(obtenerFotoPilotoCarrera("Gabriel Ponce de León", pilotos as Piloto[], [deCarrera])).toBe(FOTO_SILUETA);
        expect(existsSync(path.join(imagenes, FOTO_SILUETA))).toBe(true);
    });

    it("separa nombre y apellido con el apellido de la ACTC", () => {
        expect(separarNombre({ piloto: "Gabriel Ponce de León", apellido: "Ponce de León" })).toEqual({
            nombre: "Gabriel",
            apellido: "Ponce de León",
        });
        expect(separarNombre({ piloto: "Juan Martín Trucco", apellido: "Trucco" })).toEqual({ nombre: "Juan Martín", apellido: "Trucco" });
    });
});

describe("partida del top 10", () => {
    const idsValidos = obtenerPilotosDeCarreras(catalogo).map((piloto) => piloto.id);
    const nueva = (almacenamiento = crearAlmacenamientoEnMemoria()) => ({
        almacenamiento,
        partida: crearPartidaTop10({ almacenamiento, clave: "partidaTCdleTop10", carrera: rosario, idsValidos, fecha: "2026-10-23" }),
    });

    it("un piloto del top 10 se acomoda en su puesto", () => {
        const { partida } = nueva();
        partida.cargar();

        expect(partida.intentar(id("Christian Ledesma")).resultado).toEqual({ tipo: "acierto", posicion: 3 });
        expect(partida.estado().acertados).toEqual([3]);
    });

    it("un piloto que corrió pero no entró dice en qué puesto llegó", () => {
        const { partida } = nueva();

        expect(partida.intentar(id("Mariano Werner")).resultado).toEqual({ tipo: "error", posicion: 15 });
        expect(partida.estado().errores).toBe(1);
    });

    it("un piloto que no corrió esa final es error sin puesto, y repetir no cuenta", () => {
        const { partida } = nueva();
        const ausente = idsValidos.find((piloto) => !rosario.resultados.some((resultado) => id(resultado.piloto) === piloto))!;

        expect(partida.intentar(ausente).resultado).toEqual({ tipo: "error", posicion: null });
        expect(partida.intentar(ausente).resultado).toEqual({ tipo: "repetido" });
        expect(partida.intentar("nadie").resultado).toEqual({ tipo: "invalido" });
        expect(partida.estado().errores).toBe(1);
    });

    it("completar los diez gana, suma racha y bloquea", () => {
        const { almacenamiento, partida } = nueva();
        for (const resultado of rosario.resultados.slice(0, 10)) {
            partida.intentar(id(resultado.piloto));
        }

        expect(partida.estado()).toMatchObject({ terminada: true, gano: true, rendido: false });
        expect(partida.intentar(id("Mariano Werner")).resultado).toEqual({ tipo: "bloqueada" });
        expect(almacenamiento.getItem("rachasTCdle")).toBe('{"top10":{"fecha":"2026-10-23","racha":1}}');
    });

    it("rendirse termina sin ganar y corta la racha", () => {
        const { almacenamiento, partida } = nueva();
        partida.intentar(id("Matías Rossi"));

        expect(partida.rendirse()).toMatchObject({ terminada: true, gano: false, rendido: true, acertados: [1] });
        expect(almacenamiento.getItem("rachasTCdle")).toBe('{"top10":{"fecha":"2026-10-23","racha":0}}');
    });

    it("guarda el progreso con un formato fijo y lo recupera al recargar", () => {
        const { almacenamiento, partida } = nueva();
        partida.intentar(id("Matías Rossi"));
        partida.intentar(id("Mariano Werner"));

        expect(almacenamiento.getItem("partidaTCdleTop10")).toBe(
            '{"version":1,"fecha":"2026-10-23","carreraId":"2019-05-rosario","intentos":["matias rossi","mariano werner"],"rendido":false,"sinTiempo":false,"terminada":false,"gano":false}'
        );
        expect(nueva(almacenamiento).partida.cargar()).toMatchObject({ acertados: [1], errores: 1, terminada: false });
    });

    it("descarta la partida de otro día", () => {
        const { almacenamiento, partida } = nueva();
        partida.intentar(id("Matías Rossi"));
        const otroDia = crearPartidaTop10({ almacenamiento, clave: "partidaTCdleTop10", carrera: rosario, idsValidos, fecha: "2026-10-24" });

        expect(otroDia.cargar().intentos).toEqual([]);
        expect(almacenamiento.getItem("partidaTCdleTop10")).toBeNull();
    });

    it("con cronómetro, al llegar a cero termina sin ganar, también al volver a la página", () => {
        const almacenamiento = crearAlmacenamientoEnMemoria();
        const opciones = guardarOpcionesTop10(almacenamiento, { marcas: false, cronometro: true }, "2026-10-23", 1_000_000);
        let reloj = 1_000_000;
        const crear = () =>
            crearPartidaTop10({ almacenamiento, clave: "partidaTCdleTop10", carrera: rosario, idsValidos, fecha: "2026-10-23", opciones, ahora: () => reloj });
        const partida = crear();

        expect(leerOpcionesTop10(almacenamiento, "2026-10-23")).toEqual({ marcas: false, limiteSegundos: 120, inicio: 1_000_000 });
        expect(obtenerSegundosRestantes(opciones, reloj + 25_000)).toBe(95);
        expect(formatearCronometro(95)).toBe("1:35");

        partida.intentar(id("Matías Rossi"));
        reloj += 121_000;
        expect(partida.intentar(id("Christian Ledesma")).resultado).toEqual({ tipo: "bloqueada" });
        expect(partida.estado()).toMatchObject({ sinTiempo: true, terminada: true, gano: false, acertados: [1] });
        expect(crear().cargar()).toMatchObject({ sinTiempo: true, terminada: true });
        expect(almacenamiento.getItem("rachasTCdle")).toBe('{"top10":{"fecha":"2026-10-23","racha":0}}');
    });

    it("las opciones son del día y solo se cambian antes del primer intento", () => {
        const { almacenamiento, partida } = nueva();
        guardarOpcionesTop10(almacenamiento, { marcas: false, cronometro: false }, "2026-10-22");

        expect(leerOpcionesTop10(almacenamiento, "2026-10-23")).toBeNull();
        expect(partida.estado().opciones.marcas).toBe(true);
        expect(partida.configurar({ marcas: false, limiteSegundos: null, inicio: 1 }).opciones.marcas).toBe(false);
        partida.intentar(id("Matías Rossi"));
        expect(partida.configurar({ marcas: true, limiteSegundos: 120, inicio: 1 }).opciones).toEqual({ marcas: false, limiteSegundos: null, inicio: 1 });
    });

    it("la portada lo ve acertado o fallado como al resto", () => {
        const { almacenamiento, partida } = nueva();
        partida.rendirse();
        const estados = Object.fromEntries(obtenerEstadoJuegos(almacenamiento, "2026-10-23").map((juego) => [juego.id, juego.estado]));

        expect(estados.top10).toBe("fallado");
    });
});
