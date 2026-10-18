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

<tr>
    <td class={"celda-piloto " + estadoBooleano(comparacion.acerto)}>
        <img class="foto-piloto" src={urlImagen(obtenerImagenMiniPiloto(piloto))} alt={"Foto de " + piloto.nombre} title={piloto.nombre} />
    </td>
    <td class={"celda-marca " + clase(0, estadoBooleano(comparacion.marca))}>
        <img class="logo-marca" src={urlImagen("marcas/" + LOGOS_MARCAS[piloto.marca])} alt={"Logo de " + piloto.marca} title={piloto.marca} />
    </td>
    <td class={clase(1, estadoBooleano(comparacion.equipo))}>{piloto.equipo}</td>
    <td class={clase(2, comparacion.localidad)}>{piloto.localidad}</td>
    <td class={clase(3, estadoBooleano(comparacion.campeon))}>{piloto.campeonTC ? "Sí" : "No"}</td>
    <td class={claseNumerica(comparacion.edad, 4)} aria-label={etiquetaNumerica(comparacion.edad, textoEdad)}>
        <span class="celda-numerica__valor">{textoEdad}</span>
    </td>
    <td class={claseNumerica(comparacion.debut, 5)} aria-label={etiquetaNumerica(comparacion.debut, String(comparacion.debut.valor))}>
        <span class="celda-numerica__valor">{piloto.anioDebutTC}</span>
    </td>
</tr>
