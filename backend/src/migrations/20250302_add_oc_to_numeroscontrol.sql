-- Migración: Agregar código OC (Orden de Compra) a t_numeroscontrol
-- Fecha: 2025-03-02
-- Descripción: Permite numeración automática de órdenes de compra

-- Insertar OC para sucursal 01 si no existe (idempotente)
INSERT INTO t_numeroscontrol (Codigo, Descripcion, NumeroProximo, Copias, Sucursal)
VALUES ('OC', 'Orden de Compra', 1, 1, '01')
ON DUPLICATE KEY UPDATE Descripcion = VALUES(Descripcion);
