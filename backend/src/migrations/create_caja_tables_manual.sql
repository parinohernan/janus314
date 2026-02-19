


SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for caja_cabeza_new
-- ----------------------------
DROP TABLE IF EXISTS `caja_cabeza_new`;
CREATE TABLE `caja_cabeza_new` (
  `Codigo` int(11) NOT NULL AUTO_INCREMENT,
  `Descripcion` varchar(100) DEFAULT NULL,
  `VendedorId` varchar(20) NOT NULL,
  `SaldoInicial` decimal(15,2) NOT NULL DEFAULT '0.00',
  `SaldoCierre` decimal(15,2) DEFAULT NULL,
  `SaldoTeorico` decimal(15,2) DEFAULT NULL,
  `Apertura` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Cierre` datetime DEFAULT NULL,
  `Estado` enum('abierta','cerrada','en_arqueo') DEFAULT 'abierta',
  `Observaciones` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Codigo`),
  KEY `VendedorId` (`VendedorId`),
  CONSTRAINT `caja_cabeza_new_ibfk_1` FOREIGN KEY (`VendedorId`) REFERENCES `t_vendedores` (`Codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1;


SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for caja_movimientos
-- ----------------------------
DROP TABLE IF EXISTS `caja_movimientos`;
CREATE TABLE `caja_movimientos` (
  `Codigo` int(11) NOT NULL AUTO_INCREMENT,
  `CajaCabezaId` int(11) NOT NULL,
  `Tipo` enum('ingreso','egreso') NOT NULL,
  `Importe` decimal(15,2) NOT NULL,
  `Concepto` varchar(255) NOT NULL,
  `MetodoPago` varchar(3) NOT NULL,
  `Referencia` varchar(100) DEFAULT NULL,
  `Banco` varchar(100) DEFAULT NULL,
  `ValorFecha` date DEFAULT NULL,
  `DocumentoAsociado` varchar(50) DEFAULT NULL,
  `TipoDocumento` varchar(3) DEFAULT NULL,
  `FechaHora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioId` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Codigo`),
  KEY `CajaCabezaId` (`CajaCabezaId`),
  KEY `MetodoPago` (`MetodoPago`),
  KEY `UsuarioId` (`UsuarioId`),
  CONSTRAINT `caja_movimientos_ibfk_1` FOREIGN KEY (`CajaCabezaId`) REFERENCES `caja_cabeza_new` (`Codigo`),
  CONSTRAINT `caja_movimientos_ibfk_2` FOREIGN KEY (`MetodoPago`) REFERENCES `t_tiposdepago` (`Codigo`),
  CONSTRAINT `caja_movimientos_ibfk_3` FOREIGN KEY (`UsuarioId`) REFERENCES `t_vendedores` (`Codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=latin1;

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for caja_arqueo_detalle
-- ----------------------------
DROP TABLE IF EXISTS `caja_arqueo_detalle`;
CREATE TABLE `caja_arqueo_detalle` (
  `Codigo` int(11) NOT NULL AUTO_INCREMENT,
  `CajaCabezaId` int(11) NOT NULL,
  `MetodoPago` varchar(3) NOT NULL,
  `MontoContado` decimal(15,2) NOT NULL DEFAULT '0.00',
  `MontoSistema` decimal(15,2) NOT NULL DEFAULT '0.00',
  `Diferencia` decimal(15,2) NOT NULL DEFAULT '0.00',
  `Observaciones` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Codigo`),
  KEY `CajaCabezaId` (`CajaCabezaId`),
  KEY `MetodoPago` (`MetodoPago`),
  CONSTRAINT `caja_arqueo_detalle_ibfk_1` FOREIGN KEY (`CajaCabezaId`) REFERENCES `caja_cabeza_new` (`Codigo`),
  CONSTRAINT `caja_arqueo_detalle_ibfk_2` FOREIGN KEY (`MetodoPago`) REFERENCES `t_tiposdepago` (`Codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=latin1;

SET FOREIGN_KEY_CHECKS=1;

-- ----------------------------
-- Tipos de pago (caja usa 'CO'). Solo si faltan en t_tiposdepago.
-- Estructura: Codigo, Descripcion, Activo, aplicaSaldo, recargoPorcentaje
-- ----------------------------
INSERT IGNORE INTO `t_tiposdepago` (`Codigo`, `Descripcion`, `Activo`, `aplicaSaldo`, `recargoPorcentaje`) VALUES
('CO', 'Contado', 1, 0, 0.00),
('CC', 'Cuenta Corriente', 1, 1, 0.00),
('EFE', 'Efectivo', 0, 0, 0.00),
('TAR', 'Tarjeta', 1, 0, 5.00),
('TRA', 'Transferencia', 1, 0, 0.00),
('DIG', 'Billetera Electronica', 1, 0, 0.00);
