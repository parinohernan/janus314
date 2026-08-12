-- Reportes automáticos para el contador (Rubros por Provincia → carpeta / Drive).
-- Ejecutar en cada base de empresa.

INSERT INTO t_configuracion (Codigo, Descripcion, ValorConfig, pasar_a_ipaqs)
VALUES
  ('reportes_auto_enabled', 'Activar export automático Rubros-Provincia', '0', 0),
  ('reportes_auto_dir', 'Carpeta local de reportes del contador', '', 0),
  ('reportes_auto_rclone', 'Remoto rclone (ej. gdrive:Contabilidad/RubrosProvincia)', '', 0)
ON DUPLICATE KEY UPDATE Codigo = Codigo;
