/*
Navicat MySQL Data Transfer

Source Server         : deliveryagua
Source Server Version : 50622
Source Host           : localhost:3306
Source Database       : db_sis_fac

Target Server Type    : MYSQL
Target Server Version : 50622
File Encoding         : 65001

Date: 2025-03-12 00:03:54
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for caja_cabeza
-- ----------------------------
DROP TABLE IF EXISTS `caja_cabeza`;
CREATE TABLE `caja_cabeza` (
  `DocumentoTipo` varchar(4) NOT NULL,
  `DocumentoSucursal` varchar(4) NOT NULL,
  `DocumentoNumero` varchar(10) NOT NULL,
  `FechaHora` datetime DEFAULT NULL,
  `CodigoUsuario` varchar(10) DEFAULT NULL,
  `ImporteInicial` double(15,2) DEFAULT '0.00',
  `ImporteCierre` double(15,2) DEFAULT '0.00',
  `ImporteCierreFisico` double(15,2) DEFAULT '0.00',
  `FechaHoraCierre` datetime DEFAULT NULL,
  `Observaciones` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `VendedorCodigo` (`CodigoUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for caja_movimientos
-- ----------------------------
DROP TABLE IF EXISTS `caja_movimientos`;
CREATE TABLE `caja_movimientos` (
  `DocumentoTipo` varchar(4) NOT NULL,
  `DocumentoSucursal` varchar(4) NOT NULL,
  `DocumentoNumero` varchar(10) NOT NULL,
  `CodigoUsuario` varchar(10) NOT NULL,
  `FechaHora` datetime DEFAULT NULL,
  `ConceptoCodigo` varchar(4) DEFAULT NULL,
  `ConceptoDescripcion` varchar(250) DEFAULT NULL,
  `Importe` double(15,2) DEFAULT NULL,
  `Observacion` varchar(250) DEFAULT NULL,
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `caja_movimientos_fk` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `caja_cabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for cargapordefecto
-- ----------------------------
DROP TABLE IF EXISTS `cargapordefecto`;
CREATE TABLE `cargapordefecto` (
  `CodigoUnidad` varchar(4) NOT NULL DEFAULT '',
  `CodigoDia` char(1) NOT NULL DEFAULT '',
  `CodigoArticulo` varchar(13) NOT NULL,
  `ArticuloCantidad` double NOT NULL DEFAULT '0',
  PRIMARY KEY (`CodigoUnidad`,`CodigoDia`,`CodigoArticulo`),
  KEY `CodigoUnidad` (`CodigoUnidad`),
  KEY `CodigoDia` (`CodigoDia`),
  KEY `CodigoArticulo` (`CodigoArticulo`),
  CONSTRAINT `cargapordefecto_fk1` FOREIGN KEY (`CodigoUnidad`) REFERENCES `t_unidadesmoviles` (`Codigo`),
  CONSTRAINT `cargapordefecto_ibfk_1` FOREIGN KEY (`CodigoArticulo`) REFERENCES `t_articulos` (`Codigo`),
  CONSTRAINT `cargapordefecto_ibfk_2` FOREIGN KEY (`CodigoDia`) REFERENCES `t_dias` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for cheques
-- ----------------------------
DROP TABLE IF EXISTS `cheques`;
CREATE TABLE `cheques` (
  `Codigo` int(11) NOT NULL,
  `Numero` varchar(50) DEFAULT NULL,
  `FechaEntrada` date DEFAULT NULL,
  `FechaAcredita` date DEFAULT NULL,
  `BancoCodigo` varchar(20) DEFAULT NULL,
  `Importe` double(15,2) DEFAULT '0.00',
  `ClienteCodigo` varchar(10) DEFAULT NULL,
  `DocumentoEntradaTipo` varchar(4) DEFAULT NULL,
  `DocumentoEntradaSucursal` varchar(4) DEFAULT NULL,
  `DocumentoEntradaNumero` varchar(8) DEFAULT NULL,
  `ProveedorCodigo` varchar(10) DEFAULT NULL,
  `DocumentoSalidaTipo` varchar(4) DEFAULT NULL,
  `DocumentoSalidaSucursal` varchar(4) DEFAULT NULL,
  `DocumentoSalidaNumero` varchar(8) DEFAULT NULL,
  `EstadoCodigo` varchar(2) DEFAULT NULL,
  `FechaAnulacion` date DEFAULT NULL,
  `Descripcion` varchar(254) DEFAULT NULL,
  `Observaciones` text,
  PRIMARY KEY (`Codigo`),
  KEY `DestinoCodigo` (`EstadoCodigo`),
  KEY `BancoCodigo` (`BancoCodigo`),
  KEY `ClienteCodigo` (`ClienteCodigo`),
  KEY `ProveedorCodigo` (`ProveedorCodigo`),
  CONSTRAINT `cheques_fk` FOREIGN KEY (`EstadoCodigo`) REFERENCES `cheques_estados` (`Codigo`),
  CONSTRAINT `cheques_fk1` FOREIGN KEY (`BancoCodigo`) REFERENCES `t_bancos` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for cheques_estados
-- ----------------------------
DROP TABLE IF EXISTS `cheques_estados`;
CREATE TABLE `cheques_estados` (
  `Codigo` varchar(2) NOT NULL,
  `Descripcion` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`Codigo`),
  UNIQUE KEY `Codigo_2` (`Codigo`),
  KEY `Codigo` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for clientes_descuentos
-- ----------------------------
DROP TABLE IF EXISTS `clientes_descuentos`;
CREATE TABLE `clientes_descuentos` (
  `ClienteCodigo` varchar(10) NOT NULL,
  `ArticuloCodigo` varchar(10) NOT NULL,
  `PorcentajeDescuento` double(15,4) DEFAULT '0.0000'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for comisionescabeza
-- ----------------------------
DROP TABLE IF EXISTS `comisionescabeza`;
CREATE TABLE `comisionescabeza` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `Fecha` date NOT NULL DEFAULT '0000-00-00',
  `VentasFechaDesde` date NOT NULL DEFAULT '0000-00-00',
  `VentasFechaHasta` date NOT NULL DEFAULT '0000-00-00',
  `VendedorCodigo` varchar(20) NOT NULL,
  `TotalUnidades` double(15,3) NOT NULL DEFAULT '0.000',
  `ImporteTotal` double(15,3) NOT NULL DEFAULT '0.000',
  `FechaAnulacion` date DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `VendedorCodigo` (`VendedorCodigo`),
  CONSTRAINT `comisionescabeza_fk` FOREIGN KEY (`VendedorCodigo`) REFERENCES `t_vendedores` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for comisionesitems
-- ----------------------------
DROP TABLE IF EXISTS `comisionesitems`;
CREATE TABLE `comisionesitems` (
  `DocumentoTipo` varchar(3) NOT NULL,
  `DocumentoSucursal` varchar(4) NOT NULL,
  `DocumentoNumero` varchar(8) NOT NULL,
  `CodigoArticulo` varchar(13) DEFAULT NULL,
  `DescArticulo` varchar(250) NOT NULL,
  `CantArticulo` double(15,3) NOT NULL DEFAULT '0.000',
  `PrecioCosto` double(15,3) NOT NULL DEFAULT '0.000',
  `PrecioVenta` double(15,3) NOT NULL DEFAULT '0.000',
  `PorcentajeVendedor` double(15,3) NOT NULL DEFAULT '0.000',
  `ImporteComision` double(15,3) NOT NULL DEFAULT '0.000',
  `comisiones_items_id` bigint(20) NOT NULL DEFAULT '0',
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `comisionesitems_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `comisionescabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for comisiones_vendedores
-- ----------------------------
DROP TABLE IF EXISTS `comisiones_vendedores`;
CREATE TABLE `comisiones_vendedores` (
  `VendedorCodigo` varchar(20) NOT NULL,
  `ArticuloCodigo` varchar(13) NOT NULL,
  `PorcentajeDeComision` double(15,4) DEFAULT '0.0000',
  KEY `VendedorCodigo` (`VendedorCodigo`,`ArticuloCodigo`),
  KEY `VendedorCodigo_2` (`VendedorCodigo`),
  KEY `ArticuloCodigo` (`ArticuloCodigo`),
  CONSTRAINT `comisiones_vendedores_fk` FOREIGN KEY (`VendedorCodigo`) REFERENCES `t_vendedores` (`Codigo`),
  CONSTRAINT `comisiones_vendedores_fk1` FOREIGN KEY (`ArticuloCodigo`) REFERENCES `t_articulos` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for complementos
-- ----------------------------
DROP TABLE IF EXISTS `complementos`;
CREATE TABLE `complementos` (
  `ComplementoId` int(11) NOT NULL,
  `Assembly` varchar(100) DEFAULT NULL,
  `Clase` varchar(50) DEFAULT NULL,
  `Nombre` varchar(50) DEFAULT NULL,
  `Parametros` varchar(200) DEFAULT NULL,
  `esEXE` bit(1) DEFAULT b'0',
  PRIMARY KEY (`ComplementoId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for comprascabeza
-- ----------------------------
DROP TABLE IF EXISTS `comprascabeza`;
CREATE TABLE `comprascabeza` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `Fecha` date DEFAULT NULL,
  `FechaDePago` date DEFAULT NULL,
  `ProveedorCodigo` varchar(8) NOT NULL DEFAULT '',
  `TipoPago` char(2) DEFAULT NULL,
  `ImporteBruto` double(15,3) DEFAULT '0.000',
  `ImporteBonificado` double(15,3) DEFAULT '0.000',
  `ImporteNeto` double(15,3) DEFAULT '0.000',
  `ImporteAdicional` double(15,3) DEFAULT '0.000',
  `ImporteIva1` double(15,3) DEFAULT '0.000',
  `ImporteIva2` double(15,3) DEFAULT '0.000',
  `Percepcion` double(15,3) DEFAULT '0.000',
  `ImporteTotal` double(15,3) DEFAULT '0.000',
  `ImportePagado` double(15,3) DEFAULT '0.000',
  `Observacion` varchar(300) DEFAULT NULL,
  `ObservacionAnula` varchar(500) DEFAULT NULL,
  `RemitoNro` varchar(20) DEFAULT NULL,
  `OrdenCompraNro` varchar(8) DEFAULT NULL,
  `FechaAnulacion` datetime DEFAULT NULL,
  `Anulado` tinyint(1) NOT NULL DEFAULT '0',
  `IngresosBrutos` double(15,3) DEFAULT '0.000',
  `OtrosImpuestos1` double(15,3) DEFAULT '0.000',
  `OtrosImpuestos2` double(15,3) DEFAULT '0.000',
  `OtrosImpuestos3` double(15,3) DEFAULT '0.000',
  `gmc_diario_general_numero` int(11) DEFAULT NULL,
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `ProveedorCodigo` (`ProveedorCodigo`),
  KEY `DocumentoTipo_2` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`ProveedorCodigo`),
  CONSTRAINT `comprascabeza_ibfk_1` FOREIGN KEY (`ProveedorCodigo`) REFERENCES `t_proveedores` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for comprasitems
-- ----------------------------
DROP TABLE IF EXISTS `comprasitems`;
CREATE TABLE `comprasitems` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `ProveedorCodigo` varchar(7) DEFAULT NULL,
  `CodigoArticulo` varchar(13) NOT NULL DEFAULT '',
  `Cantidad` double DEFAULT NULL,
  `PrecioCostoUnitario` double DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`CodigoArticulo`),
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `CodigoArticulo` (`CodigoArticulo`),
  KEY `DocumentoTipo_2` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`ProveedorCodigo`),
  CONSTRAINT `comprasitems_fk` FOREIGN KEY (`CodigoArticulo`) REFERENCES `t_articulos` (`Codigo`),
  CONSTRAINT `comprasitems_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`, `ProveedorCodigo`) REFERENCES `comprascabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`, `ProveedorCodigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for configuracionpantallas
-- ----------------------------
DROP TABLE IF EXISTS `configuracionpantallas`;
CREATE TABLE `configuracionpantallas` (
  `Pantalla` varchar(50) DEFAULT NULL,
  `Control` varchar(50) DEFAULT NULL,
  `Propiedad` varchar(50) DEFAULT NULL,
  `Valor` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for datosempresa
-- ----------------------------
DROP TABLE IF EXISTS `datosempresa`;
CREATE TABLE `datosempresa` (
  `RazonSocial` varchar(50) NOT NULL DEFAULT '',
  `Domicilio` varchar(70) DEFAULT NULL,
  `Localidad` varchar(50) DEFAULT NULL,
  `Telefono` varchar(50) DEFAULT NULL,
  `EMail` varchar(100) DEFAULT NULL,
  `Sucursal` varchar(4) DEFAULT NULL,
  `Cuit` varchar(13) DEFAULT NULL,
  `PuertoFiscal` tinyint(3) unsigned DEFAULT NULL,
  `CategoriaIva` char(1) DEFAULT NULL,
  `IngresosBrutos` varchar(40) DEFAULT NULL,
  `DomicilioComercial` varchar(80) DEFAULT NULL,
  `DomicilioFiscal` varchar(80) DEFAULT NULL,
  `PieCero` varchar(40) DEFAULT NULL,
  `PieUno` varchar(40) DEFAULT NULL,
  `PieDos` varchar(40) DEFAULT NULL,
  `PieTres` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`RazonSocial`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for dias_de_visita
-- ----------------------------
DROP TABLE IF EXISTS `dias_de_visita`;
CREATE TABLE `dias_de_visita` (
  `ClienteCodigo` varchar(8) NOT NULL,
  `VendedorCodigo` varchar(8) NOT NULL,
  `DiaCodigo` char(1) NOT NULL,
  `Observaciones` text,
  `HoraDesde` time DEFAULT NULL,
  `HoraHasta` time DEFAULT NULL,
  `orden` int(11) DEFAULT NULL,
  PRIMARY KEY (`ClienteCodigo`,`VendedorCodigo`,`DiaCodigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for documentos_deuda
-- ----------------------------
DROP TABLE IF EXISTS `documentos_deuda`;
CREATE TABLE `documentos_deuda` (
  `documento_tipo` varchar(3) NOT NULL,
  `documento_sucursal` varchar(4) NOT NULL,
  `documento_numero` varchar(8) NOT NULL,
  `fecha` date DEFAULT NULL,
  `codigo_cliente` varchar(10) DEFAULT NULL,
  `importe_total` double(15,3) DEFAULT NULL,
  `importe_pagado` double(15,3) DEFAULT NULL,
  `importe_deuda` double(15,3) DEFAULT NULL,
  PRIMARY KEY (`documento_tipo`,`documento_sucursal`,`documento_numero`),
  KEY `documentos_deuda_idx2` (`codigo_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 PACK_KEYS=0;

-- ----------------------------
-- Table structure for facturacabeza
-- ----------------------------
DROP TABLE IF EXISTS `facturacabeza`;
CREATE TABLE `facturacabeza` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `Fecha` date DEFAULT NULL,
  `ClienteCodigo` varchar(8) DEFAULT NULL,
  `VendedorCodigo` varchar(20) DEFAULT NULL,
  `PagoTipo` char(2) DEFAULT NULL,
  `ImporteBruto` double(15,3) DEFAULT '0.000',
  `PorcentajeBonificacion` double(15,2) DEFAULT '0.00',
  `ImporteBonificado` double(15,3) DEFAULT '0.000',
  `ImporteNeto` double(15,3) DEFAULT '0.000',
  `ImporteAdicional` double(15,3) DEFAULT '0.000',
  `ImporteIva1` double(15,3) DEFAULT '0.000',
  `ImporteIva2` double(15,3) DEFAULT '0.000',
  `BaseImponible1` double(15,3) DEFAULT '0.000',
  `BaseImponible2` double(15,3) DEFAULT '0.000',
  `ImporteTotal` double(15,3) DEFAULT '0.000',
  `ImportePagado` double(15,3) DEFAULT '0.000',
  `PorcentajeIva1` double(15,3) DEFAULT '0.000',
  `PorcentajeIva2` double(15,3) DEFAULT '0.000',
  `ListaNumero` tinyint(3) unsigned DEFAULT '0',
  `FechaAnulacion` datetime DEFAULT NULL,
  `Observacion` varchar(500) DEFAULT NULL,
  `CodigoUsuario` varchar(10) DEFAULT NULL,
  `CajaNumero` varchar(10) DEFAULT NULL,
  `afip_cae` varchar(100) DEFAULT NULL,
  `afip_cae_observaciones` varchar(254) DEFAULT NULL,
  `afip_cae_vencimiento` date DEFAULT NULL,
  `orden_entrega_id` int(11) DEFAULT NULL,
  `TransporteCodigo` varchar(3) DEFAULT NULL,
  `PorcentajePercepcionIIBB` double(15,3) DEFAULT '0.000',
  `ImportePercepcionIIBB` double(15,3) DEFAULT '0.000',
  `FechaVencimiento` date DEFAULT NULL,
  `gmc_diario_general_numero` int(11) DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `ClienteCodigo` (`ClienteCodigo`),
  KEY `DocumentoSucursal` (`DocumentoSucursal`),
  KEY `VendedorCodigo` (`VendedorCodigo`),
  KEY `orden_entrega_id` (`orden_entrega_id`),
  KEY `CodigoUsuario` (`CodigoUsuario`),
  KEY `Fecha` (`Fecha`),
  CONSTRAINT `facturacabeza_fk` FOREIGN KEY (`ClienteCodigo`) REFERENCES `t_clientes` (`Codigo`),
  CONSTRAINT `facturacabeza_fk1` FOREIGN KEY (`CodigoUsuario`) REFERENCES `t_usuarios` (`Codigo`),
  CONSTRAINT `facturacabeza_fk2` FOREIGN KEY (`VendedorCodigo`) REFERENCES `t_vendedores` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for facturaitems
-- ----------------------------
DROP TABLE IF EXISTS `facturaitems`;
CREATE TABLE `facturaitems` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `CodigoArticulo` varchar(13) DEFAULT NULL,
  `Cantidad` double(15,2) DEFAULT NULL,
  `ImporteCosto` double(15,3) NOT NULL DEFAULT '0.000',
  `PrecioLista` double(15,3) NOT NULL DEFAULT '0.000',
  `PorcentajeBonificado` double(15,3) NOT NULL DEFAULT '0.000',
  `ImporteBonificado` double(15,3) NOT NULL DEFAULT '0.000',
  `PrecioUnitario` double(15,2) DEFAULT NULL,
  `DocumentoLiqTipo` varchar(3) DEFAULT NULL,
  `DocumentoLiqSucursal` varchar(4) DEFAULT NULL,
  `DocumentoLiqNumero` varchar(8) DEFAULT NULL,
  `LiqFecha` date DEFAULT NULL,
  `es_merma` tinyint(4) DEFAULT '0',
  KEY `CodigoArticulo` (`CodigoArticulo`),
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `facturaitems_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `facturacabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for gastoscabeza
-- ----------------------------
DROP TABLE IF EXISTS `gastoscabeza`;
CREATE TABLE `gastoscabeza` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `Fecha` date NOT NULL DEFAULT '0000-00-00',
  `ImporteTotal` double(15,3) NOT NULL DEFAULT '0.000',
  `Observacion` tinytext,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for gastositems
-- ----------------------------
DROP TABLE IF EXISTS `gastositems`;
CREATE TABLE `gastositems` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `CodigoGasto` varchar(4) NOT NULL DEFAULT '',
  `CodigoTipoDeGasto` varchar(4) NOT NULL DEFAULT '',
  `Importe` double(15,2) NOT NULL DEFAULT '0.00',
  `Observacion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`CodigoGasto`,`CodigoTipoDeGasto`),
  KEY `CodigoTipoDeGasto` (`CodigoTipoDeGasto`),
  KEY `CodigoGasto` (`CodigoGasto`),
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `gastositems_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `gastoscabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`),
  CONSTRAINT `gastositems_ibfk_2` FOREIGN KEY (`CodigoTipoDeGasto`) REFERENCES `t_tiposdegastos` (`Codigo`),
  CONSTRAINT `gastositems_ibfk_3` FOREIGN KEY (`CodigoGasto`) REFERENCES `t_gastosdescripcion` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for geolocalizacion
-- ----------------------------
DROP TABLE IF EXISTS `geolocalizacion`;
CREATE TABLE `geolocalizacion` (
  `Codigo` int(11) NOT NULL,
  `Fecha` datetime DEFAULT NULL,
  `VendedorCodigo` varchar(8) DEFAULT NULL,
  `SucursalCodigo` int(11) DEFAULT NULL,
  `Longitud` double(15,10) DEFAULT NULL,
  `Latitud` double(15,10) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 AVG_ROW_LENGTH=42;

-- ----------------------------
-- Table structure for ger_t_agrupaciones
-- ----------------------------
DROP TABLE IF EXISTS `ger_t_agrupaciones`;
CREATE TABLE `ger_t_agrupaciones` (
  `Codigo` int(11) NOT NULL AUTO_INCREMENT,
  `Descripcion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for ger_t_agrupaciones_grupos
-- ----------------------------
DROP TABLE IF EXISTS `ger_t_agrupaciones_grupos`;
CREATE TABLE `ger_t_agrupaciones_grupos` (
  `codigo` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) DEFAULT NULL,
  `agrupacioncodigo` int(11) DEFAULT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for ger_t_agrupaciones_grupos_articulos
-- ----------------------------
DROP TABLE IF EXISTS `ger_t_agrupaciones_grupos_articulos`;
CREATE TABLE `ger_t_agrupaciones_grupos_articulos` (
  `AgrupacionGrupoCodigo` int(11) DEFAULT NULL,
  `ArticuloCodigo` varchar(20) DEFAULT NULL,
  KEY `AgrupacionGrupoCodigo` (`AgrupacionGrupoCodigo`),
  KEY `ArticuloCodigo` (`ArticuloCodigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for ger_t_canales_grupos
-- ----------------------------
DROP TABLE IF EXISTS `ger_t_canales_grupos`;
CREATE TABLE `ger_t_canales_grupos` (
  `codigo` int(11) NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for listasdeprecios
-- ----------------------------
DROP TABLE IF EXISTS `listasdeprecios`;
CREATE TABLE `listasdeprecios` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Descripcion` varchar(50) DEFAULT NULL,
  `Ocultar` varchar(8) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1 AVG_ROW_LENGTH=3276;

-- ----------------------------
-- Table structure for menu
-- ----------------------------
DROP TABLE IF EXISTS `menu`;
CREATE TABLE `menu` (
  `Codigo` varchar(30) NOT NULL,
  `Habilitado` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`Codigo`),
  UNIQUE KEY `Item` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AVG_ROW_LENGTH=364;

-- ----------------------------
-- Table structure for movimientospasajearticulos
-- ----------------------------
DROP TABLE IF EXISTS `movimientospasajearticulos`;
CREATE TABLE `movimientospasajearticulos` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `CodigoUOrigen` varchar(4) NOT NULL DEFAULT '',
  `CodigoUDestino` varchar(4) NOT NULL DEFAULT '',
  `CodigoArticulo` varchar(13) NOT NULL DEFAULT '',
  `Cantidad` double(15,2) NOT NULL DEFAULT '0.00',
  `Fecha` datetime NOT NULL,
  `Observacion` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`CodigoUOrigen`,`CodigoUDestino`,`CodigoArticulo`),
  KEY `CodigoArticulo` (`CodigoArticulo`),
  KEY `Fecha` (`Fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for movimientosstock
-- ----------------------------
DROP TABLE IF EXISTS `movimientosstock`;
CREATE TABLE `movimientosstock` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `Fecha` date NOT NULL,
  `CodigoArticulo` varchar(13) NOT NULL DEFAULT '',
  `Cantidad` double(15,2) NOT NULL DEFAULT '0.00',
  `MovimientoTipo` char(3) DEFAULT NULL,
  `Observacion` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`CodigoArticulo`),
  KEY `CodigoArticulo` (`CodigoArticulo`,`Fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for notacreditocabeza
-- ----------------------------
DROP TABLE IF EXISTS `notacreditocabeza`;
CREATE TABLE `notacreditocabeza` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `CodigoCliente` varchar(8) NOT NULL,
  `Fecha` date NOT NULL DEFAULT '0000-00-00',
  `ImporteTotal` double(15,3) DEFAULT '0.000',
  `ImporteUtilizado` double(15,3) DEFAULT '0.000',
  `FechaAnulacion` date DEFAULT NULL,
  `ImporteNeto` double(15,3) DEFAULT '0.000',
  `ImporteIva1` double(15,3) DEFAULT '0.000',
  `ImporteIva2` double(15,3) DEFAULT '0.000',
  `BaseImponible1` double(15,3) DEFAULT '0.000',
  `BaseImponible2` double(15,3) DEFAULT '0.000',
  `PorcentajeIva1` double(15,3) DEFAULT '0.000',
  `PorcentajeIva2` double(15,3) DEFAULT '0.000',
  `ListaNumero` tinyint(1) DEFAULT '0',
  `Observacion` varchar(1000) DEFAULT NULL,
  `PorStock` tinyint(1) DEFAULT '0',
  `CodigoUsuario` varchar(10) DEFAULT NULL,
  `CajaNumero` varchar(10) DEFAULT NULL,
  `CodigoVendedor` varchar(20) NOT NULL DEFAULT '',
  `ImporteBruto` double(15,3) DEFAULT '0.000',
  `ImporteBonificado` double(15,3) DEFAULT '0.000',
  `ImporteAdicional` double(15,3) DEFAULT '0.000',
  `afip_cae` varchar(100) DEFAULT NULL,
  `afip_cae_observaciones` varchar(254) DEFAULT NULL,
  `afip_cae_vencimiento` date DEFAULT NULL,
  `factura_tipo` varchar(4) DEFAULT NULL,
  `factura_sucursal` varchar(4) DEFAULT NULL,
  `factura_numero` varchar(8) DEFAULT NULL,
  `gmc_diario_general_numero` int(11) DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `CodigoCliente` (`CodigoCliente`),
  KEY `PorStock` (`PorStock`),
  KEY `Fecha` (`Fecha`),
  KEY `factura` (`factura_tipo`,`factura_sucursal`,`factura_numero`),
  KEY `CodigoUsuario` (`CodigoUsuario`),
  KEY `CodigoVendedor` (`CodigoVendedor`),
  CONSTRAINT `notacreditocabeza_fk` FOREIGN KEY (`CodigoCliente`) REFERENCES `t_clientes` (`Codigo`),
  CONSTRAINT `notacreditocabeza_fk1` FOREIGN KEY (`CodigoUsuario`) REFERENCES `t_usuarios` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for notacreditoitems
-- ----------------------------
DROP TABLE IF EXISTS `notacreditoitems`;
CREATE TABLE `notacreditoitems` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `CodigoArticulo` varchar(13) DEFAULT NULL,
  `Cantidad` double(15,2) DEFAULT '0.00',
  `PrecioUnitario` double(15,2) DEFAULT '0.00',
  `DocumentoLiqTipo` varchar(3) DEFAULT NULL,
  `DocumentoLiqSucursal` varchar(4) DEFAULT NULL,
  `DocumentoLiqNumero` varchar(8) DEFAULT NULL,
  `LiqFecha` date DEFAULT NULL,
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`CodigoArticulo`),
  KEY `CodigoArticulo` (`CodigoArticulo`),
  CONSTRAINT `notacreditoitems_fk` FOREIGN KEY (`CodigoArticulo`) REFERENCES `t_articulos` (`Codigo`),
  CONSTRAINT `notacreditoitems_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `notacreditocabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for notacreditovalores
-- ----------------------------
DROP TABLE IF EXISTS `notacreditovalores`;
CREATE TABLE `notacreditovalores` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `ValorCodigo` varchar(4) NOT NULL DEFAULT '',
  `ValorFecha` date DEFAULT NULL,
  `ValorNumero` varchar(50) DEFAULT NULL,
  `Valorbanco` varchar(4) DEFAULT NULL,
  `ValorImporte` double(15,3) DEFAULT '0.000',
  `ChequeCodigo` int(11) DEFAULT NULL,
  `ValorObservaciones` text,
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `notacreditovalores_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `notacreditocabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for notadebitocabeza
-- ----------------------------
DROP TABLE IF EXISTS `notadebitocabeza`;
CREATE TABLE `notadebitocabeza` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `ClienteCodigo` varchar(8) NOT NULL,
  `Fecha` date NOT NULL DEFAULT '0000-00-00',
  `ImporteTotal` double DEFAULT NULL,
  `ImportePagado` double DEFAULT NULL,
  `FechaAnulacion` datetime DEFAULT NULL,
  `CodigoUsuario` varchar(10) NOT NULL DEFAULT '',
  `VendedorCodigo` varchar(20) NOT NULL DEFAULT '',
  `ImporteNeto` double(15,4) DEFAULT '0.0000',
  `ImporteIva1` double(15,4) DEFAULT '0.0000',
  `gmc_diario_general_numero` int(11) DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `ClienteCodigo` (`ClienteCodigo`),
  KEY `VendedorCodigo` (`VendedorCodigo`),
  KEY `Fecha` (`Fecha`),
  CONSTRAINT `notadebitocabeza_fk` FOREIGN KEY (`ClienteCodigo`) REFERENCES `t_clientes` (`Codigo`),
  CONSTRAINT `notadebitocabeza_fk1` FOREIGN KEY (`VendedorCodigo`) REFERENCES `t_vendedores` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for notadebitoitems
-- ----------------------------
DROP TABLE IF EXISTS `notadebitoitems`;
CREATE TABLE `notadebitoitems` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `Descripcion` varchar(254) NOT NULL,
  `Importe` double(15,3) DEFAULT '0.000',
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `notadebitoitems_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `notadebitocabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for ordencargacabeza
-- ----------------------------
DROP TABLE IF EXISTS `ordencargacabeza`;
CREATE TABLE `ordencargacabeza` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `Fecha` date NOT NULL DEFAULT '0000-00-00',
  `FechaPedidosHasta` date DEFAULT NULL,
  `CodigoUMovil` varchar(4) NOT NULL,
  `CodigoDia` char(1) NOT NULL DEFAULT '',
  `CantArticulos` double(15,2) DEFAULT '0.00',
  `PesoDeCarga` double(15,2) DEFAULT '0.00',
  `FechaAnulacion` datetime DEFAULT NULL,
  `OrdenCerrada` tinyint(3) unsigned DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `CodigoUMovil` (`CodigoUMovil`),
  CONSTRAINT `ordencargacabeza_ibfk_1` FOREIGN KEY (`CodigoUMovil`) REFERENCES `t_unidadesmoviles` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for ordencargaitems
-- ----------------------------
DROP TABLE IF EXISTS `ordencargaitems`;
CREATE TABLE `ordencargaitems` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `CodigoArticulo` varchar(13) NOT NULL DEFAULT '',
  `Cantidad` double(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`CodigoArticulo`),
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `ordencargaitems_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `ordencargacabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for orden_entrega_cabeza
-- ----------------------------
DROP TABLE IF EXISTS `orden_entrega_cabeza`;
CREATE TABLE `orden_entrega_cabeza` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` date DEFAULT NULL,
  `usuario_codigo` varchar(20) DEFAULT NULL,
  `importe_total` double(15,3) DEFAULT '0.000',
  `fecha_anulacion` date DEFAULT NULL,
  `transporte_codigo` varchar(3) NOT NULL,
  `fecha_hora_cierre` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transporte_codigo` (`transporte_codigo`),
  KEY `usuario_codigo` (`usuario_codigo`),
  CONSTRAINT `orden_entrega_cabeza_fk` FOREIGN KEY (`transporte_codigo`) REFERENCES `t_transportes` (`Codigo`),
  CONSTRAINT `orden_entrega_cabeza_fk1` FOREIGN KEY (`usuario_codigo`) REFERENCES `t_usuarios` (`Codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for orden_entrega_items
-- ----------------------------
DROP TABLE IF EXISTS `orden_entrega_items`;
CREATE TABLE `orden_entrega_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orden_entrega_cabeza_id` int(11) NOT NULL,
  `factura_tipo` char(3) DEFAULT NULL,
  `factura_sucursal` varchar(4) DEFAULT NULL,
  `factura_numero` varchar(8) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `factura_tipo` (`factura_tipo`,`factura_sucursal`,`factura_numero`),
  KEY `orden_entrega_cabeza_id` (`orden_entrega_cabeza_id`),
  CONSTRAINT `orden_entrega_items_fk` FOREIGN KEY (`orden_entrega_cabeza_id`) REFERENCES `orden_entrega_cabeza` (`id`),
  CONSTRAINT `orden_entrega_items_fk1` FOREIGN KEY (`factura_tipo`, `factura_sucursal`, `factura_numero`) REFERENCES `facturacabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB AUTO_INCREMENT=259 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for paneles
-- ----------------------------
DROP TABLE IF EXISTS `paneles`;
CREATE TABLE `paneles` (
  `usuario_codigo` varchar(20) NOT NULL,
  `panel_name` varchar(50) NOT NULL,
  `position_top` double(15,3) NOT NULL,
  `position_left` double(15,3) NOT NULL,
  `loaded` tinyint(1) DEFAULT '0' COMMENT 'inica si ya esta cargado',
  UNIQUE KEY `usuario_panel` (`usuario_codigo`,`panel_name`),
  KEY `usuario_codigo` (`usuario_codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for pedidoscabeza
-- ----------------------------
DROP TABLE IF EXISTS `pedidoscabeza`;
CREATE TABLE `pedidoscabeza` (
  `DocumentoTipo` varchar(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(8) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `CodigoCliente` varchar(8) DEFAULT NULL,
  `CodigoUMovil` varchar(4) NOT NULL,
  `FechaEmicion` date NOT NULL DEFAULT '0000-00-00',
  `FechaEntrega` date DEFAULT NULL,
  `FechaEnviado` date DEFAULT NULL,
  `CantidadArticulos` double DEFAULT NULL,
  `PesoDeCarga` double DEFAULT NULL,
  `Observacion` varchar(10) DEFAULT NULL,
  `FechaAnulacion` date DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `CodigoCliente` (`CodigoCliente`),
  KEY `CodigoUMovil` (`CodigoUMovil`),
  CONSTRAINT `pedidoscabeza_fk` FOREIGN KEY (`CodigoCliente`) REFERENCES `t_clientes` (`Codigo`),
  CONSTRAINT `pedidoscabeza_ibfk_2` FOREIGN KEY (`CodigoUMovil`) REFERENCES `t_unidadesmoviles` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for pedidositems
-- ----------------------------
DROP TABLE IF EXISTS `pedidositems`;
CREATE TABLE `pedidositems` (
  `DocumentoTipo` varchar(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `CodigoArticulo` varchar(13) NOT NULL DEFAULT '',
  `Cantidad` double(15,2) DEFAULT '0.00',
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`CodigoArticulo`),
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `CodigoArticulo` (`CodigoArticulo`),
  CONSTRAINT `pedidositems_fk` FOREIGN KEY (`CodigoArticulo`) REFERENCES `t_articulos` (`Codigo`),
  CONSTRAINT `pedidositems_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `pedidoscabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for planesdepago
-- ----------------------------
DROP TABLE IF EXISTS `planesdepago`;
CREATE TABLE `planesdepago` (
  `PlanesDePagoId` int(11) NOT NULL AUTO_INCREMENT,
  `Fecha` date DEFAULT NULL,
  `FacturaTipo` varchar(3) DEFAULT NULL,
  `FacturaSucursal` int(11) DEFAULT NULL,
  `FacturaNumero` int(11) DEFAULT NULL,
  `ImporteAdelanto` double(15,3) DEFAULT NULL,
  `CantidadDeCuotas` int(11) DEFAULT NULL,
  `ImportePorCuota` double(15,3) DEFAULT '0.000',
  `Adelanto` double(15,3) DEFAULT '0.000',
  `ImporteAFinanciar` double(15,3) DEFAULT '0.000',
  `ImporteTotal` double(15,3) DEFAULT '0.000',
  `PorcentajeIntereses` double(15,3) DEFAULT NULL,
  `FechaAnulacion` date DEFAULT NULL,
  PRIMARY KEY (`PlanesDePagoId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 PACK_KEYS=0;

-- ----------------------------
-- Table structure for presupuestocabeza
-- ----------------------------
DROP TABLE IF EXISTS `presupuestocabeza`;
CREATE TABLE `presupuestocabeza` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `Fecha` datetime DEFAULT NULL,
  `ClienteCodigo` varchar(7) DEFAULT NULL,
  `PagoTipo` char(2) DEFAULT NULL,
  `VendedorCodigo` varchar(20) DEFAULT NULL,
  `ImporteBruto` double(15,2) DEFAULT '0.00',
  `PorcentajeBonificacion` double(15,2) DEFAULT '0.00',
  `ImporteBonificado` double(15,2) DEFAULT '0.00',
  `ImporteNeto` double(15,2) DEFAULT '0.00',
  `ImporteTotal` double(15,2) DEFAULT '0.00',
  `ImportePagado` double(15,2) DEFAULT '0.00',
  `ListaNumero` tinyint(3) unsigned DEFAULT '0',
  `FechaAnulacion` datetime DEFAULT NULL,
  `Observacion` varchar(50) DEFAULT '200',
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `ClienteCodigo` (`ClienteCodigo`),
  CONSTRAINT `presupuestocabeza_ibfk_1` FOREIGN KEY (`ClienteCodigo`) REFERENCES `t_clientes` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for presupuestoitems
-- ----------------------------
DROP TABLE IF EXISTS `presupuestoitems`;
CREATE TABLE `presupuestoitems` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `CodigoArticulo` varchar(13) NOT NULL DEFAULT '',
  `Cantidad` double(15,2) DEFAULT '0.00',
  `PrecioUnitario` double(15,3) DEFAULT '0.000',
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`CodigoArticulo`),
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `presupuestoitems_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `presupuestocabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for preventa_cabeza
-- ----------------------------
DROP TABLE IF EXISTS `preventa_cabeza`;
CREATE TABLE `preventa_cabeza` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `Fecha` datetime DEFAULT NULL,
  `ClienteCodigo` varchar(8) DEFAULT NULL,
  `VendedorCodigo` varchar(20) DEFAULT NULL,
  `PagoTipo` char(2) DEFAULT NULL,
  `ImporteBruto` double(15,3) DEFAULT '0.000',
  `PorcentajeBonificacion` double(15,2) DEFAULT '0.00',
  `ImporteBonificado` double(15,3) DEFAULT '0.000',
  `ImporteNeto` double(15,3) DEFAULT '0.000',
  `ImporteAdicional` double(15,3) DEFAULT '0.000',
  `ImporteIva1` double(15,3) DEFAULT '0.000',
  `ImporteIva2` double(15,3) DEFAULT '0.000',
  `ImporteTotal` double(15,3) DEFAULT '0.000',
  `ImportePagado` double(15,3) DEFAULT '0.000',
  `PorcentajeIva1` double(15,3) DEFAULT '0.000',
  `PorcentajeIva2` double(15,3) DEFAULT '0.000',
  `ListaNumero` tinyint(3) unsigned DEFAULT '0',
  `FechaAnulacion` date DEFAULT NULL,
  `Observacion` varchar(200) DEFAULT NULL,
  `FacturaTipo` varchar(3) DEFAULT NULL,
  `FacturaSucursal` varchar(4) DEFAULT NULL,
  `FacturaNumero` varchar(8) DEFAULT NULL,
  `FechaEntrega` date DEFAULT NULL,
  `FechaHoraEnvio` datetime DEFAULT NULL COMMENT 'fech / hora de envio del pedido',
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `ClienteCodigo` (`ClienteCodigo`),
  KEY `DocumentoSucursal` (`DocumentoSucursal`),
  KEY `VendedorCodigo` (`VendedorCodigo`),
  KEY `ClienteCodigo_2` (`ClienteCodigo`,`VendedorCodigo`),
  CONSTRAINT `preventa_cabeza_fk` FOREIGN KEY (`ClienteCodigo`) REFERENCES `t_clientes` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for preventa_items
-- ----------------------------
DROP TABLE IF EXISTS `preventa_items`;
CREATE TABLE `preventa_items` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `CodigoArticulo` varchar(13) NOT NULL DEFAULT '',
  `Cantidad` double(15,2) DEFAULT NULL,
  `PrecioUnitario` double DEFAULT NULL,
  `DocumentoLiqTipo` char(3) DEFAULT NULL,
  `DocumentoLiqSucursal` varchar(4) DEFAULT NULL,
  `DocumentoLiqNumero` varchar(8) DEFAULT NULL,
  `LiqFecha` date DEFAULT NULL,
  `PrecioLista` double(15,3) DEFAULT '0.000',
  `PorcentajeBonificacion` double(15,3) DEFAULT '0.000',
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`CodigoArticulo`),
  KEY `CodigoArticulo` (`CodigoArticulo`),
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `preventa_items_fk` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `preventa_cabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`),
  CONSTRAINT `preventa_items_fk1` FOREIGN KEY (`CodigoArticulo`) REFERENCES `t_articulos` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for proveedoresnotacreditocabeza
-- ----------------------------
DROP TABLE IF EXISTS `proveedoresnotacreditocabeza`;
CREATE TABLE `proveedoresnotacreditocabeza` (
  `DocumentoTipo` char(4) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `CodigoProveedor` varchar(8) NOT NULL,
  `Fecha` date NOT NULL DEFAULT '0000-00-00',
  `ImporteTotal` double(15,3) DEFAULT '0.000',
  `ImporteUtilizado` double(15,3) DEFAULT '0.000',
  `FechaAnulacion` datetime DEFAULT NULL,
  `ImporteNeto` double(15,3) DEFAULT '0.000',
  `ImporteIVA1` double(15,3) DEFAULT '0.000',
  `OtrosImpuestos1` double(15,3) DEFAULT '0.000',
  `ImporteIva2` double(15,3) DEFAULT '0.000',
  `ImporteIIBB` double(15,3) DEFAULT '0.000',
  `OtrosImpuestos2` double(15,3) DEFAULT '0.000',
  `OtrosImpuestos3` double(15,3) DEFAULT '0.000',
  `ImporteBruto` double(15,3) NOT NULL DEFAULT '0.000',
  `ImporteBonificado` double(15,3) NOT NULL DEFAULT '0.000',
  `por_stock` tinyint(1) DEFAULT '0',
  `TipoPago` varchar(4) NOT NULL,
  `gmc_diario_general_numero` int(11) DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `CodigoProveedor` (`CodigoProveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for proveedoresnotacreditoitems
-- ----------------------------
DROP TABLE IF EXISTS `proveedoresnotacreditoitems`;
CREATE TABLE `proveedoresnotacreditoitems` (
  `DocumentoTipo` char(4) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `ProveedorCodigo` varchar(7) DEFAULT NULL,
  `CodigoArticulo` varchar(13) NOT NULL DEFAULT '',
  `Cantidad` double DEFAULT NULL,
  `PrecioCostoUnitario` double DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`CodigoArticulo`),
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `CodigoArticulo` (`CodigoArticulo`),
  KEY `DocumentoTipo_2` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`ProveedorCodigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for proveedoresnotacreditovalores
-- ----------------------------
DROP TABLE IF EXISTS `proveedoresnotacreditovalores`;
CREATE TABLE `proveedoresnotacreditovalores` (
  `DocumentoTipo` char(4) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `ValorCodigo` varchar(4) NOT NULL DEFAULT '',
  `ValorFecha` date DEFAULT NULL,
  `ValorNumero` varchar(50) DEFAULT NULL,
  `Valorbanco` varchar(4) DEFAULT NULL,
  `ValorImporte` double(15,3) DEFAULT NULL,
  `ChequeCodigo` int(11) DEFAULT NULL,
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `proveedoresnotacreditovalores_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `proveedoresnotacreditocabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for proveedoresnotadebitocabeza
-- ----------------------------
DROP TABLE IF EXISTS `proveedoresnotadebitocabeza`;
CREATE TABLE `proveedoresnotadebitocabeza` (
  `DocumentoTipo` char(4) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `ProveedorCodigo` varchar(8) NOT NULL,
  `Fecha` date NOT NULL DEFAULT '0000-00-00',
  `ImporteTotal` double(15,3) DEFAULT '0.000',
  `ImportePagado` double DEFAULT '0',
  `FechaAnulacion` date DEFAULT NULL,
  `ImporteNeto` double(15,2) DEFAULT '0.00',
  `ImporteIVA1` double(15,2) DEFAULT '0.00',
  `OtrosImpuestos` double(15,2) DEFAULT '0.00',
  `ImporteIVA2` double(15,2) DEFAULT '0.00',
  `ImporteIIBB` double(15,2) DEFAULT '0.00',
  `OtrosImpuestos2` double(15,2) DEFAULT '0.00',
  `OtrosImpuestos3` double(15,2) DEFAULT '0.00',
  `gmc_diario_general_numero` int(11) DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `ProveedorCodigo` (`ProveedorCodigo`),
  CONSTRAINT `proveedoresnotadebitocabeza_ibfk_1` FOREIGN KEY (`ProveedorCodigo`) REFERENCES `t_proveedores` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for proveedoresnotadebitoitems
-- ----------------------------
DROP TABLE IF EXISTS `proveedoresnotadebitoitems`;
CREATE TABLE `proveedoresnotadebitoitems` (
  `DocumentoTipo` char(4) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `Descripcion` varchar(254) NOT NULL,
  `Importe` double(15,2) DEFAULT NULL,
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `proveedoresnotadebitoitems_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `proveedoresnotadebitocabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for proveedoresreciboscabeza
-- ----------------------------
DROP TABLE IF EXISTS `proveedoresreciboscabeza`;
CREATE TABLE `proveedoresreciboscabeza` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `Fecha` date NOT NULL,
  `ProveedorCodigo` varchar(8) NOT NULL DEFAULT '',
  `ImporteTotal` double(15,2) DEFAULT NULL,
  `FechaAnulacion` datetime DEFAULT NULL,
  `VendedorCodigo` varchar(20) DEFAULT NULL,
  `gmc_diario_general_numero` int(11) DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `ProveedorCodigo` (`ProveedorCodigo`),
  KEY `VendedorCodigo` (`VendedorCodigo`),
  CONSTRAINT `proveedoresreciboscabeza_fk` FOREIGN KEY (`ProveedorCodigo`) REFERENCES `t_proveedores` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for proveedoresrecibositems
-- ----------------------------
DROP TABLE IF EXISTS `proveedoresrecibositems`;
CREATE TABLE `proveedoresrecibositems` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `FacturaTipo` char(4) NOT NULL,
  `FacturaSucursal` varchar(4) NOT NULL DEFAULT '',
  `FacturaNumero` varchar(8) NOT NULL DEFAULT '',
  `ProveedorCodigo` varchar(8) DEFAULT NULL,
  `ImportePagado` double(15,3) DEFAULT '0.000',
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`FacturaTipo`,`FacturaSucursal`,`FacturaNumero`),
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `DocumentoFactura` (`FacturaTipo`,`FacturaSucursal`,`FacturaNumero`,`ProveedorCodigo`),
  KEY `ProveedorCodigo` (`ProveedorCodigo`),
  CONSTRAINT `proveedoresrecibositems_fk` FOREIGN KEY (`ProveedorCodigo`) REFERENCES `t_proveedores` (`Codigo`),
  CONSTRAINT `proveedoresrecibositems_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `proveedoresreciboscabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for proveedoresrecibosvalores
-- ----------------------------
DROP TABLE IF EXISTS `proveedoresrecibosvalores`;
CREATE TABLE `proveedoresrecibosvalores` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `ValorCodigo` varchar(4) NOT NULL DEFAULT '',
  `ValorFecha` date DEFAULT NULL,
  `ValorSucursal` varchar(4) DEFAULT NULL,
  `ValorNumero` varchar(50) DEFAULT NULL,
  `Valorbanco` varchar(4) DEFAULT NULL,
  `ValorImporte` double(15,3) DEFAULT '0.000',
  `ChequeCodigo` int(11) DEFAULT NULL,
  `ValorObservaciones` varchar(254) DEFAULT NULL,
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `proveedoresrecibosvalores_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `proveedoresreciboscabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for proveedores_retenciones
-- ----------------------------
DROP TABLE IF EXISTS `proveedores_retenciones`;
CREATE TABLE `proveedores_retenciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proveedor_codigo` varchar(20) NOT NULL,
  `fecha` date NOT NULL,
  `documento_tipo` varchar(4) DEFAULT NULL,
  `documento_sucursal` varchar(4) DEFAULT NULL,
  `documento_numero` varchar(8) DEFAULT NULL,
  `importe_total` double(15,2) DEFAULT NULL,
  `importe_retencion` double(15,2) DEFAULT NULL,
  `fecha_anulacion` date DEFAULT NULL,
  `aplica_retencion_general_codigo` varchar(2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aplica_retencion_general_codigo` (`aplica_retencion_general_codigo`),
  KEY `proveedor_codigo` (`proveedor_codigo`),
  CONSTRAINT `proveedores_retenciones_fk` FOREIGN KEY (`aplica_retencion_general_codigo`) REFERENCES `retenciones_generales` (`codigo`),
  CONSTRAINT `proveedores_retenciones_fk1` FOREIGN KEY (`proveedor_codigo`) REFERENCES `t_proveedores` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for prv_orden_compra
-- ----------------------------
DROP TABLE IF EXISTS `prv_orden_compra`;
CREATE TABLE `prv_orden_compra` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `Fecha` date DEFAULT NULL,
  `FechaDeEntrega` date DEFAULT NULL,
  `ProveedorCodigo` varchar(8) NOT NULL DEFAULT '',
  `TipoPago` char(2) DEFAULT NULL,
  `ImporteBruto` double(15,2) DEFAULT '0.00',
  `ImporteNeto` double(15,2) DEFAULT '0.00',
  `ImporteAdicional` double(15,2) DEFAULT '0.00',
  `ImporteIva1` double(15,2) DEFAULT '0.00',
  `ImporteIva2` double(15,2) DEFAULT '0.00',
  `Percepcion` double(15,2) DEFAULT '0.00',
  `ImporteTotal` double(15,2) DEFAULT NULL,
  `Observacion` varchar(1000) DEFAULT NULL,
  `ObservacionAnula` varchar(1000) DEFAULT NULL,
  `RemitoNro` varchar(20) DEFAULT NULL,
  `FechaAnulacion` date DEFAULT NULL,
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `ProveedorCodigo` (`ProveedorCodigo`),
  CONSTRAINT `prv_orden_compra_ibfk_1` FOREIGN KEY (`ProveedorCodigo`) REFERENCES `t_proveedores` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for prv_orden_compra_items
-- ----------------------------
DROP TABLE IF EXISTS `prv_orden_compra_items`;
CREATE TABLE `prv_orden_compra_items` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `ProveedorCodigo` varchar(7) DEFAULT NULL,
  `CodigoArticulo` varchar(13) DEFAULT NULL,
  `Cantidad` double(15,2) DEFAULT '0.00',
  `PrecioCostoUnitario` double(15,3) DEFAULT '0.000',
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `ProveedorCodigo` (`ProveedorCodigo`),
  KEY `CodigoArticulo` (`CodigoArticulo`),
  CONSTRAINT `prv_orden_compra_items_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `prv_orden_compra` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`),
  CONSTRAINT `prv_orden_compra_items_ibfk_2` FOREIGN KEY (`CodigoArticulo`) REFERENCES `t_articulos` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for reciboscabeza
-- ----------------------------
DROP TABLE IF EXISTS `reciboscabeza`;
CREATE TABLE `reciboscabeza` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `Fecha` date NOT NULL,
  `ClienteCodigo` varchar(10) NOT NULL,
  `ImporteTotal` double(15,3) DEFAULT '0.000',
  `FechaAnulacion` date DEFAULT NULL,
  `CodigoUsuario` varchar(10) DEFAULT NULL,
  `CajaNumero` varchar(10) DEFAULT NULL,
  `VendedorCodigo` varchar(20) DEFAULT NULL,
  `Referencia` varchar(20) DEFAULT NULL,
  `gmc_diario_general_numero` int(11) DEFAULT NULL,
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `ClienteCodigo` (`ClienteCodigo`),
  KEY `VendedorCodigo` (`VendedorCodigo`),
  KEY `CodigoUsuario` (`CodigoUsuario`),
  CONSTRAINT `reciboscabeza_fk` FOREIGN KEY (`ClienteCodigo`) REFERENCES `t_clientes` (`Codigo`),
  CONSTRAINT `reciboscabeza_fk2` FOREIGN KEY (`CodigoUsuario`) REFERENCES `t_usuarios` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for recibositems
-- ----------------------------
DROP TABLE IF EXISTS `recibositems`;
CREATE TABLE `recibositems` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `FacturaTipo` char(3) NOT NULL DEFAULT '',
  `FacturaSucursal` varchar(4) NOT NULL DEFAULT '',
  `FacturaNumero` varchar(8) NOT NULL DEFAULT '',
  `ImportePagado` double(15,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`FacturaTipo`,`FacturaSucursal`,`FacturaNumero`),
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `recibositems_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `reciboscabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for recibosvalores
-- ----------------------------
DROP TABLE IF EXISTS `recibosvalores`;
CREATE TABLE `recibosvalores` (
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `ValorCodigo` varchar(4) NOT NULL DEFAULT '',
  `ValorFecha` date DEFAULT NULL,
  `ValorSucursal` varchar(4) DEFAULT NULL,
  `ValorNumero` varchar(50) DEFAULT NULL,
  `Valorbanco` varchar(4) DEFAULT NULL,
  `ValorImporte` double(15,3) DEFAULT NULL,
  `ChequeCodigo` int(11) DEFAULT NULL,
  `ValorObservaciones` varchar(254) DEFAULT NULL,
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  CONSTRAINT `recibosvalores_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `reciboscabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for remitos_cabeza
-- ----------------------------
DROP TABLE IF EXISTS `remitos_cabeza`;
CREATE TABLE `remitos_cabeza` (
  `DocumentoTipo` varchar(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(8) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `CodigoCliente` varchar(8) DEFAULT NULL,
  `CodigoUMovil` varchar(4) NOT NULL,
  `FechaEmicion` date NOT NULL DEFAULT '0000-00-00',
  `FechaEntrega` date DEFAULT NULL,
  `FechaEnviado` date DEFAULT NULL,
  `PesoDeCarga` decimal(18,0) DEFAULT NULL,
  `CantidadArticulos` int(11) DEFAULT '0',
  `Observacion` varchar(10) DEFAULT NULL,
  `FechaAnulacion` date DEFAULT NULL,
  `FacturadoFecha` date DEFAULT NULL,
  `FacturaTipo` varchar(3) DEFAULT NULL,
  `FacturaSucursal` varchar(4) DEFAULT NULL,
  `FacturaNumero` varchar(8) DEFAULT NULL,
  `ImporteNeto` double(15,3) NOT NULL DEFAULT '0.000',
  `ImporteIva1` double(15,3) NOT NULL DEFAULT '0.000',
  `ImporteTotal` double(15,3) NOT NULL DEFAULT '0.000',
  `mueve_stock` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `CodigoCliente` (`CodigoCliente`),
  KEY `CodigoUMovil` (`CodigoUMovil`),
  CONSTRAINT `remitos_cabeza_fk` FOREIGN KEY (`CodigoUMovil`) REFERENCES `t_unidadesmoviles` (`Codigo`),
  CONSTRAINT `remitos_cabeza_fk1` FOREIGN KEY (`CodigoCliente`) REFERENCES `t_clientes` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for remitos_items
-- ----------------------------
DROP TABLE IF EXISTS `remitos_items`;
CREATE TABLE `remitos_items` (
  `DocumentoTipo` varchar(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `CodigoArticulo` varchar(10) NOT NULL DEFAULT '',
  `Cantidad` double(15,3) NOT NULL DEFAULT '0.000',
  `PrecioUnitario` double(15,3) NOT NULL DEFAULT '0.000',
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `CodigoArticulo` (`CodigoArticulo`),
  CONSTRAINT `remitos_items_fk` FOREIGN KEY (`CodigoArticulo`) REFERENCES `t_articulos` (`Codigo`),
  CONSTRAINT `remitos_items_ibfk_1` FOREIGN KEY (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`) REFERENCES `remitos_cabeza` (`DocumentoTipo`, `DocumentoSucursal`, `DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for retenciones_escalas
-- ----------------------------
DROP TABLE IF EXISTS `retenciones_escalas`;
CREATE TABLE `retenciones_escalas` (
  `codigo` varchar(2) NOT NULL,
  `monto_desde` double(15,2) DEFAULT '0.00',
  `monto_hasta` double(15,2) DEFAULT '0.00',
  `importe_retencion` double(15,2) DEFAULT '0.00',
  `porcentaje_retencion` double(15,2) DEFAULT '0.00',
  `sobre_excedente` double(15,2) DEFAULT '0.00',
  PRIMARY KEY (`codigo`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for retenciones_generales
-- ----------------------------
DROP TABLE IF EXISTS `retenciones_generales`;
CREATE TABLE `retenciones_generales` (
  `codigo` varchar(2) NOT NULL,
  `descripcion` text,
  `importe_excento` double(15,2) DEFAULT '0.00',
  `porcentaje_alicuota` double(15,2) DEFAULT '0.00',
  `retencion_minima` double(15,2) DEFAULT '0.00',
  `usar_escala` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`codigo`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `retenciones_escala_codigo` (`usar_escala`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for rutas
-- ----------------------------
DROP TABLE IF EXISTS `rutas`;
CREATE TABLE `rutas` (
  `Codigo` varchar(8) NOT NULL,
  `Descripcion` varchar(20) DEFAULT NULL,
  `codVendedor` varchar(8) DEFAULT NULL,
  PRIMARY KEY (`Codigo`),
  KEY `codVendedor` (`codVendedor`),
  CONSTRAINT `rutas_fk` FOREIGN KEY (`codVendedor`) REFERENCES `t_vendedores` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for rutas_articulos
-- ----------------------------
DROP TABLE IF EXISTS `rutas_articulos`;
CREATE TABLE `rutas_articulos` (
  `codRuta` varchar(8) NOT NULL,
  `codArticulo` varchar(13) NOT NULL DEFAULT '',
  PRIMARY KEY (`codRuta`,`codArticulo`),
  KEY `codRuta` (`codRuta`),
  KEY `codArticulo` (`codArticulo`),
  CONSTRAINT `rutas_articulos_fk` FOREIGN KEY (`codRuta`) REFERENCES `rutas` (`Codigo`),
  CONSTRAINT `rutas_articulos_fk1` FOREIGN KEY (`codArticulo`) REFERENCES `t_articulos` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for rutas_clientes
-- ----------------------------
DROP TABLE IF EXISTS `rutas_clientes`;
CREATE TABLE `rutas_clientes` (
  `codRuta` varchar(8) NOT NULL,
  `codCliente` varchar(8) NOT NULL,
  `orden_visita` int(11) NOT NULL DEFAULT '0',
  KEY `codRuta` (`codRuta`,`codCliente`),
  KEY `codRuta_2` (`codRuta`),
  KEY `codCliente` (`codCliente`),
  CONSTRAINT `rutas_clientes_fk` FOREIGN KEY (`codRuta`) REFERENCES `rutas` (`Codigo`),
  CONSTRAINT `rutas_clientes_fk1` FOREIGN KEY (`codCliente`) REFERENCES `t_clientes` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for rutas_entrega
-- ----------------------------
DROP TABLE IF EXISTS `rutas_entrega`;
CREATE TABLE `rutas_entrega` (
  `Codigo` int(11) NOT NULL,
  `Descripcion` varchar(50) DEFAULT NULL,
  `TransporteCodigo` varchar(3) DEFAULT NULL,
  PRIMARY KEY (`Codigo`),
  KEY `TransporteCodigo` (`TransporteCodigo`),
  CONSTRAINT `rutas_entrega_fk` FOREIGN KEY (`TransporteCodigo`) REFERENCES `t_transportes` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for rutas_entrega_clientes
-- ----------------------------
DROP TABLE IF EXISTS `rutas_entrega_clientes`;
CREATE TABLE `rutas_entrega_clientes` (
  `codRutaEntrega` int(11) NOT NULL,
  `codCliente` varchar(8) NOT NULL,
  PRIMARY KEY (`codRutaEntrega`,`codCliente`),
  KEY `codRutaEntrega` (`codRutaEntrega`),
  KEY `codCliente` (`codCliente`),
  CONSTRAINT `rutas_entrega_clientes_fk` FOREIGN KEY (`codRutaEntrega`) REFERENCES `rutas_entrega` (`Codigo`),
  CONSTRAINT `rutas_entrega_clientes_fk1` FOREIGN KEY (`codCliente`) REFERENCES `t_clientes` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for sys_errores
-- ----------------------------
DROP TABLE IF EXISTS `sys_errores`;
CREATE TABLE `sys_errores` (
  `Id` int(11) NOT NULL AUTO_INCREMENT,
  `Descripcion` text CHARACTER SET latin1,
  `UltimaConsulta` text CHARACTER SET latin1,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for tmp_cc_clientes_valores
-- ----------------------------
DROP TABLE IF EXISTS `tmp_cc_clientes_valores`;
CREATE TABLE `tmp_cc_clientes_valores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `cliente_codigo` varchar(20) NOT NULL,
  `importe` double(15,3) DEFAULT NULL,
  `usuario_codigo` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for tmp_compras_iva
-- ----------------------------
DROP TABLE IF EXISTS `tmp_compras_iva`;
CREATE TABLE `tmp_compras_iva` (
  `DocumentoTipo` varchar(4) NOT NULL,
  `DocumentoSucursal` varchar(4) NOT NULL,
  `DocumentoNumero` varchar(8) NOT NULL,
  `ProveedorCodigo` varchar(8) DEFAULT NULL,
  `Fecha` date NOT NULL,
  `ImporteNeto` double(15,2) DEFAULT '0.00',
  `ImporteIva1` double(15,2) DEFAULT '0.00',
  `ImporteIva2` double(15,2) DEFAULT '0.00',
  `IngresosBrutos` double(15,2) DEFAULT '0.00',
  `OtrosImpuestos1` double(15,2) DEFAULT '0.00',
  `OtrosImpuestos2` double(15,2) DEFAULT '0.00',
  `OtrosImpuestos3` double(15,2) DEFAULT '0.00',
  `ImporteTotal` double(15,2) DEFAULT '0.00',
  `UsuarioCodigo` varchar(20) NOT NULL,
  KEY `DocumentoTipo` (`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`),
  KEY `ProveedorCodigo` (`ProveedorCodigo`),
  KEY `UsuarioCodigo` (`UsuarioCodigo`),
  KEY `Fecha` (`Fecha`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for tmp_costosymargenes
-- ----------------------------
DROP TABLE IF EXISTS `tmp_costosymargenes`;
CREATE TABLE `tmp_costosymargenes` (
  `codigo_usuario` varchar(10) NOT NULL,
  `codigo_articulo` varchar(13) NOT NULL DEFAULT '',
  `desc_articulo` varchar(200) NOT NULL,
  `stock_inicial` double NOT NULL,
  `costo_unitario_inicial` double NOT NULL,
  `total_unidades_vendidas` double NOT NULL,
  `total_importe_ventas` double NOT NULL,
  `sum_total_importe_ventas` double NOT NULL DEFAULT '0',
  `stock_incrementado` double NOT NULL,
  `costo_uni_periodo` double NOT NULL DEFAULT '0',
  `fecha_desde` date NOT NULL,
  `fecha_hasta` date NOT NULL,
  PRIMARY KEY (`codigo_usuario`,`codigo_articulo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='Informe_MargenesYCostos';

-- ----------------------------
-- Table structure for tmp_documentos_deuda
-- ----------------------------
DROP TABLE IF EXISTS `tmp_documentos_deuda`;
CREATE TABLE `tmp_documentos_deuda` (
  `codigo_usuario` varchar(10) NOT NULL,
  `documento_tipo` varchar(3) NOT NULL,
  `documento_sucursal` varchar(4) NOT NULL,
  `documento_numero` varchar(8) NOT NULL,
  `codigo_cliente` varchar(8) NOT NULL,
  `fecha` date NOT NULL,
  `importe_total` double NOT NULL,
  `importe_pagado` double NOT NULL,
  `importe_deuda` double NOT NULL,
  PRIMARY KEY (`codigo_usuario`,`documento_tipo`,`documento_sucursal`,`documento_numero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for tmp_movimientos_cc
-- ----------------------------
DROP TABLE IF EXISTS `tmp_movimientos_cc`;
CREATE TABLE `tmp_movimientos_cc` (
  `codigo_usuario` varchar(10) NOT NULL,
  `DocumentoTipo` varchar(4) NOT NULL,
  `DocumentoSucursal` varchar(4) NOT NULL,
  `DocumentoNumero` varchar(150) NOT NULL,
  `CodCliente` varchar(10) NOT NULL,
  `Fecha` date NOT NULL,
  `Debe` double NOT NULL,
  `Haber` double NOT NULL,
  PRIMARY KEY (`codigo_usuario`,`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='TB temp para la lectura de movimientos en cuentas corrientes';

-- ----------------------------
-- Table structure for tmp_movimientos_cc_rango
-- ----------------------------
DROP TABLE IF EXISTS `tmp_movimientos_cc_rango`;
CREATE TABLE `tmp_movimientos_cc_rango` (
  `codigo_usuario` varchar(10) NOT NULL,
  `DocumentoTipo` varchar(4) DEFAULT NULL,
  `DocumentoSucursal` varchar(4) DEFAULT NULL,
  `DocumentoNumero` varchar(8) DEFAULT NULL,
  `CodCliente` varchar(10) DEFAULT NULL,
  `Fecha` date DEFAULT NULL,
  `Debe` double DEFAULT NULL,
  `Haber` double DEFAULT NULL,
  `Descripcion` varchar(60) DEFAULT NULL,
  `SaldoAnterior` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='Tmb Tab para detalle de cc en rango de fechas';

-- ----------------------------
-- Table structure for tmp_prv_documentos_deuda
-- ----------------------------
DROP TABLE IF EXISTS `tmp_prv_documentos_deuda`;
CREATE TABLE `tmp_prv_documentos_deuda` (
  `codigo_usuario` varchar(10) NOT NULL,
  `documento_tipo` varchar(3) NOT NULL,
  `documento_sucursal` varchar(4) NOT NULL,
  `documento_numero` varchar(8) NOT NULL,
  `codigo_proveedor` varchar(10) NOT NULL,
  `fecha` date NOT NULL,
  `importe_total` double NOT NULL,
  `importe_pagado` double NOT NULL,
  `importe_deuda` double NOT NULL,
  PRIMARY KEY (`codigo_usuario`,`documento_tipo`,`documento_sucursal`,`documento_numero`,`codigo_proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for tmp_prv_movimientos_cc
-- ----------------------------
DROP TABLE IF EXISTS `tmp_prv_movimientos_cc`;
CREATE TABLE `tmp_prv_movimientos_cc` (
  `codigo_usuario` varchar(10) NOT NULL,
  `DocumentoTipo` varchar(4) NOT NULL,
  `DocumentoSucursal` varchar(4) NOT NULL,
  `DocumentoNumero` varchar(8) NOT NULL,
  `CodProveedor` varchar(10) NOT NULL,
  `Fecha` date NOT NULL,
  `Debe` double NOT NULL,
  `Haber` double NOT NULL,
  PRIMARY KEY (`codigo_usuario`,`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`,`CodProveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='TB temp para la lectura de movimientos en cuentas corrientes';

-- ----------------------------
-- Table structure for tmp_prv_movimientos_cc_rango
-- ----------------------------
DROP TABLE IF EXISTS `tmp_prv_movimientos_cc_rango`;
CREATE TABLE `tmp_prv_movimientos_cc_rango` (
  `codigo_usuario` varchar(10) NOT NULL,
  `DocumentoTipo` varchar(4) DEFAULT NULL,
  `DocumentoSucursal` varchar(4) DEFAULT NULL,
  `DocumentoNumero` varchar(8) DEFAULT NULL,
  `CodProveedor` varchar(10) DEFAULT NULL,
  `Fecha` date DEFAULT NULL,
  `Debe` double DEFAULT NULL,
  `Haber` double DEFAULT NULL,
  `Descripcion` varchar(60) DEFAULT NULL,
  `SaldoAnterior` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='Tmb Tab para detalle de cc en rango de fechas';

-- ----------------------------
-- Table structure for tmp_resumen_ventas_cobros
-- ----------------------------
DROP TABLE IF EXISTS `tmp_resumen_ventas_cobros`;
CREATE TABLE `tmp_resumen_ventas_cobros` (
  `UsuarioCodigo` varchar(10) DEFAULT NULL,
  `VendedorCodigo` varchar(20) DEFAULT NULL,
  `TotalVendido` double(15,2) DEFAULT '0.00',
  `TotalCobrado` double(15,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for tmp_seguimientodecostos
-- ----------------------------
DROP TABLE IF EXISTS `tmp_seguimientodecostos`;
CREATE TABLE `tmp_seguimientodecostos` (
  `ArticuloDescripcion` varchar(60) DEFAULT NULL,
  `Fecha` varchar(30) DEFAULT NULL,
  `PrecioCosto` float(9,3) DEFAULT NULL,
  `ProveedorDescripcion` varchar(100) DEFAULT NULL,
  `UsuarioCodigo` varchar(100) DEFAULT NULL,
  `Fecha2` date DEFAULT NULL,
  `PrecioVenta` float(9,3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for tmp_ventas_articulos
-- ----------------------------
DROP TABLE IF EXISTS `tmp_ventas_articulos`;
CREATE TABLE `tmp_ventas_articulos` (
  `codigo_usuario` varchar(10) NOT NULL,
  `CodigoArticulo` varchar(13) DEFAULT NULL,
  `Descripcion` varchar(100) NOT NULL,
  `VendedorCodigo` varchar(20) DEFAULT NULL,
  `Peso` float NOT NULL,
  `RubroCodigo` varchar(4) NOT NULL,
  `CantTotal` double(10,0) NOT NULL,
  `ImpTotal` double(10,0) NOT NULL,
  `unidadventa` varchar(20) DEFAULT NULL,
  `RubroDesc` varchar(50) DEFAULT NULL,
  `PrecioProm` double(15,3) DEFAULT NULL,
  KEY `codigo_usuario` (`codigo_usuario`,`CodigoArticulo`),
  KEY `usuario` (`codigo_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='Tb temp ventas de articulos';

-- ----------------------------
-- Table structure for tmp_ventas_clientes
-- ----------------------------
DROP TABLE IF EXISTS `tmp_ventas_clientes`;
CREATE TABLE `tmp_ventas_clientes` (
  `codigo_usuario` varchar(10) NOT NULL,
  `CodCliente` varchar(10) NOT NULL,
  `DescCliente` varchar(100) NOT NULL,
  `CantTotal` double NOT NULL,
  `ImpTotal` double NOT NULL,
  `PesoTotal` double(15,3) NOT NULL,
  PRIMARY KEY (`codigo_usuario`,`CodCliente`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='Tb temp de clientes con ventas';

-- ----------------------------
-- Table structure for tmp_ventas_clientes_detalle
-- ----------------------------
DROP TABLE IF EXISTS `tmp_ventas_clientes_detalle`;
CREATE TABLE `tmp_ventas_clientes_detalle` (
  `codigo_usuario` varchar(10) NOT NULL,
  `CodigoArticulo` varchar(13) NOT NULL DEFAULT '',
  `DescArticulo` varchar(100) NOT NULL,
  `CantTotal` double NOT NULL,
  `PesoTotal` double NOT NULL,
  `ImpTotal` double NOT NULL,
  `ClienteCodigo` varchar(10) NOT NULL,
  `CodigoProveedor` varchar(8) NOT NULL,
  `CodigoRubro` varchar(4) NOT NULL,
  PRIMARY KEY (`codigo_usuario`,`CodigoArticulo`,`ClienteCodigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for tmp_ventas_clientes_periodos
-- ----------------------------
DROP TABLE IF EXISTS `tmp_ventas_clientes_periodos`;
CREATE TABLE `tmp_ventas_clientes_periodos` (
  `ClienteCodigo` varchar(15) NOT NULL,
  `ClienteDesc` varchar(200) NOT NULL,
  `Anio` varchar(4) NOT NULL,
  `Mes` int(11) NOT NULL,
  `MesLiteral` varchar(20) NOT NULL,
  `KgTotal` double(15,3) DEFAULT '0.000',
  `ImporteTotal` double(15,3) DEFAULT '0.000',
  PRIMARY KEY (`ClienteCodigo`),
  CONSTRAINT `tmp_ventas_clientes_periodos_fk` FOREIGN KEY (`ClienteCodigo`) REFERENCES `t_clientes` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for tmp_ventas_iva
-- ----------------------------
DROP TABLE IF EXISTS `tmp_ventas_iva`;
CREATE TABLE `tmp_ventas_iva` (
  `CodigoUsuario` varchar(10) NOT NULL DEFAULT '',
  `DocumentoTipo` char(3) NOT NULL DEFAULT '',
  `DocumentoSucursal` varchar(4) NOT NULL DEFAULT '',
  `DocumentoNumero` varchar(8) NOT NULL DEFAULT '',
  `ClienteCodigo` varchar(8) DEFAULT NULL,
  `cuit` varchar(11) DEFAULT NULL,
  `ClienteDescrip` varchar(50) DEFAULT NULL,
  `Fecha` date DEFAULT NULL,
  `ImporteNeto` double DEFAULT NULL,
  `ImporteIva1` double DEFAULT NULL,
  `ImporteIva2` double DEFAULT NULL,
  `ImporteIIBB` double(15,2) DEFAULT '0.00',
  `ImporteTotal` double DEFAULT NULL,
  PRIMARY KEY (`CodigoUsuario`,`DocumentoTipo`,`DocumentoSucursal`,`DocumentoNumero`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for tmp_ventas_vendedor
-- ----------------------------
DROP TABLE IF EXISTS `tmp_ventas_vendedor`;
CREATE TABLE `tmp_ventas_vendedor` (
  `codigo_usuario` varchar(10) NOT NULL,
  `CantTotal` double NOT NULL,
  `PesoTotal` double NOT NULL,
  `ImpTotal` double NOT NULL,
  `Fecha` varchar(20) NOT NULL,
  `Orden` int(11) DEFAULT NULL,
  PRIMARY KEY (`codigo_usuario`,`Fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_articulos
-- ----------------------------
DROP TABLE IF EXISTS `t_articulos`;
CREATE TABLE `t_articulos` (
  `Codigo` varchar(13) NOT NULL,
  `Descripcion` varchar(200) NOT NULL,
  `Existencia` double DEFAULT NULL,
  `ExistenciaMinima` double DEFAULT '0',
  `ExistenciaMaxima` double DEFAULT '0',
  `PrecioCostoMasImp` double DEFAULT '0',
  `PorcentajeIVA1` double DEFAULT '0',
  `PorcentajeIVA2` double DEFAULT '0',
  `PrecioCosto` double DEFAULT NULL,
  `UnidadVenta` char(3) DEFAULT NULL,
  `Lista1` double DEFAULT NULL,
  `Lista2` double DEFAULT NULL,
  `Lista3` double DEFAULT NULL,
  `Lista4` double DEFAULT NULL,
  `Lista5` double DEFAULT NULL,
  `ProveedorCodigo` varchar(7) DEFAULT NULL,
  `RubroCodigo` varchar(4) DEFAULT NULL,
  `Peso` double DEFAULT '0',
  `SiempreSeDescarga` tinyint(3) unsigned DEFAULT NULL,
  `Iva2SobreNeto` tinyint(1) DEFAULT '0',
  `PorcentajeVendedor` double DEFAULT NULL,
  `DescuentoXCantidad` varchar(245) DEFAULT NULL,
  `SeVende` tinyint(1) DEFAULT '1',
  `Activo` tinyint(1) DEFAULT '1',
  `EnviadoACentral` int(11) DEFAULT NULL,
  `RequiereFrio` tinyint(1) DEFAULT '0',
  `FamiliaCodigo` varchar(2) DEFAULT NULL,
  `SubFamiliaCodigo` varchar(4) DEFAULT NULL,
  `ProveedorArticuloCodigo` varchar(20) DEFAULT ' ',
  `EsCompuesto` tinyint(1) NOT NULL DEFAULT '0',
  `UV_OrdenDeEntrega` char(3) DEFAULT NULL,
  `UbicacionDeposito` varchar(100) DEFAULT NULL,
  `CodigoBarras` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`Codigo`),
  KEY `ProveedorCodigo` (`ProveedorCodigo`),
  KEY `RubroCodigo` (`RubroCodigo`),
  KEY `UnidadVenta` (`UnidadVenta`),
  KEY `FamiliaCodigo` (`FamiliaCodigo`),
  KEY `SubFamiliaCodigo` (`SubFamiliaCodigo`),
  CONSTRAINT `t_articulos_fk` FOREIGN KEY (`ProveedorCodigo`) REFERENCES `t_proveedores` (`Codigo`),
  CONSTRAINT `t_articulos_fk1` FOREIGN KEY (`RubroCodigo`) REFERENCES `t_rubros` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_articulosadescargartmp
-- ----------------------------
DROP TABLE IF EXISTS `t_articulosadescargartmp`;
CREATE TABLE `t_articulosadescargartmp` (
  `CodigoArticulo` varchar(13) NOT NULL DEFAULT '',
  `CodigoUMovil` varchar(4) NOT NULL DEFAULT '',
  `Cantidad` double NOT NULL DEFAULT '0',
  `Fecha` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_articulosumoviles
-- ----------------------------
DROP TABLE IF EXISTS `t_articulosumoviles`;
CREATE TABLE `t_articulosumoviles` (
  `CodigoArticulo` varchar(13) NOT NULL DEFAULT '',
  `CodigoUMovil` varchar(4) NOT NULL DEFAULT '',
  `Lista1` double DEFAULT NULL,
  `Lista2` double DEFAULT NULL,
  `Lista3` double DEFAULT NULL,
  `Lista4` double DEFAULT NULL,
  `Lista5` double DEFAULT NULL,
  `Existencia` double DEFAULT NULL,
  `CodigoRubro` varchar(4) DEFAULT NULL,
  `Actualizado` tinyint(3) unsigned DEFAULT NULL,
  KEY `CodigoArticulo` (`CodigoArticulo`),
  KEY `CodigoUMovil` (`CodigoUMovil`),
  KEY `CodigoArticulo_2` (`CodigoArticulo`,`CodigoUMovil`),
  CONSTRAINT `t_articulosumoviles_ibfk_1` FOREIGN KEY (`CodigoArticulo`) REFERENCES `t_articulos` (`Codigo`),
  CONSTRAINT `t_articulosumoviles_ibfk_2` FOREIGN KEY (`CodigoUMovil`) REFERENCES `t_unidadesmoviles` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_articulos_composicion
-- ----------------------------
DROP TABLE IF EXISTS `t_articulos_composicion`;
CREATE TABLE `t_articulos_composicion` (
  `ArticuloCodigo` varchar(13) NOT NULL,
  `ArticuloComponenteCodigo` varchar(13) NOT NULL,
  `Cantidad` float(9,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`ArticuloCodigo`,`ArticuloComponenteCodigo`),
  KEY `ArticuloCodigo` (`ArticuloCodigo`),
  KEY `ArticuloComponenteCodigo` (`ArticuloComponenteCodigo`),
  CONSTRAINT `t_articulos_composicion_fk` FOREIGN KEY (`ArticuloCodigo`) REFERENCES `t_articulos` (`Codigo`),
  CONSTRAINT `t_articulos_composicion_fk1` FOREIGN KEY (`ArticuloComponenteCodigo`) REFERENCES `t_articulos` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_articulos_familias
-- ----------------------------
DROP TABLE IF EXISTS `t_articulos_familias`;
CREATE TABLE `t_articulos_familias` (
  `Codigo` varchar(2) NOT NULL,
  `Descripcion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_articulos_subfamilias
-- ----------------------------
DROP TABLE IF EXISTS `t_articulos_subfamilias`;
CREATE TABLE `t_articulos_subfamilias` (
  `Codigo` varchar(4) DEFAULT NULL,
  `Descripcion` varchar(50) DEFAULT NULL,
  `FamiliaCodigo` varchar(2) DEFAULT NULL,
  KEY `FamiliaCodigo` (`FamiliaCodigo`),
  KEY `Codigo` (`Codigo`),
  CONSTRAINT `t_articulos_subfamilias_fk` FOREIGN KEY (`FamiliaCodigo`) REFERENCES `t_articulos_familias` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_articulos_unidades_alternativas
-- ----------------------------
DROP TABLE IF EXISTS `t_articulos_unidades_alternativas`;
CREATE TABLE `t_articulos_unidades_alternativas` (
  `ArticuloCodigo` varchar(13) DEFAULT NULL,
  `UnidadVentaCodigo` varchar(3) DEFAULT NULL,
  `Cantidad` double(15,3) DEFAULT NULL,
  KEY `ArticuloCodigo` (`ArticuloCodigo`,`UnidadVentaCodigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_bancos
-- ----------------------------
DROP TABLE IF EXISTS `t_bancos`;
CREATE TABLE `t_bancos` (
  `Codigo` varchar(4) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_caja_conceptos
-- ----------------------------
DROP TABLE IF EXISTS `t_caja_conceptos`;
CREATE TABLE `t_caja_conceptos` (
  `Codigo` varchar(4) NOT NULL,
  `Descripcion` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_canales
-- ----------------------------
DROP TABLE IF EXISTS `t_canales`;
CREATE TABLE `t_canales` (
  `Codigo` varchar(4) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  `CanalGrupoCodigo` int(11) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_categoriasiva
-- ----------------------------
DROP TABLE IF EXISTS `t_categoriasiva`;
CREATE TABLE `t_categoriasiva` (
  `Codigo` char(1) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  `Porcentaje1` int(11) DEFAULT NULL,
  `Porcentaje2` int(11) DEFAULT NULL,
  `Documento` char(1) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_clientes
-- ----------------------------
DROP TABLE IF EXISTS `t_clientes`;
CREATE TABLE `t_clientes` (
  `Codigo` varchar(8) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  `NombreFantasia` varchar(80) DEFAULT NULL,
  `Cuit` varchar(11) DEFAULT NULL,
  `Calle` varchar(50) DEFAULT NULL,
  `Numero` varchar(15) DEFAULT NULL,
  `Piso` varchar(10) DEFAULT NULL,
  `Departamento` varchar(10) DEFAULT NULL,
  `ProvinciaCodigo` varchar(3) DEFAULT NULL,
  `CodigoPostal` varchar(10) DEFAULT NULL,
  `Localidad` varchar(50) DEFAULT NULL,
  `ContactoNombre` varchar(100) DEFAULT NULL,
  `Mail` varchar(50) DEFAULT NULL,
  `Telefono` varchar(50) DEFAULT NULL,
  `TelefonoMovil` varchar(50) DEFAULT NULL,
  `ContactoComercial` text COMMENT 'en el sistema se usa como observaciones',
  `CategoriaIva` char(1) DEFAULT NULL,
  `ListaPrecio` char(1) DEFAULT NULL,
  `ImporteDeuda` double(15,2) DEFAULT '0.00',
  `CodigoVendedor` varchar(20) DEFAULT NULL,
  `Actualizado` tinyint(3) unsigned DEFAULT NULL,
  `SaldoNTCNoAplicado` double(15,2) DEFAULT '0.00',
  `Activo` tinyint(1) unsigned zerofill DEFAULT '0',
  `LimiteCredito` double(15,2) DEFAULT '0.00',
  `CanalCodigo` varchar(2) DEFAULT NULL,
  `FechaDeAlta` date DEFAULT NULL,
  `FechaDeBaja` date DEFAULT NULL,
  `TransporteCodigo` varchar(3) DEFAULT NULL,
  `DirEntregaCalle` varchar(50) DEFAULT NULL,
  `DirEntregaNumero` varchar(10) DEFAULT NULL,
  `DirEntregaPiso` varchar(3) DEFAULT NULL,
  `DirEntregaDpto` varchar(5) DEFAULT NULL,
  `DirEntregaProvinciaCodigo` varchar(3) DEFAULT NULL,
  `DirEntregaLocalidadCodigo` varchar(10) DEFAULT NULL,
  `CondicionVentaCodigo` varchar(3) DEFAULT NULL,
  `PorcentajeBonificacionGeneral` double(15,2) DEFAULT '0.00',
  `GrupoPercepcionIIBBCodigo` varchar(10) DEFAULT NULL,
  `PorcentajePercepcionIIBB` double(15,2) DEFAULT '0.00',
  `GrupoCodigo` varchar(20) DEFAULT NULL,
  `cant_facturas_impagas_max` int(11) DEFAULT '0',
  `ZonaCodigo` varchar(3) DEFAULT NULL,
  `InvCuentaVentas` int(11) DEFAULT NULL,
  `CliCuentaCredito` int(11) DEFAULT NULL,
  `TipoDocumento` varchar(2) DEFAULT NULL,
  `CodigoLocalidad` varchar(8) DEFAULT NULL,
  PRIMARY KEY (`Codigo`),
  KEY `CodigoVendedor` (`CodigoVendedor`),
  KEY `CategoriaIva` (`CategoriaIva`),
  KEY `Localidad` (`Localidad`),
  KEY `CanalCodigo` (`CanalCodigo`),
  KEY `TransporteCodigo` (`TransporteCodigo`),
  KEY `CondicionVentaCodigo` (`CondicionVentaCodigo`),
  KEY `GrupoPercepcionIIBBCodigo` (`GrupoPercepcionIIBBCodigo`),
  KEY `GrupoCodigo` (`GrupoCodigo`),
  CONSTRAINT `t_clientes_ibfk_2` FOREIGN KEY (`CategoriaIva`) REFERENCES `t_categoriasiva` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_clientes_grupos
-- ----------------------------
DROP TABLE IF EXISTS `t_clientes_grupos`;
CREATE TABLE `t_clientes_grupos` (
  `Codigo` varchar(20) NOT NULL,
  `Descripcion` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`Codigo`),
  UNIQUE KEY `Codigo` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_codigospostales
-- ----------------------------
DROP TABLE IF EXISTS `t_codigospostales`;
CREATE TABLE `t_codigospostales` (
  `Codigo` varchar(10) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  `Provincia` char(3) DEFAULT NULL,
  PRIMARY KEY (`Codigo`),
  KEY `Provincia` (`Provincia`),
  CONSTRAINT `t_codigospostales_ibfk_1` FOREIGN KEY (`Provincia`) REFERENCES `t_provincias` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_comprobantes
-- ----------------------------
DROP TABLE IF EXISTS `t_comprobantes`;
CREATE TABLE `t_comprobantes` (
  `CodigoAfip` varchar(3) DEFAULT NULL,
  `Codigo` varchar(4) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) NOT NULL,
  `Reporte` varchar(100) DEFAULT NULL,
  `Modulo` varchar(3) DEFAULT NULL COMMENT 'VEN=Ventas\r\nCOM=Compras\r\nMER=Mercaderias',
  `Tipo` varchar(3) DEFAULT NULL COMMENT 'FAC=Facturas\r\nNTC=Nota de Credito',
  `Activo` tinyint(4) DEFAULT '1',
  `UsaFacturaElectronica` bit(1) DEFAULT b'0',
  `UsaControladorFiscal` bit(1) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AVG_ROW_LENGTH=468;

-- ----------------------------
-- Table structure for t_condiciones_venta
-- ----------------------------
DROP TABLE IF EXISTS `t_condiciones_venta`;
CREATE TABLE `t_condiciones_venta` (
  `Codigo` varchar(2) DEFAULT NULL,
  `Descripcion` varchar(50) DEFAULT NULL,
  `CantidadDias` int(11) DEFAULT '0',
  KEY `Codigo` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_configuracion
-- ----------------------------
DROP TABLE IF EXISTS `t_configuracion`;
CREATE TABLE `t_configuracion` (
  `Codigo` varchar(500) NOT NULL,
  `Descripcion` varchar(200) DEFAULT NULL,
  `ValorConfig` text NOT NULL,
  `pasar_a_ipaqs` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_configuracion vieja
-- ----------------------------
DROP TABLE IF EXISTS `t_configuracion vieja`;
CREATE TABLE `t_configuracion vieja` (
  `Codigo` varchar(500) NOT NULL,
  `Descripcion` varchar(200) DEFAULT NULL,
  `valorConfig` varchar(200) DEFAULT NULL,
  `pasar_a_ipaqs` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_coordenadas_prn
-- ----------------------------
DROP TABLE IF EXISTS `t_coordenadas_prn`;
CREATE TABLE `t_coordenadas_prn` (
  `codigo` varchar(20) NOT NULL,
  `descripcion` varchar(50) DEFAULT NULL,
  `y` int(11) DEFAULT NULL,
  `x` int(11) DEFAULT NULL,
  `ancho` int(11) DEFAULT NULL,
  `Activo` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_dias
-- ----------------------------
DROP TABLE IF EXISTS `t_dias`;
CREATE TABLE `t_dias` (
  `Codigo` char(1) NOT NULL DEFAULT '',
  `Descripcion` varchar(20) NOT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_documentos
-- ----------------------------
DROP TABLE IF EXISTS `t_documentos`;
CREATE TABLE `t_documentos` (
  `Codigo` char(1) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  `CantidadRenglones` int(11) DEFAULT NULL,
  `NombreReporte` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_filtros
-- ----------------------------
DROP TABLE IF EXISTS `t_filtros`;
CREATE TABLE `t_filtros` (
  `Codigo` int(11) NOT NULL AUTO_INCREMENT,
  `Descripcion` varchar(50) DEFAULT NULL,
  `formulario` varchar(100) DEFAULT NULL,
  `valor` text,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_gastosdescripcion
-- ----------------------------
DROP TABLE IF EXISTS `t_gastosdescripcion`;
CREATE TABLE `t_gastosdescripcion` (
  `Codigo` char(3) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) NOT NULL,
  `CodigoTipo` char(2) NOT NULL DEFAULT '',
  PRIMARY KEY (`Codigo`,`CodigoTipo`),
  KEY `CodigoTipo` (`CodigoTipo`),
  KEY `Codigo` (`Codigo`),
  CONSTRAINT `t_gastosdescripcion_ibfk_1` FOREIGN KEY (`CodigoTipo`) REFERENCES `t_tiposdegastos` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_numeroscontrol
-- ----------------------------
DROP TABLE IF EXISTS `t_numeroscontrol`;
CREATE TABLE `t_numeroscontrol` (
  `Codigo` char(3) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  `NumeroProximo` int(11) DEFAULT NULL,
  `Copias` int(11) DEFAULT NULL,
  `Sucursal` varchar(4) NOT NULL,
  PRIMARY KEY (`Codigo`,`Sucursal`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_objetivos
-- ----------------------------
DROP TABLE IF EXISTS `t_objetivos`;
CREATE TABLE `t_objetivos` (
  `Mes` int(4) NOT NULL,
  `Anio` int(4) NOT NULL,
  `Rubro` varchar(4) NOT NULL,
  `VolumenObjetivo` double(15,2) DEFAULT '0.00',
  `FacturacionObjetivo` double(15,2) DEFAULT '0.00',
  `VolumenReal` double(15,2) DEFAULT '0.00',
  `FacturacionReal` double(15,2) DEFAULT '0.00',
  `FechaProceso` datetime DEFAULT NULL,
  PRIMARY KEY (`Mes`,`Anio`,`Rubro`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_objetivos_vendedores
-- ----------------------------
DROP TABLE IF EXISTS `t_objetivos_vendedores`;
CREATE TABLE `t_objetivos_vendedores` (
  `Mes` int(4) NOT NULL,
  `Anio` int(4) NOT NULL,
  `Rubro` varchar(4) NOT NULL,
  `VendedorCodigo` varchar(20) NOT NULL,
  `VolumenObjetivo` double(15,2) DEFAULT '0.00',
  `FacturacionObjetivo` double(15,2) DEFAULT '0.00',
  `VolumenReal` double(15,2) DEFAULT '0.00',
  `FacturacionReal` double(15,2) DEFAULT '0.00',
  `FechaProceso` date DEFAULT NULL,
  PRIMARY KEY (`Mes`,`Anio`,`Rubro`,`VendedorCodigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_opcionesasignadas
-- ----------------------------
DROP TABLE IF EXISTS `t_opcionesasignadas`;
CREATE TABLE `t_opcionesasignadas` (
  `Codigo` varchar(10) DEFAULT NULL,
  `Opcion` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_percepciones_iibb_grupos
-- ----------------------------
DROP TABLE IF EXISTS `t_percepciones_iibb_grupos`;
CREATE TABLE `t_percepciones_iibb_grupos` (
  `Codigo` int(11) NOT NULL AUTO_INCREMENT,
  `Descripcion` varchar(50) DEFAULT NULL,
  `Porcentaje` double(15,3) DEFAULT NULL,
  `ImporteDesde` double(15,3) DEFAULT '0.000',
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_perfiles
-- ----------------------------
DROP TABLE IF EXISTS `t_perfiles`;
CREATE TABLE `t_perfiles` (
  `PerfilId` int(11) NOT NULL AUTO_INCREMENT,
  `Descripcion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`PerfilId`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1 PACK_KEYS=0;

-- ----------------------------
-- Table structure for t_proveedores
-- ----------------------------
DROP TABLE IF EXISTS `t_proveedores`;
CREATE TABLE `t_proveedores` (
  `Codigo` varchar(8) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  `Cuit` varchar(11) DEFAULT NULL,
  `Calle` varchar(50) DEFAULT NULL,
  `Numero` varchar(15) DEFAULT NULL,
  `Piso` varchar(10) DEFAULT NULL,
  `Departamento` varchar(10) DEFAULT NULL,
  `CodigoPostal` varchar(10) DEFAULT NULL,
  `Telefono` varchar(50) DEFAULT NULL,
  `Mail` varchar(50) DEFAULT NULL,
  `ContactoComercial` varchar(50) DEFAULT NULL,
  `ImporteDeuda` double DEFAULT '0',
  `Enviado` int(11) DEFAULT '0',
  `SaldoNTCNoAplicado` double DEFAULT '0',
  `retenciones_generales_codigo` varchar(2) DEFAULT NULL,
  `CondicionVentaCodigo` varchar(2) DEFAULT NULL,
  `ProveedorTipoCodigo` varchar(3) DEFAULT NULL,
  `InvCuentaCompras` int(11) DEFAULT NULL,
  PRIMARY KEY (`Codigo`),
  KEY `CodigoPostal` (`CodigoPostal`),
  KEY `retenciones_generales_codigo` (`retenciones_generales_codigo`),
  CONSTRAINT `t_proveedores_fk` FOREIGN KEY (`retenciones_generales_codigo`) REFERENCES `retenciones_generales` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_proveedores_tipos
-- ----------------------------
DROP TABLE IF EXISTS `t_proveedores_tipos`;
CREATE TABLE `t_proveedores_tipos` (
  `Codigo` varchar(3) NOT NULL,
  `Descripcion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_provincias
-- ----------------------------
DROP TABLE IF EXISTS `t_provincias`;
CREATE TABLE `t_provincias` (
  `Codigo` char(3) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_rubros
-- ----------------------------
DROP TABLE IF EXISTS `t_rubros`;
CREATE TABLE `t_rubros` (
  `Codigo` varchar(4) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  `RubroGrupoCodigo` varchar(4) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_rubros_grupos
-- ----------------------------
DROP TABLE IF EXISTS `t_rubros_grupos`;
CREATE TABLE `t_rubros_grupos` (
  `codigo` varchar(4) NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`codigo`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_tiposdedocumento
-- ----------------------------
DROP TABLE IF EXISTS `t_tiposdedocumento`;
CREATE TABLE `t_tiposdedocumento` (
  `Codigo` varchar(3) DEFAULT NULL,
  `Descripcion` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_tiposdegastos
-- ----------------------------
DROP TABLE IF EXISTS `t_tiposdegastos`;
CREATE TABLE `t_tiposdegastos` (
  `Codigo` char(2) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) NOT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_transportes
-- ----------------------------
DROP TABLE IF EXISTS `t_transportes`;
CREATE TABLE `t_transportes` (
  `Codigo` varchar(3) NOT NULL,
  `Descripcion` varchar(20) DEFAULT NULL,
  `kg_maximo` double(15,2) NOT NULL DEFAULT '0.00',
  `mt3_maximo` double(15,2) NOT NULL DEFAULT '0.00',
  `estado` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_ultimaoperacion
-- ----------------------------
DROP TABLE IF EXISTS `t_ultimaoperacion`;
CREATE TABLE `t_ultimaoperacion` (
  `UltimaOperacion` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_unidadesmoviles
-- ----------------------------
DROP TABLE IF EXISTS `t_unidadesmoviles`;
CREATE TABLE `t_unidadesmoviles` (
  `Codigo` varchar(4) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  `PathDB` varchar(1000) DEFAULT NULL,
  `EsUnidadMovil` tinyint(4) DEFAULT '0',
  `UnidadCargada` int(11) DEFAULT '0',
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_unidadesventa
-- ----------------------------
DROP TABLE IF EXISTS `t_unidadesventa`;
CREATE TABLE `t_unidadesventa` (
  `Codigo` char(3) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_usuarios
-- ----------------------------
DROP TABLE IF EXISTS `t_usuarios`;
CREATE TABLE `t_usuarios` (
  `Codigo` varchar(10) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  `Clave` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_valores
-- ----------------------------
DROP TABLE IF EXISTS `t_valores`;
CREATE TABLE `t_valores` (
  `Codigo` varchar(4) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  `PideNumero` tinyint(1) DEFAULT NULL,
  `PideFecha` tinyint(1) DEFAULT NULL,
  `PideBanco` tinyint(1) DEFAULT NULL,
  `Sistema` tinyint(1) DEFAULT NULL,
  `PideObservaciones` tinyint(1) DEFAULT '0',
  `EnCobros` tinyint(1) NOT NULL DEFAULT '0',
  `EnPagos` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_vendedores
-- ----------------------------
DROP TABLE IF EXISTS `t_vendedores`;
CREATE TABLE `t_vendedores` (
  `Codigo` varchar(20) NOT NULL DEFAULT '',
  `Descripcion` varchar(50) DEFAULT NULL,
  `Clave` varchar(20) DEFAULT NULL,
  `Activo` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for t_zonas
-- ----------------------------
DROP TABLE IF EXISTS `t_zonas`;
CREATE TABLE `t_zonas` (
  `Codigo` varchar(3) NOT NULL,
  `Descripcion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for ventas_a_cuenta
-- ----------------------------
DROP TABLE IF EXISTS `ventas_a_cuenta`;
CREATE TABLE `ventas_a_cuenta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigoCliente` varchar(255) DEFAULT NULL,
  `codigoArticuloProveedor` varchar(255) DEFAULT NULL,
  `codigoArticulo` varchar(255) DEFAULT NULL,
  `cantidad` double DEFAULT NULL,
  `observacion` varchar(255) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `fechaLimite` date DEFAULT NULL,
  `Descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_articulo` (`codigoArticulo`),
  KEY `fk_cliente` (`codigoCliente`),
  CONSTRAINT `fk_articulo` FOREIGN KEY (`codigoArticulo`) REFERENCES `t_articulos` (`Codigo`),
  CONSTRAINT `fk_cliente` FOREIGN KEY (`codigoCliente`) REFERENCES `t_clientes` (`Codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Procedure structure for Usp_ConsolidaCC_Prc
-- ----------------------------
DROP PROCEDURE IF EXISTS `Usp_ConsolidaCC_Prc`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `Usp_ConsolidaCC_Prc`()
BEGIN
DECLARE done INT DEFAULT 0;
DECLARE xSuma double;
DECLARE xCodCliente varchar(8);
DECLARE xImporteDeuda double;
DECLARE xImpDeudaNtd double;
DECLARE xCurCli CURSOR FOR select codigo from t_clientes;
DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done =1;
update notadebitocabeza SET ImportePagado=round(ImporteTotal,2)
where round(ImporteTotal,2)=round(ImportePagado,2)
and ImportePagado <> ImporteTotal or
ImportePagado > ImporteTotal;
update facturacabeza SET ImportePagado=round(ImporteTotal,2)
where round(ImporteTotal,2)=round(ImportePagado,2)
and ImportePagado <> ImporteTotal
or ImportePagado > ImporteTotal;
update notacreditocabeza SET ImporteUtilizado=round(ImporteTotal,2)
where round(ImporteTotal,2)=round(ImporteUtilizado,2)
and ImporteUtilizado <> ImporteTotal
or ImporteUtilizado > ImporteTotal;
OPEN xCurCli;
     REPEAT
           FETCH xCurCli INTO xCodCliente;
           set xSuma=0;
           set xImporteDeuda=0;
           set xSuma = (select sum(ImporteTotal - ImportePagado) as Resultado
                       from facturacabeza
                       where ImporteTotal - ImportePagado > 0
                       and FechaAnulacion is null and
                       ClienteCodigo=xCodCliente);
          if xSuma >= 0 then
              set xImporteDeuda=xSuma;
          end if;
          set xSuma = (select sum(ImporteTotal - ImportePagado) as ResultadoNtd
                    from notadebitocabeza
                    where ImporteTotal - ImportePagado > 0 and FechaAnulacion is null and
                    ClienteCodigo=xCodCliente);
          if xSuma >= 0 then
             set xImporteDeuda=(xImporteDeuda + xSuma);
          end if;
           update t_clientes set ImporteDeuda=xImporteDeuda where Codigo=xCodCliente;
           update notacreditocabeza SET ImporteUtilizado=ImporteTotal
           Where ImporteUtilizado > ImporteTotal;
           set xSuma=0;
           set xSuma = (select SUM(ImporteTotal - ImporteUtilizado) as
                            SaldoCCNoAplicado
                            from notacreditocabeza
                            where FechaAnulacion is null
                            and CodigoCliente= xCodCliente);
           if xSuma >= 0 then
              update t_clientes set SaldoNTCNoAplicado=xSuma where Codigo=xCodCliente;
           else
               update t_clientes set SaldoNTCNoAplicado=0 where Codigo=xCodCliente;
           end if;
     UNTIL done END REPEAT;
CLOSE xCurCli;
END
;;
DELIMITER ;
