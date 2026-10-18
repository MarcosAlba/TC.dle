<script lang="ts">
    // Ventana de resultado al terminar la partida (un <dialog> nativo).
    import type { Snippet } from "svelte";
    import type { JuegoId } from "../lib/juegos";
    import CuentaRegresiva from "./CuentaRegresiva.svelte";
    import SiguienteJuego from "./SiguienteJuego.svelte";

    interface Props {
        juego: JuegoId;
        fecha: string;
        terminada: boolean;
        correcto: boolean;
        titulo: string;
        /** "Nuevo auto en:" */
        etiquetaRegreso: string;
        clase?: string;
        /** Elemento que recupera el foco al cerrar. */
        focoRetorno?: () => HTMLElement | null | undefined;
        children: Snippet;
    }

    let { juego, fecha, terminada, correcto, titulo, etiquetaRegreso, clase = "", focoRetorno, children }: Props = $props();
    const idBase = $props.id();
    let dialogo: HTMLDialogElement;
    let botonCerrar: HTMLButtonElement;

    export function abrir() {
        if (!dialogo.open) {
            document.body.classList.add("resultado-modal-abierto");
            dialogo.showModal();
            botonCerrar.focus();
        }
    }

    export function cerrar() {
        if (dialogo.open) {
            dialogo.close();
        }
    }

    function alCerrar() {
        document.body.classList.remove("resultado-modal-abierto");
        focoRetorno?.()?.focus({ preventScroll: true });
    }
</script>

<dialog
    bind:this={dialogo}
    class={"resultado-modal " + clase}
    class:resultado-modal--correcto={correcto}
    aria-labelledby={idBase + "-titulo"}
    aria-describedby={idBase + "-detalle"}
    onclick={(evento) => evento.target === dialogo && cerrar()}
    onclose={alCerrar}
>
    <div class="resultado-modal__contenido">
        <button bind:this={botonCerrar} class="resultado-modal__cerrar" type="button" aria-label="Cerrar resultado" onclick={cerrar}>×</button>
        <p class="resultado-modal__etiqueta">Bandera a cuadros</p>
        <h2 id={idBase + "-titulo"}>{titulo}</h2>
        <div id={idBase + "-detalle"} class="resultado-modal__cuerpo">
            {@render children()}
        </div>
        <CuentaRegresiva clase="resultado-modal__regreso" etiqueta={etiquetaRegreso} activa={terminada} {fecha} />
        <SiguienteJuego juegoActual={juego} {terminada} />
    </div>
</dialog>
