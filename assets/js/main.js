const URL_GOOGLE_SCRIPT = "https://script.google.com/macros/s/AKfycbyMTA5XDrAjHJ2pAq9FetNhp5chzTKGea_ptRLquBmJBEg_-YWHXusDPN5WUpUktWnp/exec";

document.addEventListener('DOMContentLoaded', () => {
    // 1. LÓGICA PARA CARGAR FIESTAS (index.html)
    const formFiesta = document.getElementById('formFiesta');
    if (formFiesta) {
        formFiesta.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = formFiesta.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '⌛ Guardando en Alboroto...';

            const formData = new FormData(formFiesta);
            const datos = Object.fromEntries(formData.entries());

            try {
                // Usamos text/plain para evitar problemas de CORS en el envío POST
                await fetch(URL_GOOGLE_SCRIPT, {
                    method: 'POST',
                    mode: 'no-cors', 
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(datos)
                });

                // Como no-cors no permite leer respuesta, asumimos éxito si no hay catch
                alert('✅ ¡Fiesta registrada con éxito! Ya podés verla en Gestión.');
                formFiesta.reset();
            } catch (error) {
                console.error("Error al guardar:", error);
                alert('Hubo un problema al guardar la fiesta.');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }

    // 2. LÓGICA PARA MOSTRAR GESTIÓN (gestion.html)
    if (document.querySelector('.list-group')) {
        cargarFiestasActivas();
    }
});

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
            contenedor.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
        });
}

// --- UTILIDADES ---
function mandarWhatsApp(tel, nombre, fecha, hora) {
    const numero = tel.replace(/\D/g, ''); 
    const msj = encodeURIComponent(`¡Hola! Te escribimos de Alboroto Multiespacio para confirmar los detalles del cumple de ${nombre} el día ${fecha} a las ${hora} hs.`);
    window.open(`https://wa.me/${numero}?text=${msj}`, '_blank');
}

function abrirModalEdicion(json) {
    const fiesta = JSON.parse(json);
    console.log("Datos para editar:", fiesta);
    alert("Función de edición lista para conectar con tu modal de Bootstrap.");
}