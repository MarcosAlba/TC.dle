export const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

const dosDigitos = (numero: number): string => String(numero).padStart(2, "0");

/** Día local del jugador como "AAAA-MM-DD": el desafío cambia a su medianoche. */
export function obtenerFechaLocal(fecha: Date = new Date()): string {
    return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

/** Día anterior a una fecha "AAAA-MM-DD" (cruza meses y años). */
export function obtenerFechaAnterior(fecha: string): string {
    const [anio, mes, dia] = fecha.split("-").map(Number);
    return obtenerFechaLocal(new Date(anio, mes - 1, dia - 1));
}

/** Tiempo que falta para la próxima medianoche local, como "HH:MM:SS". */
export function obtenerTiempoHastaMedianoche(fecha: Date = new Date()): string {
    const medianoche = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1);
    const diferencia = Math.max(0, medianoche.getTime() - fecha.getTime());
    const horas = Math.floor(diferencia / 3600000);
    const minutos = Math.floor((diferencia % 3600000) / 60000);
    const segundos = Math.floor((diferencia % 60000) / 1000);

    return [horas, minutos, segundos].map(dosDigitos).join(":");
}
