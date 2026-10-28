<script lang="ts">
    // Herramienta interna (solo en desarrollo): revisar la foto de un auto, con
    // o sin el desenfoque del juego, antes de cargarla. También acepta una foto
    // propia (arrastrada, pegada o elegida): se muestra con un object URL local,
    // no se sube ni se guarda en ningún lado.
    import Buscador from "../components/Buscador.svelte";
    import { autos, pilotos } from "../data";
    import type { Piloto } from "../data/tipos";
    import { obtenerEstiloDesenfoque } from "../lib/autos";
    import { obtenerApellidoPiloto } from "../lib/pilotos";
    import { urlImagen } from "../lib/rutas";

    // Una entrada por auto cargado, no por piloto: si un piloto tiene varios años
    // aparece varias veces en el buscador, una por cada foto.
    interface AutoVistaPrevia {
        id: number;
        piloto: Piloto;
        anio: number | null;
        imagen: string;
    }

    const autosVistaPrevia: AutoVistaPrevia[] = autos.flatMap((auto, indice) => {
        const piloto = pilotos.find((candidato) => candidato.id === auto.pilotoId);

        return piloto ? [{ id: indice, piloto, anio: auto.anio, imagen: urlImagen("autos/" + auto.archivo) }] : [];
    });

    const textoAnio = (auto: AutoVistaPrevia) => (auto.anio ? "Año " + auto.anio : "Sin año cargado");

    let foto = $state<{ url: string; alt: string } | null>(null);
    let estado = $state("Elegí un auto para verlo.");
    let desenfocada = $state(false);
    let arrastrando = $state(false);
    let marco: HTMLElement;
    let inputArchivo: HTMLInputElement;
    let urlFotoPropia: string | null = null;

    const estilo = $derived(obtenerEstiloDesenfoque(desenfocada ? 24 : 0));

    function mostrar(url: string, alt: string, texto: string) {
        foto = { url, alt };
        desenfocada = false;
        estado = texto;
    }

    function mostrarAuto(auto: AutoVistaPrevia) {
        mostrar(
            auto.imagen,
            "Auto de " + auto.piloto.nombre,
            auto.piloto.nombre + " · " + auto.piloto.marca + " · " + textoAnio(auto)
        );
    }

    function mostrarArchivo(archivo: File | undefined) {
        if (!archivo || !archivo.type.startsWith("image/")) {
            estado = "Ese archivo no es una imagen.";
            return;
        }

        if (urlFotoPropia) {
            URL.revokeObjectURL(urlFotoPropia);
        }
        urlFotoPropia = URL.createObjectURL(archivo);
        mostrar(urlFotoPropia, "Foto de prueba: " + archivo.name, "Foto de prueba · " + archivo.name);
    }

    function alPegar(evento: ClipboardEvent) {
        const archivo = Array.from(evento.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));

        if (archivo) {
            mostrarArchivo(archivo);
        }
    }
</script>

<!-- Un archivo soltado fuera del cuadro no debe reemplazar la herramienta por la imagen. -->
<svelte:window ondragover={(e) => e.preventDefault()} ondrop={(e) => e.preventDefault()} />
<svelte:document onpaste={alPegar} />

<section class="tarjeta-desafio tarjeta-desafio--suelta tarjeta-desafio--foto" aria-label="Foto seleccionada">
    <div
        bind:this={marco}
        class="marco-auto"
        class:marco-auto--arrastrando={arrastrando}
        style:--desenfoque-auto={estilo.desenfoque}
        style:--brillo-auto={estilo.brillo}
        style:--escala-auto={estilo.escala}
        role="presentation"
        ondragenter={() => (arrastrando = true)}
        ondragover={() => (arrastrando = true)}
        ondragleave={(e) => {
            if (!marco.contains(e.relatedTarget as Node | null)) {
                arrastrando = false;
            }
        }}
        ondrop={(e) => {
            arrastrando = false;
            mostrarArchivo(e.dataTransfer?.files[0]);
        }}
    >
        {#if foto}
            <img class="foto-vista-previa" src={foto.url} alt={foto.alt} />
        {:else}
            <p class="vacio-vista-previa">
                La foto seleccionada aparece acá. También podés arrastrar una imagen desde el escritorio y soltarla en este cuadro.
            </p>
        {/if}
    </div>
    <div class="estado-diario">
        <p class="estado-vista-previa" aria-live="polite">{estado}</p>
    </div>
</section>

<section class="panel-intento" aria-labelledby="titulo-buscador-vista-previa">
    <div class="panel-intento__cabecera">
        <div>
            <p>Catálogo de autos</p>
            <h2 id="titulo-buscador-vista-previa">Buscá un piloto</h2>
        </div>
    </div>

    <div class="panel-intento__contenido">
        <div class="fila-busqueda">
            <Buscador
                id="buscar-auto"
                idLista="sugerencias-vista-previa"
                placeholder="Escribí el nombre del piloto"
                etiquetaCampo="Nombre del piloto"
                consejoVacio="Probá con el apellido."
                elementos={autosVistaPrevia}
                minimoCaracteres={1}
                obtenerEtiqueta={(auto: AutoVistaPrevia) => auto.piloto.nombre + (auto.anio ? " (" + auto.anio + ")" : "")}
                obtenerTextoBusqueda={(auto: AutoVistaPrevia) => auto.piloto.nombre}
                obtenerTextoCorto={(auto: AutoVistaPrevia) => obtenerApellidoPiloto(auto.piloto)}
                alSeleccionar={mostrarAuto}
            >
                {#snippet opcion(auto: AutoVistaPrevia)}
                    <span class="buscador__contenido">
                        <strong>{auto.piloto.nombre}</strong>
                        <span>{textoAnio(auto)}</span>
                    </span>
                {/snippet}
            </Buscador>
        </div>

        <div class="controles-vista-previa">
            <input bind:this={inputArchivo} type="file" accept="image/*" hidden onchange={() => {
                mostrarArchivo(inputArchivo.files?.[0]);
                inputArchivo.value = "";
            }} />
            <button class="boton-vista-previa-secundario" type="button" onclick={() => inputArchivo.click()}>Subir foto</button>
            <button class="boton-intentar" type="button" disabled={!foto} onclick={() => (desenfocada = true)}>Aplicar blur original</button>
            <button class="boton-vista-previa-secundario" type="button" disabled={!foto} onclick={() => (desenfocada = false)}>Quitar blur</button>
        </div>
    </div>
</section>
