const Empresa = require('./src/models/Empresa');

async function listarEmpresas() {
  try {
    const empresas = await Empresa.findAll({
      where: { estado: 'activo' },
      attributes: ['id', 'nombre', 'db_name']
    });
    
    console.log('Empresas disponibles:');
    empresas.forEach(emp => {
      console.log(`- ID: ${emp.id}, Nombre: ${emp.nombre}, DB: ${emp.db_name}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

listarEmpresas(); 