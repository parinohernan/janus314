-- Cantidad solicitada al proveedor (unidades del proveedor / bultos) por ítem de OC
-- Ejecutar en cada base de empresa que use órdenes de compra.

ALTER TABLE prv_orden_compra_items
  ADD COLUMN CantidadProveedor DOUBLE(15, 4) NULL DEFAULT NULL COMMENT 'Unidades solicitadas al proveedor'
  AFTER Cantidad;
