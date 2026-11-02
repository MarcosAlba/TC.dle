<script lang="ts">
    // ¿De quién es esta campaña? Se ven la marca y el número de las primeras
    // temporadas de un piloto; cada error destapa dos años más.
    import BotonCompartir from "../../components/BotonCompartir.svelte";
    import Buscador from "../../components/Buscador.svelte";
    import CuentaRegresiva from "../../components/CuentaRegresiva.svelte";
    import OpcionPiloto from "../../components/OpcionPiloto.svelte";
    import PanelIntento from "../../components/PanelIntento.svelte";
    import { pilotos } from "../../data/catalogo/pilotos";
    import type { Piloto } from "../../data/tipos";
    import { obtenerAlmacenamiento } from "../../lib/almacenamiento";
    import { crearDatoDiario } from "../../lib/dato-diario";
    import { leerDiaJuego } from "../../lib/dia-juego";
    import { contarTemporadasVisibles, elegirTrayectoria, MAXIMO_INTENTOS_TRAYECTORIA, type FichaPiloto } from "../../lib/extra";
    import { obtenerApellidoPiloto, obtenerTextoBusquedaPiloto } from "../../lib/pilotos";
    import { urlImagen, urlSitio } from "../../lib/rutas";
    import { obtenerLogoMarca, obtenerNombreMarca } from "../../lib/top10";

    let { fichas }: { fichas: FichaPiloto[] } = $props();

    const dia = leerDiaJuego(location.search);
    const fecha = dia.fecha;
    const secreto = elegirTrayectoria(fichas, dia.fechaSeleccion);
    const guardado = crearDatoDiario<number[]>({
        almacenamiento: obtenerAlmacenamiento(),
        clave: dia.esArchivo ? "tcdleTrayectoriaArchivo" : "tcdleTrayectoria",
        fecha,
    });

    let intentos = $state<number[]>(guardado.leer() ?? []);
    let mensaje = $state("");
    let campoBuscador: ReturnType<typeof Buscador<Piloto>> | undefined = $state();

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

    const textoCompartir = $derived(
        [
            "TCdle · Trayectoria · " + fecha.slice(8, 10) + "/" + fecha.slice(5, 7),
            "🏁 " + (acerto ? intentos.length : "X") + "/" + MAXIMO_INTENTOS_TRAYECTORIA,
            intentos.map((id) => (id === secreto.id ? "🟩" : "🟥")).join(""),
            urlSitio(),
        ].join("\n")
    );

    function intentar() {
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

        intentos = [...intentos, elemento.id];
        guardado.guardar(intentos);
        campoBuscador!.limpiar();
        mensaje = elemento.id === secreto.id ? "" : terminada ? "Se terminaron los intentos." : "No es " + elemento.nombre + ". Se destaparon dos temporadas más.";
        if (!terminada) {
            campoBuscador!.enfocar();
        }
    }
</script>

<section class="trayectoria" aria-label="Temporadas del piloto">
    <ol class="trayectoria__anios">
        {#each secreto.temporadas as temporada, indice (temporada.anio)}
            {@const visible = indice < visibles}
            {@const logo = obtenerLogoMarca(temporada.marca)}
            <li class="trayectoria__anio" class:trayectoria__anio--oculto={!visible}>
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
        {/each}
    </ol>
    <p class="extra__ayuda">
        Marca y número con los que corrió la primera final de cada año (desde 2010).
        {#if !terminada}Intento {intentos.length + 1} de {MAXIMO_INTENTOS_TRAYECTORIA}.{/if}
    </p>
</section>

{#if terminada}
    <section class="extra-resultado" class:extra-resultado--correcto={acerto} aria-live="polite">
        <img class="extra-resultado__foto" src={urlImagen(fichas.find((ficha) => ficha.id === secreto.id)!.foto)} alt={"Foto de " + secreto.nombre} />
        <div class="extra-resultado__texto">
            <p class="extra-resultado__etiqueta">{acerto ? "Bandera a cuadros" : "Se terminaron los intentos"}</p>
            <h2>{secreto.nombre}</h2>
            <p>{acerto ? "Lo sacaste en " + intentos.length + (intentos.length === 1 ? " intento." : " intentos.") : "Era su campaña."}</p>
            <CuentaRegresiva etiqueta="Nueva campaña en:" activa={true} {fecha} />
        </div>
        <BotonCompartir texto={textoCompartir} />
    </section>
{:else}
    <PanelIntento titulo="Elegí un piloto" alIntentar={intentar}>
        {#snippet buscador()}
            <Buscador
                bind:this={campoBuscador}
                id="nombre-trayectoria"
                idLista="sugerencias-trayectoria"
                etiquetaCampo="Nombre del piloto"
                consejoVacio="Probá con el apellido."
                placeholder="¿De quién es esta campaña?"
                elementos={pilotos}
                obtenerEtiqueta={(piloto: Piloto) => piloto.nombre}
                obtenerTextoBusqueda={obtenerTextoBusquedaPiloto}
                obtenerTextoCorto={obtenerApellidoPiloto}
                minimoCaracteres={1}
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
{/if}

{#if fallados.length > 0}
    <ul class="extra-fallados" aria-label="Intentos">
        {#each fallados as piloto (piloto.id)}
            <li>{piloto.nombre}</li>
        {/each}
    </ul>
{/if}
