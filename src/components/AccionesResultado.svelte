<script lang="ts">
    // Lo que se puede hacer al terminar la partida: pasar al próximo juego (lo principal)
    // y compartir el resultado. Lo usan el panel de resultado y el piloto. La racha no
    // se muestra acá: va en el texto que se comparte. Con los cinco juegos terminados
    // suma "Día completo", para compartir todo el día en un solo mensaje.
    import { obtenerAlmacenamiento } from "../lib/almacenamiento";
    import { construirTextoDia, obtenerDiaCompleto, obtenerNumeroTCdle, registrarMarcadorDia, type MarcadorJuego } from "../lib/dia";
    import { JUEGOS, type JuegoId } from "../lib/juegos";
    import { obtenerRacha } from "../lib/rachas";
    import { urlSitio } from "../lib/rutas";
    import BotonCompartir from "./BotonCompartir.svelte";
    import SiguienteJuego from "./SiguienteJuego.svelte";

    interface Props {
        juego: JuegoId;
        fecha: string;
        terminada: boolean;
        /** Arma el texto a compartir; recibe la racha de hoy para sumarla. */
        armarTexto: (racha: number) => string;
        /** Cómo terminó, para el resumen del día. */
        marcador: MarcadorJuego;
    }

    let { juego, fecha, terminada, armarTexto, marcador }: Props = $props();

    // La racha se registra al terminar la partida, antes de que este bloque se muestre; se suma al texto compartido.
    const racha = $derived(terminada ? obtenerRacha(obtenerAlmacenamiento(), juego, fecha) : 0);

    let dia: ReturnType<typeof obtenerDiaCompleto> = $state(null);

    $effect(() => {
        if (!terminada) {
            return;
        }
        const almacenamiento = obtenerAlmacenamiento();
        registrarMarcadorDia(almacenamiento, fecha, juego, marcador);
        dia = obtenerDiaCompleto(almacenamiento, fecha);
    });
</script>

{#if terminada}
    {#if dia}
        <div class="dia-completo">
            <p class="dia-completo__titulo">
                <span>Día completo</span>
                <b>TCdle #{obtenerNumeroTCdle(fecha)}</b>
            </p>
            <ul class="dia-completo__lista">
                {#each dia as { juego: id, marcador: resultado } (id)}
                    <li class:dia-completo__gano={resultado.gano}>
                        <span>{JUEGOS.find((item) => item.id === id)?.corto}</span>
                        <b>{resultado.puntaje === null ? "X" : resultado.puntaje}/{resultado.maximo}</b>
                    </li>
                {/each}
            </ul>
            <BotonCompartir texto={construirTextoDia(fecha, dia, urlSitio())} etiqueta="Compartir el día" clase="boton-compartir--dia" />
        </div>
    {/if}
    <div class="resultado-acciones">
        <BotonCompartir texto={armarTexto(racha)} icono />
        <SiguienteJuego juegoActual={juego} {terminada} />
    </div>
{/if}
