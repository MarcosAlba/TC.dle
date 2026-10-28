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
        /** Nombre del campo para lectores de pantalla: no se ve, pero el campo no puede quedar sin él. */
        etiquetaCampo: string;
        deshabilitado?: boolean;
        /** Lo escrito no vale: el campo se marca y el lector de pantalla lo anuncia. */
        invalido?: boolean;
        /** Id del aviso de error que explica por qué; el campo lo lee junto con su nombre. */
        idMensaje?: string;
        /** Qué probar cuando no hay coincidencias, por ejemplo "Probá con el apellido." */
        consejoVacio?: string;
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
        invalido = false,
        idMensaje,
        consejoVacio = "",
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

    // La lista solo existe para quien lee la pantalla si tiene opciones: el aviso de "sin
    // coincidencias" va aparte, en una región que se anuncia sola.
    const hayOpciones = $derived(abierta && sugerencias.length > 0);
    const sinCoincidencias = $derived(abierta && sugerencias.length === 0);
    const textoVacio = $derived(
        ("No hay coincidencias para «" + valor.trim() + "». " + consejoVacio).trim()
    );
    const anuncio = $derived(
        sinCoincidencias
            ? textoVacio
            : hayOpciones
              ? sugerencias.length + (sugerencias.length === 1 ? " resultado" : " resultados")
              : ""
    );

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

    /** Sacudida corta del campo para un intento que no vale; no se mueve si la persona pidió menos movimiento. */
    export function sacudir() {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        campo.animate(
            [{ translate: "0" }, { translate: "-0.3rem" }, { translate: "0.3rem" }, { translate: "-0.2rem" }, { translate: "0" }],
            { duration: 260, easing: "ease-out" }
        );
    }
</script>

<svelte:document onclick={alClickearFuera} />

<div class="buscador" bind:this={contenedor}>
    <label class="solo-lectores" for={id}>{etiquetaCampo}</label>
    <input
        bind:this={campo}
        bind:value={valor}
        {id}
        type="text"
        role="combobox"
        {placeholder}
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        enterkeyhint="go"
        disabled={deshabilitado}
        aria-autocomplete="list"
        aria-controls={idLista}
        aria-expanded={hayOpciones}
        aria-invalid={invalido || undefined}
        aria-describedby={invalido ? idMensaje : undefined}
        aria-activedescendant={indiceActivo >= 0 ? idLista + "-activa" : undefined}
        oninput={alEscribir}
        onkeydown={alTeclear}
        onblur={() => setTimeout(ocultar, 120)}
    />
    <div bind:this={lista} id={idLista} class="buscador__sugerencias" role="listbox" aria-label={etiquetaCampo} hidden={!hayOpciones}>
        {#each sugerencias as elemento, indice}
            <!-- tabindex -1: se navega con las flechas desde el campo (aria-activedescendant), no con Tab. -->
            <button
                type="button"
                tabindex="-1"
                class="buscador__opcion"
                class:buscador__opcion--activa={indice === indiceActivo}
                role="option"
                aria-selected={indice === indiceActivo}
                id={indice === indiceActivo ? idLista + "-activa" : undefined}
                onmousedown={(evento) => {
                    evento.preventDefault();
                    seleccionar(elemento);
                }}
                onclick={() => seleccionar(elemento)}
            >
                {@render opcion(elemento)}
            </button>
        {/each}
    </div>
    {#if sinCoincidencias}
        <!-- Solo se ve: el lector ya lo recibe por la región de abajo. -->
        <div class="buscador__sugerencias" aria-hidden="true">
            <p class="buscador__vacio">{textoVacio}</p>
        </div>
    {/if}
    <span class="solo-lectores" role="status" aria-live="polite" aria-atomic="true">{anuncio}</span>
</div>
