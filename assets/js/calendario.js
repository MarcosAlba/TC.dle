// Calendario de carreras de TC para la cuenta regresiva de la portada.
// Se carga a mano: una entrada por fecha, con la hora de largada de la final
// en hora argentina (-03:00). La final del TC es siempre el domingo a las 14.
// `circuito` (opcional) es el nombre del SVG en assets/images/circuitos.
// La portada muestra la primera carrera que todavía no largó y oculta el
// bloque si no queda ninguna.
const calendarioTC = [
    {
        fecha: 12,
        lugar: "San Nicolás",
        circuito: "san-nicolas",
        largada: "2026-10-04T14:00:00-03:00"
    }
];
