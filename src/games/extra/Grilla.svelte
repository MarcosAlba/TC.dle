<script lang="ts">
    // Grilla TC: nueve casilleros, cada uno pide un piloto que cumpla su fila y su
    // columna. Se escribe un piloto y se ubica solo en el casillero libre donde
    // encaja; si encaja en más de uno, se elige dónde ponerlo. Se juega contra
    // reloj (o sin tiempo, según lo elegido en la introducción) y cada piloto vale
    // una sola vez. Errar no termina la partida.
    import { onMount, tick } from "svelte";
    import Cronometro from "../../components/Cronometro.svelte";
    import Buscador from "../../components/Buscador.svelte";
    import ResultadoEnLinea from "../../components/ResultadoEnLinea.svelte";
    import OpcionPiloto from "../../components/OpcionPiloto.svelte";
    import PanelIntento from "../../components/PanelIntento.svelte";
    import { plantelExtra as pilotos } from "../../data/catalogo/plantel-extra";
    import type { Piloto } from "../../data/tipos";
    import { obtenerAlmacenamiento } from "../../lib/almacenamiento";
    import { construirTextoCompartir } from "../../lib/compartir";
    import { leerDiaJuego } from "../../lib/dia-juego";
    import {
        casillerosPosibles,
        CLAVE_DIFICULTAD_GRILLA,
        EVENTO_TIEMPO_GRILLA,
        leerDificultadGuardada,
        NOMBRES_DIFICULTAD,
        semillaDelDia,
        type Dificultad,
        generarGrilla,
        normalizarTiempoGrilla,
        resolverGrilla,
        respuestasCasillero,
        type Condicion,
        type FichaPiloto,
        type TiempoGrilla,
    } from "../../lib/extra";
    import { crearPartidaExtra } from "../../lib/partida-extra";
    import { obtenerApellidoPiloto, obtenerImagenMiniPiloto, obtenerTextoBusquedaPiloto } from "../../lib/pilotos";
    import { urlImagen, urlSitio } from "../../lib/rutas";

    let { fichas }: { fichas: FichaPiloto[] } = $props();

    // Insignias de las consignas (src/assets/grilla), en línea para que tomen la
    // tipografía del sitio y los colores del modo claro. Cada una es un archivo aparte:
    // se bajan solo las seis de la grilla del día (mientras tanto se ve el símbolo o el logo).
    const CARGAR_INSIGNIA = import.meta.glob("../../assets/grilla/*.svg", { query: "?raw", import: "default" }) as Record<string, () => Promise<string>>;
    let insignias = $state<Record<string, string>>({});
    const insigniaDe = (id: string) => insignias[id];

    interface EstadoGrilla {
        /** Piloto puesto en cada casillero (0 a 8, por filas). */
        respuestas: Record<number, number>;
        /** Cada piloto probado, en orden (los que entraron y los que no). */
        probados: number[];
        rendido: boolean;
        /** Segundos elegidos en la introducción (null: sin tiempo) y cuándo se tocó "Empezar". */
        limiteSegundos?: TiempoGrilla;
        inicio?: number;
        /** Se terminó el tiempo. */
        agotado?: boolean;
        /** Elegida en la introducción; cada dificultad tiene su propia grilla del día. */
        dificultad?: Dificultad;
    }

    const dia = leerDiaJuego(location.search);
    const fecha = dia.fecha;
    const partida = crearPartidaExtra<EstadoGrilla>(obtenerAlmacenamiento(), "grilla", dia);

    let estado = $state<EstadoGrilla>(partida.leer() ?? { respuestas: {}, probados: [], rendido: false });
    const dificultad = $derived(estado.dificultad ?? "normal");
    const grilla = $derived(generarGrilla(fichas, semillaDelDia("grilla", fecha, dificultad), dificultad));
    // Baja las insignias de la grilla del día (cambian si se elige otra dificultad).
    $effect(() => {
        for (const { insignia } of [...grilla.filas, ...grilla.columnas]) {
            if (insignias[insignia] !== undefined) {
                continue;
            }
            CARGAR_INSIGNIA["../../assets/grilla/" + insignia + ".svg"]?.().then((svg) => {
                insignias[insignia] = svg.replace(/href="marcas\//g, 'href="' + urlImagen("marcas/"));
            });
        }
    });
    /** Piloto que encaja en más de un casillero libre, esperando que se elija dónde va. */
    let pendiente = $state<{ id: number; casilleros: number[] } | null>(null);
    let mensaje = $state<{ texto: string; tipo: "" | "error" | "exito" }>({ texto: "", tipo: "" });
    let campoBuscador: ReturnType<typeof Buscador<Piloto>> | undefined = $state();
    let modal: ReturnType<typeof ResultadoEnLinea> | undefined = $state();
    /** Al completarla en vivo, los nueve casilleros laten en diagonal antes del resultado. */
    let festejar = $state(false);
    let tablero: HTMLElement | undefined = $state();

    const aciertos = $derived(Object.keys(estado.respuestas).length);
    const gano = $derived(aciertos === 9);
    const terminada = $derived(estado.rendido || gano || Boolean(estado.agotado));
    const empezada = $derived(estado.inicio !== undefined);
    const opcionesReloj = $derived({ marcas: true, limiteSegundos: estado.limiteSegundos ?? null, inicio: estado.inicio ?? 0 });
    const usados = $derived(new Set(Object.values(estado.respuestas)));
    const libres = $derived([0, 1, 2, 3, 4, 5, 6, 7, 8].filter((indice) => estado.respuestas[indice] === undefined));
    /**
     * Al terminar, un piloto que valía en cada casillero vacío: distintos entre sí
     * y sin repetir los ya puestos. Si no alcanzan, el primero libre de cada uno.
     */
    const ejemplos = $derived.by(() => {
        if (!terminada) {
            return new Map<number, number>();
        }
        const distintos = resolverGrilla(fichas, grilla, libres, usados);
        if (distintos) {
            return distintos;
        }
        const porCasillero = new Map<number, number>();
        for (const indice of libres) {
            const ficha = respuestasCasillero(fichas, grilla.filas[Math.floor(indice / 3)], grilla.columnas[indice % 3]).find((f) => !usados.has(f.id));
            if (ficha) {
                porCasillero.set(indice, ficha.id);
            }
        }
        return porCasillero;
    });
    const fotoDe = (id: number) => urlImagen(obtenerImagenMiniPiloto(pilotos.find((piloto) => piloto.id === id)!));
    const nombreDe = (id: number) => pilotos.find((piloto) => piloto.id === id)!.nombre;
    const apellidoDe = (id: number) => obtenerApellidoPiloto(pilotos.find((piloto) => piloto.id === id)!);
    /** El marcador son los casilleros completados: con reloj, no siempre se llega a los nueve. */
    const marcador = $derived({ puntaje: aciertos, maximo: 9, gano });
    const armarTexto = (racha: number) =>
        construirTextoCompartir({
            juego: "grilla",
            fecha,
            puntaje: marcador.puntaje,
            maximo: 9,
            racha,
            filas: [0, 1, 2].map((fila) => [0, 1, 2].map((columna) => (estado.respuestas[fila * 3 + columna] !== undefined ? "verde" : "negro"))),
            url: urlSitio(),
        });

    function guardar() {
        partida.guardar($state.snapshot(estado), { terminada, gano, intentos: estado.probados });
    }

    if (terminada) {
        guardar();
    }

    /** Arranca la partida con el tiempo y la dificultad elegidos. Solo la primera vez: recargar no reinicia el reloj. */
    function empezar(segundos: TiempoGrilla) {
        if (empezada || terminada) {
            return;
        }
        estado.dificultad = leerDificultadGuardada(obtenerAlmacenamiento(), CLAVE_DIFICULTAD_GRILLA);
        estado.limiteSegundos = segundos;
        estado.inicio = Date.now();
        guardar();
    }

    onMount(() => {
        const alElegir = (evento: Event) => empezar(normalizarTiempoGrilla((evento as CustomEvent).detail));
        document.addEventListener(EVENTO_TIEMPO_GRILLA, alElegir);
        // Si la introducción ya se vio hoy y no quedó guardado el inicio, se juega sin tiempo.
        if (document.documentElement.classList.contains("intro-vista")) {
            empezar(null);
        }
        return () => document.removeEventListener(EVENTO_TIEMPO_GRILLA, alElegir);
    });

    function agotarTiempo() {
        if (terminada) {
            return;
        }
        estado.agotado = true;
        mensaje = { texto: "Se terminó el tiempo.", tipo: "error" };
        guardar();
        alTerminar();
    }

    async function alTerminar() {
        if (terminada) {
            pendiente = null;
            festejar = gano;
            await tick();
            modal?.abrir();
        }
    }

    function ubicar(id: number, indice: number) {
        estado.respuestas[indice] = id;
        estado.probados.push(id);
        pendiente = null;
        mensaje = { texto: "", tipo: "" };
        guardar();
        alTerminar();
    }

    function intentar() {
        if (terminada || pendiente) {
            return;
        }
        const { elemento } = campoBuscador!.resolver();
        if (!elemento) {
            mensaje = { texto: "Elegí un piloto de la lista.", tipo: "error" };
            campoBuscador!.sacudir();
            return;
        }
        if (usados.has(elemento.id)) {
            mensaje = { texto: elemento.nombre + " ya está en la grilla.", tipo: "error" };
            return;
        }
        if (estado.probados.includes(elemento.id)) {
            mensaje = { texto: "Ya probaste con " + elemento.nombre + ".", tipo: "error" };
            return;
        }

        campoBuscador!.limpiar();
        const ficha = fichas.find((item) => item.id === elemento.id)!;
        const posibles = casillerosPosibles(grilla, ficha).filter((indice) => libres.includes(indice));

        if (posibles.length === 1) {
            ubicar(elemento.id, posibles[0]);
        } else if (posibles.length > 1) {
            pendiente = { id: elemento.id, casilleros: posibles };
            mensaje = { texto: "", tipo: "" };
        } else {
            estado.probados.push(elemento.id);
            const ocupado = casillerosPosibles(grilla, ficha).length > 0;
            mensaje = {
                texto: elemento.nombre + (ocupado ? " solo encaja en casilleros que ya completaste." : " no encaja en ningún casillero."),
                tipo: "error",
            };
            guardar();
            alTerminar();
        }
    }

    function rendirse() {
        estado.rendido = true;
        guardar();
        alTerminar();
    }
</script>

<!--
    Una sola columna, como Formudle: arriba el buscador; abajo la grilla de 4 × 4 cuadrados
    iguales, donde las consignas también son casilleros con el logo o un símbolo y un rótulo
    corto. En la esquina, los aciertos y el reloj.
-->
<div class="grilla-extra">
    <ResultadoEnLinea
        bind:this={modal}
        juego="grilla"
        {fecha}
        {terminada}
        correcto={gano}
        nombre={(gano ? "Grilla completa" : estado.agotado ? "Se terminó el tiempo" : aciertos + " de 9") + (dificultad === "normal" ? "" : " (" + NOMBRES_DIFICULTAD[dificultad].toLowerCase() + ")")}
        detalle={gano
            ? "La completaste con " + estado.probados.length + " " + (estado.probados.length === 1 ? "piloto probado" : "pilotos probados") + "."
            : "Los casilleros vacíos muestran un piloto que valía."}
        {armarTexto}
        {marcador}
        espera={festejar ? 800 : 0}
    />
    {#if !terminada}
        <div class="grilla-extra__barra">
            <PanelIntento titulo="Elegí un piloto" deshabilitado={terminada || pendiente !== null} alIntentar={intentar}>
                {#snippet buscador()}
                    <Buscador
                        bind:this={campoBuscador}
                        id="nombre-grilla"
                        idLista="sugerencias-grilla"
                        etiquetaCampo="Nombre del piloto"
                        consejoVacio="Probá con el apellido."
                        placeholder="Nombre del piloto"
                        elementos={pilotos}
                        obtenerEtiqueta={(piloto: Piloto) => piloto.nombre}
                        obtenerTextoBusqueda={obtenerTextoBusquedaPiloto}
                        obtenerTextoCorto={obtenerApellidoPiloto}
                        minimoCaracteres={1}
                        deshabilitado={terminada || pendiente !== null}
                        estaExcluido={(piloto: Piloto) => usados.has(piloto.id) || estado.probados.includes(piloto.id)}
                        alEnviar={intentar}
                        alCambiar={() => (mensaje = { texto: "", tipo: "" })}
                    >
                        {#snippet opcion(piloto: Piloto)}
                            <OpcionPiloto {piloto} />
                        {/snippet}
                    </Buscador>
                {/snippet}
            </PanelIntento>
        </div>
    {/if}

    <div class="grilla-extra__aviso" aria-live="polite">
        {#if pendiente}
            <p class="mensaje-juego">Tocá dónde va <b>{apellidoDe(pendiente.id)}</b></p>
            <button type="button" class="extra-boton extra-boton--texto" onclick={() => ((pendiente = null), (mensaje = { texto: "", tipo: "" }))}>
                Cancelar
            </button>
        {:else if mensaje.texto}
            <p class={"mensaje-juego" + (mensaje.tipo ? " mensaje-juego--" + mensaje.tipo : "")}>{mensaje.texto}</p>
        {/if}
    </div>

    <div class="grilla" role="grid" aria-label="Grilla TC" bind:this={tablero} tabindex="-1">
        <div class="grilla__esquina">
            <b aria-label={aciertos + " de 9 casilleros"}>{aciertos}<small>/9</small></b>
            <!-- Fuera de cualquier {#if} del buscador: el reloj sigue mientras se elige el casillero. -->
            <Cronometro opciones={opcionesReloj} activo={empezada && !terminada} alTerminar={agotarTiempo} />
        </div>
        {#each grilla.columnas as columna (columna.id)}
            {@render consigna(columna, "columnheader")}
        {/each}
        {#each grilla.filas as fila, f (fila.id)}
            {@render consigna(fila, "rowheader")}
            {#each grilla.columnas as columna, c (columna.id)}
                {@const indice = f * 3 + c}
                {@const respuesta = estado.respuestas[indice]}
                {#if respuesta !== undefined}
                    <div class="grilla__celda grilla__celda--ok" class:grilla__celda--festeja={festejar} style:--d={f + c} role="gridcell">
                        <img src={fotoDe(respuesta)} alt="" />
                        <b>{apellidoDe(respuesta)}</b>
                    </div>
                {:else if pendiente?.casilleros.includes(indice)}
                    <button
                        type="button"
                        class="grilla__celda grilla__celda--opcion"
                        role="gridcell"
                        aria-label={"Poner a " + nombreDe(pendiente.id) + " en " + fila.texto + " y " + columna.texto}
                        onclick={() => ubicar(pendiente!.id, indice)}
                    >
                        <img src={fotoDe(pendiente.id)} alt="" />
                        <b>Acá</b>
                    </button>
                {:else if terminada}
                    {@const ejemplo = ejemplos.has(indice) ? fichas.find((ficha) => ficha.id === ejemplos.get(indice)) : undefined}
                    <div class="grilla__celda grilla__celda--vacia" role="gridcell">
                        {#if ejemplo}<small>Valía</small><b>{ejemplo.nombre}</b>{/if}
                    </div>
                {:else}
                    <div class="grilla__celda" role="gridcell" aria-label={fila.texto + " y " + columna.texto + ": libre"}></div>
                {/if}
            {/each}
        {/each}
    </div>

    {#if !terminada}
        <button type="button" class="extra-boton extra-boton--texto grilla-extra__rendirse" onclick={rendirse}>Rendirse</button>
    {/if}
</div>

{#snippet consigna(condicion: Condicion, rol: "columnheader" | "rowheader")}
    <div class="grilla__consigna" role={rol} aria-label={condicion.texto} title={condicion.texto}>
        {#if condicion.insignia && insigniaDe(condicion.insignia)}
            <span class="grilla__insignia" aria-hidden="true">{@html insigniaDe(condicion.insignia)}</span>
        {:else if condicion.logo}
            <img class="grilla__logo" src={urlImagen(condicion.logo)} alt="" />
        {:else}
            <span class="grilla__simbolo" aria-hidden="true">{condicion.simbolo}</span>
        {/if}
        <small aria-hidden="true">{condicion.rotulo}</small>
    </div>
{/snippet}
