<script lang="ts">
    // Elige la final del día y baja solo esa (ver src/pages/datos/carreras). La
    // lista de ids y los pilotos del buscador vienen armados desde la página, así
    // el navegador no carga las 246 finales. Mientras baja se ve el mismo esqueleto
    // que antes de que cargue el juego.
    import { leerDiaJuego } from "../lib/dia-juego";
    import { ruta } from "../lib/rutas";
    import { obtenerSeleccionDiaria } from "../lib/seleccion-diaria";
    import type { PilotoCarrera } from "../lib/top10";
    import type { Carrera } from "../data/tipos";
    import Top10 from "./Top10.svelte";

    let { idsJugables, candidatos }: { idsJugables: string[]; candidatos: PilotoCarrera[] } = $props();

    // La misma elección que con la lista completa: depende solo del orden y la cantidad.
    const id = obtenerSeleccionDiaria(idsJugables, "top10", leerDiaJuego(location.search).fechaSeleccion)!;

    async function bajarCarrera(): Promise<Carrera> {
        const respuesta = await fetch(ruta("datos/carreras/" + id + ".json"));
        if (!respuesta.ok) {
            throw new Error(String(respuesta.status));
        }
        return respuesta.json();
    }

    let carrera = $state(bajarCarrera());
</script>

{#await carrera}
    <div class="cargando-juego cargando-juego--top10" role="status" aria-busy="true">
        <span class="solo-lectores">Cargando la carrera…</span>
        <i class="cargando-juego__carrera" aria-hidden="true"></i>
        <div class="cargando-juego__buscador" aria-hidden="true"><i></i><i></i></div>
    </div>
{:then datos}
    <Top10 carrera={datos} {candidatos} />
{:catch}
    <div class="mensaje-carga" role="alert">
        <p>No se pudo cargar la carrera de hoy. Revisá la conexión.</p>
        <button type="button" class="intro-juego__boton" onclick={() => (carrera = bajarCarrera())}>Reintentar</button>
    </div>
{/await}
