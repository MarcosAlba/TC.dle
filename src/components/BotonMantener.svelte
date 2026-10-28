<script lang="ts">
    // Botón para acciones que no se deshacen: hay que mantenerlo apretado (con el dedo,
    // el mouse, Enter o Espacio) mientras se llena. Si se suelta antes, vuelve rápido y
    // no pasa nada. Reemplaza el "¿Seguro? Sí / No".
    import type { Snippet } from "svelte";

    interface Props {
        /** Lo que pasa al completar. */
        alCompletar: () => void;
        /** Cuánto hay que mantenerlo, en milisegundos. */
        duracion?: number;
        clase?: string;
        /** Explicación para lectores de pantalla ("Mantené apretado para rendirte"). */
        ayuda: string;
        children: Snippet;
    }

    let { alCompletar, duracion = 1200, clase = "", ayuda, children }: Props = $props();
    const idAyuda = $props.id();
    let manteniendo = $state(false);
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    function empezar() {
        if (manteniendo) {
            return;
        }
        manteniendo = true;
        temporizador = setTimeout(() => {
            manteniendo = false;
            alCompletar();
        }, duracion);
    }

    function soltar() {
        clearTimeout(temporizador);
        manteniendo = false;
    }

    function alPresionar(evento: PointerEvent) {
        // Solo el botón principal del mouse; con el dedo o el lápiz, cualquier toque.
        if (evento.pointerType === "mouse" && evento.button !== 0) {
            return;
        }
        empezar();
    }

    function alTecla(evento: KeyboardEvent) {
        if (evento.key !== "Enter" && evento.key !== " ") {
            return;
        }
        // Que no haga el clic del botón (ni baje la página con Espacio).
        evento.preventDefault();
        if (!evento.repeat) {
            empezar();
        }
    }

    function alSoltarTecla(evento: KeyboardEvent) {
        if (evento.key === "Enter" || evento.key === " ") {
            soltar();
        }
    }

    $effect(() => () => clearTimeout(temporizador));
</script>

<button
    type="button"
    class={"boton-mantener " + clase}
    class:boton-mantener--activo={manteniendo}
    style:--duracion-mantener={duracion + "ms"}
    aria-describedby={idAyuda}
    onpointerdown={alPresionar}
    onpointerup={soltar}
    onpointerleave={soltar}
    onpointercancel={soltar}
    onkeydown={alTecla}
    onkeyup={alSoltarTecla}
    onblur={soltar}
    oncontextmenu={(evento) => evento.preventDefault()}
>
    {@render children()}
</button>
<span id={idAyuda} class="solo-lectores">{ayuda}</span>
