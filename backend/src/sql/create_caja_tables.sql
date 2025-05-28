-- Crear tabla t_vendedores si no existe
CREATE TABLE IF NOT EXISTS t_vendedores (
    Codigo VARCHAR(20) PRIMARY KEY,
    Descripcion VARCHAR(50),
    Clave VARCHAR(50),
    Activo TINYINT(1) DEFAULT 1,
    Permisos VARCHAR(8)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Crear tabla t_tiposdepago si no existe
CREATE TABLE IF NOT EXISTS t_tiposdepago (
    Codigo VARCHAR(3) PRIMARY KEY,
    Descripcion VARCHAR(50),
    Activo BOOLEAN DEFAULT TRUE,
    aplicaSaldo BOOLEAN DEFAULT FALSE,
    recargoPorcentaje DECIMAL(10,2) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insertar algunos tipos de pago básicos si no existen
INSERT IGNORE INTO t_tiposdepago (Codigo, Descripcion, Activo) VALUES
('EFE', 'Efectivo', 1),
('TAR', 'Tarjeta', 1),
('TRA', 'Transferencia', 1);

-- Insertar un vendedor admin si no existe
INSERT IGNORE INTO t_vendedores (Codigo, Descripcion, Clave, Activo, Permisos) VALUES
('001', 'Administrador', '123456', 1, 'ADMIN');

-- Crear tabla caja_cabeza
CREATE TABLE IF NOT EXISTS caja_cabeza (
    Codigo INT AUTO_INCREMENT PRIMARY KEY,
    Descripcion VARCHAR(100),
    VendedorId VARCHAR(20),
    SaldoInicial DECIMAL(15,2) DEFAULT 0,
    SaldoCierre DECIMAL(15,2) DEFAULT 0,
    SaldoTeorico DECIMAL(15,2) DEFAULT 0,
    Apertura DATETIME,
    Cierre DATETIME,
    Estado ENUM('abierta', 'cerrada', 'anulada') DEFAULT 'cerrada',
    Observaciones TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (VendedorId) REFERENCES t_vendedores(Codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Crear tabla caja_movimientos
CREATE TABLE IF NOT EXISTS caja_movimientos (
    Codigo INT AUTO_INCREMENT PRIMARY KEY,
    CajaCabezaId INT NOT NULL,
    Fecha DATETIME NOT NULL,
    TipoMovimiento ENUM('ingreso', 'egreso') NOT NULL,
    MetodoPago VARCHAR(3),
    Importe DECIMAL(15,2) NOT NULL DEFAULT 0,
    Referencia VARCHAR(100),
    DocumentoTipo VARCHAR(3),
    DocumentoNumero VARCHAR(20),
    UsuarioId VARCHAR(20),
    Observaciones TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CajaCabezaId) REFERENCES caja_cabeza(Codigo),
    FOREIGN KEY (MetodoPago) REFERENCES t_tiposdepago(Codigo),
    FOREIGN KEY (UsuarioId) REFERENCES t_vendedores(Codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Crear tabla caja_arqueo_detalle
CREATE TABLE IF NOT EXISTS caja_arqueo_detalle (
    Codigo INT AUTO_INCREMENT PRIMARY KEY,
    CajaCabezaId INT NOT NULL,
    MetodoPago VARCHAR(3),
    MontoDeclarado DECIMAL(15,2) DEFAULT 0,
    MontoReal DECIMAL(15,2) DEFAULT 0,
    Diferencia DECIMAL(15,2) DEFAULT 0,
    Observaciones TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CajaCabezaId) REFERENCES caja_cabeza(Codigo),
    FOREIGN KEY (MetodoPago) REFERENCES t_tiposdepago(Codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci; 