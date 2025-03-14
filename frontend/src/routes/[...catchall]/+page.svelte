<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head>
  <title>Sección en construcción | Gestión Comercial</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
  <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
    <div class="mb-6">
      <!-- Ícono de herramientas/construcción -->
      <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
    
    <h1 class="text-3xl font-bold mb-2">Sección en construcción</h1>
    <p class="text-gray-600 mb-8">
      Estamos trabajando para mejorar tu experiencia. Esta funcionalidad estará disponible próximamente.
    </p>
    
    <div class="flex flex-col sm:flex-row justify-center gap-4">
      <Button variant="primary" on:click={() => goto('/')}>
        Volver al inicio
      </Button>
      <Button variant="secondary" on:click={() => history.back()}>
        Volver atrás
      </Button>
    </div>
  </div>
</div> 