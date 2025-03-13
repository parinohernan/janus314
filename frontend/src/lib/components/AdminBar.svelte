<script>
  // Lógica para verificar si el usuario es administrador
</script>

<div class="admin-bar">
  <span>Panel de Administración</span>
  <div class="admin-links">
    <a href="/admin/dashboard">Dashboard</a>
    <a href="/admin/usuarios">Usuarios</a>
    <a href="/admin/configuracion">Configuración</a>
  </div>
</div>

<style>
  .admin-bar {
    display: flex;
    justify-content: space-between;
    background-color: #ff3e00;
    color: white;
    padding: 0.5rem 1rem;
  }
  
  .admin-links {
    display: flex;
    gap: 1rem;
  }
  
  a {
    color: white;
    text-decoration: none;
  }
</style> 