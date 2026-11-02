// Datos del sitio que se muestran en el pie y en "Acerca de".
export const SITIO = {
    /** Repositorio público: ahí van los pedidos y avisos (fotos para bajar, errores). */
    repositorio: "https://github.com/MarcosAlba/TC.dle",
    /**
     * Usuario de cafecito.app para recibir aportes, por ejemplo "tcdle". Mientras sea null
     * no se muestra el link.
     */
    cafecito: null as string | null,
};

export const urlCafecito = (): string | null => (SITIO.cafecito ? "https://cafecito.app/" + SITIO.cafecito : null);
