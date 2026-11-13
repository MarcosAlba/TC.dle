// Calendario del archivo: un mes a la vez, con una rayita por juego según el
// historial guardado, y un panel con los ocho juegos del día elegido.
import { obtenerAlmacenamiento } from "../lib/almacenamiento";
import { FECHA_LANZAMIENTO } from "../lib/dia";
import { leerHistorial } from "../lib/dia-juego";
import { obtenerFechaLocal } from "../lib/fechas";
import { JUEGOS } from "../lib/juegos";
import { urlInicio, urlJuego } from "../lib/rutas";

const historial = leerHistorial(obtenerAlmacenamiento());
const hoy = obtenerFechaLocal();
const [anioLanzamiento, mesLanzamiento] = FECHA_LANZAMIENTO.split("-").map(Number);
const [anioHoy, mesHoy] = hoy.split("-").map(Number);

const grilla = document.querySelector<HTMLElement>("[data-grilla]")!;
const titulo = document.getElementById("archivo-mes")!;
const panelTitulo = document.querySelector<HTMLElement>("[data-panel-titulo]")!;
const panelJuegos = document.querySelector<HTMLElement>("[data-panel-juegos]")!;
const botonesMes = document.querySelectorAll<HTMLButtonElement>("[data-mes]");

// Mes a la vista como cantidad de meses desde el año 0, para sumar y comparar fácil.
const indiceMes = (anio: number, mes: number) => anio * 12 + (mes - 1);
const primerMes = indiceMes(anioLanzamiento, mesLanzamiento);
const ultimoMes = indiceMes(anioHoy, mesHoy);
// Arranca en el mes de ayer: el día 1 el mes nuevo todavía está vacío.
const ayer = new Date();
ayer.setDate(ayer.getDate() - 1);
const fechaAyer = obtenerFechaLocal(ayer);
const [anioAyer, mesAyer] = fechaAyer.split("-").map(Number);
let mesVisible = Math.max(primerMes, indiceMes(anioAyer, mesAyer));
let elegido: string | null = null;

const dosDigitos = (numero: number) => String(numero).padStart(2, "0");
const textoFecha = (fecha: string, opciones: Intl.DateTimeFormatOptions) => {
    const [anio, mes, dia] = fecha.split("-").map(Number);
    return new Date(anio, mes - 1, dia).toLocaleDateString("es-AR", opciones);
};

function mostrarPanel(fecha: string): void {
    elegido = fecha;
    panelTitulo.textContent = textoFecha(fecha, { weekday: "long", day: "numeric", month: "long" });
    panelJuegos.replaceChildren(
        ...JUEGOS.map((juego) => {
            const resultado = historial[fecha]?.[juego.id];
            const item = document.createElement("li");
            const link = document.createElement("a");
            link.className = "archivo__juego" + (resultado ? " archivo__juego--" + resultado : "");
            link.href = urlJuego(juego.archivo) + "?dia=" + fecha;
            link.innerHTML = `<span></span><small></small>`;
            link.querySelector("span")!.textContent = juego.nombre;
            link.querySelector("small")!.textContent = resultado === "acertado" ? "Resuelto" : resultado === "fallado" ? "Terminado" : "Jugar";
            item.append(link);
            return item;
        })
    );
    grilla.querySelectorAll("[data-fecha]").forEach((dia) => dia.toggleAttribute("aria-pressed", false));
    grilla.querySelector(`[data-fecha="${fecha}"]`)?.setAttribute("aria-pressed", "true");
}

function dibujarMes(): void {
    const anio = Math.floor(mesVisible / 12);
    const mes = (mesVisible % 12) + 1;
    const diasDelMes = new Date(anio, mes, 0).getDate();
    // Lunes = 0: el calendario arranca el lunes, como en Argentina.
    const corrimiento = (new Date(anio, mes - 1, 1).getDay() + 6) % 7;

    titulo.textContent = new Date(anio, mes - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    botonesMes[0].disabled = mesVisible <= primerMes;
    botonesMes[1].disabled = mesVisible >= ultimoMes;

    const celdas: HTMLElement[] = [];
    for (let vacio = 0; vacio < corrimiento; vacio++) {
        const celda = document.createElement("span");
        celda.className = "archivo__dia archivo__dia--vacio";
        celdas.push(celda);
    }

    for (let numero = 1; numero <= diasDelMes; numero++) {
        const fecha = anio + "-" + dosDigitos(mes) + "-" + dosDigitos(numero);
        const jugable = fecha >= FECHA_LANZAMIENTO && fecha < hoy;
        const celda = document.createElement(fecha === hoy ? "a" : jugable ? "button" : "span");
        celda.className = "archivo__dia" + (fecha === hoy ? " archivo__dia--hoy" : jugable ? "" : " archivo__dia--fuera");
        celda.innerHTML = `<b>${numero}</b><span class="archivo__marcas" aria-hidden="true"></span>`;

        if (fecha === hoy) {
            (celda as HTMLAnchorElement).href = urlInicio();
            celda.setAttribute("aria-label", "Hoy: ir a los desafíos de hoy");
            celda.insertAdjacentHTML("beforeend", `<small class="archivo__hoy">Hoy</small>`);
        } else if (jugable) {
            celda.dataset.fecha = fecha;
            (celda as HTMLButtonElement).type = "button";
            celda.setAttribute("aria-label", textoFecha(fecha, { weekday: "long", day: "numeric", month: "long" }));
            celda.addEventListener("click", () => mostrarPanel(fecha));
        }

        const marcas = celda.querySelector(".archivo__marcas")!;
        for (const juego of JUEGOS) {
            const marca = document.createElement("i");
            const resultado = historial[fecha]?.[juego.id];
            if (resultado) {
                marca.className = "archivo__marca--" + resultado;
            }
            marcas.append(marca);
        }
        celdas.push(celda);
    }

    grilla.replaceChildren(...celdas);
    if (elegido) {
        grilla.querySelector(`[data-fecha="${elegido}"]`)?.setAttribute("aria-pressed", "true");
    }
}

botonesMes.forEach((boton) =>
    boton.addEventListener("click", () => {
        mesVisible = Math.min(ultimoMes, Math.max(primerMes, mesVisible + Number(boton.dataset.mes)));
        dibujarMes();
    })
);

dibujarMes();
// Arranca con ayer elegido, que es lo que más se busca.
if (fechaAyer >= FECHA_LANZAMIENTO) {
    mostrarPanel(fechaAyer);
}
