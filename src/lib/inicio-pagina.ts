// Funciones que corren en el <head> antes del primer pintado, para que no
// haya parpadeo: la introducción del juego ya vista y el tema de Halloween.
// El Layout las inserta como texto (Function.toString) en un script en línea,
// por eso cada una tiene que bastarse sola: sin imports ni variables externas.
// Los tests las corren con window/localStorage simulados.

/** Si hoy ya se vio la introducción de este juego, marca <html class="intro-vista">. */
export function aplicarIntroInicial(clave: string): void {
    try {
        const hoy = new Date();
        const fecha =
            hoy.getFullYear() +
            "-" +
            String(hoy.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(hoy.getDate()).padStart(2, "0");

        if (localStorage.getItem(clave) === fecha) {
            document.documentElement.classList.add("intro-vista");
        }
    } catch {
        // Sin localStorage la introducción se muestra, como antes.
    }
}

/**
 * Tema de Halloween: se activa solo del 20/10 al 2/11 (hora local) poniendo
 * <html data-tema="halloween">. Para probarlo fuera de fecha: ?halloween=1
 * (queda prendido en la pestaña mientras se navega) y ?halloween=0 lo apaga.
 */
export function aplicarTemaInicial(): void {
    const clave = "tcdleHalloween";
    const parametro = new URLSearchParams(window.location.search).get("halloween");
    let forzado: string | null = parametro;

    try {
        if (parametro === "1" || parametro === "0") {
            sessionStorage.setItem(clave, parametro);
        } else {
            forzado = sessionStorage.getItem(clave);
        }
    } catch {
        // Sin sessionStorage vale solo el parámetro de esta página.
    }

    const hoy = new Date();
    const enTemporada =
        (hoy.getMonth() === 9 && hoy.getDate() >= 20) || (hoy.getMonth() === 10 && hoy.getDate() <= 2);
    const activo = forzado === null ? enTemporada : forzado === "1";

    if (activo) {
        document.documentElement.dataset.tema = "halloween";
    }
}

/**
 * Logo de la portada: la primera vez en la sesión hace la frenada completa y las siguientes lo
 * muestra ya terminado (pidiendo el SVG con #visto), así no se repite cada vez que se vuelve
 * de un juego. Va justo después del logo para correr antes del primer pintado.
 */
export function dejarLogoQuieto(): void {
    const clave = "tcdleLogoVisto";
    let visto = false;

    try {
        visto = sessionStorage.getItem(clave) === "1";
        sessionStorage.setItem(clave, "1");
    } catch {
        // Sin sessionStorage el logo se anima siempre, como antes.
    }

    if (!visto) {
        return;
    }

    document.querySelectorAll<HTMLImageElement>(".logo-inicio").forEach((logo) => {
        logo.src = logo.src.split("#")[0] + "#visto";
    });
}
