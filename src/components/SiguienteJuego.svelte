<script lang="ts">
    // Conexión entre juegos: al terminar la partida sugiere el próximo
    // pendiente del día, o felicita si ya se completaron todos.
    import type { JuegoId } from "../lib/juegos";
    import { obtenerAlmacenamiento } from "../lib/almacenamiento";
    import { contarPendientes, obtenerEstadoJuegos, obtenerSiguienteJuego } from "../lib/rachas";
    import { urlInicio, urlJuego } from "../lib/rutas";

    interface Props {
        juegoActual: JuegoId;
        /** La lista se arma recién cuando la partida terminó y su resultado ya está guardado. */
        terminada: boolean;
    }

    let { juegoActual, terminada }: Props = $props();

    const estado = $derived.by(() => {
        if (!terminada) {
            return null;
        }

        const juegos = obtenerEstadoJuegos(obtenerAlmacenamiento());

        return {
            total: juegos.length,
            siguiente: obtenerSiguienteJuego(juegoActual, juegos),
            pendientes: contarPendientes(juegoActual, juegos),
        };
    });
</script>

{#if estado}
    <div class="siguiente-juego-contenedor">
        {#if estado.siguiente}
            <a class="siguiente-juego" href={urlJuego(estado.siguiente.archivo)}>
                <strong>Siguiente: {estado.siguiente.nombre} →</strong>
                <small>{estado.pendientes === 1 ? "Te queda 1 juego hoy" : "Te quedan " + estado.pendientes + " juegos hoy"}</small>
            </a>
        {:else}
            <a class="siguiente-juego siguiente-juego--completo" href={urlInicio()}>
                <strong>¡Completaste los {estado.total} de hoy!</strong>
                <small>Volver al inicio</small>
            </a>
        {/if}
    </div>
{/if}
