function crearBuscadorPilotos(configuracion) {
    const campo = configuracion.campo;
    const lista = configuracion.lista;
    const pilotosDisponibles = configuracion.pilotos;
    const estaExcluido = configuracion.estaExcluido || function () {
        return false;
    };

    campo.setAttribute("aria-autocomplete", "list");
    campo.setAttribute("aria-controls", lista.id);
    campo.setAttribute("aria-expanded", "false");

    function normalizar(texto) {
        return texto
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function obtenerIniciales(nombre) {
        return nombre
            .split(" ")
            .slice(0, 2)
            .map(function (parte) {
                return parte.charAt(0);
            })
            .join("");
    }

    function ocultar() {
        lista.hidden = true;
        lista.innerHTML = "";
        campo.setAttribute("aria-expanded", "false");
    }

    function seleccionar(piloto) {
        campo.value = piloto.nombre;
        ocultar();
        campo.focus();
    }

    function crearAvatar(piloto) {
        const avatar = document.createElement("span");
        const iniciales = document.createElement("span");
        const imagen = document.createElement("img");

        avatar.className = "buscador-pilotos__avatar";
        iniciales.className = "buscador-pilotos__iniciales";
        iniciales.textContent = obtenerIniciales(piloto.nombre);

        imagen.src = piloto.imagen;
        imagen.alt = "";
        imagen.loading = "lazy";
        imagen.addEventListener("load", function () {
            iniciales.hidden = true;
        });
        imagen.addEventListener("error", function () {
            imagen.hidden = true;
        });

        avatar.appendChild(iniciales);
        avatar.appendChild(imagen);

        return avatar;
    }

    function mostrar() {
        const busqueda = normalizar(campo.value.trim());
        lista.innerHTML = "";

        if (busqueda.length < 2 || campo.disabled) {
            ocultar();
            return;
        }

        const coincidencias = pilotosDisponibles.filter(function (piloto) {
            return !estaExcluido(piloto) &&
                normalizar(piloto.nombre).includes(busqueda);
        }).slice(0, 8);

        if (coincidencias.length === 0) {
            const mensaje = document.createElement("p");
            mensaje.className = "buscador-pilotos__vacio";
            mensaje.textContent = "No hay pilotos que coincidan.";
            lista.appendChild(mensaje);
        }

        coincidencias.forEach(function (piloto) {
            const opcion = document.createElement("button");
            const nombre = document.createElement("span");

            opcion.type = "button";
            opcion.className = "buscador-pilotos__opcion";
            opcion.setAttribute("role", "option");
            opcion.setAttribute("aria-selected", "false");

            nombre.className = "buscador-pilotos__nombre";
            nombre.textContent = piloto.nombre;

            opcion.appendChild(crearAvatar(piloto));
            opcion.appendChild(nombre);
            opcion.addEventListener("click", function () {
                seleccionar(piloto);
            });

            lista.appendChild(opcion);
        });

        lista.hidden = false;
        campo.setAttribute("aria-expanded", "true");
    }

    campo.addEventListener("input", mostrar);
    campo.addEventListener("keydown", function (evento) {
        if (evento.key === "Escape") {
            ocultar();
        }
    });

    document.addEventListener("click", function (evento) {
        if (!evento.target.closest(".buscador-pilotos")) {
            ocultar();
        }
    });

    return {
        mostrar: mostrar,
        ocultar: ocultar
    };
}
