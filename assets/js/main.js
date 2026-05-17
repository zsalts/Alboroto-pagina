// REEMPLAZÁ ESTA URL POR LA DE TU "NUEVA IMPLEMENTACIÓN"
const URL_GOOGLE_SCRIPT = "https://script.google.com/macros/s/AKfycbzhNUllQkPRTuPHeZRRTH4I-p61jb4BkOroSPLTkdCVVobIb2umhoE_Xb3tZSzDOZ6z/exec"; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. CONTROL DEL FORMULARIO DE CARGA (index.html / carga.html)
    const formFiesta = document.getElementById('formFiesta');
    if (formFiesta) {
        formFiesta.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = formFiesta.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '⌛ Guardando en Alboroto...';

            const datos = {
                fecha: document.getElementById('fecha').value,
                desde: document.getElementById('horaDesde').value,
                hasta: document.getElementById('horaHasta').value,
                nombre: document.getElementById('nombreApellido').value,
                colegio: document.getElementById('colegio').value,
                edad: document.getElementById('edad').value,
                tematica: document.getElementById('tematica').value,
                telefono: document.getElementById('telefono').value,
                adultos: document.getElementById('adultos').value,
                ninos: document.getElementById('ninos').value,
                profe: document.getElementById('profe').value,
                ayudante: document.getElementById('ayudante').value,
                indicaciones: document.getElementById('indicaciones').value,
                total: document.getElementById('total').value
            };

            try {
                await fetch(URL_GOOGLE_SCRIPT, {
                    method: 'POST',
                    mode: 'no-cors', 
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(datos)
                });

                alert('✅ ¡Fiesta registrada con éxito!');
                formFiesta.reset();
            } catch (error) {
                console.error("Error al guardar:", error);
                alert('Hubo un problema al guardar.');
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Cargar Fiesta';
            }
        });
    }

    // 2. CONTROL DE LA LISTA DE GESTIÓN (index.html)
    // Nos aseguramos de no ejecutar esto en el calendario si por alguna razón hay un .list-group
    if (document.querySelector('.list-group') && !document.getElementById('calendar')) {
        cargarFiestasActivas();
    }

    // 3. LÓGICA DEL CALENDARIO HTML (calendario.html)
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', 
            locale: 'es', 
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay' 
            },
            buttonText: {
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día'
            },
            displayEventEnd: true, 
            eventTimeFormat: { 
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
            },
            eventContent: function(arg) {
                const profes = arg.event.extendedProps.staff;
                
                let htmlFormateado = `
                    <div style="background-color: var(--alboroto-naranja, #ff6b35); border-radius: 4px; padding: 4px 6px; width: 100%; height: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                        <div style="font-size: 0.85em; font-weight: 700; margin-bottom: 2px; color: #fff;">
                            🕒 ${arg.timeText} hs
                        </div>
                        <div style="font-size: 0.9em; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; margin-bottom: 2px;">
                            🎊 ${arg.event.title}
                        </div>
                        <div style="font-size: 0.75em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; opacity: 0.9;">
                            🛡️ ${profes}
                        </div>
                    </div>
                `;
                return { html: htmlFormateado };
            },
            events: function(info, successCallback, failureCallback) {
                fetch(URL_GOOGLE_SCRIPT + "?nocache=" + new Date().getTime())
                    .then(res => res.json())
                    .then(data => {
                        const eventos = data.map(f => {
                            const partes = f.fecha.split('/');
                            const fechaIso = `${partes[2]}-${partes[1]}-${partes[0]}`; 
                            
                            let textoStaff = f.profe || 'Sin profe';
                            if (f.ayudante) {
                                textoStaff += ` y ${f.ayudante}`;
                            }

                            return {
                                title: f.nombre, 
                                start: `${fechaIso}T${f.desde}:00`, 
                                end: `${fechaIso}T${f.hasta}:00`,   
                                backgroundColor: 'transparent', 
                                borderColor: 'transparent',
                                extendedProps: {  
                                    adultos: f.adultos,
                                    ninos: f.ninos,
                                    telefono: f.telefono,
                                    tematica: f.tematica, 
                                    staff: textoStaff 
                                }
                            };
                        });
                        successCallback(eventos);
                    })
                    .catch(err => {
                        console.error("Error al cargar el calendario:", err);
                        failureCallback(err);
                    });
            },
            eventClick: function(info) {
                const titulo = info.event.title;
                const horaInicio = info.event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const horaFin = info.event.end ? info.event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
                const prop = info.event.extendedProps;
                
                document.getElementById('modalTituloFiesta').textContent = titulo;
                document.getElementById('modalTematica').textContent = prop.tematica ? `(Temática: ${prop.tematica})` : '';
                document.getElementById('modalHorario').textContent = `${horaInicio} a ${horaFin} hs`;
                document.getElementById('modalStaff').textContent = prop.staff;
                document.getElementById('modalInvitados').textContent = `${prop.adultos} Ad. / ${prop.ninos} Niñ.`;
                document.getElementById('modalTelefono').textContent = prop.telefono;

                const btnWpp = document.getElementById('btnWppModal');
                const fechaLimpia = info.event.start.toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: 'numeric'});
                
                btnWpp.onclick = () => mandarWhatsApp(prop.telefono, titulo, fechaLimpia, horaInicio);

                const modalElement = document.getElementById('modalDetalles');
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        });

        calendar.render();
    }
}); // Cierre del DOMContentLoaded

// --- FUNCIONES EXTRA GLOBALES ---
// Las dejamos fuera del DOMContentLoaded para que los botones onclick="" del HTML las puedan encontrar

function cargarFiestasActivas() {
    const contenedor = document.querySelector('.list-group');
    if (!contenedor) return;

    contenedor.innerHTML = '<div class="text-center p-4">⏳ Buscando próximos eventos...</div>';

    fetch(URL_GOOGLE_SCRIPT)
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            
            contenedor.innerHTML = '';
            if (data.length === 0) {
                contenedor.innerHTML = '<div class="text-center p-4 text-muted">No hay eventos activos programados.</div>';
                return;
            }

            data.forEach(f => {
                const fJson = JSON.stringify(f).replace(/"/g, '&quot;'); 
                
                const html = `
                    <div class="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2 p-4 mb-3 border-0 shadow-sm rounded-4">
                        <div style="flex: 1; min-width: 250px;">
                            <h5 class="fw-bold mb-1" style="color: #333;">${f.nombre} <span class="fw-normal text-muted">(${f.tematica})</span></h5>
                            <div class="text-muted small d-flex align-items-center gap-2">
                                <span>📅 ${f.fecha}</span> | <span>🕒 ${f.desde} a ${f.hasta} hs</span>
                            </div>
                            <div class="mt-2">
                                <span class="badge bg-light text-dark border fw-normal">👤 ${f.adultos} Ad. / ${f.ninos} Niñ.</span>
                                <span class="badge bg-light text-dark border fw-normal">🛡️ ${f.profe}</span>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary rounded-pill px-3 shadow-sm" onclick="abrirModalEdicion('${fJson}')">
                                ✏️ Editar
                            </button>
                            <button class="btn btn-success rounded-pill px-3 text-white shadow-sm" onclick="mandarWhatsApp('${f.telefono}', '${f.nombre}', '${f.fecha}', '${f.desde}')">
                                📲 Check-in
                            </button>
                        </div>
                    </div>
                `;
                contenedor.innerHTML += html;
            });
        })
        .catch(err => {
            contenedor.innerHTML = `<div class="alert alert-danger">Error al cargar datos desde Google Script. Revisá que la URL sea correcta.</div>`;
        });
}

function mandarWhatsApp(tel, nombre, fecha, hora) {
    const numero = tel.replace(/\D/g, ''); 
    const msj = encodeURIComponent(`¡Hola! Te escribimos de Alboroto Multiespacio para confirmar los detalles del cumple de ${nombre} el día ${fecha} a las ${hora} hs.`);
    window.open(`https://wa.me/${numero}?text=${msj}`, '_blank');
}

function abrirModalEdicion(json) {
    const fiesta = JSON.parse(json);
    console.log("Datos para editar:", fiesta);
    alert("Acá se abriría el modal para editar a " + fiesta.nombre);
}