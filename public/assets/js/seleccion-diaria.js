(function (global) {
    "use strict";

    const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

    function crearSemilla(texto) {
        let semilla = 2166136261;

        for (let indice = 0; indice < texto.length; indice++) {
            semilla ^= texto.charCodeAt(indice);
            semilla = Math.imul(semilla, 16777619);
        }

        return semilla >>> 0;
    }

    function crearGenerador(semillaInicial) {
        let semilla = semillaInicial;

        return function () {
            semilla += 0x6D2B79F5;
            let resultado = semilla;
            resultado = Math.imul(resultado ^ (resultado >>> 15), resultado | 1);
            resultado ^= resultado + Math.imul(resultado ^ (resultado >>> 7), resultado | 61);
            return ((resultado ^ (resultado >>> 14)) >>> 0) / 4294967296;
        };
    }

    function crearOrdenMezclado(cantidad, clave) {
        const orden = Array.from({ length: cantidad }, function (_, indice) {
            return indice;
        });
        const aleatorio = crearGenerador(crearSemilla(clave + ":" + cantidad));

        for (let indice = orden.length - 1; indice > 0; indice--) {
            const intercambio = Math.floor(aleatorio() * (indice + 1));
            const temporal = orden[indice];
            orden[indice] = orden[intercambio];
            orden[intercambio] = temporal;
        }

        return orden;
    }

    function obtenerNumeroDeDia(fecha) {
        const fechaUtc = Date.UTC(
            fecha.getFullYear(),
            fecha.getMonth(),
            fecha.getDate()
        );

        return Math.floor(fechaUtc / MILISEGUNDOS_POR_DIA);
    }

    function obtener(elementos, clave, fecha = new Date()) {
        if (!Array.isArray(elementos) || elementos.length === 0) {
            return null;
        }

        const orden = crearOrdenMezclado(elementos.length, String(clave));
        const posicion = obtenerNumeroDeDia(fecha) % orden.length;

        return elementos[orden[posicion]];
    }

    const seleccionDiaria = Object.freeze({
        obtener: obtener
    });
    global.TCdle = global.TCdle || {};
    global.TCdle.seleccionDiaria = seleccionDiaria;
    global.seleccionDiaria = seleccionDiaria;
})(window);
