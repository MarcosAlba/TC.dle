<script lang="ts">
    // Wordle del TC: adivinar la palabra del día en largo + 1 intentos.
    import { tick } from "svelte";
    import CuentaRegresiva from "../components/CuentaRegresiva.svelte";
    import ModalResultado from "../components/ModalResultado.svelte";
    import { palabras } from "../data";
    import { obtenerAlmacenamiento } from "../lib/almacenamiento";
    import { obtenerFechaLocal } from "../lib/fechas";
    import { describirContador, palabraIntentos } from "../lib/intentos";
    import { crearPartidaDiaria } from "../lib/partida";
    import { obtenerSeleccionDiaria } from "../lib/seleccion-diaria";
    import {
        FILAS_TECLADO,
        esIntentoValido,
        evaluarIntento,
        filtrarPalabrasJugables,
        mejorarEstadoTecla,
        type EstadoLetra,
    } from "../lib/wordle";
    import type { TipoMensaje } from "./compartido/juego-adivinanza.svelte";

    interface FilaTablero {
        letras: string[];
        estados: (EstadoLetra | null)[];
        girando: boolean[];
        salto: boolean[];
    }

    const fecha = obtenerFechaLocal();
    const palabraDelDia = obtenerSeleccionDiaria(filtrarPalabrasJugables(palabras), "wordle")!;
    const largo = palabraDelDia.length;
    const maximoIntentos = largo + 1;

    // A diferencia de los otros modos no hay un catálogo cerrado de intentos
    // válidos: sirve cualquier combinación de letras del largo de la palabra
    // del día. El catálogo solo se usa para elegir la palabra secreta.
    const partida = crearPartidaDiaria<string>({
        almacenamiento: obtenerAlmacenamiento(),
        clave: "partidaTCdleWordle",
        fecha,
        objetivoId: palabraDelDia,
        maximoIntentos,
        validarId: (id) => esIntentoValido(id, largo),
    });
    const estadoInicial = partida.cargar();
    let estado = $state(estadoInicial);

    const crearFila = (): FilaTablero => ({
        letras: new Array(largo).fill(""),
        estados: new Array(largo).fill(null),
        girando: new Array(largo).fill(false),
        salto: new Array(largo).fill(false),
    });

    let tablero = $state<FilaTablero[]>(Array.from({ length: maximoIntentos }, crearFila));
    let teclas = $state<Record<string, EstadoLetra>>({});
    let intentoActual = "";
    let filaActiva = $state(estadoInicial.idsIntentados.length);
    let mensaje = $state<{ texto: string; tipo: TipoMensaje }>({ texto: "", tipo: "" });
    // El resultado espera a que termine la animación de la última fila.
    let finalizada = $state(estadoInicial.terminada);
    let elementoTablero: HTMLElement | undefined = $state();
    let modal: ReturnType<typeof ModalResultado> | undefined = $state();

    const contador = $derived(describirContador(estado));

    const esperar = (milisegundos: number) => new Promise<void>((resolver) => setTimeout(resolver, milisegundos));

    function pintarTecla(letra: string, estadoLetra: EstadoLetra) {
        teclas[letra] = mejorarEstadoTecla(teclas[letra], estadoLetra);
    }

    // Las palabras guardadas se muestran ya reveladas, sin animación.
    estadoInicial.idsIntentados.forEach((palabra, indice) => {
        const estados = evaluarIntento(palabra, palabraDelDia);

        palabra.split("").forEach((letra, columna) => {
            tablero[indice].letras[columna] = letra;
            tablero[indice].estados[columna] = estados[columna];
            pintarTecla(letra, estados[columna]);
        });
    });

    function mostrarMensaje(texto: string, tipo: TipoMensaje = "") {
        mensaje = { texto, tipo };
    }

    function manejarTecla(tecla: string) {
        if (estado.terminada) {
            return;
        }

        if (tecla === "ENTER") {
            enviarIntento();
        } else if (tecla === "BORRAR") {
            intentoActual = intentoActual.slice(0, -1);
            actualizarFilaActual();
        } else if (intentoActual.length < largo) {
            intentoActual += tecla;
            actualizarFilaActual();
        }
    }

    function actualizarFilaActual() {
        const fila = tablero[filaActiva];

        if (!fila) {
            return;
        }

        for (let columna = 0; columna < largo; columna++) {
            fila.letras[columna] = intentoActual[columna] ?? "";
        }
    }

    function agitarFilaActual() {
        const fila = elementoTablero?.children[filaActiva] as HTMLElement | undefined;

        if (!fila) {
            return;
        }

        fila.classList.remove("fila-wordle--agitando");
        void fila.offsetWidth;
        fila.classList.add("fila-wordle--agitando");
    }

    async function revelarFila(indiceFila: number, palabraIntentada: string) {
        const estados = evaluarIntento(palabraIntentada, palabraDelDia);
        const fila = tablero[indiceFila];
        const duracionGiro = 420;

        for (let columna = 0; columna < largo; columna++) {
            fila.letras[columna] = palabraIntentada[columna];
            fila.girando[columna] = true;
            await esperar(duracionGiro / 2);
            fila.estados[columna] = estados[columna];
            await esperar(duracionGiro / 2);
            fila.girando[columna] = false;
            pintarTecla(palabraIntentada[columna], estados[columna]);
        }
    }

    async function celebrarFilaGanadora(indiceFila: number) {
        const retardoEntreCeldas = 80;

        for (let columna = 0; columna < largo; columna++) {
            setTimeout(() => (tablero[indiceFila].salto[columna] = true), columna * retardoEntreCeldas);
        }

        await esperar(largo * retardoEntreCeldas + 550);
    }

    async function enviarIntento() {
        if (intentoActual.length !== largo) {
            mostrarMensaje("Faltan letras.", "error");
            agitarFilaActual();
            return;
        }

        const intento = partida.intentar(intentoActual);

        if (intento.resultado === "repetida") {
            mostrarMensaje("Ya probaste esa palabra.", "error");
            return;
        }
        if (intento.resultado === "bloqueada" || intento.resultado === "invalida") {
            return;
        }

        const indiceFila = filaActiva;
        const palabraEnviada = intentoActual;
        estado = intento.estado;
        filaActiva++;
        intentoActual = "";

        await revelarFila(indiceFila, palabraEnviada);

        // El resultado (ganaste o perdiste) lo anuncia el modal: acá solo se limpia el error previo.
        mostrarMensaje("");

        if (intento.resultado === "correcta") {
            await celebrarFilaGanadora(indiceFila);
        }
        if (intento.resultado === "correcta" || intento.resultado === "agotada") {
            finalizada = true;
            await tick();
            modal?.abrir();
        }
    }

    function alTeclear(evento: KeyboardEvent) {
        if (evento.ctrlKey || evento.metaKey || evento.altKey || estado.terminada) {
            return;
        }

        const tecla = evento.key.length === 1 ? evento.key.toUpperCase() : evento.key;

        if (tecla === "Enter") {
            evento.preventDefault();
            manejarTecla("ENTER");
        } else if (tecla === "Backspace") {
            evento.preventDefault();
            manejarTecla("BORRAR");
        } else if (/^[A-ZÑ]$/.test(tecla)) {
            manejarTecla(tecla);
        }
    }

    // Resumen del resultado en la ventana final (sin letras, para compartir el recorrido).
    const resumen = $derived(estado.idsIntentados.map((palabra) => evaluarIntento(palabra, palabraDelDia)));
</script>

<svelte:document onkeydown={alTeclear} />

<section class="tarjeta-desafio tarjeta-desafio--suelta tarjeta-wordle" aria-label="Tablero del día">
    <div bind:this={elementoTablero} class="tablero-wordle" role="group" aria-label="Tablero de letras" style:--largo-palabra={largo}>
        {#each tablero as fila}
            <div class="fila-wordle" role="row">
                {#each fila.letras as letra, columna}
                    {@const estadoLetra = fila.estados[columna]}
                    <span
                        class="celda-wordle"
                        class:celda-wordle--llena={letra !== "" && estadoLetra === null}
                        class:celda-wordle--girando={fila.girando[columna]}
                        class:celda-wordle--correcta={estadoLetra === "correcta"}
                        class:celda-wordle--presente={estadoLetra === "presente"}
                        class:celda-wordle--ausente={estadoLetra === "ausente"}
                        class:celda-wordle--salto={fila.salto[columna]}
                        role="gridcell">{letra}</span
                    >
                {/each}
            </div>
        {/each}
    </div>
    <div class="estado-diario">
        <p class="contador-intentos solo-lectores" class:contador-intentos--ultimo={contador.ultimo} aria-live="polite" hidden={estado.terminada}>
            {contador.texto}
        </p>
        <CuentaRegresiva etiqueta="Nueva palabra en:" activa={finalizada} {fecha} />
    </div>
</section>

<p class={"mensaje-juego mensaje-wordle" + (mensaje.tipo ? " mensaje-juego--" + mensaje.tipo : "")} aria-live="polite">{mensaje.texto}</p>

<section class="teclado-virtual" aria-label="Teclado virtual">
    {#each FILAS_TECLADO as filaTeclas}
        <div class="teclado-virtual__fila">
            {#each filaTeclas as tecla}
                {@const ancha = tecla === "ENTER" || tecla === "BORRAR"}
                <button
                    type="button"
                    class="tecla"
                    class:tecla--ancha={ancha}
                    class:tecla--correcta={teclas[tecla] === "correcta"}
                    class:tecla--presente={teclas[tecla] === "presente"}
                    class:tecla--ausente={teclas[tecla] === "ausente"}
                    disabled={finalizada}
                    aria-label={tecla === "BORRAR" ? "Borrar letra" : tecla === "ENTER" ? "Enviar intento" : "Letra " + tecla}
                    onclick={() => manejarTecla(tecla)}
                >
                    {tecla === "BORRAR" ? "⌫" : tecla}
                </button>
            {/each}
        </div>
    {/each}
</section>

<ModalResultado
    bind:this={modal}
    juego="wordle"
    {fecha}
    terminada={finalizada}
    correcto={estado.acerto}
    titulo={estado.acerto ? "¡Adivinaste!" : "No la adivinaste"}
    etiquetaRegreso="Nueva palabra en:"
    clase="resultado-wordle-modal"
    focoRetorno={() => elementoTablero}
>
    <strong class="resultado-modal__nombre">{palabraDelDia}</strong>
    <p class="resultado-modal__detalle">
        {estado.acerto
            ? "Lo resolviste en " + estado.intentosUsados + " " + palabraIntentos(estado.intentosUsados) + "."
            : 'La palabra era "' + palabraDelDia + '".'}
    </p>
    <div class="resumen-wordle-modal" aria-hidden="true" style:--largo-palabra={largo}>
        {#each resumen as estados}
            <div class="resumen-wordle-modal__fila">
                {#each estados as estadoLetra}
                    <span
                        class="resumen-wordle-modal__celda"
                        class:resumen-wordle-modal__celda--correcta={estadoLetra === "correcta"}
                        class:resumen-wordle-modal__celda--presente={estadoLetra === "presente"}
                    ></span>
                {/each}
            </div>
        {/each}
    </div>
</ModalResultado>
