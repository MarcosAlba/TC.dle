<script lang="ts">
    // Adiviná el circuito: reconocer el trazado por su silueta.
    import { tick } from "svelte";
    import Buscador from "../components/Buscador.svelte";
    import ResultadoEnLinea from "../components/ResultadoEnLinea.svelte";
    import PanelIntento from "../components/PanelIntento.svelte";
    import { circuitos } from "../data/catalogo/circuitos";
    import type { Circuito } from "../data/tipos";
    import { obtenerAlmacenamiento } from "../lib/almacenamiento";
    import {
        calcularPistaUbicacion,
        obtenerDetalleCircuito,
        obtenerEtiquetaCircuito,
        obtenerTextoBusquedaCircuito,
        obtenerValoresExactosCircuito,
        tieneVariantes,
    } from "../lib/circuitos";
    import { claveDelDia, leerDiaJuego } from "../lib/dia-juego";
    import { palabraIntentos } from "../lib/intentos";
    import { mensajesDeBusqueda } from "../lib/mensajes";
    import { crearPartidaDiaria, migrarPartida } from "../lib/partida";
    import { construirTextoCompartir, filaIntentos } from "../lib/compartir";
    import { rutaOculta } from "../lib/nombre-oculto.js";
    import { urlImagen, urlSitio } from "../lib/rutas";
    import { obtenerSeleccionDiaria } from "../lib/seleccion-diaria";
    import { crearJuegoAdivinanza } from "./compartido/juego-adivinanza.svelte";

    const MAXIMO_INTENTOS = 8;
    // Hoy, o un día anterior del archivo (?dia=AAAA-MM-DD): ver lib/dia-juego.ts.
    const dia = leerDiaJuego(location.search);
    const fecha = dia.fecha;
    const secreto = obtenerSeleccionDiaria(circuitos, "circuitos", dia.fechaSeleccion)!;
    const etiqueta = (circuito: Circuito) => obtenerEtiquetaCircuito(circuito, circuitos);

    const juego = crearJuegoAdivinanza<Circuito, string>({
        partida: crearPartidaDiaria<string>({
            almacenamiento: obtenerAlmacenamiento(),
            clave: claveDelDia("partidaTCdleCircuito", dia),
            fecha,
            objetivoId: secreto.id,
            idsValidos: circuitos.map((circuito) => circuito.id),
            maximoIntentos: MAXIMO_INTENTOS,
            migrar: (datos) =>
                migrarPartida(datos, { campoObjetivo: "circuitoId", objetivoActual: secreto.id, maximoIntentos: MAXIMO_INTENTOS }),
        }),
        obtenerId: (circuito) => circuito.id,
        textos: {
            ...mensajesDeBusqueda("circuito"),
            ambiguo: "Ese autódromo tiene más de un trazado. Elegí una variante de la lista.",
        },
        alError: () => campoBuscador?.sacudir(),
    });

    let campoBuscador: ReturnType<typeof Buscador<Circuito>> | undefined = $state();
    let modal: ReturnType<typeof ResultadoEnLinea> | undefined = $state();
    /** Al acertar, una línea del color del tema da una vuelta al trazado (el SVG de la silueta, como contorno). */
    let vuelta = $state("");
    const DURACION_VUELTA = 1100;
    let estadoFinal: HTMLElement | undefined = $state();

    const estado = $derived(juego.estado);
    const historial = $derived(
        estado.idsIntentados
            .map((id) => circuitos.find((circuito) => circuito.id === id))
            .filter((circuito) => circuito !== undefined)
            .reverse()
    );
    // Copia con nombre oculto (lib/nombre-oculto.js): "balcarce.svg" regalaba la respuesta.
    const urlSilueta = urlImagen(rutaOculta("circuitos/" + secreto.imagen));

    const marcador = $derived({ puntaje: estado.acerto ? estado.intentosUsados : null, maximo: MAXIMO_INTENTOS, gano: estado.acerto });

    const armarTexto = (racha: number) =>
        construirTextoCompartir({
            juego: "circuito",
            fecha,
            puntaje: estado.acerto ? estado.intentosUsados : null,
            maximo: MAXIMO_INTENTOS,
            racha,
            filas: [filaIntentos(estado.intentosUsados, estado.acerto)],
            url: urlSitio(),
        });

    /** Baja el SVG de la silueta y lo deja como contorno animado encima de la imagen. */
    async function dibujarVuelta() {
        try {
            const texto = await (await fetch(urlSilueta)).text();
            const svg = new DOMParser().parseFromString(texto, "image/svg+xml").querySelector("svg");
            if (!svg) {
                return;
            }
            if (!svg.getAttribute("viewBox")) {
                svg.setAttribute("viewBox", "0 0 " + svg.getAttribute("width") + " " + svg.getAttribute("height"));
            }
            svg.removeAttribute("width");
            svg.removeAttribute("height");
            svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
            svg.setAttribute("aria-hidden", "true");
            svg.setAttribute("class", "vuelta-circuito");
            svg.querySelectorAll("path").forEach((camino) => camino.setAttribute("pathLength", "100"));
            vuelta = svg.outerHTML;
        } catch {
            // Sin la vuelta, el resultado aparece igual.
        }
    }

    async function abrirModal() {
        if (juego.estado.acerto && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            await dibujarVuelta();
        }
        await tick();
        modal?.abrir();
    }

    function intentar() {
        const resolucion = campoBuscador!.resolver();
        const elegido = juego.validar(campoBuscador!.obtenerValor(), resolucion);

        if (!elegido) {
            if (resolucion.ambiguo && campoBuscador!.obtenerValor().trim() !== "") {
                campoBuscador!.buscar();
            }
            return;
        }

        const resultado = juego.jugar(elegido);
        campoBuscador!.limpiar();

        if (resultado === "correcta") {
            juego.mostrarMensaje("¡Correcto! Reconociste el trazado.", "exito");
            abrirModal();
        } else if (resultado === "agotada") {
            juego.mostrarMensaje("Se terminaron los intentos.", "error");
            abrirModal();
        } else {
            const pista = calcularPistaUbicacion(elegido, secreto);
            juego.mostrarMensaje(
                pista.mismaSede
                    ? "Es ese autódromo, pero con otro trazado."
                    : "No es ese circuito. El del día está a " + pista.km.toLocaleString("es-AR") + " km hacia el " + pista.direccion + "."
            );
        }

        if (!juego.estado.terminada) {
            campoBuscador!.enfocar();
        }
    }
</script>

<section class="tarjeta-desafio tarjeta-desafio--suelta tarjeta-desafio--foto" aria-label="Circuito del día">
    <div class="marco-circuito">
        <div class="marco-circuito__silueta">
            <img
                class="foto-circuito"
                src={urlSilueta}
                draggable="false"
                alt={estado.terminada ? "Silueta de " + etiqueta(secreto) : "Silueta del circuito del día"}
            />
            {#if vuelta}
                <!-- El SVG es un archivo propio del sitio (public/assets/images/circuitos). -->
                {@html vuelta}
            {/if}
        </div>
    </div>

    <div class="estado-diario">
        <div
            bind:this={estadoFinal}
            class="estado-final"
            class:estado-final--correcto={estado.acerto}
            class:solo-lectores={true}
            tabindex="-1"
            hidden={!estado.terminada}
        >
            <!-- La respuesta entra a la página recién al terminar: antes se podía leer con "Inspeccionar". -->
            {#if estado.terminada}
                <span>{estado.acerto ? "¡Correcto!" : "El circuito era"}</span>
                <strong>{etiqueta(secreto)}</strong>
            {/if}
        </div>
    </div>
</section>

<PanelIntento
    id="panel-intento-circuito"
    titulo="Elegí un trazado"
    oculto={estado.terminada}
    deshabilitado={estado.terminada}
    alIntentar={intentar}
>
    {#snippet buscador()}
        <Buscador
            bind:this={campoBuscador}
            id="nombre-circuito"
            idLista="sugerencias-circuitos"
            placeholder="Nombre del circuito"
            etiquetaCampo="Nombre del circuito"
            consejoVacio="Probá con la ciudad o el autódromo."
            deshabilitado={estado.terminada}
            elementos={circuitos}
            obtenerEtiqueta={etiqueta}
            obtenerTextoBusqueda={obtenerTextoBusquedaCircuito}
            obtenerValoresExactos={(circuito: Circuito) => obtenerValoresExactosCircuito(circuito, circuitos)}
            estaExcluido={(circuito: Circuito) => estado.idsIntentados.includes(circuito.id)}
            alEnviar={intentar}
            invalido={juego.entradaInvalida}
            idMensaje="mensaje-circuito"
            alCambiar={() => juego.mostrarMensaje("")}
        >
            <!-- Sin silueta: la miniatura regalaba la respuesta del día. -->
            {#snippet opcion(circuito: Circuito)}
                <span class="buscador__contenido">
                    <strong>{circuito.nombre}</strong>
                    <span>{obtenerDetalleCircuito(circuito)}</span>
                </span>
            {/snippet}
        </Buscador>
    {/snippet}
    {#snippet pie()}
        <p id="mensaje-circuito" class={"mensaje-juego" + (juego.mensaje.tipo ? " mensaje-juego--" + juego.mensaje.tipo : "")} aria-live="polite">
            {juego.mensaje.texto}
        </p>
    {/snippet}
</PanelIntento>

<ResultadoEnLinea
    bind:this={modal}
    juego="circuito"
    {fecha}
    terminada={estado.terminada}
    correcto={estado.acerto}
    nombre={etiqueta(secreto)}
    detalle={estado.acerto
        ? "Lo reconociste en " + estado.intentosUsados + " " + palabraIntentos(estado.intentosUsados) + "."
        : "No lo reconociste en los " + MAXIMO_INTENTOS + " intentos."}
    {armarTexto}
    {marcador}
    espera={vuelta ? DURACION_VUELTA : 0}
/>

<!-- Al terminar la lista de intentos se va: la página queda con el trazado y el resultado. -->
{#if historial.length > 0 && !estado.terminada}
    <section id="historial-circuito" class="historial-intentos" aria-labelledby="titulo-historial-circuito">
        <div class="titulo-seccion">
            <span></span>
            <h2 id="titulo-historial-circuito">Intentos</h2>
        </div>
        <div class="lista-intentos">
            {#each historial as circuito (circuito.id)}
                {@const acerto = circuito.id === secreto.id}
                <article class={"intento intento--circuito" + (acerto ? " intento--correcto" : "")} aria-label={etiqueta(circuito) + ": " + (acerto ? "correcto" : "incorrecto")}>
                    <div class="intento__nombre">
                        <strong>{circuito.nombre}</strong>
                        {#if tieneVariantes(circuito, circuitos)}
                            <span>{circuito.variante}</span>
                        {/if}
                    </div>
                    {#if !acerto}
                        {@const pista = calcularPistaUbicacion(circuito, secreto)}
                        <div class="intento__ubicacion" aria-label={pista.mismaSede ? "mismo autódromo, otro trazado" : pista.km.toLocaleString("es-AR") + " km hacia el " + pista.direccion}>
                            <b class="intento__km">{pista.mismaSede ? "Mismo lugar" : pista.km.toLocaleString("es-AR") + " km"}</b>
                            {#if !pista.mismaSede}
                                <span class="intento__flecha" title={"Hacia el " + pista.direccion}><i style:rotate={pista.grados + "deg"}>↑</i></span>
                            {/if}
                            <span class="intento__cercania" style:--cercania={pista.cercania + "%"}>{pista.cercania}%</span>
                        </div>
                    {/if}
                </article>
            {/each}
        </div>
    </section>
{/if}
