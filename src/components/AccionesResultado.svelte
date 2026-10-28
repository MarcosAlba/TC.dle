<script lang="ts">
    // Lo que se puede hacer al terminar la partida: ver la racha, compartir el
    // resultado y pasar al próximo juego. Lo usan el panel de resultado y el piloto.
    import { obtenerAlmacenamiento } from "../lib/almacenamiento";
    import type { JuegoId } from "../lib/juegos";
    import { obtenerRacha } from "../lib/rachas";
    import BotonCompartir from "./BotonCompartir.svelte";
    import SiguienteJuego from "./SiguienteJuego.svelte";

    interface Props {
        juego: JuegoId;
        fecha: string;
        terminada: boolean;
        /** Arma el texto a compartir; recibe la racha de hoy para sumarla. */
        armarTexto: (racha: number) => string;
    }

    let { juego, fecha, terminada, armarTexto }: Props = $props();

    // La racha se registra al terminar la partida, antes de que este bloque se muestre.
    const racha = $derived(terminada ? obtenerRacha(obtenerAlmacenamiento(), juego, fecha) : 0);
</script>

{#if terminada}
    {#if racha > 0}
        <p class="resultado-racha">
            <strong>{racha}</strong>
            {racha === 1 ? "día seguido" : "días seguidos"}
        </p>
    {/if}
    <div class="resultado-acciones">
        <BotonCompartir texto={armarTexto(racha)} />
        <SiguienteJuego juegoActual={juego} {terminada} />
    </div>
{/if}
