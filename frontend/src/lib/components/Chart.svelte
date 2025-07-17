<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let data: any;
  export let type: 'bar' | 'line' | 'pie' | 'doughnut' = 'bar';
  export let options: any = {};
  export let height: string = '400px';

  let canvas: HTMLCanvasElement;
  let chart: any = null;

  onMount(async () => {
    try {
      // Importar Chart.js dinámicamente para evitar errores de SSR
      const { Chart, registerables } = await import('chart.js/auto');
      
      if (!canvas || !data) {
        console.warn('Chart: Canvas o datos no disponibles');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Chart: No se pudo obtener el contexto del canvas');
        return;
      }

      // Configuración básica
      const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      };

      const finalOptions = { ...defaultOptions, ...options };

      chart = new Chart(ctx, {
        type,
        data,
        options: finalOptions
      });

      console.log('Chart: Gráfico creado exitosamente');
    } catch (error) {
      console.error('Chart: Error al crear el gráfico:', error);
    }
  });

  onDestroy(() => {
    if (chart) {
      try {
        chart.destroy();
      } catch (error) {
        console.warn('Error al destruir el gráfico:', error);
      }
    }
  });
</script>

<div style="height: {height}; position: relative;">
  <canvas bind:this={canvas}></canvas>
</div> 