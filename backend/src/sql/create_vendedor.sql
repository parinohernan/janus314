-- Insertar vendedor 001 si no existe
INSERT IGNORE INTO t_vendedores (Codigo, Descripcion, Clave, Activo, Permisos)
VALUES ('001', 'Administrador', '123456', 1, 'ADMIN'); 