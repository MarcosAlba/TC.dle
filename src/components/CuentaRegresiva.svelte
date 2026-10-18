<script lang="ts">
    // "Nuevo X en: HH:MM:SS" hasta la medianoche local. Al cambiar el día
    // recarga la página, así el desafío nuevo aparece solo.
    import { obtenerFechaLocal, obtenerTiempoHastaMedianoche } from "../lib/fechas";

    interface Props {
        etiqueta: string;
        /** Corre solo mientras la partida terminada la muestra. */
        activa: boolean;
        fecha: string;
        clase?: string;
    }

    let { etiqueta, activa, fecha, clase = "cuenta-regresiva" }: Props = $props();
    let tiempo = $state("--:--:--");

    $effect(() => {
        if (!activa) {
            return;
        }

        function actualizar() {
            const ahora = new Date();

            if (obtenerFechaLocal(ahora) !== fecha) {
                location.reload();
                return;
            }
            tiempo = obtenerTiempoHastaMedianoche(ahora);
        }

        actualizar();
        const intervalo = setInterval(actualizar, 1000);

        return () => clearInterval(intervalo);
    });
</script>

<p class={clase} hidden={!activa}>
    <span>{etiqueta}</span>
    <strong>{tiempo}</strong>
</p>
