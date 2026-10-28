<script lang="ts">
    // Lo que se puede hacer al terminar la partida: pasar al próximo juego (lo principal)
    // y compartir el resultado. Lo usan el panel de resultado y el piloto. La racha no
    // se muestra acá: va en el texto que se comparte.
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

    // La racha se registra al terminar la partida, antes de que este bloque se muestre; se suma al texto compartido.
    const racha = $derived(terminada ? obtenerRacha(obtenerAlmacenamiento(), juego, fecha) : 0);
</script>

{#if terminada}
    <div class="resultado-acciones">
        <BotonCompartir texto={armarTexto(racha)} icono />
        <SiguienteJuego juegoActual={juego} {terminada} />
    </div>
{/if}
