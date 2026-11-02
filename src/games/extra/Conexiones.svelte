<script lang="ts">
    // Conexiones TC: 16 pilotos en cuatro grupos ocultos de cuatro. Se eligen cuatro
    // y se prueba; con cuatro errores se termina.
    import BotonCompartir from "../../components/BotonCompartir.svelte";
    import CuentaRegresiva from "../../components/CuentaRegresiva.svelte";
    import { pilotos } from "../../data/catalogo/pilotos";
    import { obtenerAlmacenamiento } from "../../lib/almacenamiento";
    import { crearDatoDiario } from "../../lib/dato-diario";
    import { leerDiaJuego } from "../../lib/dia-juego";
    import { generarConexiones, MAXIMO_ERRORES_CONEXIONES, probarConexion, type FichaPiloto } from "../../lib/extra";
    import { obtenerImagenMiniPiloto } from "../../lib/pilotos";
    import { urlImagen, urlSitio } from "../../lib/rutas";

    let { fichas }: { fichas: FichaPiloto[] } = $props();

    interface EstadoConexiones {
        resueltos: string[];
        /** Cada intento, para el texto que se comparte. */
        intentos: number[][];
        errores: number;
    }

    const COLORES = ["amarillo", "verde", "azul", "violeta"];
    const EMOJIS = ["🟨", "🟩", "🟦", "🟪"];

    const dia = leerDiaJuego(location.search);
    const fecha = dia.fecha;
    const conexiones = generarConexiones(fichas, "conexiones:" + fecha);
    const guardado = crearDatoDiario<EstadoConexiones>({
        almacenamiento: obtenerAlmacenamiento(),
        clave: dia.esArchivo ? "tcdleConexionesArchivo" : "tcdleConexiones",
        fecha,
    });

    let estado = $state<EstadoConexiones>(guardado.leer() ?? { resueltos: [], intentos: [], errores: 0 });
    let seleccion = $state<number[]>([]);
    let orden = $state<number[]>(conexiones.orden);
    let mensaje = $state("");

    const gano = $derived(estado.resueltos.length === 4);
    const terminada = $derived(gano || estado.errores >= MAXIMO_ERRORES_CONEXIONES);
    const grupoDe = (id: number) => conexiones.grupos.findIndex((item) => item.pilotos.includes(id));
    // Al terminar sin ganar se muestran todos los grupos, en el orden de dificultad.
    const gruposVisibles = $derived(
        terminada
            ? [...estado.resueltos.map((id) => conexiones.grupos.find((item) => item.grupo.id === id)!), ...conexiones.grupos.filter((item) => !estado.resueltos.includes(item.grupo.id))]
            : estado.resueltos.map((id) => conexiones.grupos.find((item) => item.grupo.id === id)!)
    );
    const sueltos = $derived(orden.filter((id) => !gruposVisibles.some((item) => item.pilotos.includes(id))));
    const piloto = (id: number) => pilotos.find((item) => item.id === id)!;

    const textoCompartir = $derived(
        [
            "TCdle · Conexiones · " + fecha.slice(8, 10) + "/" + fecha.slice(5, 7),
            "🏁 " + estado.resueltos.length + "/4 · " + estado.errores + (estado.errores === 1 ? " error" : " errores"),
            ...estado.intentos.map((intento) => intento.map((id) => EMOJIS[conexiones.grupos[grupoDe(id)].grupo.dificultad]).join("")),
            urlSitio(),
        ].join("\n")
    );

    function alternar(id: number) {
        if (terminada) {
            return;
        }
        mensaje = "";
        seleccion = seleccion.includes(id) ? seleccion.filter((item) => item !== id) : seleccion.length < 4 ? [...seleccion, id] : seleccion;
    }

    function mezclar() {
        const copia = [...orden];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        orden = copia;
    }

    function probar() {
        if (seleccion.length !== 4) {
            return;
        }
        const ordenada = [...seleccion].sort((a, b) => a - b);
        if (estado.intentos.some((intento) => [...intento].sort((a, b) => a - b).join() === ordenada.join())) {
            mensaje = "Ya probaste esos cuatro.";
            return;
        }

        const resultado = probarConexion(conexiones, seleccion);
        estado.intentos.push([...seleccion]);
        if (resultado.grupo) {
            estado.resueltos.push(resultado.grupo);
            mensaje = "";
            seleccion = [];
        } else {
            estado.errores++;
            mensaje = resultado.aUno ? "¡Uno afuera! Tres son del mismo grupo." : "No son un grupo.";
        }
        guardado.guardar($state.snapshot(estado));
    }
</script>

<div class="conexiones">
    {#each gruposVisibles as { grupo, pilotos: ids } (grupo.id)}
        <div class={"conexiones__grupo conexiones__grupo--" + COLORES[grupo.dificultad]}>
            <b>{grupo.texto}</b>
            <span>{ids.map((id) => piloto(id).nombre).join(" · ")}</span>
        </div>
    {/each}

    {#if sueltos.length > 0}
        <div class="conexiones__tablero" role="group" aria-label="Pilotos para agrupar">
            {#each sueltos as id (id)}
                <button
                    type="button"
                    class="conexiones__piloto"
                    aria-pressed={seleccion.includes(id)}
                    disabled={terminada}
                    onclick={() => alternar(id)}
                >
                    <img src={urlImagen(obtenerImagenMiniPiloto(piloto(id)))} alt="" />
                    <span>{piloto(id).nombre}</span>
                </button>
            {/each}
        </div>
    {/if}

    {#if terminada}
        <section class="extra-resultado extra-resultado--compacto" class:extra-resultado--correcto={gano} aria-live="polite">
            <div class="extra-resultado__texto">
                <p class="extra-resultado__etiqueta">{gano ? "Bandera a cuadros" : "Se terminaron los errores"}</p>
                <h2>{estado.resueltos.length} de 4 grupos</h2>
                <CuentaRegresiva etiqueta="Nuevas conexiones en:" activa={true} {fecha} />
            </div>
            <BotonCompartir texto={textoCompartir} />
        </section>
    {:else}
        <div class="conexiones__controles">
            <p class="conexiones__errores" aria-label={"Te quedan " + (MAXIMO_ERRORES_CONEXIONES - estado.errores) + " errores"}>
                Errores:
                {#each Array.from({ length: MAXIMO_ERRORES_CONEXIONES }) as _, indice (indice)}
                    <i class:usado={indice < estado.errores}></i>
                {/each}
            </p>
            <button type="button" class="extra-boton extra-boton--claro" onclick={mezclar}>Mezclar</button>
            <button type="button" class="extra-boton extra-boton--claro" disabled={seleccion.length === 0} onclick={() => (seleccion = [])}>Deseleccionar</button>
            <button type="button" class="extra-boton" disabled={seleccion.length !== 4} onclick={probar}>Probar</button>
        </div>
        <p class="mensaje-juego" aria-live="polite">{mensaje}</p>
    {/if}
</div>
