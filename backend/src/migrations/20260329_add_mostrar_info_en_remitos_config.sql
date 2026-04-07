-- Parámetro general: mostrar información en remitos (0/1 en ValorConfig).
-- Ejecutar en cada base de empresa que deba poder editar este flag desde /configuracion.

INSERT INTO t_configuracion (Codigo, Descripcion, ValorConfig, pasar_a_ipaqs)
VALUES ('mostrar_info_en_remitos', 'Mostrar información en remitos', '0', 0)
ON DUPLICATE KEY UPDATE Codigo = Codigo;
