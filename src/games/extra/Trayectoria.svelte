<script lang="ts">
    // Adiviná la campaña: se ven la marca y el número de las primeras temporadas
    // de un piloto; cada error destapa dos años más. Los años van en una tira
    // compacta para que, en el celular, el buscador quede en la misma pantalla.
    import { tick } from "svelte";
    import Buscador from "../../components/Buscador.svelte";
    import ResultadoEnLinea from "../../components/ResultadoEnLinea.svelte";
    import OpcionPiloto from "../../components/OpcionPiloto.svelte";
    import PanelIntento from "../../components/PanelIntento.svelte";
    import { pilotos } from "../../data/catalogo/pilotos";
    import type { Piloto } from "../../data/tipos";
    import { obtenerAlmacenamiento } from "../../lib/almacenamiento";
    import { construirTextoCompartir } from "../../lib/compartir";
    import { leerDiaJuego } from "../../lib/dia-juego";
    import { contarTemporadasVisibles, elegirTrayectoria, MAXIMO_INTENTOS_TRAYECTORIA, type FichaPiloto } from "../../lib/extra";
    import { palabraIntentos } from "../../lib/intentos";
    import { crearPartidaExtra } from "../../lib/partida-extra";
    import { obtenerApellidoPiloto, obtenerTextoBusquedaPiloto } from "../../lib/pilotos";
    import { urlImagen, urlSitio } from "../../lib/rutas";
    import { obtenerLogoMarca, obtenerNombreMarca } from "../../lib/top10";

    let { fichas }: { fichas: FichaPiloto[] } = $props();

    const dia = leerDiaJuego(location.search);
    const fecha = dia.fecha;
    const secreto = elegirTrayectoria(fichas, dia.fechaSeleccion);
    const partida = crearPartidaExtra<number[]>(obtenerAlmacenamiento(), "trayectoria", dia);

    let intentos = $state<number[]>(partida.leer() ?? []);
    let mensaje = $state("");
    let campoBuscador: ReturnType<typeof Buscador<Piloto>> | undefined = $state();
    let modal: ReturnType<typeof ResultadoEnLinea> | undefined = $state();
    /** Al terminar en vivo: desde qué temporada se dan vuelta las que seguían tapadas. */
    let revelarDesde = $state<number | null>(null);
    let tira: HTMLElement | undefined = $state();

    const acerto = $derived(intentos.includes(secreto.id));
    const terminada = $derived(acerto || intentos.length >= MAXIMO_INTENTOS_TRAYECTORIA);
    const errores = $derived(intentos.filter((id) => id !== secreto.id).length);
    const visibles = $derived(contarTemporadasVisibles(secreto.temporadas.length, errores, terminada));
    const fallados = $derived(
        intentos
            .filter((id) => id !== secreto.id)
            .map((id) => pilotos.find((piloto) => piloto.id === id))
            .filter((piloto) => piloto !== undefined)
            .reverse()
    );
    /** Años sin finales entre una temporada y la siguiente: se avisan para que el salto no confunda. */
    const salto = (indice: number) => {
        const siguiente = secreto.temporadas[indice + 1];
        const desde = secreto.temporadas[indice].anio + 1;
        if (!siguiente || siguiente.anio === desde) {
            return null;
        }
        const hasta = siguiente.anio - 1;
        return (desde === hasta ? String(desde) : desde + " a " + hasta) + ": no corrió finales";
    };
    const marcador = $derived({ puntaje: acerto ? intentos.length : null, maximo: MAXIMO_INTENTOS_TRAYECTORIA, gano: acerto });
    const armarTexto = (racha: number) =>
        construirTextoCompartir({
            juego: "trayectoria",
            fecha,
            puntaje: marcador.puntaje,
            maximo: MAXIMO_INTENTOS_TRAYECTORIA,
            racha,
            filas: [intentos.map((id) => (id === secreto.id ? "verde" : "negro"))],
            url: urlSitio(),
        });

    function guardar() {
        partida.guardar(intentos, { terminada, gano: acerto, intentos });
    }

    // Registra la racha de una partida terminada (no la suma dos veces el mismo día).
    if (terminada) {
        guardar();
    }

    async function intentar() {
        if (terminada) {
            return;
        }
        const { elemento } = campoBuscador!.resolver();
        if (!elemento) {
            mensaje = "Elegí un piloto de la lista.";
            campoBuscador!.sacudir();
            return;
        }
        if (intentos.includes(elemento.id)) {
            mensaje = "Ya probaste con " + elemento.nombre + ".";
            return;
        }

        const tapadasDesde = visibles;
        intentos = [...intentos, elemento.id];
        guardar();
        campoBuscador!.limpiar();
        if (terminada) {
            mensaje = "";
            revelarDesde = tapadasDesde;
            await tick();
            modal?.abrir();
        } else {
            mensaje = "No es " + elemento.nombre + ". Se destaparon dos temporadas más.";
            campoBuscador!.enfocar();
        }
    }
</script>

<section class="trayectoria" aria-label="Temporadas del piloto" bind:this={tira} tabindex="-1">
    <ol class="trayectoria__anios">
        {#each secreto.temporadas as temporada, indice (temporada.anio)}
            {@const visible = indice < visibles}
            {@const logo = obtenerLogoMarca(temporada.marca)}
            {@const hueco = salto(indice)}
            <li
                class="trayectoria__anio"
                class:trayectoria__anio--oculto={!visible}
                class:trayectoria__anio--revela={revelarDesde !== null && indice >= revelarDesde}
                style:--i={revelarDesde !== null ? indice - revelarDesde : 0}
            >
                <span class="trayectoria__numero-anio">{temporada.anio}</span>
                {#if visible}
                    {#if logo}
                        <img class="trayectoria__logo" src={urlImagen(logo)} alt={obtenerNombreMarca(temporada.marca)} title={obtenerNombreMarca(temporada.marca)} />
                    {:else}
                        <span class="trayectoria__logo trayectoria__logo--texto">{obtenerNombreMarca(temporada.marca)}</span>
                    {/if}
                    <b>#{temporada.numero}</b>
                {:else}
                    <span class="trayectoria__logo trayectoria__logo--oculto" aria-label="Temporada sin destapar">?</span>
                    <b aria-hidden="true">#?</b>
                {/if}
            </li>
            {#if hueco}
                <li class="trayectoria__salto">{hueco}</li>
            {/if}
        {/each}
    </ol>
</section>

<PanelIntento titulo="Elegí un piloto" oculto={terminada} deshabilitado={terminada} alIntentar={intentar}>
    {#snippet buscador()}
        <Buscador
            bind:this={campoBuscador}
            id="nombre-trayectoria"
            idLista="sugerencias-trayectoria"
            etiquetaCampo="Nombre del piloto"
            consejoVacio="Probá con el apellido."
            placeholder="Nombre del piloto"
            elementos={pilotos}
            obtenerEtiqueta={(piloto: Piloto) => piloto.nombre}
            obtenerTextoBusqueda={obtenerTextoBusquedaPiloto}
            obtenerTextoCorto={obtenerApellidoPiloto}
            minimoCaracteres={1}
            deshabilitado={terminada}
            estaExcluido={(piloto: Piloto) => intentos.includes(piloto.id)}
            alEnviar={intentar}
            alCambiar={() => (mensaje = "")}
        >
            {#snippet opcion(piloto: Piloto)}
                <OpcionPiloto {piloto} />
            {/snippet}
        </Buscador>
    {/snippet}
    {#snippet pie()}
        <p class="mensaje-juego" aria-live="polite">{mensaje}</p>
    {/snippet}
</PanelIntento>

<ResultadoEnLinea
    bind:this={modal}
    juego="trayectoria"
    {fecha}
    {terminada}
    correcto={acerto}
    nombre={secreto.nombre}
    detalle={acerto
        ? "Lo sacaste en " + intentos.length + " " + palabraIntentos(intentos.length) + "."
        : "No lo sacaste en los " + MAXIMO_INTENTOS_TRAYECTORIA + " intentos."}
    {armarTexto}
    {marcador}
    espera={revelarDesde === null ? 0 : Math.min(1200, (secreto.temporadas.length - revelarDesde) * 60 + 340)}
/>

{#if fallados.length > 0}
    <ul class="extra-fallados" aria-label="Pilotos que no eran">
        {#each fallados as piloto (piloto.id)}
            <li>No es {piloto.nombre}</li>
        {/each}
    </ul>
{/if}
