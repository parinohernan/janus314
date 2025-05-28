-- Tabla de cabecera de caja
DROP TABLE IF EXISTS caja_arqueo_detalle;
DROP TABLE IF EXISTS caja_movimientos;
DROP TABLE IF EXISTS caja_cabeza;

CREATE TABLE caja_cabeza (
    Codigo INT AUTO_INCREMENT PRIMARY KEY,
    Descripcion VARCHAR(100),
    VendedorId VARCHAR(20) NOT NULL,
    SaldoInicial DECIMAL(15,2) NOT NULL DEFAULT 0,
    SaldoCierre DECIMAL(15,2),
    SaldoTeorico DECIMAL(15,2),
    Apertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Cierre DATETIME,
    Estado ENUM('abierta', 'cerrada', 'en_arqueo') DEFAULT 'abierta',
    Observaciones TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (VendedorId) REFERENCES t_vendedores(Codigo)
);

CREATE TABLE caja_movimientos (
    Codigo INT AUTO_INCREMENT PRIMARY KEY,
    CajaCabezaId INT NOT NULL,
    Tipo ENUM('ingreso', 'egreso') NOT NULL,
    Importe DECIMAL(15,2) NOT NULL,
    Concepto VARCHAR(255) NOT NULL,
    MetodoPago VARCHAR(3) NOT NULL,
    Referencia VARCHAR(100),
    Banco VARCHAR(100),
    ValorFecha DATE,
    DocumentoAsociado VARCHAR(50),
    TipoDocumento ENUM('factura', 'recibo', 'nota_credito', 'gasto', 'otros'),
    FechaHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UsuarioId VARCHAR(20) NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CajaCabezaId) REFERENCES caja_cabeza(Codigo),
    FOREIGN KEY (MetodoPago) REFERENCES t_tiposdepago(Codigo),
    FOREIGN KEY (UsuarioId) REFERENCES t_vendedores(Codigo)
);

CREATE TABLE caja_arqueo_detalle (
    Codigo INT AUTO_INCREMENT PRIMARY KEY,
    CajaCabezaId INT NOT NULL,
    MetodoPago VARCHAR(3) NOT NULL,
    MontoContado DECIMAL(15,2) NOT NULL DEFAULT 0,
    MontoSistema DECIMAL(15,2) NOT NULL DEFAULT 0,
    Diferencia DECIMAL(15,2) NOT NULL DEFAULT 0,
    Observaciones TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CajaCabezaId) REFERENCES caja_cabeza(Codigo),
    FOREIGN KEY (MetodoPago) REFERENCES t_tiposdepago(Codigo)
); 