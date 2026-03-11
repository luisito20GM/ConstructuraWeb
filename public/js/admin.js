// =============================================
// admin.js — Lógica del Panel de Administración
// =============================================

const token   = localStorage.getItem('cr_token');
const usuario = JSON.parse(localStorage.getItem('cr_usuario') || '{}');

// Verificar que sea admin al cargar
if (!token || usuario.rol !== 'admin') {
    alert('Acceso denegado. Inicia sesión como administrador.');
    window.location.href = '/login';
}

document.getElementById('admin-nombre').textContent = usuario.nombre || 'Admin';

// ─────────────────────────────────────────
// Peticiones con token
// ─────────────────────────────────────────
async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        }
    });
    if (res.status === 401 || res.status === 403) {
        alert('Sesión expirada. Inicia sesión de nuevo.');
        window.location.href = '/login';
    }
    return res.json();
}

// ─────────────────────────────────────────
// Navegación entre secciones
// ─────────────────────────────────────────
function mostrarSeccion(seccion) {
    ['dashboard','cotizaciones','productos','usuarios','pagos'].forEach(s => {
        document.getElementById(`seccion-${s}`).style.display = s === seccion ? 'block' : 'none';
    });

    // Actualizar sidebar activo
    document.querySelectorAll('.sidebar .nav-link').forEach(a => a.classList.remove('active'));

    const titulos = { dashboard: 'Dashboard', cotizaciones: 'Cotizaciones', productos: 'Productos', usuarios: 'Usuarios' };
    document.getElementById('page-title').textContent = titulos[seccion] || seccion;

    // Cargar datos según la sección
    if (seccion === 'dashboard')    cargarDashboard();
    if (seccion === 'cotizaciones') cargarCotizaciones();
    if (seccion === 'productos')    cargarProductos();
    if (seccion === 'usuarios')     cargarUsuarios();
    if (seccion === 'pagos')        cargarPagos();
}

// ─────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────
async function cargarDashboard() {
    const data = await apiFetch('/api/admin/dashboard');
    document.getElementById('d-total-cot').textContent = data.total_cotizaciones  || 0;
    document.getElementById('d-nuevas').textContent    = data.cotizaciones_nuevas || 0;
    document.getElementById('d-productos').textContent = data.total_productos      || 0;
    document.getElementById('d-usuarios').textContent  = data.total_usuarios       || 0;
    document.getElementById('d-ingresos').textContent  = `$${parseFloat(data.ingresos_estimados || 0).toFixed(2)}`;
}

// ─────────────────────────────────────────
// COTIZACIONES
// ─────────────────────────────────────────
async function cargarCotizaciones() {
    const data  = await apiFetch('/api/admin/cotizaciones');
    const tbody = document.getElementById('tabla-cotizaciones');

    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No hay cotizaciones aún.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(c => {
        const fecha   = new Date(c.creado_en).toLocaleDateString('es-MX');
        const badgeClass = c.estatus === 'nueva' ? 'badge-nueva' : c.estatus === 'vista' ? 'badge-vista' : 'badge-atendida';
        return `
            <tr>
                <td>${c.id}</td>
                <td class="fw-semibold">${c.nombre}</td>
                <td>${c.telefono}</td>
                <td>${c.servicio || '—'}</td>
                <td class="text-warning fw-bold">$${parseFloat(c.total || 0).toFixed(2)}</td>
                <td>${fecha}</td>
                <td><span class="badge ${badgeClass}">${c.estatus}</span></td>
                <td>
                    <select class="form-select form-select-sm" onchange="cambiarEstatusCot(${c.id}, this.value)" style="min-width:110px">
                        <option value="nueva"    ${c.estatus==='nueva'    ?'selected':''}>Nueva</option>
                        <option value="vista"    ${c.estatus==='vista'    ?'selected':''}>Vista</option>
                        <option value="atendida" ${c.estatus==='atendida' ?'selected':''}>Atendida</option>
                    </select>
                </td>
            </tr>`;
    }).join('');
}

async function cambiarEstatusCot(id, estatus) {
    await apiFetch(`/api/admin/cotizaciones/${id}`, {
        method: 'PUT',
        body:   JSON.stringify({ estatus })
    });
    cargarCotizaciones();
}

// ─────────────────────────────────────────
// PRODUCTOS
// ─────────────────────────────────────────
async function cargarProductos() {
    const data  = await apiFetch('/api/admin/productos');
    const tbody = document.getElementById('tabla-productos');

    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No hay productos.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(p => `
        <tr>
            <td>${p.id}</td>
            <td class="fw-semibold">${p.nombre}</td>
            <td><span class="badge ${p.tipo==='renta'?'bg-info text-dark':p.tipo==='venta'?'bg-success':'bg-warning text-dark'}">${p.tipo}</span></td>
            <td>${p.categoria || '—'}</td>
            <td class="fw-bold text-warning">$${parseFloat(p.precio).toFixed(2)}</td>
            <td><span class="badge ${p.disponible ? 'bg-success' : 'bg-secondary'}">${p.disponible ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editarProducto(${p.id})">✏️</button>
                <button class="btn btn-sm btn-outline-danger"        onclick="eliminarProducto(${p.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

let _productosCache = [];

async function abrirModalProducto(id = null) {
    document.getElementById('prod-id').value       = id || '';
    document.getElementById('prod-nombre').value   = '';
    document.getElementById('prod-desc').value     = '';
    document.getElementById('prod-precio').value   = '';
    document.getElementById('prod-tipo').value     = 'renta';
    document.getElementById('prod-categoria').value = '';
    document.getElementById('prod-img').value      = '';
    document.getElementById('modal-prod-titulo').textContent = id ? 'Editar producto' : 'Nuevo producto';

    if (id) {
        const data = await apiFetch('/api/admin/productos');
        const p    = data.find(x => x.id === id);
        if (p) {
            document.getElementById('prod-nombre').value    = p.nombre;
            document.getElementById('prod-desc').value      = p.descripcion || '';
            document.getElementById('prod-precio').value    = p.precio;
            document.getElementById('prod-tipo').value      = p.tipo;
            document.getElementById('prod-categoria').value = p.categoria || '';
            document.getElementById('prod-img').value       = p.img || '';
        }
    }

    new bootstrap.Modal(document.getElementById('modalProducto')).show();
}

function editarProducto(id) { abrirModalProducto(id); }

async function guardarProducto() {
    const id     = document.getElementById('prod-id').value;
    const body   = {
        nombre:      document.getElementById('prod-nombre').value.trim(),
        descripcion: document.getElementById('prod-desc').value.trim(),
        precio:      document.getElementById('prod-precio').value,
        tipo:        document.getElementById('prod-tipo').value,
        categoria:   document.getElementById('prod-categoria').value.trim(),
        img:         document.getElementById('prod-img').value.trim()
    };

    if (!body.nombre || !body.precio) return alert('Nombre y precio son obligatorios.');

    const url    = id ? `/api/admin/productos/${id}` : '/api/admin/productos';
    const method = id ? 'PUT' : 'POST';

    const data = await apiFetch(url, { method, body: JSON.stringify(body) });
    alert(data.mensaje);
    bootstrap.Modal.getInstance(document.getElementById('modalProducto'))?.hide();
    cargarProductos();
}

async function eliminarProducto(id) {
    if (!confirm('¿Desactivar este producto del catálogo?')) return;
    const data = await apiFetch(`/api/admin/productos/${id}`, { method: 'DELETE' });
    alert(data.mensaje);
    cargarProductos();
}

// ─────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────
async function cargarUsuarios() {
    const data  = await apiFetch('/api/admin/usuarios');
    const tbody = document.getElementById('tabla-usuarios');

    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No hay clientes registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(u => `
        <tr>
            <td>${u.id}</td>
            <td class="fw-semibold">${u.nombre}</td>
            <td>${u.email}</td>
            <td>${u.telefono || '—'}</td>
            <td>${new Date(u.creado_en).toLocaleDateString('es-MX')}</td>
        </tr>
    `).join('');
}

function cerrarSesion() {
    localStorage.removeItem('cr_token');
    localStorage.removeItem('cr_usuario');
    window.location.href = '/login';
}
// ─────────────────────────────────────────
// PAGOS
// ─────────────────────────────────────────
async function cargarPagos() {
    const data  = await apiFetch('/api/pagos');
    const tbody = document.getElementById('tabla-pagos');

    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No hay pagos registrados aún.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(p => {
        const fecha = new Date(p.creado_en).toLocaleDateString('es-MX');
        const badge = p.estatus === 'aprobado'  ? 'bg-success' :
                      p.estatus === 'pendiente' ? 'bg-warning text-dark' :
                      p.estatus === 'rechazado' ? 'bg-danger' : 'bg-secondary';
        const icono = p.metodo === 'tarjeta' ? '💳' :
                      p.metodo === 'oxxo'    ? '🏪' :
                      p.metodo === 'paypal'  ? '🅿️' :
                      p.metodo === 'spei'    ? '🏦' : '💰';
        return `
            <tr>
                <td>${p.id}</td>
                <td class="fw-semibold">${p.nombre_cliente}</td>
                <td>${icono} ${p.metodo}</td>
                <td class="text-warning fw-bold">$${parseFloat(p.total).toFixed(2)}</td>
                <td><span class="badge ${badge}">${p.estatus}</span></td>
                <td>${fecha}</td>
            </tr>`;
    }).join('');
}
// ─────────────────────────────────────────
// Cargar dashboard al inicio
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => cargarDashboard());
