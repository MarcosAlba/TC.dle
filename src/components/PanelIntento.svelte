<script lang="ts">
    // Zócalo de intento: el buscador y el botón "Intentar".
    import type { Snippet } from "svelte";

    interface Props {
        id?: string;
        titulo: string;
        oculto?: boolean;
        deshabilitado?: boolean;
        alIntentar: () => void;
        buscador: Snippet;
        pie?: Snippet;
    }

    let { id, titulo, oculto = false, deshabilitado = false, alIntentar, buscador, pie }: Props = $props();
    const idBase = $props.id();
    const idTitulo = idBase + "-titulo";
</script>

<section {id} class="panel-intento" aria-labelledby={idTitulo} hidden={oculto}>
    <h2 id={idTitulo} class="solo-lectores">{titulo}</h2>

    <div class="panel-intento__contenido">
        <div class="fila-busqueda">
            {@render buscador()}
            <button class="boton-intentar" type="button" disabled={deshabilitado} onclick={alIntentar}>Intentar</button>
        </div>
        {@render pie?.()}
    </div>
</section>
