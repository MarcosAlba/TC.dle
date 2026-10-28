<script lang="ts">
    // Resultado al terminar la partida (un <dialog> nativo). En escritorio es una
    // ventana modal; en celular es un panel que sube desde abajo sin tapar el
    // tablero y, al cerrarlo, queda como una barra para volver a verlo o compartir.
    import type { Snippet } from "svelte";
    import { onMount } from "svelte";
    import { obtenerAlmacenamiento } from "../lib/almacenamiento";
    import type { JuegoId } from "../lib/juegos";
    import { obtenerRacha } from "../lib/rachas";
    import AccionesResultado from "./AccionesResultado.svelte";
    import BotonCompartir from "./BotonCompartir.svelte";
    import CuentaRegresiva from "./CuentaRegresiva.svelte";

    interface Props {
        juego: JuegoId;
        fecha: string;
        terminada: boolean;
        correcto: boolean;
        titulo: string;
        /** Resumen corto para la barra: "Ganaste en 4". */
        resumen: string;
        /** Arma el texto a compartir; recibe la racha de hoy para sumarla. */
        armarTexto: (racha: number) => string;
        /** "Nuevo auto en:" */
        etiquetaRegreso: string;
        clase?: string;
        /** El resultado todavía no está completo (la ronda extra del auto): no se ofrece la barra. */
        pendiente?: boolean;
        /** Elemento que recupera el foco al cerrar. */
        focoRetorno?: () => HTMLElement | null | undefined;
        children: Snippet;
    }

    let {
        juego,
        fecha,
        terminada,
        correcto,
        titulo,
        resumen,
        armarTexto,
        etiquetaRegreso,
        clase = "",
        pendiente = false,
        focoRetorno,
        children,
    }: Props = $props();
    const idBase = $props.id();
    let dialogo: HTMLDialogElement;
    let botonCerrar: HTMLButtonElement;
    // La barra aparece cuando la partida ya estaba terminada al cargar o después de cerrar el panel.
    let barraVisible = $state(false);

    const racha = $derived(terminada ? obtenerRacha(obtenerAlmacenamiento(), juego, fecha) : 0);

    onMount(() => {
        barraVisible = terminada;
    });

    export function abrir() {
        if (dialogo.open) {
            return;
        }

        barraVisible = false;
        if (window.matchMedia("(max-width: 620px)").matches) {
            // Sin modal: el tablero sigue a la vista y se puede seguir tocando. El foco va al
            // panel (no al botón de cerrar) para que el lector lo anuncie sin dibujar un contorno.
            dialogo.show();
            dialogo.focus({ preventScroll: true });
        } else {
            document.body.classList.add("resultado-modal-abierto");
            dialogo.showModal();
            botonCerrar.focus({ preventScroll: true });
        }
    }

    export function cerrar() {
        if (dialogo.open) {
            dialogo.close();
        }
    }

    function alCerrar() {
        document.body.classList.remove("resultado-modal-abierto");
        barraVisible = true;
        focoRetorno?.()?.focus({ preventScroll: true });
    }
</script>

<dialog
    bind:this={dialogo}
    class={"resultado-modal " + clase}
    class:resultado-modal--correcto={correcto}
    aria-labelledby={idBase + "-titulo"}
    aria-describedby={idBase + "-detalle"}
    tabindex="-1"
    onclick={(evento) => evento.target === dialogo && cerrar()}
    onclose={alCerrar}
>
    <div class="resultado-modal__contenido">
        <span class="resultado-modal__asa" aria-hidden="true"></span>
        <button bind:this={botonCerrar} class="resultado-modal__cerrar" type="button" aria-label="Cerrar resultado" onclick={cerrar}>
            <svg class="icono" viewBox="0 0 20 20" aria-hidden="true"><use href="#icono-cerrar"></use></svg>
        </button>
        <p class="resultado-modal__etiqueta">{correcto ? "Bandera a cuadros" : "Abandono"}</p>
        <h2 id={idBase + "-titulo"}>{titulo}</h2>
        <div id={idBase + "-detalle"} class="resultado-modal__cuerpo">
            {#if terminada}
                {@render children()}
            {/if}
        </div>
        <CuentaRegresiva clase="resultado-modal__regreso" etiqueta={etiquetaRegreso} activa={terminada} {fecha} />
        <AccionesResultado {juego} {fecha} {terminada} {armarTexto} />
    </div>
</dialog>

{#if barraVisible && terminada && !pendiente}
    <div class="resultado-barra" class:resultado-barra--correcto={correcto}>
        <button type="button" class="resultado-barra__abrir" onclick={abrir} aria-label={"Ver el resultado. " + resumen}>
            <span class="resultado-barra__resumen">{resumen}</span>
            {#if racha > 0}
                <span class="resultado-barra__racha">Racha {racha}</span>
            {/if}
            <svg class="icono resultado-barra__flecha" viewBox="0 0 22 16" aria-hidden="true"><use href="#icono-avanzar"></use></svg>
        </button>
        <BotonCompartir texto={armarTexto(racha)} clase="boton-compartir--barra" />
    </div>
{/if}
