<script lang="ts">
  import { fade } from 'svelte/transition';
  import Icon from '$lib/components/ui/Icon.svelte';
  import type { ComponentType } from 'svelte';
  
  interface Props {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: ComponentType;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    trend?: number; // Porcentaje de cambio (positivo o negativo)
  }
  
  let {
    title,
    value,
    subtitle,
    icon,
    color = 'blue',
    trend
  }: Props = $props();
  
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600'
  };
  
  const gradientClass = $derived(colorClasses[color]);
</script>

<div
  class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
  transition:fade={{ duration: 200 }}
>
  <div class="p-6">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p class="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        {#if subtitle}
          <p class="text-sm text-gray-500">{subtitle}</p>
        {/if}
        {#if trend !== undefined}
          <div class="flex items-center gap-1 mt-2">
            {#if trend > 0}
              <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              <span class="text-sm font-medium text-green-600">+{trend.toFixed(1)}%</span>
            {:else if trend < 0}
              <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>
              </svg>
              <span class="text-sm font-medium text-red-600">{trend.toFixed(1)}%</span>
            {:else}
              <span class="text-sm font-medium text-gray-600">Sin cambios</span>
            {/if}
          </div>
        {/if}
      </div>
      <div class="flex-shrink-0 ml-4">
        <div class="w-14 h-14 bg-gradient-to-br {gradientClass} rounded-lg flex items-center justify-center">
          <Icon {icon} size={28} strokeWidth={2.5} class="text-white" />
        </div>
      </div>
    </div>
  </div>
</div>
