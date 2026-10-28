<script lang="ts">
    // Una fila de la tabla de intentos: las celdas se revelan de a una.
    import { LOGOS_MARCAS, obtenerImagenMiniPiloto, type CeldaNumerica } from "../../lib/pilotos";
    import { urlImagen } from "../../lib/rutas";
    import type { FilaPiloto } from "./tipos";

    let { fila }: { fila: FilaPiloto } = $props();
    const { piloto, comparacion } = $derived(fila);

    // Celdas con pista, en el orden en que se revelan.
    function clase(indice: number, estado: string): string {
        const animacion = !fila.animada ? "" : indice < fila.reveladas ? " celda-visible" : " celda-pendiente";
        return estado + animacion;
    }

    const estadoBooleano = (coincide: boolean) => (coincide ? "coincide" : "no-coincide");

    function claseNumerica(celda: CeldaNumerica, indice: number): string {
        return (
            clase(indice, celda.estado) +
            " celda-numerica" +
            (celda.direccion ? " celda-numerica--" + celda.direccion : "")
        );
    }

    function etiquetaNumerica(celda: CeldaNumerica, texto: string): string | undefined {
        return celda.direccion ? texto + ". El valor buscado es " + celda.direccion + "." : undefined;
    }

    const textoEdad = $derived(piloto.fechaFallecimiento ? comparacion.edad.valor + " †" : String(comparacion.edad.valor));
</script>

<!--
    En escritorio es una fila de tabla. En celular (piloto.css) cada fila se dibuja como una
    tarjeta: foto y nombre arriba y las seis pistas en una grilla de 3×2. Por eso hay un
    nombre visible solo ahí y una etiqueta por celda (oculta en escritorio, donde las
    pone el encabezado de la tabla).
-->
<tr>
    <td class={"celda-piloto " + estadoBooleano(comparacion.acerto)}>
        <img class="foto-piloto" src={urlImagen(obtenerImagenMiniPiloto(piloto))} alt={"Foto de " + piloto.nombre} title={piloto.nombre} />
        <span class="celda-piloto__nombre" aria-hidden="true">{piloto.nombre}</span>
    </td>
    <td class={"celda-marca " + clase(0, estadoBooleano(comparacion.marca))}>
        <span class="celda-etiqueta" aria-hidden="true">Modelo</span>
        <img class="logo-marca" src={urlImagen("marcas/" + LOGOS_MARCAS[piloto.marca])} alt={"Logo de " + piloto.marca} title={piloto.marca} />
    </td>
    <td class={clase(1, estadoBooleano(comparacion.equipo))} title={piloto.equipo}>
        <span class="celda-etiqueta" aria-hidden="true">Equipo</span>
        <span class="celda-valor">{piloto.equipo}</span>
    </td>
    <td class={clase(2, comparacion.localidad)} title={piloto.localidad}>
        <span class="celda-etiqueta" aria-hidden="true">Localidad</span>
        <span class="celda-valor">{piloto.localidad}</span>
    </td>
    <td class={clase(3, estadoBooleano(comparacion.campeon))}>
        <span class="celda-etiqueta" aria-hidden="true">Campeón</span>
        <span class="celda-valor">{piloto.campeonTC ? "Sí" : "No"}</span>
    </td>
    <td class={claseNumerica(comparacion.edad, 4)} aria-label={etiquetaNumerica(comparacion.edad, textoEdad)}>
        <span class="celda-etiqueta" aria-hidden="true">Edad</span>
        <span class="celda-numerica__valor">{textoEdad}</span>
    </td>
    <td class={claseNumerica(comparacion.debut, 5)} aria-label={etiquetaNumerica(comparacion.debut, String(comparacion.debut.valor))}>
        <span class="celda-etiqueta" aria-hidden="true">Debut</span>
        <span class="celda-numerica__valor">{piloto.anioDebutTC}</span>
    </td>
</tr>
