<script lang="ts">
    // Cronómetro del Top 10: cuenta hacia atrás desde que se tocó "Empezar" y
    // avisa al llegar a cero. Sale de la hora de inicio guardada, así sigue
    // bien aunque se recargue la página.
    import { formatearCronometro, obtenerSegundosRestantes, type OpcionesTop10 } from "../lib/top10";

    interface Props {
        opciones: OpcionesTop10;
        activo: boolean;
        alTerminar: () => void;
    }

    let { opciones, activo, alTerminar }: Props = $props();
    let segundos = $state<number | null>(null);

    $effect(() => {
        if (!activo || opciones.limiteSegundos === null) {
            return;
        }

        function actualizar() {
            segundos = obtenerSegundosRestantes(opciones);
            if (segundos === 0) {
                clearInterval(intervalo);
                alTerminar();
            }
        }

        const intervalo = setInterval(actualizar, 250);
        actualizar();

        return () => clearInterval(intervalo);
    });
</script>

{#if activo && segundos !== null}
    <p class="cronometro" class:cronometro--final={segundos <= 15} aria-label={"Quedan " + segundos + " segundos"}>
        <span aria-hidden="true">{formatearCronometro(segundos)}</span>
    </p>
{/if}
