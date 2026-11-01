<script lang="ts">
    // Opción del buscador de pilotos: miniatura (o iniciales mientras carga), nombre y,
    // con el tema dorado, el distintivo de la Copa de Oro.
    import { copaDeOro, juegaCopaDeOro } from "../data/copa-de-oro";
    import type { Piloto } from "../data/tipos";
    import { obtenerIniciales, obtenerImagenMiniPiloto } from "../lib/pilotos";
    import { urlImagen } from "../lib/rutas";

    let { piloto }: { piloto: Piloto } = $props();
    let cargada = $state(false);
    let fallo = $state(false);
</script>

<span class="buscador__avatar">
    <span class="buscador__iniciales" hidden={cargada}>{obtenerIniciales(piloto)}</span>
    <img
        src={urlImagen(obtenerImagenMiniPiloto(piloto))}
        alt=""
        loading="lazy"
        hidden={fallo}
        onload={() => (cargada = true)}
        onerror={() => (fallo = true)}
    />
</span>
<span class="buscador__nombre">{piloto.nombre}</span>
{#if juegaCopaDeOro(piloto.id)}
    <!-- Solo se ve con el tema de la Copa de Oro (tokens.css). -->
    <span class="distintivo-copa" title={"Juega la Copa de Oro " + copaDeOro.temporada}>Copa de Oro</span>
{/if}
