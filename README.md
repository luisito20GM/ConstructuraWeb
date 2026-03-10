# 🏗️ ConstruRenta — Guía de instalación paso a paso

## ¿Qué incluye este proyecto?
- ✅ index.html — Página principal corregida
- ✅ login.html — Login y registro de clientes
- ✅ admin.html — Panel de administración
- ✅ server.js  — Servidor Node.js + Express
- ✅ Rutas API  — Productos, cotizaciones, auth, admin
- ✅ MySQL      — Base de datos completa
- ✅ PDF        — Generación automática de cotizaciones
- ✅ Correo     — Envío automático por Gmail

---

## 📁 Estructura de carpetas

```
construrenta/
├── server.js              ← Servidor principal
├── db.js                  ← Conexión a MySQL
├── .env.example           ← Plantilla de configuración
├── package.json           ← Dependencias
├── database.sql           ← Script de base de datos
├── middleware/
│   └── auth.js            ← Verificación de tokens
├── routes/
│   ├── auth.js            ← Login y registro
│   ├── productos.js       ← Catálogo público
│   ├── cotizacion.js      ← Cotizador + PDF + correo
│   └── admin.js           ← Panel de administrador
└── public/
    ├── index.html         ← Página principal
    ├── login.html         ← Login / Registro
    ├── admin.html         ← Panel admin
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── main.js        ← Lógica del front-end
    │   └── admin.js       ← Lógica del panel admin
    └── img/               ← 🖼️ AQUÍ van tus imágenes
```

---

## 🚀 INSTALACIÓN PASO A PASO

### PASO 1 — Instalar dependencias
Abre la terminal dentro de la carpeta `construrenta` y ejecuta:
```bash
npm install
```

### PASO 2 — Configurar el archivo .env
Copia el archivo de ejemplo:
```bash
cp .env.example .env
```
Abre `.env` y llena tus datos reales:
- DB_PASSWORD → tu contraseña de MySQL
- EMAIL_USER  → tu correo Gmail
- EMAIL_PASS  → contraseña de aplicación de Gmail*
- EMAIL_DESTINO → correo donde recibirás las cotizaciones

*Para obtener la contraseña de aplicación de Gmail:
1. Ve a myaccount.google.com
2. Seguridad → Verificación en 2 pasos (actívala)
3. Contraseñas de aplicación → Genera una para "Correo"

### PASO 3 — Crear la base de datos
1. Abre MySQL Workbench o phpMyAdmin
2. Abre el archivo `database.sql`
3. Ejecuta todo el script
4. Se creará la base de datos con productos de ejemplo

### PASO 4 — Arrancar el servidor
```bash
npm start
```
O para desarrollo (se reinicia automáticamente al guardar):
```bash
npm run dev
```

### PASO 5 — Abrir en el navegador
```
http://localhost:3000
```

---

## 🖼️ AGREGAR TUS IMÁGENES

Coloca tus fotos en la carpeta: `public/img/`

Los nombres deben coincidir con los que pusiste en la base de datos.
Ejemplo: si en MySQL el producto tiene `img = 'revolvedora.jpg'`,
el archivo debe estar en `public/img/revolvedora.jpg`.

Para las tarjetas de servicios, reemplaza en `index.html`:
```html
<!-- Mantenimiento Escolar -->
<img src="img/servicio-escolar.jpg" ...>

<!-- Remodelación -->
<img src="img/servicio-remodelacion.jpg" ...>

<!-- Renta Maquinaria -->
<img src="img/servicio-maquinaria.jpg" ...>
```

---

## 🔐 ACCESO AL PANEL DE ADMINISTRACIÓN

URL: `http://localhost:3000/admin`

Credenciales por defecto:
- Correo: admin@construrenta.com
- Password: password

⚠️ **Cambia la contraseña después de entrar** actualizando el hash en MySQL.

---

## 📋 ENDPOINTS DE LA API

| Método | URL                          | Descripción                  |
|--------|------------------------------|------------------------------|
| GET    | /api/productos               | Obtener catálogo             |
| GET    | /api/productos?categoria=X   | Filtrar por categoría        |
| POST   | /api/auth/login              | Iniciar sesión               |
| POST   | /api/auth/registro           | Registrar cliente            |
| POST   | /api/cotizacion              | Enviar cotización + PDF      |
| GET    | /api/admin/dashboard         | Estadísticas (admin)         |
| GET    | /api/admin/cotizaciones      | Ver cotizaciones (admin)     |
| POST   | /api/admin/productos         | Crear producto (admin)       |
| PUT    | /api/admin/productos/:id     | Editar producto (admin)      |
| DELETE | /api/admin/productos/:id     | Desactivar producto (admin)  |
| GET    | /api/admin/usuarios          | Ver clientes (admin)         |

---

## ❓ PROBLEMAS COMUNES

**Error: Cannot connect to MySQL**
→ Verifica que MySQL esté corriendo y que los datos en `.env` sean correctos.

**Error: Invalid login / correo no encontrado**
→ Asegúrate de haber ejecutado el `database.sql` completo.

**El correo no llega**
→ Verifica que usaste la "Contraseña de aplicación" de Gmail, no tu contraseña normal.

**Imágenes no se ven**
→ Confirma que los archivos estén en `public/img/` y que el nombre coincida exactamente.
