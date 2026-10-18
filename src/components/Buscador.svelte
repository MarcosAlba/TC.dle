<script lang="ts" generics="T">
    // Campo de texto con sugerencias (pilotos y circuitos). La búsqueda en sí
    // está en src/lib/buscador.ts; acá solo se maneja el DOM y el teclado.
    import type { Snippet } from "svelte";
    import { buscarElementos, obtenerMinimoCaracteres, resolverEntrada, type ConfiguracionBusqueda } from "../lib/buscador";
    import { normalizarTexto } from "../lib/texto";

    interface Props extends ConfiguracionBusqueda<T> {
        id: string;
        idLista: string;
        placeholder: string;
        /** Etiqueta solo para lectores de pantalla; sin ella el campo no lleva <label>. */
        etiquetaCampo?: string;
        deshabilitado?: boolean;
        mensajeVacio?: string;
        opcion: Snippet<[T]>;
        alEnviar?: () => void;
        alCambiar?: () => void;
        alSeleccionar?: (elemento: T) => void;
    }

    let {
        id,
        idLista,
        placeholder,
        etiquetaCampo,
        deshabilitado = false,
        mensajeVacio = "No hay coincidencias.",
        opcion,
        alEnviar,
        alCambiar,
        alSeleccionar,
        ...configuracion
    }: Props = $props();

    let campo: HTMLInputElement;
    let contenedor: HTMLDivElement;
    let lista: HTMLDivElement;
    let valor = $state("");
    let sugerencias = $state.raw<T[]>([]);
    let indiceActivo = $state(-1);
    let abierta = $state(false);
    let seleccionado: T | null = null;

    export function ocultar() {
        abierta = false;
        sugerencias = [];
        indiceActivo = -1;
    }

    function seleccionar(elemento: T) {
        seleccionado = elemento;
        valor = configuracion.obtenerEtiqueta(elemento);
        ocultar();
        campo.focus();
        alSeleccionar?.(elemento);
    }

    function mostrar() {
        sugerencias = buscarElementos(configuracion, valor);
        indiceActivo = -1;

        if (deshabilitado || normalizarTexto(valor).length < obtenerMinimoCaracteres(configuracion)) {
            ocultar();
            return;
        }

        abierta = true;
    }

    function mover(direccion: number) {
        if (!abierta || sugerencias.length === 0) {
            return;
        }

        indiceActivo = (indiceActivo + direccion + sugerencias.length) % sugerencias.length;
        queueMicrotask(() => lista.children[indiceActivo]?.scrollIntoView({ block: "nearest" }));
    }

    function alTeclear(evento: KeyboardEvent) {
        if (evento.key === "ArrowDown") {
            evento.preventDefault();
            mover(1);
        } else if (evento.key === "ArrowUp") {
            evento.preventDefault();
            mover(-1);
        } else if (evento.key === "Enter") {
            evento.preventDefault();
            // Enter manda el intento en un solo toque: con la opción resaltada
            // si hay una, o con la primera de la lista (ver resolver()).
            if (indiceActivo >= 0) {
                seleccionar(sugerencias[indiceActivo]);
            }
            alEnviar?.();
        } else if (evento.key === "Escape") {
            ocultar();
        }
    }

    function alEscribir() {
        seleccionado = null;
        mostrar();
        alCambiar?.();
    }

    function alClickearFuera(evento: MouseEvent) {
        if (!contenedor.contains(evento.target as Node)) {
            ocultar();
        }
    }

    export function resolver() {
        return resolverEntrada(configuracion, valor, seleccionado, sugerencias);
    }

    export function obtenerValor(): string {
        return valor;
    }

    export function limpiar() {
        seleccionado = null;
        valor = "";
        ocultar();
    }

    export function buscar() {
        mostrar();
    }

    export function enfocar() {
        campo.focus();
    }
</script>

<svelte:document onclick={alClickearFuera} />

<div class="buscador" bind:this={contenedor}>
    {#if etiquetaCampo}
        <label class="solo-lectores" for={id}>{etiquetaCampo}</label>
    {/if}
    <input
        bind:this={campo}
        bind:value={valor}
        {id}
        type="text"
        role="combobox"
        {placeholder}
        autocomplete="off"
        disabled={deshabilitado}
        aria-autocomplete="list"
        aria-controls={idLista}
        aria-expanded={abierta}
        aria-activedescendant={indiceActivo >= 0 ? idLista + "-activa" : undefined}
        oninput={alEscribir}
        onkeydown={alTeclear}
        onblur={() => setTimeout(ocultar, 120)}
    />
    <div bind:this={lista} id={idLista} class="buscador__sugerencias" role="listbox" hidden={!abierta}>
        {#if abierta && sugerencias.length === 0}
            <p class="buscador__vacio">{mensajeVacio}</p>
        {:else}
            {#each sugerencias as elemento, indice}
                <button
                    type="button"
                    class="buscador__opcion"
                    class:buscador__opcion--activa={indice === indiceActivo}
                    role="option"
                    aria-selected={indice === indiceActivo}
                    id={indice === indiceActivo ? idLista + "-activa" : undefined}
                    onmousedown={(evento) => {
                        evento.preventDefault();
                        seleccionar(elemento);
                    }}
                >
                    {@render opcion(elemento)}
                </button>
            {/each}
        {/if}
    </div>
</div>
