<script lang="ts">
    // Botón "Compartir": abre el menú del sistema en celulares y tablets y copia
    // el texto al portapapeles en el resto. El aviso aparece en el mismo botón.
    import { compartirTexto } from "../lib/compartir";

    interface Props {
        texto: string;
        clase?: string;
        /** Solo el ícono (el aviso de "¡Copiado!" igual aparece con texto). */
        icono?: boolean;
    }

    let { texto, clase = "", icono = false }: Props = $props();
    let aviso = $state("");
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    function avisar(mensaje: string) {
        aviso = mensaje;
        clearTimeout(temporizador);
        temporizador = setTimeout(() => (aviso = ""), 2500);
    }

    async function compartir() {
        // En una PC el menú de compartir del sistema no tiene a dónde ir: se copia.
        const conMenu = typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches;
        const resultado = await compartirTexto(texto, {
            compartir: conMenu ? (datos) => navigator.share(datos) : undefined,
            copiar: navigator.clipboard ? (contenido) => navigator.clipboard.writeText(contenido) : undefined,
        });

        if (resultado === "copiado") {
            avisar("¡Copiado!");
        } else if (resultado === "error") {
            avisar("No se pudo copiar");
        }
    }
</script>

<button type="button" class={"boton-compartir " + clase} class:boton-compartir--icono={icono} onclick={compartir}>
    {#if icono && !aviso}
        <svg class="icono" viewBox="0 0 20 20" aria-hidden="true"><use href="#icono-compartir"></use></svg>
        <span class="boton-compartir__etiqueta" aria-hidden="true">Compartir</span>
    {:else}
        <span aria-hidden="true">{aviso || "Compartir"}</span>
    {/if}
    <span class="solo-lectores">Compartir resultado</span>
</button>
<span class="solo-lectores" role="status">{aviso}</span>
