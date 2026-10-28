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
            <!--
                En el celular va el nombre corto ("Circuito") para que entre en un renglón; el largo
                queda para los lectores de pantalla. En el botón cuadrado de la PC tampoco va "Siguiente:".
            -->
            <a class="siguiente-juego" href={urlJuego(estado.siguiente.archivo)}>
                <strong>
                    <span class="siguiente-juego__prefijo">Siguiente:</span>
                    <span class="siguiente-juego__largo">{estado.siguiente.nombre}</span><span
                        class="siguiente-juego__corto"
                        aria-hidden="true">{estado.siguiente.corto}</span
                    >
                </strong>
                <span class="siguiente-juego__extra" aria-hidden="true">{estado.pendientes} más</span>
                <span class="solo-lectores">{estado.pendientes === 1 ? "Te queda 1 juego hoy" : "Te quedan " + estado.pendientes + " juegos hoy"}</span>
                <svg class="icono" viewBox="0 0 22 16" aria-hidden="true"><use href="#icono-avanzar"></use></svg>
            </a>
        {:else}
            <a class="siguiente-juego siguiente-juego--completo" href={urlInicio()}>
                <strong>
                    <span class="siguiente-juego__largo">¡Completaste los {estado.total} de hoy!</span><span
                        class="siguiente-juego__corto"
                        aria-hidden="true">¡{estado.total} de {estado.total}!</span
                    >
                </strong>
                <span class="siguiente-juego__extra">Inicio</span>
                <svg class="icono" viewBox="0 0 22 16" aria-hidden="true"><use href="#icono-avanzar"></use></svg>
            </a>
        {/if}
    </div>
{/if}
