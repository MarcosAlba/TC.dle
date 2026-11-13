<script lang="ts">
    // Pop up chico de estadísticas, como el de Formudle: partidas, ganadas, porcentaje,
    // racha y mejor racha, y un gráfico con en cuántos intentos (o con cuántos puntos)
    // terminó cada partida. Se abre solo un rato después de terminar (cuando el tablero
    // ya festejó) y desde el botón de estadísticas del encabezado.
    // El juego avisa con el evento "tcdle:resultado" (lo manda AccionesResultado).
    import { onMount } from "svelte";
    import { obtenerAlmacenamiento } from "../lib/almacenamiento";
    import type { MarcadorJuego } from "../lib/dia";
    import { calcularEstadisticas, type Estadisticas } from "../lib/estadisticas";
    import { obtenerFechaLocal } from "../lib/fechas";
    import { obtenerJuego, type JuegoId } from "../lib/juegos";
    import BotonCompartir from "./BotonCompartir.svelte";
    import { urlInicio } from "../lib/rutas";
    import "../styles/estadisticas.css";

    /** Tiempo hasta abrirse solo: el festejo del tablero y la entrada del resultado. */
    const ESPERA_APERTURA = 1800;

    let { juego }: { juego: JuegoId } = $props();
    const nombre = obtenerJuego(juego).nombre;
    let dialogo: HTMLDialogElement;
    let fecha = $state(obtenerFechaLocal());
    let marcador = $state<MarcadorJuego | null>(null);
    let texto = $state("");
    let datos = $state<Estadisticas | null>(null);
    let abiertoSolo = false;

    const maximaBarra = $derived(Math.max(1, ...(datos?.barras.map((barra) => barra.cantidad) ?? [1])));

    function abrir() {
        datos = calcularEstadisticas(obtenerAlmacenamiento(), juego, fecha, marcador);
        if (!dialogo.open) {
            dialogo.showModal();
        }
    }

    onMount(() => {
        const alResultado = (evento: Event) => {
            const detalle = (evento as CustomEvent).detail as { juego: JuegoId; fecha: string; texto: string; marcador: MarcadorJuego; recien: boolean };
            if (detalle.juego !== juego) {
                return;
            }
            fecha = detalle.fecha;
            marcador = detalle.marcador;
            texto = detalle.texto;
            if (detalle.recien && !abiertoSolo) {
                abiertoSolo = true;
                setTimeout(abrir, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 400 : ESPERA_APERTURA);
            }
        };
        document.addEventListener("tcdle:resultado", alResultado);
        document.addEventListener("tcdle:abrir-estadisticas", abrir);
        // Si la partida ya estaba terminada y el resultado avisó antes de que esto cargara.
        document.dispatchEvent(new Event("tcdle:pedir-resultado"));
        return () => {
            document.removeEventListener("tcdle:resultado", alResultado);
            document.removeEventListener("tcdle:abrir-estadisticas", abrir);
        };
    });
</script>

<dialog
    bind:this={dialogo}
    class="estadisticas"
    aria-labelledby="titulo-estadisticas"
    onclick={(evento) => evento.target === dialogo && dialogo.close()}
>
    <div class="estadisticas__contenido">
        <button type="button" class="estadisticas__cerrar" aria-label="Cerrar estadísticas" onclick={() => dialogo.close()}>
            <svg class="icono" viewBox="0 0 20 20" aria-hidden="true"><use href="#icono-cerrar"></use></svg>
        </button>
        <h2 id="titulo-estadisticas" class="estadisticas__titulo">Estadísticas</h2>
        <p class="estadisticas__juego">{nombre}</p>

        {#if datos}
            <dl class="estadisticas__numeros">
                <div><dt>Jugadas</dt><dd>{datos.jugadas}</dd></div>
                <div><dt>Ganadas</dt><dd>{datos.ganadas}</dd></div>
                <div><dt>% ganadas</dt><dd>{datos.porcentaje}</dd></div>
                <div><dt>Racha</dt><dd>{datos.racha}</dd></div>
                <div><dt>Mejor racha</dt><dd>{datos.mejorRacha}</dd></div>
            </dl>

            {#if datos.barras.length > 1}
                <h3 class="estadisticas__subtitulo">{datos.tipo === "puntos" ? "Puntos por partida" : "Intentos para ganar"}</h3>
                <ol class="estadisticas__barras" style:--columnas={datos.barras.length}>
                    {#each datos.barras as barra (barra.etiqueta)}
                        <li class:actual={barra.actual} aria-label={(barra.etiqueta === "X" ? "Perdidas" : barra.etiqueta) + ": " + barra.cantidad}>
                            <span class="estadisticas__cantidad">{barra.cantidad || ""}</span>
                            <span class="estadisticas__pista"><i style:--alto={barra.cantidad / maximaBarra}></i></span>
                            <span class="estadisticas__etiqueta">{barra.etiqueta}</span>
                        </li>
                    {/each}
                </ol>
            {/if}
        {/if}

        {#if texto}
            <div class="estadisticas__acciones">
                <BotonCompartir {texto} etiqueta="Copiar" clase="estadisticas__compartir" />
                <a class="jugar-mas" href={urlInicio()}>
                    Jugar más juegos
                    <svg class="icono" viewBox="0 0 22 16" aria-hidden="true"><use href="#icono-avanzar"></use></svg>
                </a>
            </div>
        {:else}
            <p class="estadisticas__nota">Terminá la partida de hoy para compartir el resultado.</p>
        {/if}
    </div>
</dialog>
