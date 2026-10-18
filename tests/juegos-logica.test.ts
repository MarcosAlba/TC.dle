// Lógica propia de cada modo (la que antes vivía mezclada con el DOM).
import { describe, expect, it } from "vitest";
import pilotos from "../src/data/pilotos.json";
import circuitos from "../src/data/circuitos.json";
import { calendarioTC } from "../src/data/calendario";
import type { Circuito, Piloto } from "../src/data/tipos";
import { generarOpcionesAnio, obtenerEstiloDesenfoque, obtenerNivelDesenfoque } from "../src/lib/autos";
import { obtenerProximaCarrera, obtenerTiempoRestante } from "../src/lib/calendario";
import {
    obtenerDetalleCircuito,
    obtenerEtiquetaCircuito,
    obtenerTextoBusquedaCircuito,
    tieneVariantes,
} from "../src/lib/circuitos";
import { buscarElementos } from "../src/lib/buscador";
import { JUEGOS } from "../src/lib/juegos";
import { calcularEdad, compararPiloto, obtenerPistasPiloto } from "../src/lib/pilotos";
import { contarPendientes, obtenerSiguienteJuego, type JuegoConEstado } from "../src/lib/rachas";

const todosPilotos = pilotos as Piloto[];
const piloto = (id: number) => todosPilotos.find((item) => item.id === id)!;

describe("piloto: comparación de intentos", () => {
    const hoy = new Date(2026, 9, 17);

    it("el mismo piloto acierta todo", () => {
        const canapino = piloto(1);
        const comparacion = compararPiloto(canapino, canapino, hoy);

        expect(comparacion).toMatchObject({ acerto: true, marca: true, equipo: true, localidad: "coincide", campeon: true });
        expect(comparacion.edad).toMatchObject({ estado: "coincide", direccion: null });
        expect(comparacion.debut).toMatchObject({ estado: "coincide", direccion: null });
    });

    it("una misma provincia da 'cerca' y los números dan la dirección del valor buscado", () => {
        const secreto = { ...piloto(1), localidad: "Rosario, Santa Fe", provincia: "Santa Fe", anioDebutTC: 2009 };
        const intento = { ...piloto(2), localidad: "Rafaela, Santa Fe", provincia: "Santa Fe", anioDebutTC: 2015 };
        const comparacion = compararPiloto(intento, secreto, hoy);

        expect(comparacion.acerto).toBe(false);
        expect(comparacion.localidad).toBe("cerca");
        expect(comparacion.debut).toEqual({ valor: 2015, estado: "no-coincide", direccion: "menor" });
    });

    it("un número a dos años o menos es 'cerca' pero conserva la flecha", () => {
        const secreto = { ...piloto(1), anioDebutTC: 2010 };

        expect(compararPiloto({ ...piloto(2), anioDebutTC: 2008 }, secreto, hoy).debut).toEqual({
            valor: 2008,
            estado: "cerca",
            direccion: "mayor",
        });
    });

    it("la localidad se compara sin tildes ni mayúsculas", () => {
        const secreto = { ...piloto(1), localidad: "Río Cuarto, Córdoba", provincia: "Córdoba" };

        expect(compararPiloto({ ...piloto(2), localidad: "rio cuarto, cordoba", provincia: "Córdoba" }, secreto, hoy).localidad).toBe("coincide");
    });
});

describe("piloto: edad", () => {
    it("cuenta el cumpleaños del año y las leyendas fallecidas muestran la edad al morir", () => {
        expect(calcularEdad({ fechaNacimiento: "1990-01-19" }, new Date(2026, 0, 18))).toBe(35);
        expect(calcularEdad({ fechaNacimiento: "1990-01-19" }, new Date(2026, 0, 19))).toBe(36);
        expect(calcularEdad({ fechaNacimiento: "1911-06-24", fechaFallecimiento: "1995-07-17" }, new Date(2026, 0, 1))).toBe(84);
    });
});

describe("piloto: pistas", () => {
    it("el verbo cambia para las leyendas y una pista sin dato no tiene texto", () => {
        const activo = { ...piloto(1), numeroAuto: 1, datoPeculiar: null, estadisticaDestacada: null, retirado: undefined };
        const leyenda = { ...piloto(1), numeroAuto: 7, retirado: true, estadisticaDestacada: { tipo: "series" as const, valor: 4 } };

        expect(obtenerPistasPiloto(activo).map((pista) => pista.texto)).toEqual(["Corre con el número 1.", null, null]);
        expect(obtenerPistasPiloto(leyenda).map((pista) => pista.texto)[0]).toBe("Corría con el número 7.");
        expect(obtenerPistasPiloto(leyenda)[2].texto).toBe("Series ganadas: 4.");
        expect(obtenerPistasPiloto(activo).map((pista) => pista.intentos)).toEqual([3, 5, 7]);
    });

    it("las pistas aparecen con el dato cargado", () => {
        expect(obtenerPistasPiloto(piloto(1))[1].texto).toMatch(/18 campeonatos/);
    });
});

describe("auto: desenfoque y ronda del año", () => {
    it("el desenfoque baja con cada intento y desaparece al terminar", () => {
        expect(obtenerNivelDesenfoque(0, false)).toBe(24);
        expect(obtenerNivelDesenfoque(3, false)).toBe(12);
        expect(obtenerNivelDesenfoque(20, false)).toBe(0);
        expect(obtenerNivelDesenfoque(2, true)).toBe(0);
        expect(obtenerEstiloDesenfoque(24)).toEqual({ desenfoque: "1.5rem", brillo: "0.72", escala: "1.08" });
        expect(obtenerEstiloDesenfoque(0)).toEqual({ desenfoque: "0rem", brillo: "1", escala: "1" });
    });

    it("las opciones de año son 5, ordenadas, incluyen el real y no pasan del año tope", () => {
        const opciones = generarOpcionesAnio(2018, "anio:2026-10-17:3:2018", 2026);

        expect(opciones).toHaveLength(5);
        expect(opciones).toContain(2018);
        expect(opciones).toEqual([...opciones].sort((a, b) => a - b));
        expect(new Set(opciones).size).toBe(5);
        expect(Math.max(...opciones)).toBeLessThanOrEqual(2026);
        expect(opciones.every((anio) => Math.abs(anio - 2018) < 8)).toBe(true);
    });

    it("son las mismas durante todo el día y cambian con la semilla", () => {
        const semilla = "anio:2026-10-17:3:2018";

        expect(generarOpcionesAnio(2018, semilla, 2026)).toEqual(generarOpcionesAnio(2018, semilla, 2026));
        expect(generarOpcionesAnio(2018, "otra", 2026)).not.toEqual(generarOpcionesAnio(2018, semilla, 2026));
    });

    it("con el año real pegado al tope no inventa años futuros", () => {
        expect(generarOpcionesAnio(2026, "x", 2026).every((anio) => anio <= 2026)).toBe(true);
    });
});

describe("circuito: etiquetas y búsqueda", () => {
    const catalogo = circuitos as Circuito[];
    const circuito = (id: string) => catalogo.find((item) => item.id === id)!;

    it("la variante principal no se repite en la etiqueta y las otras sí", () => {
        expect(obtenerEtiquetaCircuito(circuito("la-plata-sin-chicana"), catalogo)).toBe(
            "Autódromo Roberto Mouras — Circuito largo sin chicana"
        );
        const unico = catalogo.find((item) => item.variante === "Circuito principal" && catalogo.every((otro) => otro.id === item.id || otro.nombre !== item.nombre))!;
        expect(obtenerEtiquetaCircuito(unico, catalogo)).toBe(unico.nombre);
    });

    it("si dos circuitos se llamarían igual, la etiqueta suma la ciudad", () => {
        // Balcarce y Rosario tienen un autódromo "Juan Manuel Fangio" con la misma variante.
        expect(obtenerEtiquetaCircuito(circuito("balcarce"), catalogo)).toBe("Autódromo Juan Manuel Fangio (Balcarce)");
        expect(obtenerEtiquetaCircuito(circuito("rosario"), catalogo)).toBe("Autódromo Juan Manuel Fangio (Rosario)");
        expect(obtenerEtiquetaCircuito(circuito("balcarce"), [circuito("balcarce")])).toBe("Autódromo Juan Manuel Fangio");
    });

    it("las variantes de una misma sede se detectan", () => {
        expect(tieneVariantes(circuito("la-plata-sin-chicana"), catalogo)).toBe(true);
        expect(tieneVariantes(circuito("balcarce"), catalogo)).toBe(false);
        expect(obtenerDetalleCircuito(circuito("balcarce"))).toBe("Balcarce");
    });

    it("se encuentra por nombre, ciudad o alias, sin tildes", () => {
        const config = {
            elementos: catalogo,
            obtenerEtiqueta: (item: Circuito) => obtenerEtiquetaCircuito(item, catalogo),
            obtenerTextoBusqueda: obtenerTextoBusquedaCircuito,
        };

        expect(buscarElementos(config, "fangio").map((item) => item.id)).toContain("balcarce");
        expect(buscarElementos(config, "autodromo roberto mou").length).toBeGreaterThan(0);
    });
});

describe("conexión entre juegos", () => {
    const juegos = (estados: Record<string, "acertado" | "fallado" | "pendiente">): JuegoConEstado[] =>
        JUEGOS.map((juego) => ({ ...juego, estado: estados[juego.id] ?? "pendiente", racha: 0 }));

    it("sugiere el próximo pendiente después del actual, dando la vuelta", () => {
        const lista = juegos({ circuito: "acertado" });

        expect(obtenerSiguienteJuego("piloto", lista)?.id).toBe("auto");
        expect(obtenerSiguienteJuego("auto", lista)?.id).toBe("wordle");
        expect(obtenerSiguienteJuego("wordle", lista)?.id).toBe("piloto");
        expect(contarPendientes("piloto", lista)).toBe(2);
    });

    it("sin pendientes no hay siguiente", () => {
        const lista = juegos({ piloto: "acertado", auto: "fallado", circuito: "acertado", wordle: "acertado" });

        expect(obtenerSiguienteJuego("piloto", lista)).toBeNull();
        expect(contarPendientes("piloto", lista)).toBe(0);
    });
});

describe("portada: próxima carrera", () => {
    it("toma la primera que todavía no largó, sin importar el orden de la lista", () => {
        const desordenado = [...calendarioTC].reverse();

        expect(obtenerProximaCarrera(desordenado, new Date("2026-10-10T12:00:00-03:00"))?.fecha).toBe(13);
        expect(obtenerProximaCarrera(desordenado, new Date("2026-10-25T14:00:01-03:00"))?.fecha).toBe(14);
    });

    it("sin carreras por delante devuelve null", () => {
        expect(obtenerProximaCarrera(calendarioTC, new Date("2027-01-01T00:00:00-03:00"))).toBeNull();
    });

    it("descompone el tiempo restante", () => {
        const inicio = new Date("2026-10-25T14:00:00-03:00");
        const ahora = new Date(inicio.getTime() - ((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000));

        expect(obtenerTiempoRestante(inicio, ahora)).toEqual({ dias: 2, horas: 3, minutos: 4, segundos: 5 });
        expect(obtenerTiempoRestante(inicio, new Date(inicio.getTime() + 5000))).toEqual({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
    });
});
