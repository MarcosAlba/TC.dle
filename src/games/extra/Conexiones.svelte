<script lang="ts">
    // Conexiones TC: 16 pilotos en cuatro grupos ocultos de cuatro. Se eligen cuatro
    // y se prueba; con cuatro errores se termina. El tablero es de 4 × 4 en todas
    // las pantallas, así se ven los dieciséis juntos y los botones quedan a mano.
    import { tick } from "svelte";
    import ResultadoEnLinea from "../../components/ResultadoEnLinea.svelte";
    import { pilotos } from "../../data/catalogo/pilotos";
    import { obtenerAlmacenamiento } from "../../lib/almacenamiento";
    import { leerDiaJuego } from "../../lib/dia-juego";
    import { generarConexiones, MAXIMO_ERRORES_CONEXIONES, probarConexion, type FichaPiloto } from "../../lib/extra";
    import { crearPartidaExtra } from "../../lib/partida-extra";
    import { obtenerApellidoPiloto, obtenerImagenMiniPiloto } from "../../lib/pilotos";
    import { urlImagen, urlSitio } from "../../lib/rutas";

    let { fichas }: { fichas: FichaPiloto[] } = $props();

    interface EstadoConexiones {
        resueltos: string[];
        /** Cada intento, para el texto que se comparte. */
        intentos: number[][];
        errores: number;
    }

    // Por el orden del grupo en el día (del más fácil al más difícil).
    const COLORES = ["amarillo", "verde", "azul", "violeta"];
    const EMOJIS = ["🟨", "🟩", "🟦", "🟪"];

    const dia = leerDiaJuego(location.search);
    const fecha = dia.fecha;
    const conexiones = generarConexiones(fichas, "conexiones:" + fecha);
    const partida = crearPartidaExtra<EstadoConexiones>(obtenerAlmacenamiento(), "conexiones", dia);

    let estado = $state<EstadoConexiones>(partida.leer() ?? { resueltos: [], intentos: [], errores: 0 });
    let seleccion = $state<number[]>([]);
    let orden = $state<number[]>(conexiones.orden);
    let mensaje = $state("");
    let modal: ReturnType<typeof ResultadoEnLinea> | undefined = $state();
    /** Grupos que se acaban de armar en vivo: entran plegándose en su barra de color. */
    let recienArmados = $state<string[]>([]);
    let tablero: HTMLElement | undefined = $state();
    /** Animaciones del tablero: los cuatro que acertaste saltan antes de armar el grupo; si erraste, tiemblan. */
    let saltando = $state<number[]>([]);
    let temblando = $state(false);
    const esperar = (ms: number) => new Promise((listo) => setTimeout(listo, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms));

    const gano = $derived(estado.resueltos.length === 4);
    const terminada = $derived(gano || estado.errores >= MAXIMO_ERRORES_CONEXIONES);
    const nivelDe = (id: number) => conexiones.grupos.findIndex((item) => item.pilotos.includes(id));
    const nivelDeGrupo = (grupoId: string) => conexiones.grupos.findIndex((item) => item.grupo.id === grupoId);
    // Al terminar sin ganar se muestran todos los grupos: primero los resueltos, después el resto.
    const gruposVisibles = $derived(
        terminada
            ? [...estado.resueltos.map((id) => conexiones.grupos.find((item) => item.grupo.id === id)!), ...conexiones.grupos.filter((item) => !estado.resueltos.includes(item.grupo.id))]
            : estado.resueltos.map((id) => conexiones.grupos.find((item) => item.grupo.id === id)!)
    );
    const sueltos = $derived(orden.filter((id) => !gruposVisibles.some((item) => item.pilotos.includes(id))));
    const piloto = (id: number) => pilotos.find((item) => item.id === id)!;
    /** Apellido corto; si dos de los dieciséis comparten apellido (los Canapino), va con la inicial. */
    const apellidos = conexiones.orden.map((id) => obtenerApellidoPiloto(piloto(id)));
    const nombreCorto = (id: number) => {
        const apellido = obtenerApellidoPiloto(piloto(id));
        return apellidos.filter((otro) => otro === apellido).length > 1 ? piloto(id).nombre.charAt(0) + ". " + apellido : apellido;
    };
    // Ganando, el máximo de intentos es cuatro aciertos más tres errores.
    const marcador = $derived({ puntaje: gano ? estado.intentos.length : null, maximo: 4 + MAXIMO_ERRORES_CONEXIONES - 1, gano });
    // Cada intento es una fila con el color del grupo de cada piloto elegido, sin nombres.
    const armarTexto = (racha: number) => {
        const puntos = "🏁 " + estado.resueltos.length + "/4 · " + estado.errores + (estado.errores === 1 ? " error" : " errores");
        return [
            "TCdle · Conexiones · " + fecha.slice(8, 10) + "/" + fecha.slice(5, 7),
            racha > 0 ? puntos + " · 🔥 " + racha : puntos,
            ...estado.intentos.map((intento) => intento.map((id) => EMOJIS[nivelDe(id)]).join("")),
            urlSitio(),
        ].join("\n");
    };

    function guardar() {
        partida.guardar($state.snapshot(estado), { terminada, gano, intentos: estado.intentos });
    }

    if (terminada) {
        guardar();
    }

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

    async function probar() {
        if (seleccion.length !== 4 || terminada) {
            return;
        }
        const ordenada = [...seleccion].sort((a, b) => a - b);
        if (estado.intentos.some((intento) => [...intento].sort((a, b) => a - b).join() === ordenada.join())) {
            mensaje = "Ya probaste esos cuatro.";
            return;
        }

        const resultado = probarConexion(conexiones, seleccion);
        if (resultado.grupo) {
            // Los cuatro saltan uno tras otro y recién después se juntan en su barra.
            saltando = [...seleccion];
            await esperar(520);
            saltando = [];
        } else {
            temblando = true;
            setTimeout(() => (temblando = false), 360);
        }
        estado.intentos.push([...seleccion]);
        if (resultado.grupo) {
            estado.resueltos.push(resultado.grupo);
            recienArmados = [resultado.grupo];
            mensaje = "";
            seleccion = [];
        } else {
            estado.errores++;
            mensaje = resultado.aUno ? "¡Uno afuera! Tres son del mismo grupo." : "No son un grupo.";
        }
        guardar();
        if (terminada) {
            seleccion = [];
            // Al perder, los grupos que faltaban se arman uno tras otro.
            if (!gano) {
                recienArmados = conexiones.grupos.map((item) => item.grupo.id).filter((id) => !estado.resueltos.includes(id));
            }
            await tick();
            modal?.abrir();
        }
    }
</script>

<div class="conexiones" class:conexiones--perdio={terminada && !gano} bind:this={tablero} tabindex="-1">
    {#each gruposVisibles as { grupo, pilotos: ids } (grupo.id)}
        <!-- Como Formudle: dos caras a cada lado y, en el medio, la consigna y los apellidos. -->
        <div
            class={"conexiones__grupo conexiones__grupo--" + COLORES[nivelDeGrupo(grupo.id)]}
            class:conexiones__grupo--nuevo={recienArmados.includes(grupo.id)}
            style:--i={Math.max(0, recienArmados.indexOf(grupo.id))}
        >
            <span class="conexiones__caras conexiones__caras--izquierda" aria-hidden="true">
                {#each ids.slice(0, 2) as id (id)}<img src={urlImagen(obtenerImagenMiniPiloto(piloto(id)))} alt="" />{/each}
            </span>
            <span class="conexiones__consigna">
                <b>{grupo.texto}</b>
                <span>{ids.map(nombreCorto).join(", ")}</span>
            </span>
            <span class="conexiones__caras conexiones__caras--derecha" aria-hidden="true">
                {#each ids.slice(2) as id (id)}<img src={urlImagen(obtenerImagenMiniPiloto(piloto(id)))} alt="" />{/each}
            </span>
        </div>
    {/each}

    {#if sueltos.length > 0}
        <div class="conexiones__tablero" role="group" aria-label="Pilotos para agrupar">
            {#each sueltos as id (id)}
                <button
                    type="button"
                    class="conexiones__piloto"
                    class:conexiones__piloto--salta={saltando.includes(id)}
                    class:conexiones__piloto--tiembla={temblando && seleccion.includes(id)}
                    style:--i={Math.max(0, saltando.indexOf(id))}
                    aria-pressed={seleccion.includes(id)}
                    aria-label={piloto(id).nombre}
                    disabled={terminada}
                    onclick={() => alternar(id)}
                >
                    <img src={urlImagen(obtenerImagenMiniPiloto(piloto(id)))} alt="" />
                    <span aria-hidden="true">{nombreCorto(id)}</span>
                </button>
            {/each}
        </div>
    {/if}

    <!-- Errores como círculos: vacíos los que quedan, llenos los usados (al perder, todos llenos). -->
    {#if !gano}
        <p class="conexiones__errores" aria-label={"Te quedan " + Math.max(0, MAXIMO_ERRORES_CONEXIONES - estado.errores) + " errores"}>
            {#each Array.from({ length: MAXIMO_ERRORES_CONEXIONES }) as _, indice (indice)}
                <i class:usado={indice < estado.errores}></i>
            {/each}
        </p>
    {/if}
    {#if !terminada}
        <div class="conexiones__controles">
            <button type="button" class="extra-boton extra-boton--claro" onclick={mezclar}>Mezclar</button>
            <button type="button" class="extra-boton extra-boton--claro" disabled={seleccion.length === 0} onclick={() => (seleccion = [])}>Soltar</button>
            <button type="button" class="extra-boton" disabled={seleccion.length !== 4} onclick={probar}>Probar</button>
        </div>
        <p class="mensaje-juego" aria-live="polite">{mensaje}</p>
    {/if}
</div>

<ResultadoEnLinea
    bind:this={modal}
    juego="conexiones"
    {fecha}
    {terminada}
    correcto={gano}
    nombre={gano ? "Cuatro grupos" : estado.resueltos.length + " de 4 grupos"}
    detalle={gano
        ? estado.errores === 0
            ? "Sin errores."
            : "Con " + estado.errores + (estado.errores === 1 ? " error." : " errores.")
        : "Arriba quedaron los cuatro grupos del día."}
    {armarTexto}
    {marcador}
    espera={recienArmados.length * 120 + 300}
    clase="resultado-linea--conexiones"
/>
