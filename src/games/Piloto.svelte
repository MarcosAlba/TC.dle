<script lang="ts">
    // Modo clásico: adivinar el piloto del día comparando sus datos.
    import AccionesResultado from "../components/AccionesResultado.svelte";
    import Buscador from "../components/Buscador.svelte";
    import CuentaRegresiva from "../components/CuentaRegresiva.svelte";
    import OpcionPiloto from "../components/OpcionPiloto.svelte";
    import PanelIntento from "../components/PanelIntento.svelte";
    import { pilotos } from "../data";
    import type { Piloto } from "../data/tipos";
    import { obtenerAlmacenamiento } from "../lib/almacenamiento";
    import { construirTextoCompartir, filaPiloto } from "../lib/compartir";
    import { obtenerFechaLocal } from "../lib/fechas";
    import { describirContador, palabraIntentos } from "../lib/intentos";
    import { mensajesDeBusqueda } from "../lib/mensajes";
    import { crearPartidaDiaria, migrarPartida } from "../lib/partida";
    import {
        compararPiloto,
        obtenerApellidoPiloto,
        obtenerPistasPiloto,
        obtenerTextoBusquedaPiloto,
    } from "../lib/pilotos";
    import { urlImagen, urlSitio } from "../lib/rutas";
    import { obtenerSeleccionDiaria } from "../lib/seleccion-diaria";
    import { crearJuegoAdivinanza } from "./compartido/juego-adivinanza.svelte";
    import FilaIntento from "./piloto/FilaIntento.svelte";
    import type { FilaPiloto } from "./piloto/tipos";

    const MAXIMO_INTENTOS = 8;
    const RETRASO_CELDAS = 350;
    const CELDAS_CON_PISTA = 6;

    const secreto = obtenerSeleccionDiaria(pilotos, "pilotos")!;
    const fecha = obtenerFechaLocal();
    const juego = crearJuegoAdivinanza<Piloto, number>({
        partida: crearPartidaDiaria<number>({
            almacenamiento: obtenerAlmacenamiento(),
            clave: "partidaTCdle",
            fecha,
            objetivoId: secreto.id,
            idsValidos: pilotos.map((piloto) => piloto.id),
            maximoIntentos: MAXIMO_INTENTOS,
            migrar: (datos) =>
                migrarPartida(datos, {
                    campoIntentos: "pilotosIntentados",
                    objetivoActual: secreto.id,
                    maximoIntentos: MAXIMO_INTENTOS,
                }),
        }),
        obtenerId: (piloto) => piloto.id,
        textos: mensajesDeBusqueda("piloto"),
        alError: () => campoBuscador?.sacudir(),
    });

    function crearFila(piloto: Piloto, animada: boolean): FilaPiloto {
        return {
            id: piloto.id,
            piloto,
            comparacion: compararPiloto(piloto, secreto),
            animada,
            reveladas: animada ? 0 : CELDAS_CON_PISTA,
        };
    }

    // La tabla muestra primero el último intento.
    let filas = $state<FilaPiloto[]>(
        juego.estado.idsIntentados
            .map((id) => pilotos.find((piloto) => piloto.id === id))
            .filter((piloto) => piloto !== undefined)
            .map((piloto) => crearFila(piloto, false))
            .reverse()
    );
    // Mientras se revelan las celdas no se puede jugar ni se muestra el resultado.
    let revelando = $state(false);
    // El resultado y las pistas esperan a que termine la animación de la última fila.
    let intentosVisibles = $state(juego.estado.intentosUsados);
    let resultadoVisible = $state(juego.estado.terminada);
    let pistaActiva = $state<string | null>(null);
    let campoBuscador: ReturnType<typeof Buscador<Piloto>> | undefined = $state();
    let panelResultado: HTMLElement | undefined = $state();

    const estado = $derived(juego.estado);
    const contador = $derived(describirContador(estado));
    const pistas = $derived(obtenerPistasPiloto(secreto).filter((pista) => pista.texto !== null));
    const textoPista = $derived(pistas.find((pista) => pista.id === pistaActiva)?.texto ?? "");
    const controlesBloqueados = $derived(revelando || estado.terminada);
    const tablaVisible = $derived(filas.length > 0);
    const acerto = $derived(estado.acerto);
    const claseNombre = $derived(
        secreto.nombre.length > 22 ? " resultado-final--nombre-muy-largo resultado-final--nombre-largo" : secreto.nombre.length > 17 ? " resultado-final--nombre-largo" : ""
    );

    // Si la partida guardada ya terminó, el mensaje final se muestra desde el principio.
    if (juego.estado.terminada) {
        mostrarMensajeFinal();
    }

    function mostrarMensajeFinal() {
        if (juego.estado.acerto) {
            juego.mostrarMensaje("¡Felicidades! Adivinaste el piloto secreto: " + secreto.nombre, "exito");
        } else {
            juego.mostrarMensaje("Se terminaron los intentos. El piloto era: " + secreto.nombre, "error");
        }
    }

    function esperar(milisegundos: number): Promise<void> {
        return new Promise((resolver) => setTimeout(resolver, milisegundos));
    }

    async function intentar() {
        const elegido = juego.validar(campoBuscador!.obtenerValor(), campoBuscador!.resolver());

        if (!elegido || revelando) {
            return;
        }

        juego.jugar(elegido);
        revelando = true;
        campoBuscador!.ocultar();
        resultadoVisible = false;
        juego.mostrarMensaje("");
        campoBuscador!.limpiar();

        const fila = crearFila(elegido, true);
        filas.unshift(fila);
        const filaReactiva = filas[0];

        for (let celda = 1; celda <= CELDAS_CON_PISTA; celda++) {
            await esperar(RETRASO_CELDAS);
            filaReactiva.reveladas = celda;
        }

        intentosVisibles = juego.estado.intentosUsados;
        revelando = false;

        if (juego.estado.terminada) {
            resultadoVisible = true;
            mostrarMensajeFinal();
            queueMicrotask(() => panelResultado?.scrollIntoView({ behavior: "smooth", block: "center" }));
            return;
        }

        campoBuscador!.enfocar();
    }

    // Una fila de colores por intento, del primero al último, igual que la tabla pero sin nombres.
    const armarTexto = (racha: number) =>
        construirTextoCompartir({
            juego: "piloto",
            fecha,
            puntaje: estado.acerto ? estado.intentosUsados : null,
            maximo: MAXIMO_INTENTOS,
            racha,
            filas: estado.idsIntentados
                .map((id) => pilotos.find((piloto) => piloto.id === id))
                .filter((piloto) => piloto !== undefined)
                .map((piloto) => filaPiloto(compararPiloto(piloto, secreto))),
            url: urlSitio(),
        });

    function alternarPista(id: string) {
        pistaActiva = pistaActiva === id ? null : id;
    }

    function detallePista(intentosNecesarios: number): string {
        const restantes = intentosNecesarios - intentosVisibles;

        if (restantes <= 0) {
            return "Disponible";
        }

        return "En " + restantes + " " + (restantes === 1 ? "intento" : "intentos");
    }
</script>

{#if pistas.length > 0 && !resultadoVisible}
    <section id="pistas" class="pistas" aria-labelledby="titulo-pistas">
        <h2 id="titulo-pistas" class="solo-lectores">Pistas</h2>
        <div class="pistas__lista">
            {#each pistas as pista (pista.id)}
                {@const disponible = intentosVisibles >= pista.intentos}
                <button
                    class="pista"
                    class:pista--disponible={disponible}
                    class:pista--activa={pistaActiva === pista.id}
                    type="button"
                    aria-controls="pista-texto"
                    aria-expanded={pistaActiva === pista.id}
                    disabled={!disponible}
                    onclick={() => alternarPista(pista.id)}
                >
                    <span class="pista__nombre">{pista.nombre}</span>
                    <span class="pista__detalle">{detallePista(pista.intentos)}</span>
                </button>
            {/each}
        </div>
        <p id="pista-texto" class="pistas__texto" aria-live="polite" hidden={pistaActiva === null}>{textoPista}</p>
    </section>
{/if}

<PanelIntento titulo="Elegí un piloto" oculto={resultadoVisible} deshabilitado={controlesBloqueados} alIntentar={intentar}>
    {#snippet buscador()}
        <Buscador
            bind:this={campoBuscador}
            id="nombre-piloto"
            idLista="sugerencias-pilotos"
            etiquetaCampo="Nombre del piloto"
            consejoVacio="Probá con el apellido."
            placeholder="Adiviná el piloto de hoy"
            deshabilitado={controlesBloqueados}
            elementos={pilotos}
            obtenerEtiqueta={(piloto: Piloto) => piloto.nombre}
            obtenerTextoBusqueda={obtenerTextoBusquedaPiloto}
            obtenerTextoCorto={obtenerApellidoPiloto}
            minimoCaracteres={1}
            estaExcluido={(piloto: Piloto) => estado.idsIntentados.includes(piloto.id)}
            alEnviar={intentar}
            invalido={juego.entradaInvalida}
            idMensaje="mensaje-piloto"
            alCambiar={() => juego.mostrarMensaje("")}
        >
            {#snippet opcion(piloto: Piloto)}
                <OpcionPiloto {piloto} />
            {/snippet}
        </Buscador>
    {/snippet}
    {#snippet pie()}
        <div class="estado-partida">
            <span class="contador-intentos" class:contador-intentos--ultimo={contador.ultimo} aria-live="polite" hidden={estado.terminada}>
                {contador.texto}
            </span>
            <p id="mensaje-piloto" class={"mensaje-juego" + (juego.mensaje.tipo ? " mensaje-juego--" + juego.mensaje.tipo : "")} aria-live="polite">
                {juego.mensaje.texto}
            </p>
        </div>
    {/snippet}
</PanelIntento>

{#if resultadoVisible}
    <section
        bind:this={panelResultado}
        id="resultado-final"
        class={"resultado-final " + (acerto ? "resultado-final--correcto" : "resultado-final--incorrecto") + claseNombre}
        aria-labelledby="nombre-piloto-final"
    >
        <div class="resultado-final__media">
            <img class="resultado-final__foto" src={urlImagen(secreto.foto)} alt={"Foto de " + secreto.nombre} />
        </div>
        <div class="resultado-final__contenido">
            <p class="resultado-final__etiqueta">{acerto ? "Bandera a cuadros" : "Se terminaron los intentos"}</p>
            <p class="resultado-final__subtitulo">{acerto ? "Piloto del día" : "El piloto del día era"}</p>
            <h2 id="nombre-piloto-final">{secreto.nombre}</h2>
            <p id="detalle-resultado-final">
                {acerto
                    ? "Lo resolviste en " + estado.intentosUsados + " " + palabraIntentos(estado.intentosUsados) + "."
                    : "No lograste encontrarlo en los " + MAXIMO_INTENTOS + " intentos disponibles."}
            </p>
            <CuentaRegresiva clase="resultado-final__regreso" etiqueta="Nuevo piloto en:" activa={true} {fecha} />
            <AccionesResultado juego="piloto" {fecha} terminada={estado.terminada} {armarTexto} />
        </div>
    </section>
{/if}

{#if tablaVisible}
    <section id="panel-intentos" class="panel-intentos" aria-labelledby="titulo-intentos">
        <div class="titulo-seccion">
            <span></span>
            <h2 id="titulo-intentos">Intentos</h2>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Modelo</th>
                    <th>Equipo</th>
                    <th>Localidad</th>
                    <th>Campeón de TC</th>
                    <th>Edad</th>
                    <th>Año de debut</th>
                </tr>
            </thead>
            <tbody>
                {#each filas as fila (fila.id)}
                    <FilaIntento {fila} />
                {/each}
            </tbody>
        </table>

        {#if !revelando}
            <aside id="guia-pistas" class="guia-pistas" aria-labelledby="titulo-guia">
                <h3 id="titulo-guia">Guía de pistas</h3>
                <div class="guia-pistas__grilla">
                    <div class="guia-pista guia-pista--correcta">
                        <strong>Coincide</strong>
                        <span>El dato es correcto</span>
                    </div>
                    <div class="guia-pista guia-pista--cerca">
                        <strong>Cerca</strong>
                        <span>Misma provincia</span>
                    </div>
                    <div class="guia-pista guia-pista--incorrecta">
                        <strong>No coincide</strong>
                        <span>El dato es diferente</span>
                    </div>
                    <div class="guia-pista guia-pista--mayor">
                        <strong>↑ Mayor</strong>
                        <span>El valor buscado es más alto</span>
                    </div>
                    <div class="guia-pista guia-pista--menor">
                        <strong>↓ Menor</strong>
                        <span>El valor buscado es más bajo</span>
                    </div>
                </div>
            </aside>
        {/if}
    </section>
{/if}
