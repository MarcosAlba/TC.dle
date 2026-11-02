<script lang="ts">
    // Lo que se puede hacer al terminar la partida: pasar al próximo juego (lo principal)
    // y compartir el resultado. Lo usan el panel de resultado y el piloto. La racha no
    // se muestra acá: va en el texto que se comparte. Con los cinco juegos terminados
    // suma "Día completo", para compartir todo el día en un solo mensaje.
    import { track } from "@vercel/analytics";
    import { obtenerAlmacenamiento } from "../lib/almacenamiento";
    import { registrarHistorial } from "../lib/dia-juego";
    import { obtenerFechaLocal } from "../lib/fechas";
    import { construirTextoDia, obtenerDiaCompleto, obtenerNumeroTCdle, registrarMarcadorDia, type MarcadorJuego } from "../lib/dia";
    import { JUEGOS, type JuegoId } from "../lib/juegos";
    import { obtenerRacha } from "../lib/rachas";
    import { ruta, urlSitio } from "../lib/rutas";
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
    const esHoy = fecha === obtenerFechaLocal();

    $effect(() => {
        if (!terminada) {
            return;
        }
        const almacenamiento = obtenerAlmacenamiento();
        // Un evento por partida terminada (no al volver a abrirla): cuánta gente termina cada juego y cuánta lo saca.
        if (registrarHistorial(almacenamiento, fecha, juego, marcador.gano)) {
            track("partida", { juego, gano: marcador.gano, puntaje: marcador.puntaje ?? "X", archivo: !esHoy });
        }
        // Un día del archivo no entra en el resumen de hoy.
        if (esHoy) {
            registrarMarcadorDia(almacenamiento, fecha, juego, marcador);
            dia = obtenerDiaCompleto(almacenamiento, fecha);
        }
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
        {#if esHoy}
            <SiguienteJuego juegoActual={juego} {terminada} />
        {:else}
            <div class="siguiente-juego-contenedor">
                <a class="siguiente-juego" href={ruta("archivo.html")}>
                    <strong>
                        <span class="siguiente-juego__largo">Volver al archivo</span><span class="siguiente-juego__corto" aria-hidden="true">Archivo</span>
                    </strong>
                    <svg class="icono" viewBox="0 0 22 16" aria-hidden="true"><use href="#icono-avanzar"></use></svg>
                </a>
            </div>
        {/if}
    </div>
{/if}
