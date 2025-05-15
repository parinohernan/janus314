<script lang="ts">
  import { onMount } from 'svelte';

  // Interface para las estadísticas
  interface Stat {
    label: string;
    value: string;
    icon: string;
    displayValue: number;
    targetValue: number;
  }

  // Estadísticas rápidas con valores de animación
  export let quickStats: Stat[] = [
    {
      label: 'Ventas Hoy',
      value: '0',
      icon: '📈',
      displayValue: 0,
      targetValue: 0
    },
    {
      label: 'Mis Ventas',
      value: '0',
      icon: '🎯',
      displayValue: 0,
      targetValue: 0
    },
    {
      label: 'Clientes',
      value: '0',
      icon: '👥',
      displayValue: 0,
      targetValue: 0
    }
  ];

  // Por ahora usamos vendedor fijo = 1 hasta implementar login
  const VENDEDOR_DEFAULT = '1';

  function obtenerFechaHoy(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const fechaFormateada = `${año}-${mes}-${dia}`;
    console.log('Fecha actual formateada:', fechaFormateada);
    return fechaFormateada;
  }

  async function cargarEstadisticas() {
    try {
      const fechaHoy = obtenerFechaHoy();

      // Cargar cantidad de clientes activos
      const responseClientes = await fetch('https://janus314-api.osvi.lat/api/clientes?page=1&limit=1&Activo=1', {
        credentials: 'include',
        mode: 'cors'
      });
      
      if (responseClientes.ok) {
        const dataClientes = await responseClientes.json();
        console.log('Respuesta clientes - totalItems:', dataClientes.meta?.totalItems);
        if (dataClientes.meta?.totalItems !== undefined) {
          quickStats[2].value = dataClientes.meta.totalItems.toString();
        }
      }

      // Cargar ventas totales del día
      const urlVentasHoy = `https://janus314-api.osvi.lat/api/facturas?page=1&limit=1&tipo=PRF&fecha=${fechaHoy}`;
      console.log('URL ventas hoy:', urlVentasHoy);
      const responseVentasHoy = await fetch(urlVentasHoy, {
        credentials: 'include',
        mode: 'cors'
      });

      if (responseVentasHoy.ok) {
        const dataVentasHoy = await responseVentasHoy.json();
        console.log('Respuesta ventas hoy - totalItems:', dataVentasHoy.meta?.totalItems);
        if (dataVentasHoy.meta?.totalItems !== undefined) {
          quickStats[0].value = dataVentasHoy.meta.totalItems.toString();
        }
      } else {
        console.error('Error en respuesta ventas hoy:', await responseVentasHoy.text());
      }

      // Cargar ventas del vendedor por defecto
      const urlVentasVendedor = `https://janus314-api.osvi.lat/api/facturas?page=1&limit=1&tipo=PRF&fecha=${fechaHoy}&vendedor=${VENDEDOR_DEFAULT}`;
      console.log('URL ventas vendedor:', urlVentasVendedor);
      const responseVentasVendedor = await fetch(urlVentasVendedor, {
        credentials: 'include',
        mode: 'cors'
      });

      if (responseVentasVendedor.ok) {
        const dataVentasVendedor = await responseVentasVendedor.json();
        console.log('Respuesta ventas vendedor - totalItems:', dataVentasVendedor.meta?.totalItems);
        if (dataVentasVendedor.meta?.totalItems !== undefined) {
          quickStats[1].value = dataVentasVendedor.meta.totalItems.toString();
        }
      } else {
        console.error('Error en respuesta ventas vendedor:', await responseVentasVendedor.text());
      }

      // Forzar actualización de la vista
      quickStats = [...quickStats];
      
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  onMount(async () => {
    await cargarEstadisticas();
  });
</script>

<div class="quick-stats">
  {#each quickStats as stat (stat.label)}
    <div class="stat-card">
      <span class="stat-icon">{stat.icon}</span>
      <span class="stat-value">{stat.value}</span>
      <span class="stat-label">{stat.label}</span>
    </div>
  {/each}
</div>

<style>
  .quick-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: var(--tg-theme-secondary-bg-color, #f5f5f5);
    padding: 16px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: transform 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
  }

  .stat-icon {
    font-size: 1.5rem;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 1.4rem;
    font-weight: bold;
    color: var(--tg-theme-button-color, #2481cc);
    transition: color 0.3s ease;
    min-height: 1.4em; /* Evitar saltos en el layout durante la animación */
  }

  .stat-label {
    font-size: 0.9rem;
    color: var(--tg-theme-hint-color, #999);
    margin-top: 4px;
  }

  @media (max-width: 360px) {
    .quick-stats {
      grid-template-columns: 1fr;
    }

    .stat-card {
      padding: 12px;
    }
  }
</style> 