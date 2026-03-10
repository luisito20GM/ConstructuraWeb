// =============================================
// routes/auth.js — Login y Registro
// =============================================
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../db');
require('dotenv').config();

// ─────────────────────────────────────────
// POST /api/auth/registro
// Registrar un nuevo cliente
// ─────────────────────────────────────────
router.post('/registro', async (req, res) => {
    const { nombre, email, telefono, password } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    try {
        // Verificar si el correo ya está registrado
        const [existe] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existe.length > 0) {
            return res.status(409).json({ error: 'Ese correo ya está registrado. Intenta iniciar sesión.' });
        }

        // Encriptar la contraseña antes de guardarla
        const hash = await bcrypt.hash(password, 10);

        // Insertar usuario en la base de datos
        await db.query(
            'INSERT INTO usuarios (nombre, email, telefono, password, rol) VALUES (?, ?, ?, ?, ?)',
            [nombre, email, telefono || null, hash, 'cliente']
        );

        res.status(201).json({ mensaje: '✅ Registro exitoso. Ya puedes iniciar sesión.' });

    } catch (err) {
        console.error('Error en registro:', err);
        res.status(500).json({ error: 'Error del servidor. Intenta más tarde.' });
    }
});

// ─────────────────────────────────────────
// POST /api/auth/login
// Iniciar sesión (cliente o admin)
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }

    try {
        // Buscar usuario en la base de datos
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        }

        const usuario = rows[0];

        // Verificar contraseña
        const passwordCorrecta = await bcrypt.compare(password, usuario.password);
        if (!passwordCorrecta) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        }

        // Generar token JWT (válido por 7 días)
        const token = jwt.sign(
            { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            mensaje: `¡Bienvenido, ${usuario.nombre}!`,
            token,
            usuario: {
                id:     usuario.id,
                nombre: usuario.nombre,
                email:  usuario.email,
                rol:    usuario.rol
            }
        });

    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error del servidor. Intenta más tarde.' });
    }
});

module.exports = router;
