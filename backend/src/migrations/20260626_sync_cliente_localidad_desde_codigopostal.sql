-- Sincroniza t_clientes.Localidad con la descripción del catálogo t_codigospostales
-- según CodigoPostal. Ejecutar una vez para corregir datos históricos desalineados.

UPDATE t_clientes c
INNER JOIN t_codigospostales cp ON cp.Codigo = c.CodigoPostal
SET c.Localidad = cp.Descripcion
WHERE c.CodigoPostal IS NOT NULL
  AND TRIM(c.CodigoPostal) <> '';
