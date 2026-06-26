-- OPCIONAL: columna dedicada CC/CO. La aplicación funciona sin esta columna usando el sufijo
-- [#FP:CC] o [#FP:CO] al final de Observacion (ver notaCredito.service.js y pdf.controller.js).
-- Si ejecutás este script, luego podés volver a agregar FormaPagoCodigo en los modelos Sequelize.
--
-- Condición de venta de la nota de crédito (CC / CO) para PDF y reportes.
-- ImporteUtilizado sigue siendo "monto aplicado en recibos", no la forma de pago.
-- Ejecutar en cada base de empresa.

ALTER TABLE notacreditocabeza
  ADD COLUMN FormaPagoCodigo CHAR(2) NULL COMMENT 'CC cuenta corriente, CO contado' AFTER ImporteUtilizado;

-- Registros previos: heurística antigua (contado = ImporteUtilizado >= ImporteTotal).
UPDATE notacreditocabeza
SET FormaPagoCodigo = CASE
  WHEN COALESCE(ImporteTotal, 0) > 0 AND COALESCE(ImporteUtilizado, 0) >= COALESCE(ImporteTotal, 0) THEN 'CO'
  ELSE 'CC'
END
WHERE FormaPagoCodigo IS NULL;
