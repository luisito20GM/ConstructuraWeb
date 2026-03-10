// =============================================
// routes/productos.js — Catálogo de productos
// =============================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ─────────────────────────────────────────
// GET /api/productos
// Devuelve todos los productos disponibles
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { categoria } = req.query; // Filtro opcional por categoría

        let query  = 'SELECT * FROM productos WHERE disponible = 1';
        let params = [];

        if (categoria) {
            query  += ' AND categoria = ?';
            params.push(categoria);
        }

        query += ' ORDER BY creado_en DESC';

        const [productos] = await db.query(query, params);
        res.json(productos);

    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).json({ error: 'Error al cargar el catálogo.' });
    }
});

// ─────────────────────────────────────────
// GET /api/productos/:id
// Devuelve un producto por su ID
// ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM productos WHERE id = ? AND disponible = 1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error del servidor.' });
    }
});

module.exports = router;
