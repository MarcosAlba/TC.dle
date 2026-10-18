// Núcleo compartido: texto, fechas, búsqueda, partida diaria, migraciones y rachas.
import { describe, expect, it } from "vitest";
import { crearAlmacenamientoEnMemoria } from "../src/lib/almacenamiento";
import { buscarElementos, resolverEntrada } from "../src/lib/buscador";
import { crearDatoDiario } from "../src/lib/dato-diario";
import { obtenerFechaAnterior, obtenerFechaLocal, obtenerTiempoHastaMedianoche } from "../src/lib/fechas";
import { crearPartidaDiaria, migrarPartida } from "../src/lib/partida";
import { obtenerRacha } from "../src/lib/rachas";
import { normalizarTexto } from "../src/lib/texto";
import { obtenerApellidoPiloto, obtenerImagenMiniPiloto } from "../src/lib/pilotos";

describe("texto y fechas", () => {
    it("normaliza texto", () => {
        expect(normalizarTexto("  Autódromo N.º 1  ")).toBe("autodromo n 1");
    });

    it("da la fecha local y el tiempo hasta la medianoche", () => {
        expect(obtenerFechaLocal(new Date(2026, 7, 7, 23))).toBe("2026-08-07");
        expect(obtenerTiempoHastaMedianoche(new Date(2026, 7, 7, 23, 59, 50))).toBe("00:00:10");
    });

    it("calcula el día anterior cruzando mes y año", () => {
        expect(obtenerFechaAnterior("2026-09-01")).toBe("2026-08-31");
        expect(obtenerFechaAnterior("2026-01-01")).toBe("2025-12-31");
    });
});

describe("búsqueda", () => {
    const elementos = [
        { id: 1, nombre: "Agustín Canapino" },
        { id: 2, nombre: "Mauricio Lambiris" },
        { id: 3, nombre: "Matías Canapino" },
        { id: 4, nombre: "Santiago Alvarez" },
        { id: 5, nombre: "Agustín Martínez" },
    ];
    type Elemento = (typeof elementos)[number];
    const ids = (resultado: Elemento[]) => resultado.map((item) => item.id);

    it("excluye elementos y busca por prefijo", () => {
        const encontrados = buscarElementos(
            {
                elementos,
                obtenerEtiqueta: (item) => item.nombre,
                obtenerTextoBusqueda: (item) => item.nombre,
                estaExcluido: (item) => item.id === 3,
            },
            "cana"
        );
        expect(ids(encontrados)).toEqual([1]);
    });

    // Búsqueda de pilotos: una letra mira solo el apellido, y de dos en adelante
    // coincide por prefijo de palabra (nombre o apellido), nunca en medio de una.
    const configPilotos = {
        elementos,
        minimoCaracteres: 1,
        obtenerEtiqueta: (item: Elemento) => item.nombre,
        obtenerTextoBusqueda: (item: Elemento) => item.nombre,
        obtenerTextoCorto: obtenerApellidoPiloto,
    };

    it("con una letra mira solo el apellido", () => {
        expect(ids(buscarElementos(configPilotos, "a"))).toEqual([4]);
        expect(ids(buscarElementos(configPilotos, "al"))).toEqual([4]);
    });

    it("coincide por prefijo de palabra del nombre", () => {
        expect(ids(buscarElementos(configPilotos, "agustin"))).toEqual([1, 5]);
        expect(buscarElementos(configPilotos, "usti")).toEqual([]);
    });

    it("el apellido ordena primero aunque el nombre de pila también coincida", () => {
        expect(ids(buscarElementos(configPilotos, "ma"))).toEqual([5, 3, 2]);
    });

    it("en consultas de varias palabras cada término arranca alguna palabra", () => {
        expect(ids(buscarElementos(configPilotos, "agustin cana"))).toEqual([1]);
        expect(buscarElementos(configPilotos, "agustin lambiris")).toEqual([]);
    });

    it("no busca por debajo del mínimo de caracteres", () => {
        expect(buscarElementos({ ...configPilotos, minimoCaracteres: 2 }, "a")).toEqual([]);
    });

    describe("resolver lo que escribió el jugador", () => {
        const circuitos = [
            { id: "a", nombre: "Autódromo X", alias: ["Equis"] },
            { id: "b", nombre: "Autódromo X", alias: ["Equis largo"] },
            { id: "c", nombre: "Rafaela", alias: [] },
        ];
        const config = {
            elementos: circuitos,
            obtenerEtiqueta: (item: (typeof circuitos)[number]) => item.nombre,
            obtenerValoresExactos: (item: (typeof circuitos)[number]) => [item.nombre, ...item.alias],
        };

        it("usa el elemento elegido de la lista si el texto no cambió", () => {
            expect(resolverEntrada(config, "Autódromo X", circuitos[1], [])).toEqual({ elemento: circuitos[1], ambiguo: false });
        });

        it("avisa cuando el texto coincide exacto con más de un elemento", () => {
            expect(resolverEntrada(config, "autodromo x", null, [])).toEqual({ elemento: null, ambiguo: true });
        });

        it("acepta una respuesta alternativa exacta", () => {
            expect(resolverEntrada(config, "equis largo", null, []).elemento).toBe(circuitos[1]);
        });

        it("sin coincidencia exacta toma la primera sugerencia a la vista", () => {
            expect(resolverEntrada(config, "rafa", null, [circuitos[2]]).elemento).toBe(circuitos[2]);
            expect(resolverEntrada(config, "zzz", null, []).elemento).toBeNull();
        });
    });
});

describe("dato diario", () => {
    it("sobrevive dentro del mismo día y se descarta al cambiar de fecha", () => {
        const almacenamiento = crearAlmacenamientoEnMemoria();
        const datoHoy = crearDatoDiario<number>({ almacenamiento, clave: "anioAuto", fecha: "2026-08-07" });

        expect(datoHoy.leer()).toBeNull();
        datoHoy.guardar(2015);
        expect(datoHoy.leer()).toBe(2015);
        expect(crearDatoDiario({ almacenamiento, clave: "anioAuto", fecha: "2026-08-08" }).leer()).toBeNull();
        datoHoy.limpiar();
        expect(datoHoy.leer()).toBeNull();
    });
});

describe("partida diaria", () => {
    it("valida, repite, acierta y bloquea", () => {
        const juego = crearPartidaDiaria<number>({
            almacenamiento: crearAlmacenamientoEnMemoria(),
            clave: "partida",
            fecha: "2026-08-07",
            objetivoId: 3,
            idsValidos: [1, 2, 3, 4],
            maximoIntentos: 3,
        });

        expect(juego.intentar(99).resultado).toBe("invalida");
        expect(juego.intentar(1).resultado).toBe("incorrecta");
        expect(juego.intentar(1).resultado).toBe("repetida");
        expect(juego.intentar(3).resultado).toBe("correcta");
        expect(juego.intentar(2).resultado).toBe("bloqueada");
        expect(juego.estado().idsIntentados).toEqual([1, 3]);
    });

    // validarId permite aceptar intentos que no salen de un catálogo fijo
    // (por ejemplo, el Wordle acepta cualquier palabra del largo correcto).
    const validarCincoLetras = (id: unknown) => typeof id === "string" && id.length === 5;

    it("acepta intentos que valida una función propia", () => {
        const juego = crearPartidaDiaria<string>({
            almacenamiento: crearAlmacenamientoEnMemoria(),
            clave: "partidaLibre",
            fecha: "2026-08-07",
            objetivoId: "GATOX",
            maximoIntentos: 3,
            validarId: validarCincoLetras,
        });

        expect(juego.intentar("MAL").resultado).toBe("invalida");
        expect(juego.intentar("PERRO").resultado).toBe("incorrecta");
        expect(juego.intentar("PERRO").resultado).toBe("repetida");
        expect(juego.intentar("GATOX").resultado).toBe("correcta");
    });

    it("al recargar, validarId también filtra qué intentos guardados son válidos", () => {
        const almacenamiento = crearAlmacenamientoEnMemoria();
        almacenamiento.setItem(
            "partidaRestaurada",
            JSON.stringify({
                version: 2,
                fecha: "2026-08-07",
                objetivoId: "GATOX",
                idsIntentados: ["PERRO", "MAL", "GATOX"],
                terminada: true,
            })
        );
        const juego = crearPartidaDiaria<string>({
            almacenamiento,
            clave: "partidaRestaurada",
            fecha: "2026-08-07",
            objetivoId: "GATOX",
            maximoIntentos: 3,
            validarId: validarCincoLetras,
        });

        expect(juego.cargar().idsIntentados).toEqual(["PERRO", "GATOX"]);
    });

    it("se agota al llegar al máximo de intentos", () => {
        const juego = crearPartidaDiaria({
            almacenamiento: crearAlmacenamientoEnMemoria(),
            clave: "agotada",
            fecha: "2026-08-07",
            objetivoId: 4,
            idsValidos: [1, 2, 3, 4],
            maximoIntentos: 2,
        });

        expect(juego.intentar(1).resultado).toBe("incorrecta");
        expect(juego.intentar(2).resultado).toBe("agotada");
    });

    it("descarta partidas guardadas corruptas o de otro día", () => {
        for (const contenido of ["{", JSON.stringify({ fecha: "2026-08-06" })]) {
            const corrupto = crearAlmacenamientoEnMemoria();
            corrupto.setItem("partida", contenido);
            const nuevo = crearPartidaDiaria({
                almacenamiento: corrupto,
                clave: "partida",
                fecha: "2026-08-07",
                objetivoId: 1,
                idsValidos: [1],
            });

            expect(nuevo.cargar().intentosUsados).toBe(0);
            expect(corrupto.getItem("partida")).toBeNull();
        }
    });
});

describe("migraciones de partidas con formato viejo", () => {
    it("pasa la partida de pilotos al formato 2 y descarta ids inválidos o repetidos", () => {
        const legado = crearAlmacenamientoEnMemoria();
        legado.setItem(
            "pilotos",
            JSON.stringify({ fecha: "Fri Aug 07 2026", cantidadIntentos: 4, pilotosIntentados: [1, 1, 2, 999] })
        );
        const juego = crearPartidaDiaria({
            almacenamiento: legado,
            clave: "pilotos",
            fecha: "2026-08-07",
            objetivoId: 3,
            idsValidos: [1, 2, 3],
            migrar: (datos) =>
                migrarPartida(datos, { campoIntentos: "pilotosIntentados", objetivoActual: 3, maximoIntentos: 8 }),
        });

        expect(juego.cargar().idsIntentados).toEqual([1, 2]);
        expect(JSON.parse(legado.getItem("pilotos")!).version).toBe(2);
    });

    it("migra la partida vieja del auto", () => {
        const autoLegado = migrarPartida(
            { fecha: "Fri Aug 07 2026", autoPilotoId: 7, idsIntentados: [2, 7], terminada: true },
            { campoObjetivo: "autoPilotoId", objetivoActual: 7, maximoIntentos: 8 }
        );

        expect(autoLegado.fecha).toBe("2026-08-07");
        expect(autoLegado.objetivoId).toBe(7);
        expect(autoLegado.terminada).toBe(true);
    });

    it("migra la partida vieja del circuito", () => {
        const circuitoLegado = migrarPartida(
            { fecha: "2026-08-07", circuitoId: "rafaela", idsIntentados: ["parana"] },
            { campoObjetivo: "circuitoId", objetivoActual: "rafaela", maximoIntentos: 8 }
        );

        expect(circuitoLegado.objetivoId).toBe("rafaela");
        expect(circuitoLegado.idsIntentados).toEqual(["parana"]);
    });
});

describe("rachas", () => {
    // Suman con aciertos en días seguidos y se cortan al perder o saltear.
    const almacenamiento = crearAlmacenamientoEnMemoria();

    function jugarCircuito(fecha: string, acertar: boolean) {
        crearPartidaDiaria({
            almacenamiento,
            clave: "partidaTCdleCircuito",
            fecha,
            objetivoId: 1,
            idsValidos: [1, 2],
            maximoIntentos: 1,
        }).intentar(acertar ? 1 : 2);
    }

    it("suma, se mantiene un día, se corta al saltear o perder y cruza el cambio de mes", () => {
        jugarCircuito("2026-08-06", true);
        jugarCircuito("2026-08-07", true);
        expect(obtenerRacha(almacenamiento, "circuito", "2026-08-07")).toBe(2);
        expect(obtenerRacha(almacenamiento, "circuito", "2026-08-08"), "La racha sigue viva el día siguiente hasta jugar").toBe(2);
        expect(obtenerRacha(almacenamiento, "circuito", "2026-08-09"), "Saltear un día corta la racha").toBe(0);
        jugarCircuito("2026-08-08", false);
        expect(obtenerRacha(almacenamiento, "circuito", "2026-08-08"), "Perder reinicia la racha").toBe(0);
        jugarCircuito("2026-08-09", true);
        expect(obtenerRacha(almacenamiento, "circuito", "2026-08-09")).toBe(1);
        jugarCircuito("2026-08-31", true);
        jugarCircuito("2026-09-01", true);
        expect(obtenerRacha(almacenamiento, "circuito", "2026-09-01"), "La racha cruza el cambio de mes").toBe(2);
    });
});

describe("miniaturas de pilotos", () => {
    it("el buscador y la tabla usan pilotos/mini/*.webp", () => {
        expect(obtenerImagenMiniPiloto({ foto: "pilotos/agustin_canapino.webp" })).toBe("pilotos/mini/agustin_canapino.webp");
        expect(obtenerImagenMiniPiloto({ foto: "pilotos/osvaldo_morresi.avif" })).toBe("pilotos/mini/osvaldo_morresi.webp");
        // También con una URL completa, como la usaba el sitio plano.
        expect(obtenerImagenMiniPiloto({ foto: "http://localhost/assets/images/pilotos/agustin_canapino.webp" })).toBe(
            "http://localhost/assets/images/pilotos/mini/agustin_canapino.webp"
        );
    });
});
