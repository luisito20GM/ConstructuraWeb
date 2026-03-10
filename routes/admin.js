// =============================================
// routes/admin.js — Panel de Administración
// Solo accesible con token de administrador
// =============================================
const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const { soloAdmin } = require('../middleware/auth');

// ─────────────────────────────────────────
// GET /api/admin/dashboard
// Resumen general del negocio
// ─────────────────────────────────────────
router.get('/dashboard', soloAdmin, async (req, res) => {
    try {
        const [[{ total_cotizaciones }]] = await db.query('SELECT COUNT(*) AS total_cotizaciones FROM cotizaciones');
        const [[{ cotizaciones_nuevas }]] = await db.query("SELECT COUNT(*) AS cotizaciones_nuevas FROM cotizaciones WHERE estatus = 'nueva'");
        const [[{ total_productos }]]    = await db.query('SELECT COUNT(*) AS total_productos FROM productos WHERE disponible = 1');
        const [[{ total_usuarios }]]     = await db.query("SELECT COUNT(*) AS total_usuarios FROM usuarios WHERE rol = 'cliente'");
        const [[{ ingresos_estimados }]] = await db.query('SELECT IFNULL(SUM(total),0) AS ingresos_estimados FROM cotizaciones');

        res.json({ total_cotizaciones, cotizaciones_nuevas, total_productos, total_usuarios, ingresos_estimados });
    } catch (err) {
        res.status(500).json({ error: 'Error al cargar el dashboard.' });
    }
});

// ─────────────────────────────────────────
// PRODUCTOS — CRUD completo
// ─────────────────────────────────────────

// GET /api/admin/productos — Listar todos
router.get('/productos', soloAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM productos ORDER BY creado_en DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener productos.' });
    }
});

// POST /api/admin/productos — Crear nuevo producto
router.post('/productos', soloAdmin, async (req, res) => {
    const { nombre, descripcion, precio, tipo, categoria, img } = req.body;
    if (!nombre || !precio) return res.status(400).json({ error: 'Nombre y precio son obligatorios.' });
    try {
        const [result] = await db.query(
            'INSERT INTO productos (nombre, descripcion, precio, tipo, categoria, img) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, descripcion || null, precio, tipo || 'renta', categoria || null, img || null]
        );
        res.status(201).json({ mensaje: 'Producto creado.', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear producto.' });
    }
});

// PUT /api/admin/productos/:id — Actualizar producto
router.put('/productos/:id', soloAdmin, async (req, res) => {
    const { nombre, descripcion, precio, tipo, categoria, img, disponible } = req.body;
    try {
        await db.query(
            'UPDATE productos SET nombre=?, descripcion=?, precio=?, tipo=?, categoria=?, img=?, disponible=? WHERE id=?',
            [nombre, descripcion, precio, tipo, categoria, img, disponible ?? 1, req.params.id]
        );
        res.json({ mensaje: 'Producto actualizado.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar producto.' });
    }
});

// DELETE /api/admin/productos/:id — Desactivar producto (soft delete)
router.delete('/productos/:id', soloAdmin, async (req, res) => {
    try {
        await db.query('UPDATE productos SET disponible = 0 WHERE id = ?', [req.params.id]);
        res.json({ mensaje: 'Producto desactivado.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar producto.' });
    }
});

// ─────────────────────────────────────────
// COTIZACIONES
// ─────────────────────────────────────────

// GET /api/admin/cotizaciones — Listar todas
router.get('/cotizaciones', soloAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cotizaciones ORDER BY creado_en DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener cotizaciones.' });
    }
});

// PUT /api/admin/cotizaciones/:id — Cambiar estatus
router.put('/cotizaciones/:id', soloAdmin, async (req, res) => {
    const { estatus } = req.body;
    const validos = ['nueva', 'vista', 'atendida'];
    if (!validos.includes(estatus)) return res.status(400).json({ error: 'Estatus inválido.' });
    try {
        await db.query('UPDATE cotizaciones SET estatus = ? WHERE id = ?', [estatus, req.params.id]);
        res.json({ mensaje: 'Estatus actualizado.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar cotización.' });
    }
});

// ─────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────

// GET /api/admin/usuarios — Listar clientes
router.get('/usuarios', soloAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, nombre, email, telefono, rol, activo, creado_en FROM usuarios WHERE rol = 'cliente' ORDER BY creado_en DESC"
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuarios.' });
    }
});

module.exports = router;
