// =============================================
// main.js — Lógica del front-end
// Conectado a Node.js (antes era Flask/Python)
// =============================================

let products = [];
let cart     = {};

// ─────────────────────────────────────────
// DATOS DE PRUEBA — Se usan cuando no hay
// servidor corriendo (ej. abrir en celular
// directo desde el archivo HTML).
// ✏️ Edítalos con tus productos reales.
// Cuando Railway/servidor esté activo estos
// datos se ignoran automáticamente.
// ─────────────────────────────────────────
const PRODUCTOS_PRUEBA = [
    // ── Productos originales de tu products.json ──
    {
        id: 1,
        nombre: 'Taladro Industrial',
        descripcion: 'Taladro potente para trabajo pesado.',
        precio: 150,
        unidad: 'día',
        tipo: 'renta',
        categoria: 'Herramienta',
        img: ''   // 🖼️ Pon aquí el nombre de tu imagen: 'taladro-industrial.jpg'
    },
    {
        id: 2,
        nombre: 'Andamios',
        descripcion: 'Andamios resistentes y fáciles de montar.',
        precio: 200,
        unidad: 'día',
        tipo: 'renta',
        categoria: 'Andamios',
        img: ''   // 🖼️ Pon aquí el nombre de tu imagen: 'andamios.jpg'
    },
    {
        id: 3,
        nombre: 'Lijadora de Banda',
        descripcion: 'Lijadora profesional para acabados finos.',
        precio: 1200,
        unidad: 'unidad',
        tipo: 'venta',
        categoria: 'Herramienta',
        img: ''   // 🖼️ Pon aquí el nombre de tu imagen: 'lijadora.jpg'
    },
    // ── Productos adicionales ──
    {
        id: 4,
        nombre: 'Revolvedora de Concreto',
        descripcion: 'Revolvedora eléctrica de 1/2 saco, ideal para obra pequeña.',
        precio: 500,
        unidad: 'día',
        tipo: 'renta',
        categoria: 'Maquinaria',
        img: ''   // 🖼️ Pon aquí el nombre de tu imagen: 'revolvedora.jpg'
    },
    {
        id: 5,
        nombre: 'Andamio Metálico',
        descripcion: 'Andamio tubular de 2m de altura, con base y pasador de seguridad.',
        precio: 300,
        unidad: 'día',
        tipo: 'renta',
        categoria: 'Andamios',
        img: ''   // 🖼️ Pon aquí el nombre de tu imagen: 'andamio.jpg'
    },
    {
        id: 6,
        nombre: 'Compresor de Aire',
        descripcion: 'Compresor 50 litros, 2HP, incluye manguera y pistola.',
        precio: 400,
        unidad: 'día',
        tipo: 'renta',
        categoria: 'Maquinaria',
        img: ''   // 🖼️ Pon aquí el nombre de tu imagen: 'compresor.jpg'
    },
    {
        id: 7,
        nombre: 'Nivel Láser',
        descripcion: 'Nivel láser autonivelante con trípode, 30m de alcance.',
        precio: 250,
        unidad: 'día',
        tipo: 'renta',
        categoria: 'Herramienta',
        img: ''   // 🖼️ Pon aquí el nombre de tu imagen: 'nivel.jpg'
    },
    {
        id: 8,
        nombre: 'Cemento Gris (bulto)',
        descripcion: 'Cemento Portland tipo I, bolsa de 50kg.',
        precio: 180,
        unidad: 'bulto',
        tipo: 'venta',
        categoria: 'Materiales',
        img: ''   // 🖼️ Pon aquí el nombre de tu imagen: 'cemento.jpg'
    },
    {
        id: 9,
        nombre: 'Varilla #4 (pieza)',
        descripcion: 'Varilla corrugada #4 de 6 metros, alta resistencia.',
        precio: 85,
        unidad: 'pieza',
        tipo: 'venta',
        categoria: 'Materiales',
        img: ''   // 🖼️ Pon aquí el nombre de tu imagen: 'varilla.jpg'
    },
    {
        id: 8,
        nombre: 'Compactadora de Suelo',
        descripcion: 'Compactadora tipo Canguro, motor a gasolina, 65kg de golpe.',
        precio: 600,
        tipo: 'ambos',
        categoria: 'Maquinaria',
        img: ''   // 🖼️ Pon aquí el nombre de tu imagen: 'compactadora.jpg'
    }
];

// ─────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────
function formatCurrency(v) {
    return `$${parseFloat(v).toFixed(2)}`;
}

function getToken() {
    return localStorage.getItem('cr_token');
}

function getUsuario() {
    const raw = localStorage.getItem('cr_usuario');
    return raw ? JSON.parse(raw) : null;
}

// ─────────────────────────────────────────
// CARRITO — Guardar y cargar en localStorage
// ─────────────────────────────────────────
function saveCart() {
    localStorage.setItem('construrenta_cart', JSON.stringify(cart));
    updateCartCount();
}

function loadCart() {
    const raw = localStorage.getItem('construrenta_cart');
    cart = raw ? JSON.parse(raw) : {};
}

function updateCartCount() {
    const count = Object.values(cart).reduce((s, it) => s + it.qty, 0);
    const el = document.getElementById('cart-count');
    if (el) el.textContent = count;
}

// ─────────────────────────────────────────
// CATÁLOGO — Renderizar productos
// ─────────────────────────────────────────
function renderProducts(list) {
    const grid    = document.getElementById('catalogo-grid');
    const loading = document.getElementById('catalogo-loading');
    if (loading) loading.remove();

    if (list.length === 0) {
        grid.innerHTML = '<p class="text-center text-muted py-4">No hay productos disponibles en esta categoría.</p>';
        return;
    }

    grid.innerHTML = '';
    list.forEach(p => {
        // 🖼️ Imagen del producto (viene de public/img/)
        const imgSrc = p.img ? `/img/${p.img}` : '/img/producto-default.jpg';

        const col = document.createElement('div');
        col.className = 'col-md-3 col-sm-6 mb-4';
        col.innerHTML = `
            <div class="card product-card h-100 shadow-sm">
                <!-- 🖼️ IMAGEN: se carga desde public/img/${p.img || 'producto-default.jpg'} -->
                <img src="${imgSrc}"
                     class="card-img-top"
                     alt="${p.nombre}"
                     style="height:200px; object-fit:contain; padding:1rem; background:#fff;"
                     onerror="this.src='/img/producto-default.jpg'">
                <div class="card-body d-flex flex-column">
                    <span class="badge ${p.tipo === 'renta' ? 'bg-info text-dark' : p.tipo === 'venta' ? 'bg-success' : 'bg-warning text-dark'} mb-2" style="width:fit-content">
                        ${p.tipo === 'renta' ? '🔑 Renta' : p.tipo === 'venta' ? '🏪 Venta' : '🔑🏪 Renta/Venta'}
                    </span>
                    <h5 class="card-title">${p.nombre}</h5>
                    <p class="text-muted small">${p.descripcion || ''}</p>
                    <p class="fw-bold text-warning fs-5 mt-auto">
                        ${formatCurrency(p.precio)}
                        ${p.unidad ? `<span class="text-muted fs-6 fw-normal">/ ${p.unidad}</span>` : ''}
                    </p>
                    <div class="d-grid gap-2 mt-2">
                        <button class="btn btn-outline-dark btn-sm" data-action="view" data-id="${p.id}">🔍 Ver detalle</button>
                        <button class="btn btn-warning btn-sm fw-bold"  data-action="add"  data-id="${p.id}">🛒 Añadir al carrito</button>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });

    // Asignar eventos a los botones
    grid.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id     = parseInt(btn.getAttribute('data-id'));
            const action = btn.getAttribute('data-action');
            if (action === 'view') viewProduct(id);
            if (action === 'add')  addToCart(id, 1);
        });
    });
}

// ─────────────────────────────────────────
// MODAL — Ver detalle de producto
// ─────────────────────────────────────────
function viewProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    const imgSrc = p.img ? `/img/${p.img}` : '/img/producto-default.jpg';

    document.getElementById('productModalLabel').textContent = p.nombre;
    document.getElementById('productModalImg').src           = imgSrc;
    document.getElementById('productModalDesc').textContent  = p.descripcion || 'Sin descripción.';
    document.getElementById('productModalPrice').textContent = formatCurrency(p.precio);
    document.getElementById('productModalTipo').textContent  =
        p.tipo === 'renta' ? '🔑 Solo renta' : p.tipo === 'venta' ? '🏪 Solo venta' : '🔑🏪 Renta y venta';

    const rentBtn   = document.getElementById('productModalRent');
    rentBtn.onclick = () => {
        addToCart(id, 1);
        bootstrap.Modal.getInstance(document.getElementById('productModal'))?.hide();
    };

    new bootstrap.Modal(document.getElementById('productModal')).show();
}

// ─────────────────────────────────────────
// CARRITO — Agregar, quitar, actualizar UI
// ─────────────────────────────────────────
function addToCart(id, qty = 1) {
    const p = products.find(x => x.id === id);
    if (!p) return alert('Producto no encontrado.');
    if (!cart[id]) cart[id] = { ...p, qty: 0 };
    cart[id].qty += qty;
    saveCart();
    updateCartUI();

    // Pequeño feedback visual
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 m-3 alert alert-warning py-2 px-3 shadow';
    toast.style.zIndex = 9999;
    toast.textContent = `✅ "${p.nombre}" añadido al carrito`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function removeFromCart(id) {
    delete cart[id];
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    container.innerHTML = '';
    const items = Object.values(cart);

    if (items.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-3">El carrito está vacío.</p>';
        document.getElementById('cart-total').textContent = '$0.00';
        updateCartCount();
        return;
    }

    let total = 0;
    items.forEach(it => {
        const precio   = parseFloat(String(it.precio || 0).replace(/[^0-9.]/g, ''));
        const subtotal = precio * it.qty;
        total         += subtotal;

        const imgSrc = it.img ? `/img/${it.img}` : '/img/producto-default.jpg';

        const row = document.createElement('div');
        row.className = 'd-flex align-items-center mb-3 pb-3 border-bottom';
        row.innerHTML = `
            <!-- 🖼️ Miniatura del producto en el carrito -->
            <img src="${imgSrc}" style="width:56px;height:56px;object-fit:contain;border-radius:6px;border:1px solid #eee;" class="me-2">
            <div class="flex-grow-1">
                <div class="fw-bold small">${it.nombre}</div>
                <div class="text-muted small">${it.qty} × ${formatCurrency(precio)}</div>
            </div>
            <div class="text-end">
                <div class="fw-semibold text-warning">${formatCurrency(subtotal)}</div>
                <button class="btn btn-sm btn-link text-danger p-0" data-remove="${it.id}">Eliminar</button>
            </div>
        `;
        container.appendChild(row);
    });

    document.getElementById('cart-total').textContent = formatCurrency(total);
    container.querySelectorAll('button[data-remove]').forEach(b =>
        b.addEventListener('click', () => removeFromCart(parseInt(b.getAttribute('data-remove'))))
    );
    updateCartCount();
}

// ─────────────────────────────────────────
// CHECKOUT — Finalizar pedido
// ─────────────────────────────────────────
function checkout() {
    if (Object.keys(cart).length === 0) return alert('El carrito está vacío.');
    mostrarMetodosPago();
    // Llenar automáticamente el formulario de cotización si está en la misma página
    const seccionForm = document.getElementById('contacto-form');
    if (seccionForm) {
        seccionForm.scrollIntoView({ behavior: 'smooth' });
        bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'))?.hide();
    } else {
        alert('Continúa llenando el formulario de cotización para finalizar.');
    }
}

// ─────────────────────────────────────────
// FORMULARIO DE COTIZACIÓN → Node.js API
// ─────────────────────────────────────────
function configurarFormulario() {
    const submitBtn = document.getElementById('submitQuote');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async () => {
        const nombre   = document.getElementById('nombre')?.value.trim();
        const telefono = document.getElementById('telefono')?.value.trim();
        const servicio = document.getElementById('servicio')?.value;
        const mensaje  = document.getElementById('mensaje')?.value.trim();
        const alertEl  = document.getElementById('form-alert');

        if (!nombre || !telefono) {
            alertEl.innerHTML = '<div class="alert alert-danger py-2">Nombre y teléfono son obligatorios.</div>';
            return;
        }

        submitBtn.disabled     = true;
        submitBtn.textContent  = '⏳ Enviando...';

        try {
            // ─── Envía a /api/cotizacion (Node.js) ───
            const res  = await fetch('/api/cotizacion', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    nombre,
                    telefono,
                    servicio,
                    mensaje,
                    items_carrito: Object.values(cart)
                })
            });

            // Sin servidor — fetch falla y va al catch
            const data = await res.json();

            if (!res.ok) {
                alertEl.innerHTML = `<div class="alert alert-danger py-2">${data.error}</div>`;
            } else {
                alertEl.innerHTML = `<div class="alert alert-success py-2">${data.mensaje}</div>`;
                ['nombre','telefono','mensaje'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
                document.getElementById('servicio').value = '';
                cart = {};
                saveCart();
                updateCartUI();
            }
        } catch (err) {
            // 📱 Sin servidor: muestra aviso en lugar de error técnico
            alertEl.innerHTML = `
                <div class="alert alert-warning py-2">
                    📋 <strong>Modo vista previa:</strong> El formulario funciona cuando el servidor
                    esté activo en Railway o localhost. Por ahora puedes contactarnos directamente
                    al <strong>{{TELEFONO}}</strong> o escribirnos a <strong>{{CORREO}}</strong>.
                </div>`;
        }

        submitBtn.disabled    = false;
        submitBtn.textContent = 'Enviar Solicitud 📩';
    });
}

// ─────────────────────────────────────────
// FILTROS DEL CATÁLOGO
// ─────────────────────────────────────────
function configurarFiltros() {
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.filtro-btn').forEach(b => {
                b.classList.remove('active', 'btn-warning');
                b.classList.add('btn-outline-secondary');
            });
            btn.classList.add('active', 'btn-warning');
            btn.classList.remove('btn-outline-secondary');

            const cat = btn.getAttribute('data-cat');
            const url = cat ? `/api/productos?categoria=${encodeURIComponent(cat)}` : '/api/productos';

            const r    = await fetch(url);
            const data = await r.json();
            products   = data;
            renderProducts(products);
        });
    });
}

// ─────────────────────────────────────────
// NAVBAR — Mostrar nombre o botón de login
// ─────────────────────────────────────────
function actualizarNavAuth() {
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;

    const usuario = getUsuario();
    if (usuario) {
        navAuth.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-outline-light btn-sm dropdown-toggle fw-bold" data-bs-toggle="dropdown">
                    👤 ${usuario.nombre.split(' ')[0]}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    ${usuario.rol === 'admin' ? '<li><a class="dropdown-item" href="/admin">⚙️ Panel Admin</a></li>' : ''}
                    <li><a class="dropdown-item text-danger" href="#" onclick="cerrarSesion()">🚪 Cerrar sesión</a></li>
                </ul>
            </div>`;
    }
}

function cerrarSesion() {

    // ─────────────────────────────────────────
// MÉTODOS DE PAGO
// ─────────────────────────────────────────
function pagarCon(metodo) {
    // Ocultar todos los paneles primero
    ['datos-spei','datos-spei-form','aviso-mp','aviso-mp-form'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    if (metodo === 'spei') {
        // SPEI — muestra datos bancarios solo al seleccionar
        const spei1 = document.getElementById('datos-spei');
        const spei2 = document.getElementById('datos-spei-form');
        if (spei1) spei1.style.display = 'block';
        if (spei2) spei2.style.display = 'block';

    } else {
        // Tarjeta, OXXO, PayPal — muestra aviso de MercadoPago
        // Cuando el servidor esté activo aquí se abre el checkout real
        const mp1 = document.getElementById('aviso-mp');
        const mp2 = document.getElementById('aviso-mp-form');
        if (mp1) mp1.style.display = 'block';
        if (mp2) mp2.style.display = 'block';

        // TODO: cuando tengas las claves de MercadoPago
        // descomenta estas líneas:
        // const mp = new MercadoPago('TU_PUBLIC_KEY_TEST');
        // mp.checkout({ preference: { id: 'ID_GENERADO_POR_EL_SERVIDOR' } });
    }
}

// Mostrar métodos de pago al finalizar pedido
function mostrarMetodosPago() {
    const mp = document.getElementById('metodos-pago');
    const mpForm = document.getElementById('metodos-pago-form');
    if (mp) mp.style.display = 'block';
    if (mpForm) mpForm.style.display = 'block';
}



    localStorage.removeItem('cr_token');
    localStorage.removeItem('cr_usuario');
    window.location.href = '/';
}

// ─────────────────────────────────────────
// INICIALIZACIÓN
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    updateCartUI();
    configurarFormulario(alertEl.innerHTML = `<div class="alert alert-success py-2">${data.mensaje}</div>`);
    mostrarMetodosPago();
    configurarFiltros();
    actualizarNavAuth();
    mostrarMetodosPago();
    
    // ─────────────────────────────────────────
    // Cargar productos desde la API de Node.js.
    // Si no hay servidor (archivo abierto directo
    // en celular o PC), usa PRODUCTOS_PRUEBA
    // automáticamente como fallback.
    // ─────────────────────────────────────────
    fetch('/api/productos')
        .then(r => {
            if (!r.ok) throw new Error('Sin servidor');
            return r.json();
        })
        .then(data => {
            // ✅ Servidor activo: usa datos reales de MySQL
            products = data;
            renderProducts(products);
        })
        .catch(() => {
            // 📱 Sin servidor: usa datos de prueba del archivo
            console.info('ℹ️ Servidor no disponible — mostrando datos de prueba.');
            products = PRODUCTOS_PRUEBA;
            renderProducts(products);

            // Aviso sutil en el catálogo (no intrusivo)
            const grid = document.getElementById('catalogo-grid');
            if (grid) {
                const aviso = document.createElement('div');
                aviso.className = 'col-12 mb-3';
                aviso.innerHTML = `
                    <div class="alert alert-warning py-2 small text-center mb-0">
                        📋 Mostrando productos de demostración.
                        El formulario de cotización y login requieren el servidor activo.
                    </div>`;
                grid.prepend(aviso);
            }
        });

    // Botones del carrito
    document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
    document.getElementById('clearCartBtn')?.addEventListener('click', () => {
        cart = {};
        saveCart();
        updateCartUI();
    });
});
