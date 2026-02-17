<script lang="ts">
  import type { ComponentType } from 'svelte';
  
  interface Props {
    icon: ComponentType;
    size?: number;
    strokeWidth?: number;
    glass?: boolean;
    class?: string;
  }
  
  let { 
    icon, 
    size = 20, 
    strokeWidth = 2.5, 
    glass = false,
    class: className = ''
  }: Props = $props();
</script>

<div 
  class="icon-wrapper inline-flex items-center justify-center {glass ? 'glass-effect' : ''} {className}"
  style="--icon-size: {size}px"
>
  <svelte:component 
    this={icon} 
    {size} 
    {strokeWidth}
  />
</div>

<style>
  .icon-wrapper {
    transition: all 0.2s ease;
  }
  
  .glass-effect {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 6px;
    box-shadow: 
      0 4px 6px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .glass-effect:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
    box-shadow: 
      0 6px 8px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
</style>
