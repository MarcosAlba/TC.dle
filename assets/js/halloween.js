// Tema de Halloween. Se activa solo del 20/10 al 2/11 (hora local) y se
// carga en el <head> para poner la clase antes del primer pintado.
// Para probarlo fuera de fecha: ?halloween=1 (queda prendido en la pestaña
// mientras se navega) y ?halloween=0 para apagarlo.
(function () {
    const CLAVE = "tcdleHalloween";

    function estaEnTemporada(fecha) {
        const mes = fecha.getMonth();
        const dia = fecha.getDate();
        return (mes === 9 && dia >= 20) || (mes === 10 && dia <= 2);
    }

    function leerForzado() {
        const parametro = new URLSearchParams(window.location.search).get("halloween");

        try {
            if (parametro === "1" || parametro === "0") {
                sessionStorage.setItem(CLAVE, parametro);
                return parametro;
            }
            return sessionStorage.getItem(CLAVE);
        } catch (error) {
            return parametro;
        }
    }

    const forzado = leerForzado();
    const activo = forzado === null ? estaEnTemporada(new Date()) : forzado === "1";

    if (!activo) {
        return;
    }

    document.documentElement.classList.add("halloween");
})();
