-- ----------------------------
-- Tabla: relaciones artículo proveedor
-- Relación entre código de artículo del proveedor y artículo de la empresa,
-- con factor de conversión (ej: 1 bulto = 24 unidades -> Relacion = 24).
-- ----------------------------
DROP TABLE IF EXISTS `t_relaciones_articulo_proveedor`;
CREATE TABLE `t_relaciones_articulo_proveedor` (
  `ProveedorCodigo` varchar(8) NOT NULL,
  `CodigoArticuloProveedor` varchar(30) NOT NULL DEFAULT '',
  `CodigoArticuloEmpresa` varchar(13) NOT NULL DEFAULT '',
  `Relacion` double(15,4) NOT NULL DEFAULT '1.0000' COMMENT 'Unidades empresa por 1 unidad proveedor (ej: 24 = 1 bulto son 24 u)',
  `DescripcionProveedor` varchar(200) DEFAULT NULL COMMENT 'Descripción en el remito del proveedor',
  PRIMARY KEY (`ProveedorCodigo`, `CodigoArticuloProveedor`),
  KEY `CodigoArticuloEmpresa` (`CodigoArticuloEmpresa`),
  KEY `ProveedorCodigo` (`ProveedorCodigo`),
  CONSTRAINT `t_relaciones_articulo_proveedor_fk_proveedor` FOREIGN KEY (`ProveedorCodigo`) REFERENCES `t_proveedores` (`Codigo`),
  CONSTRAINT `t_relaciones_articulo_proveedor_fk_articulo` FOREIGN KEY (`CodigoArticuloEmpresa`) REFERENCES `t_articulos` (`Codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;