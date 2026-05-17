// ==========================================
// CONFIGURACIÓN
// ==========================================
const URL_GOOGLE_SCRIPT = "https://script.google.com/macros/s/AKfycbxRzHxHFeJSkoaTZkVzhPq9cW7KTAdqt1uD1PR1sAB_XEtIblbiKLvyWEUYNW6t-KPo/exec"; 
let fiestaSeleccionada = null; // Guarda temporalmente la fiesta a editar

// ==========================================
// INICIALIZACIÓN DEL DOM
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    // 1. CÓDIGO PARA CARGAR FIESTA (carga.html)
    const formFiesta = document.getElementById('formFiesta');
    if (formFiesta) {
        formFiesta.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = formFiesta.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '⌛ Guardando en Alboroto...';

            const datos = {
                accion: 'crear',
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
                btn.innerHTML = 'Guardar Fiesta';
            }
        });
    }

    // 2. CÓDIGO PARA MOSTRAR LISTADO DE GESTIÓN (index.html)
    if (document.querySelector('.list-group') && !document.getElementById('calendar')) {
        cargarFiestasActivas();
    }

    // 3. CÓDIGO PARA EL CALENDARIO (calendario.html)
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
            buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' },
            displayEventEnd: true, 
            eventTimeFormat: { hour: '2-digit', minute: '2-digit', meridiem: false },
            
            eventContent: function(arg) {
                const profes = arg.event.extendedProps.staff;
                let htmlFormateado = `
                    <div style="background-color: var(--alboroto-naranja, #ff6b35); border-radius: 4px; padding: 4px 6px; width: 100%; height: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.2); cursor: pointer;">
                        <div style="font-size: 0.85em; font-weight: 700; margin-bottom: 2px; color: #fff;">🕒 ${arg.timeText} hs</div>
                        <div style="font-size: 0.9em; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; margin-bottom: 2px;">🎊 ${arg.event.title}</div>
                        <div style="font-size: 0.75em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; opacity: 0.9;">🛡️ ${profes}</div>
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
                            let textoStaff = f.profe || 'Sin profe asignado';
                            if (f.ayudante) textoStaff += ` y ${f.ayudante}`;

                            return {
                                title: f.nombre, 
                                start: `${fechaIso}T${f.desde}:00`, 
                                end: `${fechaIso}T${f.hasta}:00`,   
                                backgroundColor: 'transparent', 
                                borderColor: 'transparent',
                                extendedProps: {  
                                    adultos: f.adultos, ninos: f.ninos, telefono: f.telefono,
                                    tematica: f.tematica, staff: textoStaff 
                                }
                            };
                        });
                        successCallback(eventos);
                    })
                    .catch(err => {
                        console.error("Error al cargar calendario:", err);
                        failureCallback(err);
                    });
            },
            
            eventClick: function(info) {
                // Evitar comportamientos extraños al hacer clic
                info.jsEvent.preventDefault();

                const prop = info.event.extendedProps;
                const horaInicio = info.event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                const horaFin = info.event.end ? info.event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '??:??';
                
                // Llenamos el Modal
                document.getElementById('modalTituloFiesta').textContent = info.event.title;
                document.getElementById('modalTematica').textContent = prop.tematica ? `Temática: ${prop.tematica}` : 'Sin temática especificada';
                document.getElementById('modalHorario').textContent = `${horaInicio} a ${horaFin} hs`;
                document.getElementById('modalStaff').textContent = prop.staff;
                document.getElementById('modalInvitados').textContent = `${prop.adultos || 0} Adultos / ${prop.ninos || 0} Niños`;
                document.getElementById('modalTelefono').textContent = prop.telefono || 'Sin número registrado';

                // Configuración del botón de WhatsApp
                const btnWpp = document.getElementById('btnWppModal');
                if (prop.telefono) {
                    btnWpp.style.display = 'inline-block';
                    const fechaLimpia = info.event.start.toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: 'numeric'});
                    btnWpp.onclick = () => mandarWhatsApp(prop.telefono, info.event.title, fechaLimpia, horaInicio);
                } else {
                    btnWpp.style.display = 'none';
                }

                // Usamos getOrCreateInstance para no saturar la memoria creando modales infinitos
                const modalElement = document.getElementById('modalDetalles');
                const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
                modal.show();
            }
        });
        calendar.render();
    }
});


// ==========================================
// FUNCIONES GLOBALES DE GESTIÓN Y CRUD
// ==========================================

function cargarFiestasActivas() {
    const contenedor = document.querySelector('.list-group');
    if (!contenedor) return;

    contenedor.innerHTML = '<div class="text-center p-4">⏳ Buscando próximos eventos...</div>';

    fetch(URL_GOOGLE_SCRIPT + "?nocache=" + new Date().getTime())
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
                            <h5 class="fw-bold mb-1" style="color: #333;">${f.nombre} <span class="fw-normal text-muted">(${f.tematica || 'Sin temática'})</span></h5>
                            <div class="text-muted small d-flex align-items-center gap-2">
                                <span>📅 ${f.fecha}</span> | <span>🕒 ${f.desde} a ${f.hasta} hs</span>
                            </div>
                            <div class="mt-2">
                                <span class="badge bg-light text-dark border fw-normal">👤 ${f.adultos || 0} Ad. / ${f.ninos || 0} Niñ.</span>
                                <span class="badge bg-light text-dark border fw-normal">🛡️ ${f.profe || 'Sin profe'}</span>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-danger rounded-pill px-3 shadow-sm" onclick="eliminarFiesta('${fJson}')" title="Eliminar Fiesta">
                                🗑️
                            </button>
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
            contenedor.innerHTML = `<div class="alert alert-danger">Error al cargar datos desde Google Script. Revisá tu conexión o la URL.</div>`;
        });
}

// --- FUNCIÓN ELIMINAR ---
async function eliminarFiesta(json) {
    const fiesta = JSON.parse(json);
    const confirmacion = confirm(`⚠️ ¿Estás seguro de que querés ELIMINAR la fiesta de ${fiesta.nombre}?\n\nEsta acción no se puede deshacer.`);
    
    if (!confirmacion) return; 

    const datosEliminar = {
        accion: 'eliminar',
        idOriginal: fiesta.id 
    };

    try {
        await fetch(URL_GOOGLE_SCRIPT, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(datosEliminar)
        });

        alert('🗑️ ¡Fiesta eliminada correctamente!');
        cargarFiestasActivas(); 
    } catch (error) {
        alert('Hubo un problema al intentar eliminar el evento.');
    }
}

// --- FUNCIONES DE EDICIÓN ---
function abrirModalEdicion(json) {
    const fiesta = JSON.parse(json);
    fiestaSeleccionada = fiesta; 

    document.getElementById('editNombre').value = fiesta.nombre || '';
    document.getElementById('editDesde').value = fiesta.desde || '';
    document.getElementById('editHasta').value = fiesta.hasta || '';
    document.getElementById('editColegio').value = fiesta.colegio || '';
    document.getElementById('editEdad').value = fiesta.edad || '';
    document.getElementById('editTematica').value = fiesta.tematica || '';
    document.getElementById('editAdultos').value = fiesta.adultos || 0;
    document.getElementById('editNinos').value = fiesta.ninos || 0;
    document.getElementById('editProfe').value = fiesta.profe || '';
    document.getElementById('editAyudante').value = fiesta.ayudante || '';
    document.getElementById('editTelefono').value = fiesta.telefono || '';
    document.getElementById('editIndicaciones').value = fiesta.indicaciones || '';
    document.getElementById('editTotal').value = fiesta.total || '';

    if (fiesta.fecha && fiesta.fecha.includes('/')) {
        const partes = fiesta.fecha.split('/');
        document.getElementById('editFecha').value = `${partes[2]}-${partes[1]}-${partes[0]}`;
    } else {
        document.getElementById('editFecha').value = fiesta.fecha || '';
    }

    const modal = new bootstrap.Modal(document.getElementById('modalEdicion'));
    modal.show();
}

async function guardarEdicion() {
    if (!fiestaSeleccionada) return;

    const btn = document.querySelector('#modalEdicion .modal-footer .btn-primary');
    btn.disabled = true;
    btn.innerHTML = '⌛ Actualizando...';

    const nuevaFechaInput = document.getElementById('editFecha').value;
    let nuevaFechaFormateada = nuevaFechaInput;
    if (nuevaFechaInput.includes('-')) {
        const partes = nuevaFechaInput.split('-');
        nuevaFechaFormateada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    const datosModificados = {
        accion: 'editar',
        idOriginal: fiestaSeleccionada.id, 
        nombre: document.getElementById('editNombre').value,
        fecha: nuevaFechaFormateada,
        desde: document.getElementById('editDesde').value,
        hasta: document.getElementById('editHasta').value,
        colegio: document.getElementById('editColegio').value,
        edad: document.getElementById('editEdad').value,
        tematica: document.getElementById('editTematica').value,
        telefono: document.getElementById('editTelefono').value,
        adultos: document.getElementById('editAdultos').value,
        ninos: document.getElementById('editNinos').value,
        profe: document.getElementById('editProfe').value,
        ayudante: document.getElementById('editAyudante').value,
        indicaciones: document.getElementById('editIndicaciones').value,
        total: document.getElementById('editTotal').value
    };

    try {
        await fetch(URL_GOOGLE_SCRIPT, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(datosModificados)
        });

        alert('✅ ¡Cambios guardados con éxito!');
        
        const modalElement = document.getElementById('modalEdicion');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();

        cargarFiestasActivas();
    } catch (error) {
        console.error("Error al editar:", error);
        alert('Hubo un problema al intentar modificar el evento.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Guardar Cambios';
    }
}

// --- FUNCIÓN WHATSAPP ---
function mandarWhatsApp(tel, nombre, fecha, hora) {
    if (!tel) return; // Evita errores si tocan el botón y no hay teléfono guardado
    // Convertimos a texto por las dudas y limpiamos todo lo que no sea número
    const numero = tel.toString().replace(/\D/g, ''); 
    const msj = encodeURIComponent(`¡Hola! Te escribimos de Alboroto Multiespacio para confirmar los detalles del cumple de ${nombre} el día ${fecha} a las ${hora} hs.`);
    window.open(`https://wa.me/${numero}?text=${msj}`, '_blank');
}