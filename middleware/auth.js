// =============================================
// middleware/auth.js — Verificar token JWT
// =============================================
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware para rutas que requieren login
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Inicia sesión.' });
    }

    try {
        const usuario = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = usuario; // Guarda los datos del usuario para usarlos en la ruta
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido o expirado. Vuelve a iniciar sesión.' });
    }
}

// Middleware para rutas exclusivas de administradores
function soloAdmin(req, res, next) {
    verificarToken(req, res, () => {
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos de administrador.' });
        }
        next();
    });
}

module.exports = { verificarToken, soloAdmin };
