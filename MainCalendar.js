document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        editable: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: cargarEventos(), // Cargar eventos desde LocalStorage
        dateClick: function(info) {
            selectedDate = info.dateStr; 
            console.log(selectedDate);
            calendar.changeView('timeGridDay'); 
            calendar.gotoDate(info.dateStr);
            openModal();
        },

        eventClick: function(info) {
            if (confirm("¿Deseas eliminar este evento?")) {
                info.event.remove(); // Elimina del calendario
                eliminarEvento(info.event); // Elimina del LocalStorage

                // Recargar el calendario después de eliminar
                actualizarEventosCalendario();
                actualizarListaEventos();
            }
        }
    });

    calendar.render();

    // Variables para manejar el modal
    let selectedDate = null;
    const modal = document.getElementById('eventModal');
    const eventTitleInput = document.getElementById('eventTitle');
    const eventStartTimeInput = document.getElementById('eventStartTime');
    const eventEndTimeInput = document.getElementById('eventEndTime');
    const eventRepeatSelect = document.getElementById('eventRepeat');
    const colorPicker = document.getElementById('colorInput');
    const saveEventButton = document.getElementById('saveEvent');

    // Variables para manejar la lista de eventos
    const listaDeEventos = document.getElementById('eventosdelmodal');

    flatpickr(eventStartTimeInput, {
        enableTime: true,  
        noCalendar: true,  
        dateFormat: "H:i", 
        time_24hr: true
    });

    flatpickr(eventEndTimeInput, {
        enableTime: true,  
        noCalendar: true,  
        dateFormat: "H:i", 
        time_24hr: true
    });

    // Función para abrir el modal
    function openModal() {
        modal.style.display = "flex";
        eventTitleInput.value = "";
        eventStartTimeInput.value = "";
        eventEndTimeInput.value = "";
        eventRepeatSelect.value = "none";
        colorPicker.value = "#000000"; // Color por defecto
    }

    // Función para cerrar el modal
    window.closeModal = function() {
        modal.style.display = "none";
    }

    // Guardar el evento cuando se presiona "Guardar"
    saveEventButton.addEventListener('click', function() {
        const title = eventTitleInput.value;
        const startTime = eventStartTimeInput.value;
        const endTime = eventEndTimeInput.value;
        const repeat = eventRepeatSelect.value;
        const eventColor = colorPicker.value; 
        
        if (title && startTime && endTime) {
            // Concatenamos la fecha con la hora seleccionada
            const eventStartDateTime = selectedDate.split("T")[0] + "T" + startTime + ":00";
            const eventEndDateTime = selectedDate.split("T")[0] + "T" + endTime + ":00";

            const newEvent = {
                title: title,
                start: eventStartDateTime,
                end: eventEndDateTime,
                allDay: false,
                color: eventColor,
                repeat: repeat
            };

            calendar.addEvent(newEvent);
            guardarEvento(newEvent);

            // Actualizar la lista y el calendario
            actualizarEventosCalendario();
            actualizarListaEventos();

            closeModal();
        } else {
            alert("Por favor, ingrese un título, una hora de inicio y una hora de fin.");
        }
    });

    // Función para guardar eventos en LocalStorage
    function guardarEvento(event) {
        let eventosGuardados = JSON.parse(localStorage.getItem("eventos")) || [];
        eventosGuardados.push(event);
        localStorage.setItem("eventos", JSON.stringify(eventosGuardados));
        actualizarBarraDeProgreso();
    }

    // Función para cargar eventos guardados en LocalStorage
    function cargarEventos() {
        let eventosGuardados = JSON.parse(localStorage.getItem("eventos")) || [];
        let eventos = [];

        eventosGuardados.forEach(event => {
            eventos.push(event);
            if (event.repeat !== 'none') {
                let repeatCount = 0;
                let repeatDate = new Date(event.start);

                while (repeatCount < 20) { // Limitar a 10 repeticiones para evitar demasiados eventos
                    repeatCount++;
                    switch (event.repeat) {
                        case 'daily':
                            repeatDate.setDate(repeatDate.getDate() + 1);
                            break;
                        case 'weekly':
                            repeatDate.setDate(repeatDate.getDate() + 7);
                            break;
                        case 'monthly':
                            repeatDate.setMonth(repeatDate.getMonth() + 1);
                            break;
                        case 'yearly':
                            repeatDate.setFullYear(repeatDate.getFullYear() + 1);
                            break;
                    }

                    let newEvent = { ...event };
                    newEvent.start = repeatDate.toISOString();
                    newEvent.end = new Date(repeatDate.getTime() + (new Date(event.end).getTime() - new Date(event.start).getTime())).toISOString();
                    eventos.push(newEvent);
                }
            }
        });

        return eventos;
    }

    // Función para actualizar el calendario con los eventos guardados
    function actualizarEventosCalendario() {
        calendar.getEvents().forEach(event => event.remove()); 
        calendar.addEventSource(cargarEventos()); 
    }

    // Función para eliminar un evento del LocalStorage
    function eliminarEvento(event) {
        let eventosGuardados = JSON.parse(localStorage.getItem("eventos")) || [];

        // Convertir la fecha del evento a formato ISO sin la 'Z' final
        const eventStartISO = new Date(event.start).toISOString().slice(0, -1);

        console.log("Intentando eliminar:", { title: event.title, start: eventStartISO });

        // Filtrar correctamente comparando fechas y título
        eventosGuardados = eventosGuardados.filter(e => {
            const storedStartISO = new Date(e.start).toISOString().slice(0, -1);
            return !(e.title === event.title && storedStartISO === eventStartISO);
        });

        console.log("Eventos después de eliminar:", eventosGuardados);

        localStorage.setItem("eventos", JSON.stringify(eventosGuardados));
        actualizarBarraDeProgreso();
    }

    // Función para actualizar la lista de eventos en el modal
    function actualizarListaEventos() {
        let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
        let contenedorEventos = document.getElementById("eventosdelmodal");

        // Limpiar el contenedor antes de actualizarlo
        contenedorEventos.innerHTML = "";

        // Crear elementos para cada evento
        eventos.forEach(evento => {
            let divEvento = document.createElement("div");
            divEvento.classList.add("evento");
            divEvento.innerHTML = `<strong>${evento.title}</strong> - ${evento.start}`;
            contenedorEventos.appendChild(divEvento);
        });
    }

    // Actualización del color picker
    document.getElementById('colorInput').addEventListener('input', function() {
        const color = this.value;
        document.getElementById('hexValue').textContent = color;
        document.getElementById('rgbValue').textContent = hexToRgb(color);
        document.querySelector('.color-picker').style.backgroundColor = color;
    });

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${r}, ${g}, ${b})`;
    }

    // Cargar eventos al iniciar
    actualizarListaEventos();

    // Función para mostrar el reloj y la fecha
    function mostrarRelojYFecha() {
        const relojEl = document.getElementById('reloj');
        const fechaEl = document.getElementById('fecha');

        function actualizarRelojYFecha() {
            const ahora = new Date();
            const horas = ahora.getHours().toString().padStart(2, '0');
            const minutos = ahora.getMinutes().toString().padStart(2, '0');
            const segundos = ahora.getSeconds().toString().padStart(2, '0');

            const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

            const diaSemana = diasSemana[ahora.getDay()];
            const dia = ahora.getDate();
            const mes = meses[ahora.getMonth()];
            const año = ahora.getFullYear();

            relojEl.textContent = `${horas}:${minutos}:${segundos}`;
            fechaEl.textContent = `${diaSemana}, ${dia} de ${mes} de ${año}`;
        }

        actualizarRelojYFecha();
        setInterval(actualizarRelojYFecha, 1000);
    }

    // Función para mostrar el clima
    function mostrarClima() {
        const apiKey = 'f1f3698a0801091bb5990506664534df'; // Reemplaza con tu API key de OpenWeatherMap
        const ciudad = 'Santiago'; 
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${ciudad}&appid=${apiKey}&units=metric&lang=es`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const climaEl = document.getElementById('clima');
                const temperaturaEl = document.getElementById('temperatura');

                const descripcion = data.weather[0].description;
                const temperatura = data.main.temp;

                climaEl.textContent = descripcion.charAt(0).toUpperCase() + descripcion.slice(1);
                temperaturaEl.textContent = `${temperatura}°C`;
            })
            .catch(error => console.error('Error al obtener el clima:', error));
    }

    // Función para calcular el tamaño de localStorage en MB
    function calcularTamañoLocalStorage() {
        let total = 0;
        for (let x in localStorage) {
            if (localStorage.hasOwnProperty(x)) {
                total += (localStorage[x].length * 2) / 1024 / 1024; // Convertir a MB
            }
        }
        return total.toFixed(2); // Redondear a 2 decimales
    }

    // Función para actualizar la barra de progreso
    function actualizarBarraDeProgreso() {
        const maxStorage = 5; // 5MB es el límite típico de localStorage
        const usedStorage = calcularTamañoLocalStorage();
        const usagePercentage = (usedStorage / maxStorage) * 100;

        const storageUsageBar = document.getElementById('storageUsageBar');
        const storageUsageText = document.getElementById('storageUsageText');

        storageUsageBar.style.width = `${usagePercentage}%`;
        storageUsageText.textContent = `${usedStorage} MB / ${maxStorage} MB (${usagePercentage.toFixed(2)}%)`;
    }

    // Inicializar la barra de progreso al cargar la página
    actualizarBarraDeProgreso();

    // Iniciar el reloj, la fecha y el clima
    mostrarRelojYFecha();
    mostrarClima();
});
