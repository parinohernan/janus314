-- Migración: Agregar columna Activo a t_proveedores
-- Fecha: 2025-03-02
-- Descripción: Permite marcar proveedores como activos/inactivos para limpiar vistas y selectores

-- Agregar columna Activo (1=activo, 0=inactivo)
-- DEFAULT 1 asigna automáticamente true a todos los registros existentes
ALTER TABLE t_proveedores
ADD COLUMN Activo TINYINT(1) NOT NULL DEFAULT 1;
