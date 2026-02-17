const { Op } = require('sequelize');

/**
 * Eliminar preventas con fecha anterior a 1 año desde hoy.
 * Elimina cabezas e ítems. Solo para vendedor admin (middleware).
 */
exports.eliminarPreventasAntiguas = async (req, res) => {
  try {
    const { PreventaCabeza, PreventaItem } = req.models;
    const connection = req.db;

    const haceUnAnio = new Date();
    haceUnAnio.setFullYear(haceUnAnio.getFullYear() - 1);
    const fechaLimite = haceUnAnio.toISOString().split('T')[0];

    const transaction = await connection.transaction();
    try {
      const cabezas = await PreventaCabeza.findAll({
        where: { Fecha: { [Op.lt]: fechaLimite } },
        attributes: ['DocumentoTipo', 'DocumentoSucursal', 'DocumentoNumero'],
        transaction
      });

      let itemsEliminados = 0;
      let cabezasEliminadas = 0;

      for (const cabeza of cabezas) {
        const deletedItems = await PreventaItem.destroy({
          where: {
            DocumentoTipo: cabeza.DocumentoTipo,
            DocumentoSucursal: cabeza.DocumentoSucursal,
            DocumentoNumero: cabeza.DocumentoNumero
          },
          transaction
        });
        itemsEliminados += deletedItems;
        await PreventaCabeza.destroy({
          where: {
            DocumentoTipo: cabeza.DocumentoTipo,
            DocumentoSucursal: cabeza.DocumentoSucursal,
            DocumentoNumero: cabeza.DocumentoNumero
          },
          transaction
        });
        cabezasEliminadas += 1;
      }

      await transaction.commit();

      return res.json({
        success: true,
        message: 'Preventas antiguas eliminadas correctamente',
        data: {
          fechaLimite,
          cabezasEliminadas,
          itemsEliminados
        }
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error('Error en eliminarPreventasAntiguas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar preventas antiguas',
      error: error.message
    });
  }
};

/**
 * Generar backup de la base de datos de la empresa.
 * Por ahora devuelve un mensaje; se puede integrar mysqldump o export a archivo.
 */
exports.generarBackup = async (req, res) => {
  try {
    const connection = req.db;
    const empresaData = req.empresaData;

    const [result] = await connection.query('SELECT 1 + 1 AS test');
    if (!result) {
      return res.status(500).json({ success: false, message: 'Error al verificar conexión' });
    }

    return res.json({
      success: true,
      message: 'Backup solicitado. Funcionalidad de exportación completa pendiente de configurar en el servidor.',
      data: {
        empresa: empresaData?.nombre,
        baseDatos: empresaData?.db_name
      }
    });
  } catch (error) {
    console.error('Error en generarBackup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar backup',
      error: error.message
    });
  }
};

/**
 * Exportar tablas principales a JSON (estructura simplificada).
 * Útil para respaldo o migración. Solo admin.
 */
exports.exportarTablas = async (req, res) => {
  try {
    const connection = req.db;
    const tablas = req.query.tablas ? req.query.tablas.split(',').map(t => t.trim()) : null;

    const tablasPermitidas = [
      't_configuracion',
      't_numeroscontrol',
      't_vendedores',
      't_tiposdepago',
      'datosempresa'
    ];
    const aExportar = tablas
      ? tablas.filter(t => tablasPermitidas.includes(t))
      : tablasPermitidas;

    const resultado = {};
    for (const tabla of aExportar) {
      try {
        const [rows] = await connection.query(`SELECT * FROM ${tabla}`);
        resultado[tabla] = rows || [];
      } catch (e) {
        resultado[tabla] = { error: e.message };
      }
    }

    return res.json({
      success: true,
      message: 'Exportación de tablas completada',
      data: resultado
    });
  } catch (error) {
    console.error('Error en exportarTablas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar tablas',
      error: error.message
    });
  }
};
