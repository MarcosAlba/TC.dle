<script lang="ts">
    // Top 10 de la carrera: completar los diez primeros de una final del TC.
    // El podio va arriba (2-1-3) y del 4 al 10 abajo; la pista es el logo de
    // la marca de cada puesto, si se eligió jugar con marcas. Las opciones se
    // eligen en la introducción. La partida vive en src/lib/top10.ts.
    import { tick } from "svelte";
    import Buscador from "../components/Buscador.svelte";
    import Cronometro from "../components/Cronometro.svelte";
    import CuentaRegresiva from "../components/CuentaRegresiva.svelte";
    import ModalResultado from "../components/ModalResultado.svelte";
    import OpcionPiloto from "../components/OpcionPiloto.svelte";
    import PanelIntento from "../components/PanelIntento.svelte";
    import { carreras, fotosCarreras, pilotos } from "../data";
    import type { ResultadoCarrera } from "../data/tipos";
    import { obtenerAlmacenamiento } from "../lib/almacenamiento";
    import { obtenerFechaLocal } from "../lib/fechas";
    import { construirTextoCompartir, filaTop10 } from "../lib/compartir";
    import { mensajesDeBusqueda } from "../lib/mensajes";
    import { urlImagen, urlSitio } from "../lib/rutas";
    import { obtenerSeleccionDiaria } from "../lib/seleccion-diaria";
    import {
        buscarPilotoCatalogo,
        crearPartidaTop10,
        EVENTO_OPCIONES_TOP10,
        leerOpcionesTop10,
        obtenerCarrerasJugables,
        obtenerFotoPilotoCarrera,
        obtenerLogoMarca,
        obtenerNombreMarca,
        obtenerPilotosDeCarreras,
        obtenerTop10,
        PUESTOS,
        separarNombre,
        type OpcionesTop10,
        type PilotoCarrera,
    } from "../lib/top10";

    const fecha = obtenerFechaLocal();
    const carrera = obtenerSeleccionDiaria(obtenerCarrerasJugables(carreras), "top10")!;
    const top10 = obtenerTop10(carrera);
    const podio = [top10[1], top10[0], top10[2]];
    const resto = top10.slice(3);
    const candidatos = obtenerPilotosDeCarreras(carreras);

    const almacenamiento = obtenerAlmacenamiento();
    const partida = crearPartidaTop10({
        almacenamiento,
        clave: "partidaTCdleTop10",
        carrera,
        idsValidos: candidatos.map((piloto) => piloto.id),
        fecha,
        opciones: leerOpcionesTop10(almacenamiento, fecha) ?? undefined,
    });

    let estado = $state(partida.cargar());
    let mensaje = $state<{ texto: string; tipo: "" | "error" | "exito" | "info" }>({ texto: "", tipo: "" });
    let ultimoAcierto = $state<number | null>(null);
    let confirmandoRendirse = $state(false);
    let entradaInvalida = $state(false);
    let campoBuscador: ReturnType<typeof Buscador<PilotoCarrera>> | undefined = $state();
    let modal: ReturnType<typeof ModalResultado> | undefined = $state();
    let tablero: HTMLElement | undefined = $state();

    const acertado = (posicion: number) => estado.acertados.includes(posicion);
    const visible = (posicion: number) => acertado(posicion) || estado.terminada;
    /** Sin marcas, el logo aparece recién cuando se descubre el puesto. */
    const conLogo = (posicion: number) => estado.opciones.marcas || visible(posicion);
    const fotoDe = (nombre: string) => obtenerFotoPilotoCarrera(nombre, pilotos, fotosCarreras);
    const describirPuesto = (resultado: ResultadoCarrera) =>
        resultado.posicion +
        "º: " +
        (visible(resultado.posicion) ? resultado.piloto : "sin adivinar") +
        (conLogo(resultado.posicion) ? ", " + obtenerNombreMarca(resultado.marca) : "");

    // La introducción avisa al tocar "Empezar" con las opciones elegidas.
    $effect(() => {
        const alEmpezar = (evento: Event) => {
            estado = partida.configurar((evento as CustomEvent<OpcionesTop10>).detail);
        };
        document.addEventListener(EVENTO_OPCIONES_TOP10, alEmpezar);

        return () => document.removeEventListener(EVENTO_OPCIONES_TOP10, alEmpezar);
    });

    function terminarTiempo() {
        estado = partida.revisarTiempo();
        if (estado.sinTiempo) {
            confirmandoRendirse = false;
            mensaje = { texto: "Se terminó el tiempo.", tipo: "info" };
            abrirModal();
        }
    }

    async function abrirModal() {
        await tick();
        modal?.abrir();
    }

    const mensajes = mensajesDeBusqueda("piloto");

    // Lo escrito no vale (vacío, fuera de la lista o repetido): se marca el campo hasta que se vuelva a escribir.
    function rechazarEntrada(texto: string) {
        mensaje = { texto, tipo: "error" };
        entradaInvalida = true;
        campoBuscador?.sacudir();
    }

    function intentar() {
        const valor = campoBuscador!.obtenerValor();
        const elegido = campoBuscador!.resolver().elemento;

        if (estado.terminada) {
            return;
        }
        if (valor.trim() === "") {
            rechazarEntrada(mensajes.vacio);
            return;
        }
        if (!elegido) {
            rechazarEntrada(mensajes.noEncontrado);
            return;
        }

        const { resultado, estado: nuevo } = partida.intentar(elegido.id);
        estado = nuevo;
        campoBuscador!.limpiar();
        confirmandoRendirse = false;

        if (resultado.tipo === "bloqueada") {
            terminarTiempo();
            return;
        }
        if (resultado.tipo === "acierto") {
            ultimoAcierto = resultado.posicion;
            mensaje = estado.gano
                ? { texto: "¡Completaste el top 10!", tipo: "exito" }
                : { texto: `${elegido.nombre} llegó ${resultado.posicion}º.`, tipo: "exito" };
        } else if (resultado.tipo === "error") {
            mensaje = {
                texto: resultado.posicion === null ? `${elegido.nombre} no corrió esta final.` : `${elegido.nombre} corrió, pero llegó ${resultado.posicion}º.`,
                tipo: "error",
            };
        } else if (resultado.tipo === "repetido") {
            rechazarEntrada(mensajes.repetido);
        }

        if (estado.terminada) {
            abrirModal();
        } else {
            campoBuscador!.enfocar();
        }
    }

    function rendirse() {
        if (!confirmandoRendirse) {
            confirmandoRendirse = true;
            return;
        }
        estado = partida.rendirse();
        confirmandoRendirse = false;
        mensaje = { texto: `Te faltaron ${PUESTOS - estado.acertados.length}.`, tipo: "info" };
        abrirModal();
    }

    // El marcador es cuántos puestos se descubrieron, se haya completado el Top 10 o no.
    const armarTexto = (racha: number) =>
        construirTextoCompartir({
            juego: "top10",
            fecha,
            puntaje: estado.acertados.length,
            maximo: PUESTOS,
            racha,
            filas: [filaTop10(estado.acertados, PUESTOS)],
            url: urlSitio(),
        });
</script>

{#snippet logo(resultado: ResultadoCarrera, clase: string)}
    {@const archivo = obtenerLogoMarca(resultado.marca)}
    <span class={clase} class:sin-marca={!conLogo(resultado.posicion)}>
        {#if !conLogo(resultado.posicion)}
            <!-- Sin marcas: el lugar queda, vacío, hasta descubrir el puesto. -->
        {:else if archivo}
            <img src={urlImagen(archivo)} alt={obtenerNombreMarca(resultado.marca)} />
        {:else}
            <span>{obtenerNombreMarca(resultado.marca)}</span>
        {/if}
    </span>
{/snippet}

<section bind:this={tablero} class="top10" aria-label={"Top 10 de " + carrera.nombre + " " + carrera.anio} tabindex="-1">
    <header class="top10__carrera">
        <span class="top10__tanda">Final</span>
        <h2 class="top10__nombre">{carrera.nombre} {carrera.anio}</h2>
    </header>

    <ol class="podio">
        {#each podio as resultado (resultado.posicion)}
            {@const foto = fotoDe(resultado.piloto)}
            {@const nombres = separarNombre(resultado)}
            <li
                class={"podio__puesto podio__puesto--" + resultado.posicion}
                class:podio__puesto--acertado={acertado(resultado.posicion)}
                class:podio__puesto--revelado={visible(resultado.posicion) && !acertado(resultado.posicion)}
                class:podio__puesto--nuevo={ultimoAcierto === resultado.posicion}
                aria-label={describirPuesto(resultado)}
            >
                <div class="podio__cima">
                    {#if visible(resultado.posicion)}
                        <img class="podio__foto" src={urlImagen(foto)} alt="" />
                        {@render logo(resultado, "placa-marca placa-marca--chapa")}
                    {:else}
                        {@render logo(resultado, "placa-marca")}
                    {/if}
                </div>
                {#if visible(resultado.posicion)}
                    <span class="podio__apellido">{nombres.apellido}</span>
                {/if}
                <span class="podio__bloque" aria-hidden="true">
                    <span class="numero-podio">{resultado.posicion}</span>
                </span>
            </li>
        {/each}
    </ol>

    <ol class="torre" start="4">
        {#each resto as resultado (resultado.posicion)}
            {@const nombres = separarNombre(resultado)}
            <li
                class="torre__fila"
                aria-label={describirPuesto(resultado)}
            >
                <span class="torre__posicion" aria-hidden="true">{resultado.posicion}</span>
                {@render logo(resultado, "torre__logo")}
                {#if visible(resultado.posicion)}
                    <span
                        class="torre__zocalo"
                        class:torre__zocalo--revelado={!acertado(resultado.posicion)}
                        class:torre__zocalo--nuevo={ultimoAcierto === resultado.posicion}
                    >
                        {nombres.nombre} <strong>{nombres.apellido}</strong>
                    </span>
                {:else}
                    <span class="torre__hueco"></span>
                {/if}
            </li>
        {/each}
    </ol>

    <div class="top10__pie">
        <p class="top10__cuenta" aria-live="polite"><strong>{estado.acertados.length}</strong> de {PUESTOS}</p>
        {#if estado.terminada}
            <CuentaRegresiva etiqueta="Nueva carrera en:" activa={estado.terminada} {fecha} />
        {:else}
            <Cronometro opciones={estado.opciones} activo={!estado.terminada} alTerminar={terminarTiempo} />
        {/if}
    </div>
</section>

<PanelIntento id="panel-intento-top10" titulo="Elegí un piloto" oculto={estado.terminada} deshabilitado={estado.terminada} alIntentar={intentar}>
    {#snippet buscador()}
        <Buscador
            bind:this={campoBuscador}
            id="nombre-piloto-top10"
            idLista="sugerencias-top10"
            placeholder="Escribí un piloto"
            etiquetaCampo="Nombre del piloto"
            consejoVacio="Probá con el apellido."
            deshabilitado={estado.terminada}
            elementos={candidatos}
            obtenerEtiqueta={(piloto: PilotoCarrera) => piloto.nombre}
            obtenerTextoCorto={(piloto: PilotoCarrera) => piloto.nombre.split(" ").pop() ?? piloto.nombre}
            estaExcluido={(piloto: PilotoCarrera) => estado.intentos.includes(piloto.id)}
            alEnviar={intentar}
            invalido={entradaInvalida}
            idMensaje="mensaje-top10"
            alCambiar={() => {
                mensaje = { texto: "", tipo: "" };
                entradaInvalida = false;
            }}
        >
            {#snippet opcion(piloto: PilotoCarrera)}
                {@const delCatalogo = buscarPilotoCatalogo(piloto.nombre, pilotos)}
                {#if delCatalogo}
                    <OpcionPiloto piloto={{ ...delCatalogo, nombre: piloto.nombre }} />
                {:else}
                    <span class="buscador__avatar">
                        <img src={urlImagen(fotoDe(piloto.nombre))} alt="" loading="lazy" />
                    </span>
                    <span class="buscador__nombre">{piloto.nombre}</span>
                {/if}
            {/snippet}
        </Buscador>
    {/snippet}
    {#snippet pie()}
        <p id="mensaje-top10" class={"mensaje-juego" + (mensaje.tipo ? " mensaje-juego--" + mensaje.tipo : "")} aria-live="polite">{mensaje.texto}</p>
        <div class="rendirse">
            {#if confirmandoRendirse}
                <span class="rendirse__pregunta">¿Ver el resultado y terminar?</span>
                <button type="button" class="rendirse__boton rendirse__boton--confirmar" onclick={rendirse}>Sí, me rindo</button>
                <button type="button" class="rendirse__boton" onclick={() => (confirmandoRendirse = false)}>Seguir jugando</button>
            {:else}
                <button type="button" class="rendirse__boton" onclick={rendirse}>Me rindo</button>
            {/if}
        </div>
    {/snippet}
</PanelIntento>

<ModalResultado
    bind:this={modal}
    juego="top10"
    {fecha}
    terminada={estado.terminada}
    correcto={estado.gano}
    titulo={estado.gano ? "¡Top 10 completo!" : estado.sinTiempo ? "Se terminó el tiempo" : "Te rendiste"}
    resumen={estado.acertados.length + " de " + PUESTOS}
    {armarTexto}
    etiquetaRegreso="Nueva carrera en:"
    clase="resultado-top10-modal"
    focoRetorno={() => tablero}
>
    <strong class="resultado-modal__nombre">{carrera.nombre} {carrera.anio}</strong>
    <p class="resultado-top10-modal__marcador"><strong>{estado.acertados.length}</strong> de {PUESTOS}</p>
</ModalResultado>
