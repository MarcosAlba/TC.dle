(function (global) {
    "use strict";

    const TCdle = global.TCdle || {};
    const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

    function normalizarTexto(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[.º°]/g, "")
            .replace(/[^a-zA-Z0-9]+/g, " ")
            .trim()
            .toLowerCase();
    }

    function obtenerFechaLocal(fecha = new Date()) {
        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const dia = String(fecha.getDate()).padStart(2, "0");
        return anio + "-" + mes + "-" + dia;
    }

    function obtenerTiempoHastaMedianoche(fecha = new Date()) {
        const medianoche = new Date(
            fecha.getFullYear(),
            fecha.getMonth(),
            fecha.getDate() + 1
        );
        const diferencia = Math.max(0, medianoche - fecha);
        const horas = Math.floor(diferencia / 3600000);
        const minutos = Math.floor((diferencia % 3600000) / 60000);
        const segundos = Math.floor((diferencia % 60000) / 1000);

        return [horas, minutos, segundos]
            .map(function (valor) {
                return String(valor).padStart(2, "0");
            })
            .join(":");
    }

    function migrarPartida(datos, configuracion) {
        if (datos.version === 2) {
            return datos;
        }

        const idsIntentados = datos[configuracion.campoIntentos || "idsIntentados"] || [];
        const objetivoGuardado = configuracion.campoObjetivo
            ? datos[configuracion.campoObjetivo]
            : undefined;
        const objetivoId = objetivoGuardado === undefined
            ? configuracion.objetivoActual
            : objetivoGuardado;
        const fechaGuardada = String(datos.fecha || "");
        const fechaInterpretada = /^\d{4}-\d{2}-\d{2}$/.test(fechaGuardada)
            ? null
            : new Date(fechaGuardada);
        const fecha = fechaInterpretada && !Number.isNaN(fechaInterpretada.getTime())
            ? obtenerFechaLocal(fechaInterpretada)
            : fechaGuardada;

        return {
            fecha: fecha,
            objetivoId: objetivoId,
            idsIntentados: idsIntentados,
            terminada: Boolean(datos.terminada) ||
                idsIntentados.includes(configuracion.objetivoActual) ||
                Number(datos.cantidadIntentos) >= configuracion.maximoIntentos
        };
    }

    function buscarElementos(configuracion, consulta) {
        const consultaNormalizada = normalizarTexto(consulta);
        const minimo = configuracion.minimoCaracteres === undefined
            ? 2
            : configuracion.minimoCaracteres;

        if (consultaNormalizada.length < minimo) {
            return [];
        }

        const obtenerEtiqueta = configuracion.obtenerEtiqueta;
        const obtenerTextoBusqueda = configuracion.obtenerTextoBusqueda || obtenerEtiqueta;
        const estaExcluido = configuracion.estaExcluido || function () { return false; };
        const limite = configuracion.limite || 8;

        return configuracion.elementos
            .filter(function (elemento) {
                return !estaExcluido(elemento) &&
                    normalizarTexto(obtenerTextoBusqueda(elemento)).includes(consultaNormalizada);
            })
            .sort(function (a, b) {
                const etiquetaA = normalizarTexto(obtenerEtiqueta(a));
                const etiquetaB = normalizarTexto(obtenerEtiqueta(b));
                const empiezaA = etiquetaA.startsWith(consultaNormalizada) ? 0 : 1;
                const empiezaB = etiquetaB.startsWith(consultaNormalizada) ? 0 : 1;
                return empiezaA - empiezaB || etiquetaA.localeCompare(etiquetaB, "es");
            })
            .slice(0, limite);
    }

    function crearBuscador(configuracion) {
        const campo = configuracion.campo;
        const lista = configuracion.lista;
        const contenedor = configuracion.contenedor || campo.parentElement;
        const obtenerId = configuracion.obtenerId;
        const obtenerEtiqueta = configuracion.obtenerEtiqueta;
        const obtenerValoresExactos = configuracion.obtenerValoresExactos || function (elemento) {
            return [obtenerEtiqueta(elemento)];
        };
        let sugerencias = [];
        let indiceActivo = -1;
        let seleccionado = null;

        campo.setAttribute("aria-autocomplete", "list");
        campo.setAttribute("aria-controls", lista.id);
        campo.setAttribute("aria-expanded", "false");

        function ocultar() {
            lista.hidden = true;
            lista.innerHTML = "";
            campo.setAttribute("aria-expanded", "false");
            campo.removeAttribute("aria-activedescendant");
            sugerencias = [];
            indiceActivo = -1;
        }

        function seleccionar(elemento) {
            seleccionado = elemento;
            campo.value = obtenerEtiqueta(elemento);
            ocultar();
            campo.focus();

            if (configuracion.alSeleccionar) {
                configuracion.alSeleccionar(elemento);
            }
        }

        function mover(direccion) {
            if (lista.hidden || sugerencias.length === 0) {
                return;
            }

            indiceActivo = (indiceActivo + direccion + sugerencias.length) % sugerencias.length;
            Array.from(lista.children).forEach(function (opcion, indice) {
                const activa = indice === indiceActivo;
                opcion.classList.toggle("buscador__opcion--activa", activa);
                opcion.setAttribute("aria-selected", String(activa));

                if (activa) {
                    opcion.id = lista.id + "-activa";
                    campo.setAttribute("aria-activedescendant", opcion.id);
                    opcion.scrollIntoView({ block: "nearest" });
                } else {
                    opcion.removeAttribute("id");
                }
            });
        }

        function mostrar() {
            lista.innerHTML = "";
            sugerencias = buscarElementos(configuracion, campo.value);
            indiceActivo = -1;
            const consulta = normalizarTexto(campo.value);
            const minimo = configuracion.minimoCaracteres === undefined
                ? 2
                : configuracion.minimoCaracteres;

            if (campo.disabled || consulta.length < minimo) {
                ocultar();
                return;
            }

            if (sugerencias.length === 0) {
                const vacio = document.createElement("p");
                vacio.className = "buscador__vacio";
                vacio.textContent = configuracion.mensajeVacio || "No hay coincidencias.";
                lista.appendChild(vacio);
                lista.hidden = false;
                campo.setAttribute("aria-expanded", "true");
                return;
            }

            sugerencias.forEach(function (elemento) {
                const opcion = document.createElement("button");
                opcion.type = "button";
                opcion.className = "buscador__opcion";
                opcion.setAttribute("role", "option");
                opcion.setAttribute("aria-selected", "false");
                configuracion.renderizarOpcion(opcion, elemento);
                opcion.addEventListener("mousedown", function (evento) {
                    evento.preventDefault();
                    seleccionar(elemento);
                });
                lista.appendChild(opcion);
            });

            lista.hidden = false;
            campo.setAttribute("aria-expanded", "true");
        }

        function resolver() {
            const entrada = normalizarTexto(campo.value);

            if (seleccionado && normalizarTexto(obtenerEtiqueta(seleccionado)) === entrada) {
                return { elemento: seleccionado, ambiguo: false };
            }

            const coincidencias = configuracion.elementos.filter(function (elemento) {
                return obtenerValoresExactos(elemento)
                    .map(normalizarTexto)
                    .includes(entrada);
            });

            return {
                elemento: coincidencias.length === 1 ? coincidencias[0] : null,
                ambiguo: coincidencias.length > 1
            };
        }

        function limpiar() {
            seleccionado = null;
            campo.value = "";
            ocultar();
        }

        campo.addEventListener("input", function () {
            seleccionado = null;
            mostrar();
            if (configuracion.alCambiar) {
                configuracion.alCambiar();
            }
        });

        campo.addEventListener("keydown", function (evento) {
            if (evento.key === "ArrowDown") {
                evento.preventDefault();
                mover(1);
            } else if (evento.key === "ArrowUp") {
                evento.preventDefault();
                mover(-1);
            } else if (evento.key === "Enter") {
                evento.preventDefault();
                if (indiceActivo >= 0) {
                    seleccionar(sugerencias[indiceActivo]);
                } else if (configuracion.alEnviar) {
                    configuracion.alEnviar();
                }
            } else if (evento.key === "Escape") {
                ocultar();
            }
        });

        campo.addEventListener("blur", function () {
            setTimeout(ocultar, 120);
        });

        document.addEventListener("click", function (evento) {
            if (!contenedor.contains(evento.target)) {
                ocultar();
            }
        });

        return {
            buscar: mostrar,
            limpiar: limpiar,
            ocultar: ocultar,
            resolver: resolver,
            seleccionar: seleccionar
        };
    }

    function renderizarOpcionPiloto(opcion, piloto) {
        const avatar = document.createElement("span");
        const iniciales = document.createElement("span");
        const imagen = document.createElement("img");
        const nombre = document.createElement("span");

        avatar.className = "buscador__avatar";
        iniciales.className = "buscador__iniciales";
        iniciales.textContent = piloto.nombre.split(" ").slice(0, 2).map(function (parte) {
            return parte.charAt(0);
        }).join("");
        imagen.src = piloto.imagen;
        imagen.alt = "";
        imagen.loading = "lazy";
        imagen.addEventListener("load", function () { iniciales.hidden = true; });
        imagen.addEventListener("error", function () { imagen.hidden = true; });
        nombre.className = "buscador__nombre";
        nombre.textContent = piloto.nombre;
        avatar.appendChild(iniciales);
        avatar.appendChild(imagen);
        opcion.appendChild(avatar);
        opcion.appendChild(nombre);
    }

    function crearJuegoDiario(configuracion) {
        const almacenamiento = configuracion.almacenamiento || global.localStorage;
        const maximoIntentos = configuracion.maximoIntentos || 8;
        const fecha = configuracion.fecha || obtenerFechaLocal();
        const objetivoId = configuracion.objetivoId;
        const idsValidos = new Set(configuracion.idsValidos || []);
        let idsIntentados = [];
        let terminada = false;

        function estado() {
            return {
                fecha: fecha,
                objetivoId: objetivoId,
                idsIntentados: idsIntentados.slice(),
                intentosUsados: idsIntentados.length,
                intentosRestantes: Math.max(0, maximoIntentos - idsIntentados.length),
                acerto: idsIntentados.includes(objetivoId),
                terminada: terminada,
                maximoIntentos: maximoIntentos
            };
        }

        function guardar() {
            almacenamiento.setItem(configuracion.clave, JSON.stringify({
                version: 2,
                fecha: fecha,
                objetivoId: objetivoId,
                idsIntentados: idsIntentados,
                terminada: terminada
            }));
        }

        function limpiarGuardado() {
            almacenamiento.removeItem(configuracion.clave);
        }

        function cargar() {
            const contenido = almacenamiento.getItem(configuracion.clave);
            if (!contenido) {
                return estado();
            }

            try {
                const original = JSON.parse(contenido);
                const partida = configuracion.migrar
                    ? configuracion.migrar(original, { fecha: fecha, objetivoId: objetivoId })
                    : original;

                if (!partida || partida.fecha !== fecha ||
                    (partida.objetivoId !== undefined && partida.objetivoId !== objetivoId) ||
                    !Array.isArray(partida.idsIntentados)) {
                    limpiarGuardado();
                    return estado();
                }

                idsIntentados = partida.idsIntentados.filter(function (id, indice, lista) {
                    return idsValidos.has(id) && lista.indexOf(id) === indice;
                }).slice(0, maximoIntentos);
                terminada = Boolean(partida.terminada) && (
                    idsIntentados.includes(objetivoId) || idsIntentados.length >= maximoIntentos
                );

                if (original.version !== 2) {
                    guardar();
                }
            } catch (error) {
                limpiarGuardado();
            }

            return estado();
        }

        function intentar(id) {
            if (terminada) {
                return { resultado: "bloqueada", estado: estado() };
            }
            if (!idsValidos.has(id)) {
                return { resultado: "invalida", estado: estado() };
            }
            if (idsIntentados.includes(id)) {
                return { resultado: "repetida", estado: estado() };
            }

            idsIntentados.push(id);
            let resultado = "incorrecta";
            if (id === objetivoId) {
                resultado = "correcta";
                terminada = true;
            } else if (idsIntentados.length >= maximoIntentos) {
                resultado = "agotada";
                terminada = true;
            }
            guardar();

            return { resultado: resultado, estado: estado() };
        }

        return {
            cargar: cargar,
            estado: estado,
            guardar: guardar,
            intentar: intentar,
            limpiarGuardado: limpiarGuardado
        };
    }

    function crearCuentaRegresiva(configuracion) {
        const elementos = configuracion.elementos.filter(Boolean);
        const fechaInicial = configuracion.fecha || obtenerFechaLocal();
        let intervalo;

        function actualizar() {
            const ahora = new Date();
            if (obtenerFechaLocal(ahora) !== fechaInicial) {
                (configuracion.alCambiarDia || function () { global.location.reload(); })();
                return;
            }
            const tiempo = obtenerTiempoHastaMedianoche(ahora);
            elementos.forEach(function (elemento) {
                elemento.textContent = tiempo;
            });
        }

        function iniciar() {
            clearInterval(intervalo);
            actualizar();
            intervalo = setInterval(actualizar, 1000);
        }

        return { iniciar: iniciar, actualizar: actualizar };
    }

    function renderizarIndicadores(configuracion) {
        configuracion.contenedor.innerHTML = "";
        for (let indice = 0; indice < configuracion.maximo; indice++) {
            const indicador = document.createElement("span");
            indicador.className = "indicador-intento";
            if (indice < configuracion.usados) {
                indicador.classList.add("indicador-intento--usado");
            }
            if (configuracion.acerto && indice === configuracion.usados - 1) {
                indicador.classList.add("indicador-intento--acierto");
            }
            configuracion.contenedor.appendChild(indicador);
        }
    }

    function actualizarEstadoIntentos(configuracion) {
        const partida = configuracion.partida;
        const palabra = partida.intentosRestantes === 1
            ? "intento disponible"
            : "intentos disponibles";
        configuracion.contador.textContent = partida.intentosRestantes + " " + palabra;
        configuracion.contador.hidden = partida.terminada;
        if (configuracion.regreso) {
            configuracion.regreso.hidden = !partida.terminada;
        }
        if (configuracion.numero) {
            const numero = partida.terminada
                ? partida.intentosUsados
                : partida.intentosUsados + 1;
            configuracion.numero.textContent = String(
                Math.min(Math.max(numero, 1), partida.maximoIntentos)
            ).padStart(2, "0");
        }
        if (configuracion.campo) {
            configuracion.campo.disabled = partida.terminada || configuracion.sinObjetivo;
        }
        if (configuracion.boton) {
            configuracion.boton.disabled = partida.terminada || configuracion.sinObjetivo;
        }
    }

    function mostrarMensaje(elemento, texto, tipo) {
        elemento.textContent = texto;
        elemento.className = "mensaje-juego" + (tipo ? " mensaje-juego--" + tipo : "");
    }

    function crearModalResultado(configuracion) {
        const dialogo = configuracion.dialogo;

        function cerrar() {
            if (dialogo.open) {
                dialogo.close();
            }
        }

        function abrir() {
            if (!dialogo.open) {
                document.body.classList.add("resultado-modal-abierto");
                dialogo.showModal();
                configuracion.botonCerrar.focus();
            }
        }

        configuracion.botonCerrar.addEventListener("click", cerrar);
        dialogo.addEventListener("click", function (evento) {
            if (evento.target === dialogo) {
                cerrar();
            }
        });
        dialogo.addEventListener("close", function () {
            document.body.classList.remove("resultado-modal-abierto");
            if (configuracion.focoRetorno) {
                configuracion.focoRetorno.focus({ preventScroll: true });
            }
        });
        document.addEventListener("keydown", function (evento) {
            if (evento.key === "Escape" && dialogo.open) {
                evento.preventDefault();
                cerrar();
            }
        });

        return { abrir: abrir, cerrar: cerrar };
    }

    TCdle.normalizarTexto = normalizarTexto;
    TCdle.obtenerFechaLocal = obtenerFechaLocal;
    TCdle.obtenerTiempoHastaMedianoche = obtenerTiempoHastaMedianoche;
    TCdle.migrarPartida = migrarPartida;
    TCdle.buscarElementos = buscarElementos;
    TCdle.crearBuscador = crearBuscador;
    TCdle.renderizarOpcionPiloto = renderizarOpcionPiloto;
    TCdle.crearJuegoDiario = crearJuegoDiario;
    TCdle.crearCuentaRegresiva = crearCuentaRegresiva;
    TCdle.renderizarIndicadores = renderizarIndicadores;
    TCdle.actualizarEstadoIntentos = actualizarEstadoIntentos;
    TCdle.mostrarMensaje = mostrarMensaje;
    TCdle.crearModalResultado = crearModalResultado;
    TCdle.MILISEGUNDOS_POR_DIA = MILISEGUNDOS_POR_DIA;
    global.TCdle = TCdle;
})(window);
