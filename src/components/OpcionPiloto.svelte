<script lang="ts">
    // Opción del buscador de pilotos: miniatura (o iniciales mientras carga) y nombre.
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
