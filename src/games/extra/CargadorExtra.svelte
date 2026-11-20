<script lang="ts">
    // Grilla, Conexiones y Campaña: baja las fichas de los pilotos de un archivo
    // aparte (ver src/pages/datos/fichas) en vez de llevarlas dentro del HTML. El
    // archivo es el mismo para la Grilla y Conexiones, así el navegador lo guarda una
    // sola vez. El juego se baja junto, en su propio pedazo de código. Mientras tanto
    // se ve el mismo esqueleto que antes de que cargue la página.
    import type { Component } from "svelte";
    import type { FichaPiloto } from "../../lib/extra";
    import { ruta } from "../../lib/rutas";

    type Juego = "grilla" | "conexiones" | "trayectoria";
    let { juego, archivo }: { juego: Juego; archivo: string } = $props();

    const COMPONENTES: Record<Juego, () => Promise<{ default: Component<{ fichas: FichaPiloto[] }> }>> = {
        grilla: () => import("./Grilla.svelte"),
        conexiones: () => import("./Conexiones.svelte"),
        trayectoria: () => import("./Trayectoria.svelte"),
    };

    async function cargar() {
        const [modulo, respuesta] = await Promise.all([COMPONENTES[juego](), fetch(ruta("datos/" + archivo))]);
        if (!respuesta.ok) {
            throw new Error(String(respuesta.status));
        }
        const fichas = (await respuesta.json()) as FichaPiloto[];
        return { Juego: modulo.default, fichas };
    }

    let carga = $state(cargar());
</script>

{#await carga}
    <div class="cargando-juego cargando-juego--foto" role="status" aria-busy="true">
        <span class="solo-lectores">Cargando el juego…</span>
        <i class="cargando-juego__foto" aria-hidden="true"></i>
        <div class="cargando-juego__buscador" aria-hidden="true"><i></i><i></i></div>
    </div>
{:then { Juego, fichas }}
    <Juego {fichas} />
{:catch}
    <div class="mensaje-carga" role="alert">
        <p>No se pudo cargar el juego. Revisá la conexión.</p>
        <button type="button" class="intro-juego__boton" onclick={() => (carga = cargar())}>Reintentar</button>
    </div>
{/await}
