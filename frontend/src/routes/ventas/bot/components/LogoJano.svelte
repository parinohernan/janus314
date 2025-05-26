<script lang="ts">
  import { onMount } from 'svelte';
  
  // Props para personalización
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let animated: boolean = true;
  
  // Determinar tamaño basado en prop
  let fontSize: string;
  let logoSize: string;
  
  $: {
    switch(size) {
      case 'small':
        fontSize = '1.4rem';
        logoSize = '30px';
        break;
      case 'large':
        fontSize = '2.2rem';
        logoSize = '45px';
        break;
      default: // medium
        fontSize = '1.8rem';
        logoSize = '38px';
        break;
    }
  }
  
  // Animación
  let isHovered = false;
  
  // Efecto de brillo
  let showGlow = false;
  
  onMount(() => {
    if (animated) {
      // Iniciar animación de brillo cada 5 segundos
      const interval = setInterval(() => {
        showGlow = true;
        setTimeout(() => {
          showGlow = false;
        }, 1500);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  });
</script>

<div 
  class="logo-container"
  on:mouseenter={() => isHovered = true}
  on:mouseleave={() => isHovered = false}
  role="button"
  aria-label="Logo Jano miniPOS"
  tabindex="0"
>
  <div class="fox-container" style="width: {logoSize}; height: {logoSize};">
    <img 
      src="/logojano.png" 
      alt="Jano Fox Logo"
      class="fox-logo"
      class:wiggle={isHovered && animated}
    />
  </div>
  
  <div 
    class="logo-text"
    style="font-size: {fontSize};"
    class:glow={showGlow && animated}
  >
    <span class="jano">Jano</span> <span class="minipos">miniPOS</span>
  </div>
</div>

<style>
  .logo-container {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .fox-container {
    position: relative;
    transition: transform 0.3s ease;
  }
  
  .fox-logo {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
   
  .wiggle {
    animation: wiggle 0.5s ease;
  }
  
  @keyframes wiggle {
    0% { transform: rotate(0); }
    25% { transform: rotate(-5deg); }
    50% { transform: rotate(5deg); }
    75% { transform: rotate(-3deg); }
    100% { transform: rotate(0); }
  }
  
  .logo-text {
    font-weight: bold;
    white-space: nowrap;
    position: relative;
    transition: all 0.3s ease;
  }
  
  .jano {
    background: linear-gradient(to right, #ff7733, #ff9966);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .minipos {
    background: linear-gradient(to right, #2481cc, #0072cf);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .glow {
    animation: glow-animation 1.5s ease;
  }
  
  @keyframes glow-animation {
    0% { text-shadow: 0 0 0 rgba(255, 119, 51, 0); }
    20% { text-shadow: 0 0 10px rgba(255, 119, 51, 0.5); }
    40% { text-shadow: 0 0 20px rgba(36, 129, 204, 0.5); }
    60% { text-shadow: 0 0 10px rgba(255, 119, 51, 0.5); }
    80% { text-shadow: 0 0 20px rgba(36, 129, 204, 0.5); }
    100% { text-shadow: 0 0 0 rgba(255, 119, 51, 0); }
  }
  
  .logo-container:hover .fox-container {
    transform: rotate(5deg);
  }
  
  .logo-container:hover .logo-text {
    transform: scale(1.05);
  }
</style> 