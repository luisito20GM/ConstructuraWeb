// =============================================
// server.js — Servidor principal Node.js + Express
// =============================================
const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

// ─────────────────────────────────────────
// Middlewares globales
// ─────────────────────────────────────────
app.use(cors());                          // Permitir peticiones del navegador
app.use(express.json());                  // Parsear JSON en el body
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────
// Rutas de la API
// ─────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/productos',  require('./routes/productos'));
app.use('/api/cotizacion', require('./routes/cotizacion'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/pagos',      require('./routes/pagos'));
// ─────────────────────────────────────────
// Rutas de páginas HTML
// ─────────────────────────────────────────
app.get('/',        (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/login',   (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/admin',   (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Ruta de prueba para verificar que el servidor está corriendo
app.get('/api/ping', (req, res) => res.json({ status: 'ok', mensaje: '🟢 Servidor ConstruRenta funcionando.' }));

// ─────────────────────────────────────────
// Arrancar servidor
// ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ================================');
    console.log(`   ConstruRenta corriendo en:`);
    console.log(`   http://localhost:${PORT}`);
    console.log('🚀 ================================');
    console.log('');
});
