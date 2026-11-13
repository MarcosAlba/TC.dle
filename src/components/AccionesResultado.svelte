<script lang="ts">
    // Lo que se puede hacer al terminar la partida: compartir el resultado y volver a la
    // portada a elegir otro juego. Lo usan el panel de resultado y el piloto. La racha no
    // se muestra acá: va en el texto que se comparte.
    import { track } from "@vercel/analytics";
    import { obtenerAlmacenamiento } from "../lib/almacenamiento";
    import { describirConteo, leerConteo, sumarPartida } from "../lib/contador";
    import { registrarHistorial } from "../lib/dia-juego";
    import { registrarDistribucion } from "../lib/estadisticas";
    import { obtenerFechaLocal } from "../lib/fechas";
    import { registrarMarcadorDia, type MarcadorJuego } from "../lib/dia";
    import type { JuegoId } from "../lib/juegos";
    import { obtenerRacha } from "../lib/rachas";
    import { ruta, urlInicio } from "../lib/rutas";
    import BotonCompartir from "./BotonCompartir.svelte";

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

    // Cuántos jugaron hoy en todo el sitio (contador global); null mientras no haya datos.
    let conteo: string | null = $state(null);

    async function mostrarConteo() {
        conteo = describirConteo((await leerConteo(fecha))?.[juego]);
    }
    const esHoy = fecha === obtenerFechaLocal();

    $effect(() => {
        if (!terminada) {
            return;
        }
        const almacenamiento = obtenerAlmacenamiento();
        // Un evento por partida terminada (no al volver a abrirla): cuánta gente termina cada juego y cuánta lo saca.
        const recien = registrarHistorial(almacenamiento, fecha, juego, marcador.gano);
        if (recien) {
            registrarDistribucion(almacenamiento, juego, marcador);
            track("partida", { juego, gano: marcador.gano, puntaje: marcador.puntaje ?? "X", archivo: !esHoy });
            if (esHoy) {
                sumarPartida(juego, fecha, marcador.gano).then(mostrarConteo);
            }
        } else if (esHoy) {
            mostrarConteo();
        }
        // El pop up de estadísticas (EstadisticasJuego) se abre solo cuando la partida se terminó recién.
        // Si el pop up carga después que esto, lo pide con "tcdle:pedir-resultado".
        const avisar = (abrirSolo: boolean) =>
            document.dispatchEvent(
                new CustomEvent("tcdle:resultado", { detail: { juego, fecha, texto: armarTexto(racha), marcador: { ...marcador }, recien: abrirSolo } })
            );
        avisar(recien && esHoy);
        const alPedir = () => avisar(false);
        document.addEventListener("tcdle:pedir-resultado", alPedir);
        // Un día del archivo no entra en el resumen de hoy (lo usa la portada).
        if (esHoy) {
            registrarMarcadorDia(almacenamiento, fecha, juego, marcador);
        }
        return () => document.removeEventListener("tcdle:pedir-resultado", alPedir);
    });
</script>

{#if terminada}
    <!-- Dos botones cuadrados: compartir y volver a la portada a elegir otro juego (como Formudle). -->
    <div class="resultado-acciones">
        <BotonCompartir texto={armarTexto(racha)} etiqueta="Compartir" clase="boton-compartir--resultado" />
        <a class="jugar-mas" href={esHoy ? urlInicio() : ruta("archivo.html")}>
            {esHoy ? "Jugar más juegos" : "Volver al archivo"}
            <svg class="icono" viewBox="0 0 22 16" aria-hidden="true"><use href="#icono-avanzar"></use></svg>
        </a>
    </div>
{/if}
