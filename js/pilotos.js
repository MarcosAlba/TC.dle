const pilotos = [
    {
        id: 1,
        nombre: "Agustín Canapino",
        marca: "Chevrolet",
        equipo: "Canning Motorsport",
        localidad: "Arrecifes, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1990-01-19",
        campeonTC: true,
        anioDebutTC: 2009,
        imagen: "https://www.actc.org.ar/upload/autos/10691/imgs_v3/imgtorso/podio/agustin_canapino.png"
    },

    {
        id: 2,
        nombre: "Mauricio Lambiris",
        marca: "Ford",
        equipo: "Martínez Competición",
        localidad: "Montevideo, Uruguay",
        provincia: "Montevideo",
        fechaNacimiento: "1987-03-03",
        campeonTC: false,
        anioDebutTC: 2015,
        imagen: "https://www.actc.org.ar/upload/autos/10709/imgs_v3/imgtorso/podio/mauricio_lambiris.png"
    },

    {
        id: 3,
        nombre: "Germán Todino",
        marca: "Ford",
        equipo: "Laboritto Jrs",
        localidad: "Rivera, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "2000-08-10",
        campeonTC: false,
        anioDebutTC: 2021,
        imagen: "https://www.actc.org.ar/upload/autos/10694/imgs_v3/imgtorso/podio/german_todino.png"
    },

    {
        id: 4,
        nombre: "Marcelo Agrelo",
        marca: "Torino",
        equipo: "Trotta Competición",
        localidad: "Rada Tilly, Chubut",
        provincia: "Chubut",
        fechaNacimiento: "1991-03-23",
        campeonTC: true,
        anioDebutTC: 2020,
        imagen: "https://actc.org.ar/upload/autos/10710/imgs_v3/imgtorso/podio/marcelo_agrelo.png"
    },

    {
        id: 5,
        nombre: "Juan Martín Trucco",
        marca: "Dodge",
        equipo: "DBG Team",
        localidad: "Tres Algarrobos, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1987-1-22",
        campeonTC: false,
        anioDebutTC: 2011,
        imagen: "https://www.actc.org.ar/upload/autos/10711/imgs_v3/imgtorso/podio/juan_martin_trucco.png"
    },

    {
        id: 6,
        nombre: "Santiago Mangoni",
        marca: "Chevrolet",
        equipo: "Canning Motorsport",
        localidad: "Balcarce, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1989-05-29",
        campeonTC: false,
        anioDebutTC: 2014,
        imagen: "https://www.actc.org.ar/upload/autos/10706/imgs_v3/imgtorso/podio/santiago_mangoni.png"
    },

    {
        id: 7,
        nombre: "Jeremías Olmedo",
        marca: "Torino",
        equipo: "Canning Motorsport",
        localidad: "Salta, Salta",
        provincia: "Salta",
        fechaNacimiento: "2002-08-23",
        campeonTC: false,
        anioDebutTC: 2025,
        imagen: "https://www.actc.org.ar/upload/autos/10712/imgs_v3/imgtorso/podio/jeremias_olmedo.png"
    },

    {
        id: 8,
        nombre: "Mariano Werner",
        marca: "Ford",
        equipo: "Fadel Werner Competición",
        localidad: "Paraná, Entre Ríos",
        provincia: "Entre Ríos",
        fechaNacimiento: "1988-12-30",
        campeonTC: true,
        anioDebutTC: 2010,
        imagen: "https://www.actc.org.ar/upload/autos/10708/imgs_v3/imgtorso/podio/mariano_werner.png"
    },

    {
        id: 9,
        nombre: "Christian Ledesma",
        marca: "Chevrolet",
        equipo: "Pradecon Racing",
        localidad: "Mar del Plata, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1976-02-04",
        campeonTC: true,
        anioDebutTC: 1998,
        imagen: "https://www.actc.org.ar/upload/autos/10699/imgs_v3/imgtorso/podio/christian_ledesma.png"
    },

    {
        id: 10,
        nombre: "Juan Jose Ebarlín",
        marca: "Chevrolet",
        equipo: "LRD Racing Team",
        localidad: "Benito Juárez, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1990-08-13",
        campeonTC: false,
        anioDebutTC: 2016,
        imagen: "https://actc.org.ar/upload/autos/9601/imgs_v3/imgtorso/podio/juan_jose_ebarlin.png"
    },

    {
        id: 11,
        nombre: "Luis José Di Palma",
        marca: "Toyota",
        equipo: "RUS MED Team",
        localidad: "Arrecifes, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1989-02-27",
        campeonTC: false,
        anioDebutTC: 2011,
        imagen: "https://actc.org.ar/upload/autos/9647/imgs_v3/imgtorso/podio/luis_jose_di_palma.png"
    },

    {
        id: 12,
        nombre: "Emiliano Spataro",
        marca: "Ford",
        equipo: "Spataro Racing",
        localidad: "Lanús, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1976-05-25",
        campeonTC: false,
        anioDebutTC: 2002,
        imagen: "https://actc.org.ar/upload/autos/10695/imgs_v3/imgtorso/podio/emiliano_spataro.png"
    },

    {
        id: 13,
        nombre: "Elio Craparo",
        marca: "Ford",
        equipo: "Moriatis Competición",
        localidad: "Chacabuco, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1998-07-21",
        campeonTC: false,
        anioDebutTC: 2023,
        imagen: "https://actc.org.ar/upload/autos/10697/imgs_v3/imgtorso/podio/elio_craparo.png"
    },

    {
        id: 14,
        nombre: "Matías Canapino",
        marca: "Torino",
        equipo: "Catalan Magni Motorsport",
        localidad: "Arrecifes, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "2000-05-30",
        campeonTC: false,
        anioDebutTC: 2025,
        imagen: "https://actc.org.ar/upload/autos/10690/imgs_v3/imgtorso/podio/matias_canapino.png"
    },

    {
        id: 15,
        nombre: "Norberto Fontana",
        marca: "Chevrolet",
        equipo: "Azar Motorsport",
        localidad: "Arrecifes, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1975-01-20",
        campeonTC: true,
        anioDebutTC: 2003,
        imagen: "https://actc.org.ar/upload/autos/10696/imgs_v3/imgtorso/podio/norberto_fontana.png"
    },

    {
        id: 16,
        nombre: "Gastón Mazzacane",
        marca: "Chevrolet",
        equipo: "Coiro Competición",
        localidad: "La Plata, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1975-05-08",
        campeonTC: false,
        anioDebutTC: 2009,
        imagen: "https://actc.org.ar/upload/autos/9609/imgs_v3/imgtorso/podio/gaston_mazzacane.png"
    },

    {
        id: 17,
        nombre: "Nicolas Cotignola",
        marca: "Toyota",
        equipo: "Sprint Racing",
        localidad: "Ituzaingó, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1991-05-06",
        campeonTC: false,
        anioDebutTC: 2017,
        imagen: "https://actc.org.ar/upload/autos/10715/imgs_v3/imgtorso/podio/nicolas_cotignola.png"
    },

    {
        id: 18,
        nombre: "Juan Tomás Catalán Magni",
        marca: "Chevrolet",
        equipo: "Catalan Magni Motorsport",
        localidad: "Arrecifes, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1999-01-07",
        campeonTC: false,
        anioDebutTC: 2017,
        imagen: "https://actc.org.ar/upload/autos/10716/imgs_v3/imgtorso/podio/juan_tomas_catalan_magni.png"
    },

    {
        id: 19,
        nombre: "Juan Pablo Gianini",
        marca: "Ford",
        equipo: "JPG Racing",
        localidad: "Salto, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1978-10-23",
        campeonTC: false,
        anioDebutTC: 2002,
        imagen: "https://actc.org.ar/upload/autos/10718/imgs_v3/imgtorso/podio/juan_pablo_gianini.png"
    },

    {
        id: 20,
        nombre: "Christian Dose",
        marca: "Chevrolet",
        equipo: "Dose Competición",
        localidad: "CABA, Buenos Aires",
        provincia: "CABA",
        fechaNacimiento: "1970-05-28",
        campeonTC: false,
        anioDebutTC: 2002,
        imagen: "https://actc.org.ar/upload/autos/7621/imgs_v3/imgtorso/podio/christian_dose.png"
    },

    {
        id: 21,
        nombre: "Jerónimo Teti",
        marca: "Ford",
        equipo: "Laboritto Jrs",
        localidad: "Lobería, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1978-02-10",
        campeonTC: false,
        anioDebutTC: 2025,
        imagen: "https://actc.org.ar/upload/autos/9628/imgs_v3/imgtorso/podio/jeronimo_teti.png"
    },

    {
        id: 22,
        nombre: "Nicolas Bonelli",
        marca: "Ford",
        equipo: "Hermanos Alvarez",
        localidad: "Concepción del Uruguay, Entre Ríos",
        provincia: "Entre Ríos",
        fechaNacimiento: "1983-10-25",
        campeonTC: false,
        anioDebutTC: 2013,
        imagen: "https://actc.org.ar/upload/autos/10692/imgs_v3/imgtorso/podio/nicolas_bonelli.png"
    },

    {
        id: 23,
        nombre: "Julian Santero",
        marca: "BMW",
        equipo: "BMW Motorsport",
        localidad: "Mendoza, Mendoza",
        provincia: "Mendoza",
        fechaNacimiento: "1993-10-21",
        campeonTC: true,
        anioDebutTC: 2017,
        imagen: "https://actc.org.ar/upload/autos/10720/imgs_v3/imgtorso/podio/julian_santero.png"
    },

    {
        id: 24,
        nombre: "Sebastián Abella",
        marca: "Ford",
        equipo: "Alifraco Sport",
        localidad: "Campana, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1976-08-07",
        campeonTC: false,
        anioDebutTC: 2024,
        imagen: "https://actc.org.ar/upload/autos/7628/imgs_v3/imgtorso/podio/sebastian_abella.png"
    },

    {
        id: 25,
        nombre: "Martín Serrano",
        marca: "Chevrolet",
        equipo: "Giavedoni Sport",
        localidad: "Pablo Nogués, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1988-06-25",
        campeonTC: false,
        anioDebutTC: 2013,
        imagen: "https://actc.org.ar/upload/autos/10688/imgs_v3/imgtorso/podio/martin_serrano.png"
    },

    {
        id: 26,
        nombre: "Sergio Alaux",
        marca: "Chevrolet",
        equipo: "Giavedoni Sport",
        localidad: "Pigüé, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1976-11-22",
        campeonTC: false,
        anioDebutTC: 1997,
        imagen: "https://actc.org.ar/upload/autos/9637/imgs_v3/imgtorso/podio/sergio_alaux.png"
    },

    {
        id: 27,
        nombre: "Augusto Carinelli",
        marca: "Ford",
        equipo: "Martínez Competición",
        localidad: "Corzuela, Chaco",
        provincia: "Chaco",
        fechaNacimiento: "1976-11-16",
        campeonTC: false,
        anioDebutTC: 2017,
        imagen: "https://actc.org.ar/upload/autos/10721/imgs_v3/imgtorso/podio/augusto_carinelli.png"
    },

    {
        id: 28,
        nombre: "Facundo Chapur",
        marca: "Torino",
        equipo: "Trotta Competición",
        localidad: "Córdoba, Córdoba",
        provincia: "Córdoba",
        fechaNacimiento: "1993-12-22",
        campeonTC: false,
        anioDebutTC: 2024,
        imagen: "https://actc.org.ar/upload/autos/10722/imgs_v3/imgtorso/podio/facundo_chapur.png"
    },

    {
        id: 29,
        nombre: "Tomás Abdala",
        marca: "Ford",
        equipo: "Tomas Abdala Racing",
        localidad: "Lobos, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1987-01-24",
        campeonTC: false,
        anioDebutTC: 2026,
        imagen: "https://actc.org.ar/upload/autos/10723/imgs_v3/imgtorso/podio/tomas_abdala.png"
    },

    {
        id: 30,
        nombre: "Lucas Carabajal",
        marca: "Ford",
        equipo: "DTA Racing",
        localidad: "Resistencia, Chaco",
        provincia: "Chaco",
        fechaNacimiento: "1999-09-22",
        campeonTC: false,
        anioDebutTC: 2026,
        imagen: "https://actc.org.ar/upload/autos/10724/imgs_v3/imgtorso/podio/lucas_carabajal.png"
    },

    {
        id: 31,
        nombre: "Facundo Ardusso",
        marca: "Ford",
        equipo: "Martínez Competición",
        localidad: "Las Parejas, Santa Fe",
        provincia: "Santa Fe",
        fechaNacimiento: "1988-06-24",
        campeonTC: false,
        anioDebutTC: 2013,
        imagen: "https://actc.org.ar/upload/autos/10725/imgs_v3/imgtorso/podio/facundo_ardusso.png"
    },

    {
        id: 32,
        nombre: "Ricardo Risatti",
        marca: "Ford",
        equipo: "TCM Racing Team",
        localidad: "Laboulaye, Córdoba",
        provincia: "Córdoba",
        fechaNacimiento: "1986-09-27",
        campeonTC: false,
        anioDebutTC: 2009,
        imagen: "https://actc.org.ar/upload/autos/10717/imgs_v3/imgtorso/podio/ricardo_risatti.png"
    },

    {
        id: 33,
        nombre: "Ignacio Faín",
        marca: "Torino",
        equipo: "Trotta Competición",
        localidad: "Villa Minetti, Santa Fe",
        provincia: "Santa Fe",
        fechaNacimiento: "2005-06-28",
        campeonTC: false,
        anioDebutTC: 2025,
        imagen: "https://actc.org.ar/upload/autos/9664/imgs_v3/imgtorso/podio/ignacio_fain.png"
    },

    {
        id: 34,
        nombre: "Nicolás Impiombato",
        marca: "Chevrolet",
        equipo: "Impiombato Motorsport",
        localidad: "General Rodríguez, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1994-11-08",
        campeonTC: false,
        anioDebutTC: 2025,
        imagen: "https://actc.org.ar/upload/autos/10727/imgs_v3/imgtorso/podio/nicolas_impiombato.png"
    },

    {
        id: 35,
        nombre: "Nicolás Trosset",
        marca: "Ford",
        equipo: "Savino Sport",
        localidad: "Arrecifes, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1992-01-08",
        campeonTC: false,
        anioDebutTC: 2014,
        imagen: "https://actc.org.ar/upload/autos/10728/imgs_v3/imgtorso/podio/nicolas_trosset.png"
    },

    {
        id: 36,
        nombre: "Marcos Landa",
        marca: "Chevrolet",
        equipo: "Pradecon Racing",
        localidad: "San Carlos, Maldonado, Uruguay",
        provincia: "Maldonado",
        fechaNacimiento: "2001-09-23",
        campeonTC: false,
        anioDebutTC: 2021,
        imagen: "https://actc.org.ar/upload/autos/10705/imgs_v3/imgtorso/podio/marcos_landa.png"
    },

    {
        id: 37,
        nombre: "Juan Cruz Benvenuti",
        marca: "Chevrolet",
        equipo: "Canning Motorsport",
        localidad: "Villa La Angostura, Neuquén",
        provincia: "Neuquén",
        fechaNacimiento: "1996-09-16",
        campeonTC: false,
        anioDebutTC: 2019,
        imagen: "https://actc.org.ar/upload/autos/10729/imgs_v3/imgtorso/podio/juan_cruz_benvenuti.png"
    },

    {
        id: 38,
        nombre: "Jonatan Castellano",
        marca: "Dodge",
        equipo: "Galarza Racing",
        localidad: "Lobería, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1985-05-16",
        campeonTC: false,
        anioDebutTC: 2006,
        imagen: "https://actc.org.ar/upload/autos/9600/imgs_v3/imgtorso/podio/jonatan_castellano.png",
    },

    {
        id: 39,
        nombre: "Tobías Martínez",
        marca: "Chevrolet",
        equipo: "RUS MED Team",
        localidad: "San Juan, San Juan",
        provincia: "San Juan",
        fechaNacimiento: "2001-03-16",
        campeonTC: false,
        anioDebutTC: 2024,
        imagen: "https://actc.org.ar/upload/autos/10702/imgs_v3/imgtorso/podio/tobias_martinez.png",
    },

    {
        id: 40,
        nombre: "Nicolás Moscardini",
        marca: "Ford",
        equipo: "Martínez Competición",
        localidad: "La Plata, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "2000-07-06",
        campeonTC: false,
        anioDebutTC: 2026,
        imagen: "https://actc.org.ar/upload/autos/10730/imgs_v3/imgtorso/podio/nicolas_moscardini.png",
    },

    {
        id: 41,
        nombre: "Diego Azar",
        marca: "Mercedez Benz",
        equipo: "Maquin Parts Racing - Prestige Auto Racing Team",
        localidad: "Del Viso, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1994-12-12",
        campeonTC: false,
        anioDebutTC: 2025,
        imagen: "https://actc.org.ar/upload/autos/10731/imgs_v3/imgtorso/podio/diego_azar.png",
    },

    {
        id: 42,
        nombre: "Lucas Valle",
        marca: "Chevrolet",
        equipo: "RV Racing",
        localidad: "Rawson, Chubut",
        provincia: "Chubut",
        fechaNacimiento: "1992-11-24",
        campeonTC: false,
        anioDebutTC: 2026,
        imagen: "https://actc.org.ar/upload/autos/10733/imgs_v3/imgtorso/podio/lucas_valle.png",
    },

    {
        id: 43,
        nombre: "Rodrigo Lugón",
        marca: "Ford",
        equipo: "A&P Competición",
        localidad: "Villa Allende, Córdoba",
        provincia: "Córdoba",
        fechaNacimiento: "1997-12-07",
        campeonTC: false,
        anioDebutTC: 2026,
        imagen: "https://actc.org.ar/upload/autos/10734/imgs_v3/imgtorso/podio/rodrigo_lugon.png",
    },

    {
        id: 44,
        nombre: "Gastón Ferrante",
        marca: "Ford",
        equipo: "Di Megio Motorsport",
        localidad: "Castelar, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1988-02-27",
        campeonTC: false,
        anioDebutTC: 2019,
        imagen: "https://actc.org.ar/upload/autos/10735/imgs_v3/imgtorso/podio/gaston_ferrante.png",
    },

    {
        id: 45,
        nombre: "Diego De Carlo",
        marca: "Chevrolet",
        equipo: "LRD Racing Team",
        localidad: "Lanús, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1974-04-25",
        campeonTC: false,
        anioDebutTC: 2007,
        imagen: "https://actc.org.ar/upload/autos/9652/imgs_v3/imgtorso/podio/diego_de_carlo.png",
    },

    {
        id: 46,
        nombre: "Kevin Candela",
        marca: "BMW",
        equipo: "BMW Motorsport",
        localidad: "Bragado, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1992-11-26",
        campeonTC: false,
        anioDebutTC: 2022,
        imagen: "https://actc.org.ar/upload/autos/10737/imgs_v3/imgtorso/podio/kevin_candela.png",
    },

    {
        id: 47,
        nombre: "Matias Rossi",
        marca: "Toyota",
        equipo: "Pradecon Racing",
        localidad: "Del Viso, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1984-04-02",
        campeonTC: true,
        anioDebutTC: 2003,
        imagen: "https://actc.org.ar/upload/autos/10738/imgs_v3/imgtorso/podio/matias_rossi.png",
    },

    {
        id: 48,
        nombre: "Hernán Palazzo",
        marca: "Toyota",
        equipo: "Pradecon Racing",
        localidad: "Pinamar, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "2000-02-24",
        campeonTC: false,
        anioDebutTC: 2025,
        imagen: "https://actc.org.ar/upload/autos/10739/imgs_v3/imgtorso/podio/hernan_palazzo.png",
    },

    {
        id: 49,
        nombre: "Andrés Jakos",
        marca: "Toyota",
        equipo: "Coiro Competición",
        localidad: "Ramos Mejía, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1999-08-07",
        campeonTC: false,
        anioDebutTC: 2021,
        imagen: "https://actc.org.ar/upload/autos/9667/imgs_v3/imgtorso/podio/andres_jakos.png",
    },

    {
        id: 50,
        nombre: "Martín Vázquez",
        marca: "Dodge",
        equipo: "MV Racing",
        localidad: "Pilar, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1994-04-29",
        campeonTC: false,
        anioDebutTC: 2023,
        imagen: "https://actc.org.ar/upload/autos/10741/imgs_v3/imgtorso/podio/martin_vazquez.png",
    },

    {
        id: 51,
        nombre: "Thomas Ricciardi",
        marca: "Toyota",
        equipo: "RUS MED Team",
        localidad: "Rosario, Santa Fe",
        provincia: "Santa Fe",
        fechaNacimiento: "2004-10-19",
        campeonTC: false,
        anioDebutTC: 2026,
        imagen: "https://actc.org.ar/upload/autos/10742/imgs_v3/imgtorso/podio/thomas_ricciardi.png",
    },

    {
        id: 52,
        nombre: "Valentín Aguirre",
        marca: "Chevrolet",
        equipo: "Pradecon Racing",
        localidad: "Areccifes, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1996-11-25",
        campeonTC: false,
        anioDebutTC: 2018,
        imagen: "https://actc.org.ar/upload/autos/10707/imgs_v3/imgtorso/podio/valentin_aguirre.png",
    },

    {
        id: 53,
        nombre: "Matías Jalaf",
        marca: "Ford",
        equipo: "Jalaf Competicion",
        localidad: "Mendoza, Mendoza",
        provincia: "Mendoza",
        fechaNacimiento: "1984-09-07",
        campeonTC: false,
        anioDebutTC: 2005,
        imagen: "https://actc.org.ar/upload/autos/9614/imgs_v3/imgtorso/podio/matias_jalaf.png",
    },

    {
        id: 54,
        nombre: "Jeremías Scialchi",
        marca: "Ford",
        equipo: "Moriatis Competición",
        localidad: "San Antonio de Areco, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "2003-09-14",
        campeonTC: false,
        anioDebutTC: 2025,
        imagen: "https://actc.org.ar/upload/autos/10744/imgs_v3/imgtorso/podio/jeremias_scialchi.png",
    },

    {
        id: 55,
        nombre: "Gaspar Chansard",
        marca: "Toyota",
        equipo: "Giavedoni SPORT",
        localidad: "Reconquista, Santa Fe",
        provincia: "Santa Fe",
        fechaNacimiento: "2003-06-02",
        campeonTC: false,
        anioDebutTC: 2026,
        imagen: "https://actc.org.ar/upload/autos/10745/imgs_v3/imgtorso/podio/gaspar_chansard.png",
    },

    {
        id: 56,
        nombre: "Jorge Barrio",
        marca: "Chevrolet",
        equipo: "Canning Motorsport",
        localidad: "Pinamar, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "2004-05-06",
        campeonTC: false,
        anioDebutTC: 2026,
        imagen: "https://actc.org.ar/upload/autos/10746/imgs_v3/imgtorso/podio/jorge_barrio.png",
    },

    {
        id: 57,
        nombre: "Marco Dianda",
        marca: "Dodge",
        equipo: "Galarza Racing",
        localidad: "Guatimozín, Córdoba",
        provincia: "Córdoba",
        fechaNacimiento: "2008-03-29",
        campeonTC: false,
        anioDebutTC: 2026,
        imagen: "https://actc.org.ar/upload/autos/10747/imgs_v3/imgtorso/podio/marco_dianda.png",
    },

    {
        id: 58,
        nombre: "Joaquín Ochoa",
        marca: "Dodge",
        equipo: "SAP Team",
        localidad: "Viedma, Río Negro",
        provincia: "Río Negro",
        fechaNacimiento: "2002-04-02",
        campeonTC: false,
        anioDebutTC: 2026,
        // imagen: "img/pilotos/joaco_ochoa.png"
        imagen: "https://actc.org.ar/upload/autos/10748/imgs_v3/imgtorso/podio/joaquin_ochoa.png",
    },

    {
        id: 59,
        nombre: "Juan B. De Benedictis",
        marca: "Ford",
        equipo: "RUS MED Team",
        localidad: "Necochea, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1986-12-26",
        campeonTC: false,
        anioDebutTC: 2007,
        imagen: "img/pilotos/juan_b._de_benedictis.png",
    },

    {
        id: 60,
        nombre: "Santiago Álvarez",
        marca: "Toyota",
        equipo: "UR Racing",
        localidad: "Ferré, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1999-06-24",
        campeonTC: false,
        anioDebutTC: 2023,
        imagen: "https://actc.org.ar/upload/autos/10750/imgs_v3/imgtorso/podio/santiago_alvarez.png",
    },

    {
        id: 61,
        nombre: "Juan Manuel Tomasello",
        marca: "Chevrolet",
        equipo: "DGB Motor Sport",
        localidad: "Don Torcuato, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "1988-01-15",
        campeonTC: false,
        anioDebutTC: 2026,
        imagen: "https://actc.org.ar/upload/autos/10751/imgs_v3/imgtorso/podio/juan_manuel_tomasello.png",
    },

    {
        id: 62,
        nombre: "Marcos Castro",
        marca: "Torino",
        equipo: "DGB Motor Sport",
        localidad: "Necochea, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "2000-10-30",
        campeonTC: false,
        anioDebutTC: 2026,
        imagen: "https://actc.org.ar/upload/autos/10752/imgs_v3/imgtorso/podio/marcos_castro.png",
    },

    {
        id: 63,
        nombre: "Marcos Quijada",
        marca: "Chevrolet",
        equipo: "RUS MED Team",
        localidad: "Belén de Escobar, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "2003-01-23",
        campeonTC: false,
        anioDebutTC: 2023,
        imagen: "https://actc.org.ar/upload/autos/10753/imgs_v3/imgtorso/podio/marcos_quijada.png",
    },

    {
        id: 64,
        nombre: "José Manuel Urcera",
        marca: "Mercedez Benz",
        equipo: "Maquin Parts Racing - Prestige Auto Racing Team",
        localidad: "San Antonio Oeste, Río Negro",
        provincia: "Río Negro",
        fechaNacimiento: "1991-07-09",
        campeonTC: true,
        anioDebutTC: 2015,
        imagen: "https://actc.org.ar/upload/autos/9669/imgs_v3/imgtorso/podio/jose_manuel_urcera.png",
    },

    {
        id: 65,
        nombre: "Otto Fritzler",
        marca: "Mercedez Benz",
        equipo: "Maquin Parts Racing - Prestige Auto Racing Team",
        localidad: "San Miguel, Buenos Aires",
        provincia: "Buenos Aires",
        fechaNacimiento: "2003-02-07",
        campeonTC: false,
        anioDebutTC: 2023,
        imagen: "https://actc.org.ar/upload/autos/10776/imgs_v3/imgtorso/podio/otto_fritzler.png",
    }
];
