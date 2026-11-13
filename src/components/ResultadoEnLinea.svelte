<script lang="ts">
    // Resultado de la partida dentro de la página, en el lugar del buscador: sin pop up,
    // así el tablero queda a la vista. La respuesta con el mismo formato que el título,
    // una línea y dos botones: compartir y jugar más juegos. Racha, marcador y cuenta
    // regresiva están en el pop up de estadísticas.
    // Al terminar en vivo entra con una animación después de la del tablero (`espera`)
    // y la página baja hasta él; si la partida ya estaba terminada al cargar, aparece quieto.
    import { tick } from "svelte";
    import type { MarcadorJuego } from "../lib/dia";
    import type { JuegoId } from "../lib/juegos";
    import AccionesResultado from "./AccionesResultado.svelte";

    interface Props {
        juego: JuegoId;
        fecha: string;
        terminada: boolean;
        correcto: boolean;
        /** La respuesta: piloto, circuito, palabra… */
        nombre: string;
        /** "Lo resolviste en 3 intentos." */
        detalle: string;
        /** Arma el texto a compartir; recibe la racha de hoy para sumarla. */
        armarTexto: (racha: number) => string;
        marcador: MarcadorJuego;
        /** Milisegundos que espera para entrar, mientras festeja el tablero. */
        espera?: number;
        clase?: string;
    }

    let { juego, fecha, terminada, correcto, nombre, detalle, armarTexto, marcador, espera = 0, clase = "" }: Props = $props();
    const idBase = $props.id();
    let bloque: HTMLElement | undefined = $state();
    /** Solo la partida que se termina ahora entra animada; al recargar ya está quieta. */
    let animar = $state(false);


    /**
     * Lo llama el juego al terminar. Después de la animación, baja la página hasta el
     * resultado, salvo que la persona se haya movido mientras tanto (como Framed: no la
     * arrastra si está mirando el tablero).
     */
    export async function abrir() {
        animar = true;
        await tick();
        let semovio = false;
        const marcar = () => (semovio = true);
        window.addEventListener("wheel", marcar, { once: true, passive: true });
        window.addEventListener("touchmove", marcar, { once: true, passive: true });
        const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        setTimeout(
            () => {
                window.removeEventListener("wheel", marcar);
                window.removeEventListener("touchmove", marcar);
                if (!semovio) {
                    bloque?.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "nearest" });
                }
                bloque?.focus({ preventScroll: true });
            },
            reducir ? 0 : espera + 200
        );
    }
</script>

{#if terminada}
    <section
        bind:this={bloque}
        class={"resultado-linea " + clase}
        class:resultado-linea--correcto={correcto}
        class:resultado-linea--animar={animar}
        style:--espera={espera + "ms"}
        aria-labelledby={idBase + "-nombre"}
        tabindex="-1"
    >
        <p class="solo-lectores">{correcto ? "Bandera a cuadros." : "Abandono."}</p>
        <strong id={idBase + "-nombre"} class="resultado-linea__nombre">{nombre}</strong>
        <p class="resultado-linea__detalle">{detalle}</p>
        <AccionesResultado {juego} {fecha} {terminada} {armarTexto} {marcador} />
    </section>
{/if}
