<script lang="ts">
    // Adiviná el piloto por su auto: la foto se vuelve más nítida con cada
    // error y, al acertar, hay una ronda extra para adivinar el año del auto.
    import { onMount, tick } from "svelte";
    import Buscador from "../components/Buscador.svelte";
    import CuentaRegresiva from "../components/CuentaRegresiva.svelte";
    import ModalResultado from "../components/ModalResultado.svelte";
    import OpcionPiloto from "../components/OpcionPiloto.svelte";
    import PanelIntento from "../components/PanelIntento.svelte";
    import { autos, pilotos } from "../data";
    import type { Piloto } from "../data/tipos";
    import { obtenerAlmacenamiento } from "../lib/almacenamiento";
    import {
        MAXIMO_INTENTOS_AUTO,
        generarOpcionesAnio,
        obtenerEstiloDesenfoque,
        obtenerNivelDesenfoque,
    } from "../lib/autos";
    import { crearDatoDiario } from "../lib/dato-diario";
    import { obtenerFechaLocal } from "../lib/fechas";
    import { describirContador, palabraIntentos } from "../lib/intentos";
    import { crearPartidaDiaria, migrarPartida } from "../lib/partida";
    import { obtenerApellidoPiloto, obtenerImagenMiniPiloto } from "../lib/pilotos";
    import { construirTextoCompartir, filaIntentos } from "../lib/compartir";
    import { urlImagen, urlSitio } from "../lib/rutas";
    import { obtenerSeleccionDiaria } from "../lib/seleccion-diaria";
    import { crearJuegoAdivinanza } from "./compartido/juego-adivinanza.svelte";

    const almacenamiento = obtenerAlmacenamiento();
    const fecha = obtenerFechaLocal();
    const autoDelDia = obtenerSeleccionDiaria(autos, "autos")!;
    const secreto = pilotos.find((piloto) => piloto.id === autoDelDia.pilotoId)!;
    const anioDelAuto = autoDelDia.anio !== null && Number.isFinite(Number(autoDelDia.anio)) ? Number(autoDelDia.anio) : null;
    const datoAnio = crearDatoDiario<number>({ almacenamiento, clave: "partidaTCdleAutoAnio", fecha });
    const anioGuardado = datoAnio.leer();

    const juego = crearJuegoAdivinanza<Piloto, number>({
        partida: crearPartidaDiaria<number>({
            almacenamiento,
            clave: "partidaTCdleAuto",
            fecha,
            objetivoId: secreto.id,
            idsValidos: pilotos.map((piloto) => piloto.id),
            maximoIntentos: MAXIMO_INTENTOS_AUTO,
            migrar: (datos) =>
                migrarPartida(datos, {
                    campoObjetivo: "autoPilotoId",
                    objetivoActual: secreto.id,
                    maximoIntentos: MAXIMO_INTENTOS_AUTO,
                }),
        }),
        obtenerId: (piloto) => piloto.id,
        textos: {
            vacio: "Ingresá o elegí un piloto.",
            noEncontrado: "Ese piloto no está en la lista.",
            repetido: "Ya intentaste con ese piloto.",
        },
    });

    // La respuesta guardada puede venir de la versión anterior (año escrito a mano).
    let respuestaAnio = $state<number | null>(anioGuardado !== null && Number.isFinite(Number(anioGuardado)) ? Number(anioGuardado) : null);
    let fotoPreparada = $state(false);
    let foto: HTMLImageElement;
    let campoBuscador: ReturnType<typeof Buscador<Piloto>> | undefined = $state();
    let modal: ReturnType<typeof ModalResultado> | undefined = $state();
    let estadoFinal: HTMLElement | undefined = $state();
    let opcionesAnio: HTMLElement | undefined = $state();

    const estado = $derived(juego.estado);
    const contador = $derived(describirContador(estado));
    const hayRondaAnio = anioDelAuto !== null;
    const rondaAnioVisible = $derived(estado.acerto && hayRondaAnio);
    const rondaAnioPendiente = $derived(hayRondaAnio && respuestaAnio === null);
    const estiloFoto = $derived(obtenerEstiloDesenfoque(obtenerNivelDesenfoque(estado.intentosUsados, estado.terminada)));
    // La respuesta más antigua puede no estar entre las opciones sorteadas: se suma para poder marcarla.
    const opciones = $derived.by(() => {
        if (anioDelAuto === null) {
            return [];
        }

        const sorteadas = generarOpcionesAnio(anioDelAuto, "anio:" + fecha + ":" + autoDelDia.pilotoId + ":" + anioDelAuto);

        return respuestaAnio !== null && !sorteadas.includes(respuestaAnio)
            ? [...sorteadas, respuestaAnio].sort((a, b) => a - b)
            : sorteadas;
    });
    const historial = $derived(
        estado.idsIntentados
            .map((id) => pilotos.find((piloto) => piloto.id === id))
            .filter((piloto) => piloto !== undefined)
            .reverse()
    );
    const urlFoto = urlImagen("autos/" + autoDelDia.archivo);

    // Con la partida ya terminada al cargar, el modal no se abre solo.
    onMount(() => {
        if (foto.complete && foto.naturalWidth > 0) {
            prepararFoto();
        }
    });

    $effect(() => {
        if (rondaAnioVisible && rondaAnioPendiente && opcionesAnio) {
            opcionesAnio.querySelector("button")?.focus();
        }
    });

    function prepararFoto() {
        requestAnimationFrame(() => (fotoPreparada = true));
    }

    async function abrirModal() {
        await tick();
        modal?.abrir();
    }

    function intentar() {
        const resolucion = campoBuscador!.resolver();
        const elegido = juego.validar(campoBuscador!.obtenerValor(), resolucion);

        if (!elegido) {
            return;
        }

        const resultado = juego.jugar(elegido);
        campoBuscador!.limpiar();

        if (resultado === "correcta") {
            juego.mostrarMensaje("¡Correcto! Reconociste el auto.", "exito");
            // La ronda del año solo se abre al acertar; si queda pendiente, el modal espera a que se responda.
            if (!rondaAnioPendiente) {
                abrirModal();
            }
        } else if (resultado === "agotada") {
            juego.mostrarMensaje("Se terminaron los intentos.", "error");
            abrirModal();
        } else {
            juego.mostrarMensaje("No es ese piloto. La imagen ahora está un poco más nítida.", "info");
        }

        if (!juego.estado.terminada) {
            campoBuscador!.enfocar();
        }
    }

    function elegirAnio(anio: number) {
        if (!rondaAnioPendiente) {
            return;
        }

        respuestaAnio = anio;
        datoAnio.guardar(anio);
        abrirModal();
    }

    const intentosUsados = $derived(estado.intentosUsados);

    const armarTexto = (racha: number) =>
        construirTextoCompartir({
            juego: "auto",
            fecha,
            puntaje: estado.acerto ? estado.intentosUsados : null,
            maximo: MAXIMO_INTENTOS_AUTO,
            racha,
            filas: [filaIntentos(estado.intentosUsados, estado.acerto)],
            url: urlSitio(),
        });
</script>

<section class="tarjeta-desafio tarjeta-desafio--suelta tarjeta-desafio--foto" aria-label="Auto del día">
    <div
        class="marco-auto"
        style:--desenfoque-auto={estiloFoto.desenfoque}
        style:--brillo-auto={estiloFoto.brillo}
        style:--escala-auto={estiloFoto.escala}
    >
        <img
            bind:this={foto}
            class="foto-auto"
            class:foto-auto--preparada={fotoPreparada}
            src={urlFoto}
            alt="Auto de Turismo Carretera desenfocado"
            onload={prepararFoto}
        />
    </div>
    <div class="estado-diario">
        <p class="contador-intentos" class:contador-intentos--ultimo={contador.ultimo} aria-live="polite" hidden={estado.terminada}>
            {contador.texto}
        </p>
        <div
            bind:this={estadoFinal}
            class="estado-final"
            class:estado-final--correcto={estado.acerto}
            class:solo-lectores={estado.acerto}
            tabindex="-1"
            hidden={!estado.terminada}
        >
            <span>{estado.acerto ? "¡Correcto!" : "Incorrecto"}</span>
            <strong>{secreto.nombre}</strong>
        </div>
        {#if !rondaAnioVisible}
            <CuentaRegresiva etiqueta="Próximo piloto en:" activa={estado.terminada} {fecha} />
        {/if}
    </div>
</section>

<PanelIntento
    id="panel-intento-auto"
    titulo="Elegí un piloto"
    oculto={rondaAnioVisible}
    deshabilitado={estado.terminada}
    alIntentar={intentar}
>
    {#snippet buscador()}
        <Buscador
            bind:this={campoBuscador}
            id="nombre-piloto-auto"
            idLista="sugerencias-auto"
            placeholder="Adiviná el piloto del auto"
            etiquetaCampo="Nombre del piloto"
            deshabilitado={estado.terminada}
            elementos={pilotos}
            obtenerEtiqueta={(piloto: Piloto) => piloto.nombre}
            obtenerTextoCorto={obtenerApellidoPiloto}
            minimoCaracteres={1}
            estaExcluido={(piloto: Piloto) => estado.idsIntentados.includes(piloto.id)}
            alEnviar={intentar}
            alCambiar={() => juego.mostrarMensaje("")}
        >
            {#snippet opcion(piloto: Piloto)}
                <OpcionPiloto {piloto} />
            {/snippet}
        </Buscador>
    {/snippet}
    {#snippet pie()}
        <p class={"mensaje-juego" + (juego.mensaje.tipo ? " mensaje-juego--" + juego.mensaje.tipo : "")} aria-live="polite">
            {juego.mensaje.texto}
        </p>
    {/snippet}
</PanelIntento>

{#if rondaAnioVisible}
    <section id="panel-anio-auto" class="ronda-anio" aria-labelledby="titulo-anio-auto">
        <div class="ronda-anio__cabecera">
            <span class="ronda-anio__etiqueta">Ronda extra</span>
            <h2 id="titulo-anio-auto">¿De qué año es este auto?</h2>
            <CuentaRegresiva etiqueta="Próximo piloto en:" activa={estado.terminada} {fecha} />
        </div>

        <div
            bind:this={opcionesAnio}
            class="ronda-anio__opciones"
            class:ronda-anio__opciones--respondida={!rondaAnioPendiente}
            role="group"
            aria-label="Elegí el año"
        >
            {#each opciones as anio (anio)}
                {@const esCorrecta = anio === anioDelAuto}
                {@const esElegida = anio === respuestaAnio}
                <button
                    type="button"
                    class="ronda-anio__opcion"
                    class:ronda-anio__opcion--correcta={!rondaAnioPendiente && esCorrecta}
                    class:ronda-anio__opcion--error={!rondaAnioPendiente && esElegida && !esCorrecta}
                    disabled={!rondaAnioPendiente}
                    aria-label={!rondaAnioPendiente && esCorrecta
                        ? anio + ", año correcto"
                        : !rondaAnioPendiente && esElegida
                          ? anio + ", tu respuesta"
                          : undefined}
                    onclick={() => elegirAnio(anio)}
                >
                    {anio}
                </button>
            {/each}
        </div>

        <!-- Los años ya muestran el resultado; la ayuda deja de hacer falta. -->
        <p class="ronda-anio__ayuda" hidden={!rondaAnioPendiente}>
            Una sola chance. No cambia el resultado del día, suma como bonus.
        </p>
    </section>
{/if}

{#if historial.length > 0}
    <section id="historial-auto" class="historial-intentos" aria-labelledby="titulo-historial-auto">
        <div class="titulo-seccion">
            <span></span>
            <h2 id="titulo-historial-auto">Intentos</h2>
        </div>
        <div class="lista-intentos">
            {#each historial as piloto (piloto.id)}
                {@const acerto = piloto.id === secreto.id}
                <article class={"intento intento--auto" + (acerto ? " intento--correcto" : "")} aria-label={piloto.nombre + ": " + (acerto ? "correcto" : "incorrecto")}>
                    <img src={urlImagen(obtenerImagenMiniPiloto(piloto))} alt="" />
                    <strong>{piloto.nombre}</strong>
                </article>
            {/each}
        </div>
    </section>
{/if}

<ModalResultado
    bind:this={modal}
    juego="auto"
    {fecha}
    terminada={estado.terminada}
    correcto={estado.acerto}
    titulo={estado.acerto ? "¡Adivinaste!" : "No lo adivinaste"}
    resumen={estado.acerto ? "Ganaste en " + estado.intentosUsados : "Abandono"}
    {armarTexto}
    pendiente={rondaAnioPendiente}
    etiquetaRegreso="Nuevo auto en:"
    clase="resultado-auto-modal"
    focoRetorno={() => estadoFinal}
>
    <img class="resultado-auto-modal__foto" src={urlImagen(secreto.foto)} alt={"Foto de " + secreto.nombre} />
    <strong class="resultado-modal__nombre">{secreto.nombre}</strong>
    <p class="resultado-modal__detalle">
        {estado.acerto
            ? "Lo resolviste en " + intentosUsados + " " + palabraIntentos(intentosUsados) + "."
            : "No lo adivinaste en los " + MAXIMO_INTENTOS_AUTO + " intentos."}
    </p>
    {#if respuestaAnio !== null}
        {@const acertoAnio = respuestaAnio === anioDelAuto}
        <p class="resultado-modal__detalle resultado-modal__bonus" class:resultado-modal__bonus--correcto={acertoAnio}>
            {acertoAnio
                ? "Y le acertaste al año: " + anioDelAuto + "."
                : "El diseño era de " + anioDelAuto + ", vos dijiste " + respuestaAnio + "."}
        </p>
    {/if}
</ModalResultado>
