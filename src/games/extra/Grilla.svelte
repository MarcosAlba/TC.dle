<script lang="ts">
    // Grilla TC: nueve casilleros, cada uno pide un piloto que cumpla su fila y su
    // columna. Nueve intentos en total y cada piloto vale una sola vez.
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
    import { generarGrilla, MAXIMO_INTENTOS_GRILLA, respuestasCasillero, type FichaPiloto } from "../../lib/extra";
    import { obtenerApellidoPiloto, obtenerImagenMiniPiloto, obtenerTextoBusquedaPiloto } from "../../lib/pilotos";
    import { urlImagen, urlSitio } from "../../lib/rutas";

    let { fichas }: { fichas: FichaPiloto[] } = $props();

    interface EstadoGrilla {
        /** Piloto puesto en cada casillero (0 a 8, por filas). */
        respuestas: Record<number, number>;
        intentosUsados: number;
        rendido: boolean;
    }

    const dia = leerDiaJuego(location.search);
    const fecha = dia.fecha;
    const grilla = generarGrilla(fichas, "grilla:" + fecha);
    const guardado = crearDatoDiario<EstadoGrilla>({
        almacenamiento: obtenerAlmacenamiento(),
        clave: dia.esArchivo ? "tcdleGrillaArchivo" : "tcdleGrilla",
        fecha,
    });

    let estado = $state<EstadoGrilla>(guardado.leer() ?? { respuestas: {}, intentosUsados: 0, rendido: false });
    let elegido = $state<number | null>(null);
    let mensaje = $state("");
    let campoBuscador: ReturnType<typeof Buscador<Piloto>> | undefined = $state();

    const aciertos = $derived(Object.keys(estado.respuestas).length);
    const terminada = $derived(estado.rendido || aciertos === 9 || estado.intentosUsados >= MAXIMO_INTENTOS_GRILLA);
    const usados = $derived(new Set(Object.values(estado.respuestas)));
    const casillero = (indice: number) => ({ fila: grilla.filas[Math.floor(indice / 3)], columna: grilla.columnas[indice % 3] });
    const fotoDe = (id: number) => urlImagen(obtenerImagenMiniPiloto(pilotos.find((piloto) => piloto.id === id)!));
    const nombreDe = (id: number) => pilotos.find((piloto) => piloto.id === id)!.nombre;

    const textoCompartir = $derived(
        [
            "TCdle · Grilla · " + fecha.slice(8, 10) + "/" + fecha.slice(5, 7),
            "🏁 " + aciertos + "/9",
            ...[0, 1, 2].map((fila) => [0, 1, 2].map((columna) => (estado.respuestas[fila * 3 + columna] ? "🟩" : "⬛")).join("")),
            urlSitio(),
        ].join("\n")
    );

    function guardar() {
        guardado.guardar($state.snapshot(estado));
    }

    function elegirCasillero(indice: number) {
        if (terminada || estado.respuestas[indice] !== undefined) {
            return;
        }
        elegido = indice;
        mensaje = "";
        requestAnimationFrame(() => campoBuscador?.enfocar());
    }

    function intentar() {
        if (elegido === null) {
            return;
        }
        const { elemento } = campoBuscador!.resolver();
        if (!elemento) {
            mensaje = "Elegí un piloto de la lista.";
            campoBuscador!.sacudir();
            return;
        }
        if (usados.has(elemento.id)) {
            mensaje = elemento.nombre + " ya está en otro casillero.";
            return;
        }

        const { fila, columna } = casillero(elegido);
        const ficha = fichas.find((item) => item.id === elemento.id)!;
        estado.intentosUsados++;
        if (fila.cumple(ficha) && columna.cumple(ficha)) {
            estado.respuestas[elegido] = elemento.id;
            mensaje = "¡Bien! " + elemento.nombre + " va ahí.";
            elegido = null;
        } else {
            const faltan = [fila, columna].filter((condicion) => !condicion.cumple(ficha)).map((condicion) => "«" + condicion.texto + "»");
            mensaje = elemento.nombre + " no cumple " + faltan.join(" ni ") + ".";
        }
        campoBuscador!.limpiar();
        guardar();
    }

    function rendirse() {
        estado.rendido = true;
        elegido = null;
        guardar();
    }
</script>

<div class="grilla-extra">
    <div class="grilla" role="grid" aria-label="Grilla TC">
        <div class="grilla__esquina" aria-hidden="true">
            <b>{aciertos}/9</b>
            <small>{terminada ? "Final" : MAXIMO_INTENTOS_GRILLA - estado.intentosUsados + " intentos"}</small>
        </div>
        {#each grilla.columnas as columna (columna.id)}
            <div class="grilla__cabecera" role="columnheader">{columna.texto}</div>
        {/each}
        {#each grilla.filas as fila, f (fila.id)}
            <div class="grilla__cabecera grilla__cabecera--fila" role="rowheader">{fila.texto}</div>
            {#each grilla.columnas as columna, c (columna.id)}
                {@const indice = f * 3 + c}
                {@const respuesta = estado.respuestas[indice]}
                {#if respuesta !== undefined}
                    <div class="grilla__celda grilla__celda--ok" role="gridcell">
                        <img src={fotoDe(respuesta)} alt="" />
                        <b>{nombreDe(respuesta)}</b>
                    </div>
                {:else if terminada}
                    {@const ejemplo = respuestasCasillero(fichas, fila, columna).find((ficha) => !usados.has(ficha.id))}
                    <div class="grilla__celda grilla__celda--vacia" role="gridcell">
                        {#if ejemplo}<small>Valía, por ejemplo:</small><b>{ejemplo.nombre}</b>{/if}
                    </div>
                {:else}
                    <button
                        type="button"
                        class="grilla__celda"
                        class:grilla__celda--elegida={elegido === indice}
                        role="gridcell"
                        aria-label={fila.texto + " y " + columna.texto}
                        onclick={() => elegirCasillero(indice)}>+</button
                    >
                {/if}
            {/each}
        {/each}
    </div>

    <aside class="grilla-extra__lado">
        {#if terminada}
            <section class="extra-resultado extra-resultado--compacto" class:extra-resultado--correcto={aciertos === 9} aria-live="polite">
                <div class="extra-resultado__texto">
                    <p class="extra-resultado__etiqueta">{aciertos === 9 ? "Grilla completa" : "Final"}</p>
                    <h2>{aciertos} de 9</h2>
                    <CuentaRegresiva etiqueta="Nueva grilla en:" activa={true} {fecha} />
                </div>
                <BotonCompartir texto={textoCompartir} />
            </section>
        {:else if elegido !== null}
            {@const { fila, columna } = casillero(elegido)}
            <p class="grilla-extra__pedido"><b>{fila.texto}</b> y <b>{columna.texto}</b></p>
            <PanelIntento titulo="Elegí un piloto para el casillero" alIntentar={intentar}>
                {#snippet buscador()}
                    <Buscador
                        bind:this={campoBuscador}
                        id="nombre-grilla"
                        idLista="sugerencias-grilla"
                        etiquetaCampo="Nombre del piloto"
                        consejoVacio="Probá con el apellido."
                        placeholder="Escribí un piloto"
                        elementos={pilotos}
                        obtenerEtiqueta={(piloto: Piloto) => piloto.nombre}
                        obtenerTextoBusqueda={obtenerTextoBusquedaPiloto}
                        obtenerTextoCorto={obtenerApellidoPiloto}
                        minimoCaracteres={1}
                        estaExcluido={(piloto: Piloto) => usados.has(piloto.id)}
                        alEnviar={intentar}
                        alCambiar={() => (mensaje = "")}
                    >
                        {#snippet opcion(piloto: Piloto)}
                            <OpcionPiloto {piloto} />
                        {/snippet}
                    </Buscador>
                {/snippet}
            </PanelIntento>
        {:else}
            <p class="extra__ayuda">Tocá un casillero y elegí un piloto que cumpla la fila y la columna. Cada piloto va una sola vez y tenés {MAXIMO_INTENTOS_GRILLA} intentos.</p>
        {/if}
        <p class="mensaje-juego" aria-live="polite">{mensaje}</p>
        {#if !terminada}
            <button type="button" class="extra-boton extra-boton--claro" onclick={rendirse}>Rendirse</button>
        {/if}
    </aside>
</div>
