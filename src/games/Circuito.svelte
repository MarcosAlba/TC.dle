<script lang="ts">
    // Adiviná el circuito: reconocer el trazado por su silueta.
    import { tick } from "svelte";
    import Buscador from "../components/Buscador.svelte";
    import CuentaRegresiva from "../components/CuentaRegresiva.svelte";
    import ModalResultado from "../components/ModalResultado.svelte";
    import PanelIntento from "../components/PanelIntento.svelte";
    import { circuitos } from "../data";
    import type { Circuito } from "../data/tipos";
    import { obtenerAlmacenamiento } from "../lib/almacenamiento";
    import {
        obtenerDetalleCircuito,
        obtenerEtiquetaCircuito,
        obtenerTextoBusquedaCircuito,
        obtenerValoresExactosCircuito,
        tieneVariantes,
    } from "../lib/circuitos";
    import { obtenerFechaLocal } from "../lib/fechas";
    import { describirContador, palabraIntentos } from "../lib/intentos";
    import { crearPartidaDiaria, migrarPartida } from "../lib/partida";
    import { construirTextoCompartir, filaIntentos } from "../lib/compartir";
    import { urlImagen, urlSitio } from "../lib/rutas";
    import { obtenerSeleccionDiaria } from "../lib/seleccion-diaria";
    import { crearJuegoAdivinanza } from "./compartido/juego-adivinanza.svelte";

    const MAXIMO_INTENTOS = 8;
    const fecha = obtenerFechaLocal();
    const secreto = obtenerSeleccionDiaria(circuitos, "circuitos")!;
    const etiqueta = (circuito: Circuito) => obtenerEtiquetaCircuito(circuito, circuitos);

    const juego = crearJuegoAdivinanza<Circuito, string>({
        partida: crearPartidaDiaria<string>({
            almacenamiento: obtenerAlmacenamiento(),
            clave: "partidaTCdleCircuito",
            fecha,
            objetivoId: secreto.id,
            idsValidos: circuitos.map((circuito) => circuito.id),
            maximoIntentos: MAXIMO_INTENTOS,
            migrar: (datos) =>
                migrarPartida(datos, { campoObjetivo: "circuitoId", objetivoActual: secreto.id, maximoIntentos: MAXIMO_INTENTOS }),
        }),
        obtenerId: (circuito) => circuito.id,
        textos: {
            vacio: "Ingresá o elegí un circuito.",
            ambiguo: "Ese autódromo tiene más de un trazado. Elegí una variante de la lista.",
            noEncontrado: "Ese circuito no está en la lista.",
            repetido: "Ya intentaste con ese trazado.",
        },
    });

    let campoBuscador: ReturnType<typeof Buscador<Circuito>> | undefined = $state();
    let modal: ReturnType<typeof ModalResultado> | undefined = $state();
    let estadoFinal: HTMLElement | undefined = $state();

    const estado = $derived(juego.estado);
    const contador = $derived(describirContador(estado));
    const historial = $derived(
        estado.idsIntentados
            .map((id) => circuitos.find((circuito) => circuito.id === id))
            .filter((circuito) => circuito !== undefined)
            .reverse()
    );
    const urlSilueta = urlImagen("circuitos/" + secreto.imagen);

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

    async function abrirModal() {
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
            juego.mostrarMensaje("No es ese circuito. La silueta permanece igual de nítida.");
        }

        if (!juego.estado.terminada) {
            campoBuscador!.enfocar();
        }
    }
</script>

<section class="tarjeta-desafio tarjeta-desafio--suelta tarjeta-desafio--foto" aria-label="Circuito del día">
    <div class="marco-circuito">
        <img
            class="foto-circuito"
            src={urlSilueta}
            alt={estado.terminada ? "Silueta de " + etiqueta(secreto) : "Silueta del circuito del día"}
        />
    </div>

    <div class="estado-diario">
        <p class="contador-intentos" class:contador-intentos--ultimo={contador.ultimo} aria-live="polite" hidden={estado.terminada}>
            {contador.texto}
        </p>
        <div
            bind:this={estadoFinal}
            class="estado-final"
            class:estado-final--correcto={estado.acerto}
            class:solo-lectores={estado.acerto}
            tabindex="-1"
            hidden={!estado.terminada}
        >
            <span>{estado.acerto ? "¡Correcto!" : "El circuito era"}</span>
            <strong>{etiqueta(secreto)}</strong>
        </div>
        <!-- Al acertar, el contador sube a la fila de "Intentos". -->
        {#if !estado.acerto}
            <CuentaRegresiva etiqueta="Nuevo circuito en:" activa={estado.terminada} {fecha} />
        {/if}
    </div>
</section>

<PanelIntento
    id="panel-intento-circuito"
    titulo="Elegí un trazado"
    oculto={estado.acerto}
    deshabilitado={estado.terminada}
    alIntentar={intentar}
>
    {#snippet buscador()}
        <Buscador
            bind:this={campoBuscador}
            id="nombre-circuito"
            idLista="sugerencias-circuitos"
            placeholder="Escribí el nombre del circuito"
            etiquetaCampo="Nombre del circuito"
            deshabilitado={estado.terminada}
            elementos={circuitos}
            obtenerEtiqueta={etiqueta}
            obtenerTextoBusqueda={obtenerTextoBusquedaCircuito}
            obtenerValoresExactos={(circuito: Circuito) => obtenerValoresExactosCircuito(circuito, circuitos)}
            estaExcluido={(circuito: Circuito) => estado.idsIntentados.includes(circuito.id)}
            alEnviar={intentar}
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
        <p class={"mensaje-juego" + (juego.mensaje.tipo ? " mensaje-juego--" + juego.mensaje.tipo : "")} aria-live="polite">
            {juego.mensaje.texto}
        </p>
    {/snippet}
</PanelIntento>

{#if historial.length > 0}
    <section id="historial-circuito" class="historial-intentos" aria-labelledby="titulo-historial-circuito">
        <div class="titulo-seccion">
            <span></span>
            <h2 id="titulo-historial-circuito">Intentos</h2>
            {#if estado.acerto}
                <CuentaRegresiva etiqueta="Nuevo circuito en:" activa={estado.terminada} {fecha} />
            {/if}
        </div>
        <div class="lista-intentos">
            {#each historial as circuito (circuito.id)}
                {@const acerto = circuito.id === secreto.id}
                <article class={"intento intento--circuito" + (acerto ? " intento--correcto" : "")} aria-label={etiqueta(circuito) + ": " + (acerto ? "correcto" : "incorrecto")}>
                    <strong>{circuito.nombre}</strong>
                    {#if tieneVariantes(circuito, circuitos)}
                        <span>{circuito.variante}</span>
                    {/if}
                </article>
            {/each}
        </div>
    </section>
{/if}

<ModalResultado
    bind:this={modal}
    juego="circuito"
    {fecha}
    terminada={estado.terminada}
    correcto={estado.acerto}
    titulo={estado.acerto ? "¡Adivinaste!" : "No lo adivinaste"}
    resumen={estado.acerto ? "Ganaste en " + estado.intentosUsados : "Abandono"}
    {armarTexto}
    etiquetaRegreso="Nuevo circuito en:"
    clase="resultado-circuito-modal"
    focoRetorno={() => estadoFinal}
>
    <div class="resultado-circuito-modal__silueta">
        <img src={urlSilueta} alt={"Silueta de " + etiqueta(secreto)} />
    </div>
    <strong class="resultado-modal__nombre">{etiqueta(secreto)}</strong>
    <p class="resultado-modal__detalle">
        {estado.acerto
            ? "Lo resolviste en " + estado.intentosUsados + " " + palabraIntentos(estado.intentosUsados) + "."
            : "No lo adivinaste en los " + MAXIMO_INTENTOS + " intentos."}
    </p>
</ModalResultado>
