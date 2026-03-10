-- =============================================
-- SCRIPT DE BASE DE DATOS - CONSTRURENTA
-- Ejecuta este archivo en MySQL Workbench o phpMyAdmin
-- =============================================

CREATE DATABASE IF NOT EXISTS construrenta_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE construrenta_db;

-- ─────────────────────────────────────────
-- TABLA: Usuarios (clientes y administradores)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    telefono    VARCHAR(20),
    password    VARCHAR(255) NOT NULL,           -- Guardada encriptada con bcrypt
    rol         ENUM('cliente','admin') DEFAULT 'cliente',
    activo      TINYINT(1) DEFAULT 1,
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- TABLA: Productos del catálogo
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio      DECIMAL(10,2) NOT NULL,
    tipo        ENUM('renta','venta','ambos') DEFAULT 'renta',
    categoria   VARCHAR(80),
    img         VARCHAR(255),                    -- Nombre del archivo de imagen
    disponible  TINYINT(1) DEFAULT 1,
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- TABLA: Cotizaciones recibidas
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cotizaciones (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    telefono    VARCHAR(20) NOT NULL,
    servicio    VARCHAR(100),
    mensaje     TEXT,
    items_carrito JSON,                          -- Guarda los productos del carrito
    total       DECIMAL(10,2) DEFAULT 0,
    estatus     ENUM('nueva','vista','atendida') DEFAULT 'nueva',
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- DATOS INICIALES: Admin por defecto
-- Password: Admin123! (cámbiala después de entrar)
-- ─────────────────────────────────────────
INSERT INTO usuarios (nombre, email, password, rol) VALUES
('Administrador', 'admin@construrenta.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'admin');

-- ─────────────────────────────────────────
-- DATOS DE EJEMPLO: Productos del catálogo
-- ─────────────────────────────────────────
INSERT INTO productos (nombre, descripcion, precio, tipo, categoria, img) VALUES
-- ── Productos originales de tu products.json ──
('Taladro Industrial',       'Taladro potente para trabajo pesado.',                                1150.00, 'renta',  'Herramienta',  'taladro-industrial.jpg'),
('Andamios',                 'Andamios resistentes y fáciles de montar.',                           200.00, 'renta',  'Andamios',     'andamios.jpg'),
('Lijadora de Banda',        'Lijadora profesional para acabados finos.',                          1200.00, 'venta',  'Herramienta',  'lijadora.jpg'),
-- ── Productos adicionales ──
('Revolvedora de Concreto',  'Revolvedora eléctrica de 1/2 saco, ideal para obra pequeña.',         500.00, 'renta',  'Maquinaria',   'revolvedora.jpg'),
('Andamio Metálico',         'Andamio tubular de 2m de altura, con base y pasador de seguridad.',   300.00, 'renta',  'Andamios',     'andamio.jpg'),
('Taladro Percutor',         'Taladro percutor 750W con brocas incluidas.',                         200.00, 'renta',  'Herramienta',  'taladro.jpg'),
('Compresor de Aire',        'Compresor 50 litros, 2HP, incluye manguera y pistola.',               400.00, 'renta',  'Maquinaria',   'compresor.jpg'),
('Nivel Láser',              'Nivel láser autonivelante con trípode, 30m de alcance.',              250.00, 'renta',  'Herramienta',  'nivel.jpg'),
('Cemento Gris (bulto)',     'Cemento Portland tipo I, bolsa de 50kg.',                             180.00, 'venta',  'Materiales',   'cemento.jpg'),
('Varilla #4 (pieza)',       'Varilla corrugada #4 de 6 metros, alta resistencia.',                  85.00, 'venta',  'Materiales',   'varilla.jpg'),
('Compactadora de Suelo',    'Compactadora tipo Canguro, motor a gasolina, 65kg de golpe.',          600.00, 'renta',  'Maquinaria',   'compactadora.jpg');
