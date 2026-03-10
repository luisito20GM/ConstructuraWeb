// =============================================
// routes/cotizacion.js — Cotizaciones + PDF + Correo
// =============================================
const express    = require('express');
const router     = express.Router();
const db         = require('../db');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
require('dotenv').config();

// ─────────────────────────────────────────
// Configuración del transporte de correo (Gmail)
// ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS   // Contraseña de aplicación de Gmail
    }
});

// ─────────────────────────────────────────
// Función: Generar PDF de cotización en memoria
// ─────────────────────────────────────────
function generarPDF(datos) {
    return new Promise((resolve, reject) => {
        const doc    = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data',  chunk => chunks.push(chunk));
        doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
        doc.on('error', err   => reject(err));

        // ── Encabezado ──
        doc.fontSize(22).fillColor('#e8901a').text(process.env.NOMBRE_EMPRESA || 'ConstruRenta y Venta', { align: 'center' });
        doc.fontSize(12).fillColor('#555').text('Cotización de Servicios', { align: 'center' });
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ffc107').lineWidth(2).stroke();
        doc.moveDown();

        // ── Fecha ──
        const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.fontSize(10).fillColor('#333').text(`Fecha: ${fecha}`, { align: 'right' });
        doc.moveDown();

        // ── Datos del cliente ──
        doc.fontSize(14).fillColor('#333').text('Datos del Cliente');
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').lineWidth(1).stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#555');
        doc.text(`Nombre:    ${datos.nombre}`);
        doc.text(`Teléfono:  ${datos.telefono}`);
        doc.text(`Servicio:  ${datos.servicio || 'No especificado'}`);
        if (datos.mensaje) doc.text(`Detalles:  ${datos.mensaje}`);
        doc.moveDown();

        // ── Tabla de productos si hay carrito ──
        if (datos.items_carrito && datos.items_carrito.length > 0) {
            doc.fontSize(14).fillColor('#333').text('Productos Seleccionados');
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').lineWidth(1).stroke();
            doc.moveDown(0.5);

            // Cabecera tabla
            doc.fontSize(10).fillColor('#fff')
               .rect(50, doc.y, 495, 20).fill('#ffc107');
            const yHeader = doc.y - 15;
            doc.fillColor('#000')
               .text('Producto',    55,  yHeader)
               .text('Cant.',       320, yHeader)
               .text('Precio',      380, yHeader)
               .text('Subtotal',    460, yHeader);
            doc.moveDown(1.5);

            let total = 0;
            datos.items_carrito.forEach((item, i) => {
                const precio    = parseFloat(String(item.precio || item.price || 0).replace(/[^0-9.]/g, ''));
                const subtotal  = precio * (item.qty || 1);
                total          += subtotal;
                const bgColor   = i % 2 === 0 ? '#f9f9f9' : '#ffffff';
                const yRow      = doc.y;

                doc.rect(50, yRow - 3, 495, 18).fill(bgColor);
                doc.fillColor('#333').fontSize(9)
                   .text(item.nombre || item.name || '-', 55,  yRow, { width: 260 })
                   .text(String(item.qty || 1),           320, yRow)
                   .text(`$${precio.toFixed(2)}`,         380, yRow)
                   .text(`$${subtotal.toFixed(2)}`,       460, yRow);
                doc.moveDown(1.2);
            });

            // Total
            doc.moveDown(0.5);
            doc.fontSize(13).fillColor('#000')
               .text(`Total estimado: $${total.toFixed(2)}`, { align: 'right' });
        }

        doc.moveDown(2);

        // ── Pie de página ──
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ffc107').lineWidth(2).stroke();
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#888')
           .text(`${process.env.NOMBRE_EMPRESA || 'ConstruRenta'} | Tel: ${process.env.TELEFONO_EMPRESA || ''} | ${process.env.DIRECCION_EMPRESA || ''}`, { align: 'center' });
        doc.text('Esta cotización es un estimado, precios sujetos a cambio sin previo aviso.', { align: 'center' });

        doc.end();
    });
}

// ─────────────────────────────────────────
// POST /api/cotizacion
// Recibe el formulario, guarda en BD, genera PDF y envía correo
// ─────────────────────────────────────────
router.post('/', async (req, res) => {
    const { nombre, telefono, servicio, mensaje, items_carrito } = req.body;

    // Validación básica
    if (!nombre || !telefono) {
        return res.status(400).json({ error: 'Nombre y teléfono son obligatorios.' });
    }

    try {
        // 1. Calcular total del carrito
        let total = 0;
        if (Array.isArray(items_carrito)) {
            items_carrito.forEach(item => {
                const precio = parseFloat(String(item.precio || item.price || 0).replace(/[^0-9.]/g, ''));
                total += precio * (item.qty || 1);
            });
        }

        // 2. Guardar cotización en la base de datos
        await db.query(
            'INSERT INTO cotizaciones (nombre, telefono, servicio, mensaje, items_carrito, total) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, telefono, servicio || null, mensaje || null, JSON.stringify(items_carrito || []), total]
        );

        // 3. Generar el PDF
        const pdfBuffer = await generarPDF({ nombre, telefono, servicio, mensaje, items_carrito: items_carrito || [] });

        // 4. Enviar correo con el PDF adjunto
        await transporter.sendMail({
            from:    `"${process.env.NOMBRE_EMPRESA}" <${process.env.EMAIL_USER}>`,
            to:      process.env.EMAIL_DESTINO,
            subject: `📋 Nueva cotización de ${nombre}`,
            html: `
                <h2 style="color:#e8901a;">Nueva solicitud de cotización</h2>
                <p><strong>Nombre:</strong> ${nombre}</p>
                <p><strong>Teléfono:</strong> ${telefono}</p>
                <p><strong>Servicio:</strong> ${servicio || 'No especificado'}</p>
                <p><strong>Mensaje:</strong> ${mensaje || 'Sin detalles adicionales'}</p>
                <p><strong>Total estimado:</strong> $${total.toFixed(2)}</p>
                <hr/>
                <p style="color:#888;font-size:12px;">Se adjunta el PDF con el detalle completo.</p>
            `,
            attachments: [{
                filename:    `cotizacion_${nombre.replace(/\s/g,'_')}.pdf`,
                content:     pdfBuffer,
                contentType: 'application/pdf'
            }]
        });

        res.json({ mensaje: '✅ Cotización enviada correctamente. Te contactaremos pronto.' });

    } catch (err) {
        console.error('Error al procesar cotización:', err);
        res.status(500).json({ error: 'Error al enviar la cotización. Intenta más tarde.' });
    }
});

module.exports = router;
