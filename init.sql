-- Script de inicialización de la base de datos para SistemaCompras

CREATE TABLE IF NOT EXISTS clientes (
    id_clientes SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS productos (
    id_productos SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS compras (
    id_compras SERIAL PRIMARY KEY,
    id_clientes INT NOT NULL REFERENCES clientes(id_clientes) ON DELETE RESTRICT,
    id_productos INT NOT NULL REFERENCES productos(id_productos) ON DELETE RESTRICT,
    cantidad INT,
    total NUMERIC(10, 2) NOT NULL,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agrega la columna a bases existentes que fueron creadas antes de guardar cantidad.
ALTER TABLE compras ADD COLUMN IF NOT EXISTS cantidad INT;

-- Datos iniciales de prueba
INSERT INTO clientes (nombre, email) VALUES
('Laura Gómez', 'laura.gomez@example.com'),
('Andrés Ruiz', 'andres.ruiz@example.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO productos (nombre, precio, stock) VALUES
('Teclado mecánico', 180000.00, 15),
('Mouse inalámbrico', 65000.00, 30)
ON CONFLICT DO NOTHING;
