// =============================================
// routes/pagos.js — Pagos con MercadoPago
// =============================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
require('dotenv').config();

// ─────────────────────────────────────────
// Configurar MercadoPago con tu Access Token
// ─────────────────────────────────────────
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

// ─────────────────────────────────────────
// POST /api/pagos/crear-preferencia
// El front-end llama a esta ruta cuando el
// cliente toca "Pagar con tarjeta/OXXO/PayPal"
// MercadoPago responde con un ID único
// que el navegador usa para abrir el checkout
// ─────────────────────────────────────────
router.post('/crear-preferencia', async (req, res) => {
    const { nombre, email, items, cotizacion_id } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'No hay productos en el carrito.' });
    }

    try {
        // Construir la lista de productos para MercadoPago
        // MercadoPago necesita saber qué se está cobrando
        const itemsMP = items.map(item => ({
            id:          String(item.id),
            title:       item.nombre || item.name,
            quantity:    item.qty    || 1,
            unit_price:  parseFloat(item.precio || item.price || 0),
            currency_id: 'MXN'       // Pesos mexicanos
        }));

        // Crear la preferencia de pago en MercadoPago
        const preference = new Preference(client);
        const respuesta  = await preference.create({
            body: {
                items: itemsMP,
                payer: {
                    name:  nombre || 'Cliente',
                    email: email  || 'cliente@construrenta.com'
                },
                // URLs a donde redirige MercadoPago después del pago
                back_urls: {
                    success: `${process.env.URL_SITIO || 'http://localhost:3000'}/pago-exitoso`,
                    failure: `${process.env.URL_SITIO || 'http://localhost:3000'}/pago-fallido`,
                    pending: `${process.env.URL_SITIO || 'http://localhost:3000'}/pago-pendiente`
                },
                auto_return:          'approved',
                statement_descriptor: process.env.NOMBRE_EMPRESA || 'ConstruRenta',
                external_reference:   String(cotizacion_id || 0)
            }
        });

        // Guardar la preferencia en la base de datos como pago pendiente
        await db.query(
            `INSERT INTO pagos 
             (cotizacion_id, nombre_cliente, email_cliente, metodo, total, estatus, mp_preference_id)
             VALUES (?, ?, ?, 'tarjeta', ?, 'pendiente', ?)`,
            [
                cotizacion_id || null,
                nombre        || 'Cliente',
                email         || null,
                itemsMP.reduce((s, i) => s + i.unit_price * i.quantity, 0),
                respuesta.id
            ]
        );

        // Devolver el ID al front-end para abrir el checkout
        res.json({
            preference_id: respuesta.id,
            init_point:    respuesta.init_point  // URL del checkout de MercadoPago
        });

    } catch (err) {
        console.error('Error al crear preferencia:', err);
        res.status(500).json({ error: 'Error al conectar con MercadoPago.' });
    }
});

// ─────────────────────────────────────────
// POST /api/pagos/webhook
// MercadoPago llama a esta ruta automáticamente
// cuando un pago se completa, falla o queda pendiente
// Es como un mensajero que avisa "ya pagaron"
// ─────────────────────────────────────────
router.post('/webhook', async (req, res) => {
    const { type, data } = req.body;

    // Solo nos interesan las notificaciones de pagos
    if (type !== 'payment') return res.sendStatus(200);

    try {
        // Obtener los detalles completos del pago desde MercadoPago
        const payment   = new Payment(client);
        const pagoInfo  = await payment.get({ id: data.id });

        const estatus   = pagoInfo.status === 'approved' ? 'aprobado'  :
                          pagoInfo.status === 'rejected' ? 'rechazado' : 'pendiente';

        const metodo    = pagoInfo.payment_type_id === 'credit_card'  ? 'tarjeta' :
                          pagoInfo.payment_type_id === 'debit_card'   ? 'tarjeta' :
                          pagoInfo.payment_type_id === 'ticket'       ? 'oxxo'    :
                          pagoInfo.payment_type_id === 'bank_transfer'? 'spei'    : 'tarjeta';

        // Actualizar el estatus del pago en la base de datos
        await db.query(
            `UPDATE pagos 
             SET estatus = ?, metodo = ?, mp_payment_id = ?
             WHERE mp_preference_id = ?`,
            [estatus, metodo, String(data.id), pagoInfo.external_reference]
        );

        // Si el pago fue aprobado, actualizar la cotización también
        if (estatus === 'aprobado' && pagoInfo.external_reference) {
            await db.query(
                "UPDATE cotizaciones SET estatus = 'atendida' WHERE id = ?",
                [pagoInfo.external_reference]
            );
        }

        res.sendStatus(200);

    } catch (err) {
        console.error('Error en webhook:', err);
        res.sendStatus(500);
    }
});

// ─────────────────────────────────────────
// POST /api/pagos/spei
// Cuando el cliente elige pagar por transferencia
// se registra como pago pendiente hasta que
// el admin lo apruebe manualmente desde el panel
// ─────────────────────────────────────────
router.post('/spei', async (req, res) => {
    const { nombre, email, total, cotizacion_id } = req.body;

    if (!nombre || !total) {
        return res.status(400).json({ error: 'Faltan datos del pago.' });
    }

    try {
        // Registrar el pago SPEI como pendiente
        await db.query(
            `INSERT INTO pagos 
             (cotizacion_id, nombre_cliente, email_cliente, metodo, total, estatus)
             VALUES (?, ?, ?, 'spei', ?, 'pendiente')`,
            [cotizacion_id || null, nombre, email || null, total]
        );

        // Devolver los datos bancarios para la transferencia
        // Solo se mandan aquí, nunca están visibles en el front-end
        res.json({
            mensaje: '✅ Pago SPEI registrado. Realiza la transferencia con estos datos:',
            banco:   process.env.SPEI_BANCO,
            titular: process.env.SPEI_TITULAR,
            clabe:   process.env.SPEI_CLABE
        });

    } catch (err) {
        console.error('Error al registrar SPEI:', err);
        res.status(500).json({ error: 'Error al registrar el pago.' });
    }
});

// ─────────────────────────────────────────
// GET /api/pagos
// Lista todos los pagos — solo para el admin
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM pagos ORDER BY creado_en DESC'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener pagos.' });
    }
});

// ─────────────────────────────────────────
// PUT /api/pagos/:id/aprobar
// El admin aprueba manualmente un pago SPEI
// desde el panel de administración
// ─────────────────────────────────────────
router.put('/:id/aprobar', async (req, res) => {
    try {
        await db.query(
            "UPDATE pagos SET estatus = 'aprobado' WHERE id = ?",
            [req.params.id]
        );
        res.json({ mensaje: '✅ Pago aprobado correctamente.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al aprobar el pago.' });
    }
});

module.exports = router;