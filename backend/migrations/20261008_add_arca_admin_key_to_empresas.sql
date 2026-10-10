-- Migración: Agregar columna arca_admin_key a empresas (BD maestra)
-- Fecha: 2026-10-08
-- Descripción: Guarda la clave x-admin-key de la instancia atrarca de cada empresa.
--              Se guarda por empresa porque cada instancia tiene su propio ADMIN_API_KEY.
--              La columna NUNCA se devuelve en una respuesta JSON (la elimina Empresa.toJSON).
--
-- Equivalente JS: src/migrations/20261008_add_arca_admin_key_to_empresas.js
-- BD a usar: la maestra (EMPRESAS_DB_NAME de backend/.env)
--
-- IMPORTANTE: ejecutar ANTES de deployar. El modelo Empresa ya pide esta columna,
--             sin ella fallan todas las requests autenticadas.

ALTER TABLE `empresas`
  ADD COLUMN `arca_admin_key` VARCHAR(255) NULL
    COMMENT 'Clave x-admin-key de la instancia atrarca. No se expone en APIs.'
  AFTER `arcaendpoint`;

-- Registrar la migración para que `npm run migrate` no intente volver a aplicarla.
-- Si `SequelizeMeta` no existe, créala primero (sequelize-cli la crea en su primer db:migrate).
CREATE TABLE IF NOT EXISTS `SequelizeMeta` (
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `SequelizeMeta` (`name`)
VALUES ('20261008_add_arca_admin_key_to_empresas.js');


-- ============================================================
-- ROLLBACK
-- ============================================================
-- DELETE FROM `SequelizeMeta` WHERE `name` = '20261008_add_arca_admin_key_to_empresas.js';
-- ALTER TABLE `empresas` DROP COLUMN `arca_admin_key`;
