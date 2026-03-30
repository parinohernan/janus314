<script lang="ts">
  import { browser } from '$app/environment';
  import Button from '$lib/components/ui/Button.svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth';
  import { goto } from '$app/navigation';
  import { Camera, ImageIcon, ArrowLeft, Check, Copy } from 'lucide-svelte';

  let inputCamara: HTMLInputElement | null = null;
  let inputGaleria: HTMLInputElement | null = null;

  let subiendo = false;
  let errorMsg: string | null = null;
  let ultimaUrl: string | null = null;
  let ultimoPublicId: string | null = null;
  let carpetaServidor: string | null = null;
  let copiado = false;

  async function subirArchivo(file: File) {
    if (!file.type.startsWith('image/')) {
      errorMsg = 'Elija un archivo de imagen.';
      return;
    }
    subiendo = true;
    errorMsg = null;
    ultimaUrl = null;
    ultimoPublicId = null;
    carpetaServidor = null;
    copiado = false;
    try {
      const formData = new FormData();
      formData.append('imagen', file);
      const res = await fetchWithAuth('/compras/subir-imagen-cloudinary', {
        method: 'POST',
        body: formData
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { message?: string }).message || 'Error al subir');
      }
      ultimaUrl = (data as { secureUrl?: string }).secureUrl ?? null;
      ultimoPublicId = (data as { publicId?: string }).publicId ?? null;
      carpetaServidor = (data as { folderPrefix?: string }).folderPrefix ?? null;
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'Error al subir';
    } finally {
      subiendo = false;
      if (inputCamara) inputCamara.value = '';
      if (inputGaleria) inputGaleria.value = '';
    }
  }

  function onElegirCamara(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) subirArchivo(file);
  }

  async function copiarUrl() {
    if (!ultimaUrl || !browser) return;
    try {
      await navigator.clipboard.writeText(ultimaUrl);
      copiado = true;
      setTimeout(() => (copiado = false), 2000);
    } catch {
      errorMsg = 'No se pudo copiar al portapapeles';
    }
  }
</script>

<svelte:head>
  <title>Subir imagen — Compras</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</svelte:head>

<div
  class="min-h-[100dvh] bg-slate-100 flex flex-col max-w-lg mx-auto w-full safe-pb"
  style="padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));"
>
  <header class="shrink-0 px-4 pt-4 pb-3 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
        on:click={() => goto('/compras/facturas')}
        aria-label="Volver"
      >
        <ArrowLeft size={22} />
      </button>
      <h1 class="text-lg font-semibold text-slate-800">Subir imagen</h1>
    </div>
    <p class="mt-1 text-sm text-slate-500 pl-10">
      Para remitos o documentos desde el teléfono. Se guarda en Cloudinary bajo la carpeta de su empresa (remitos/…).
    </p>
  </header>

  <main class="flex-1 px-4 py-6 flex flex-col gap-4">
    <input
      bind:this={inputCamara}
      type="file"
      accept="image/*"
      capture="environment"
      class="sr-only"
      on:change={onElegirCamara}
    />
    <input
      bind:this={inputGaleria}
      type="file"
      accept="image/*"
      class="sr-only"
      on:change={onElegirCamara}
    />

    <div class="grid grid-cols-1 gap-3">
      <button
        type="button"
        class="flex items-center justify-center gap-3 w-full min-h-[3.25rem] rounded-xl bg-blue-600 text-white font-medium text-base shadow-sm hover:bg-blue-700 active:scale-[0.99] transition disabled:opacity-50 disabled:pointer-events-none"
        disabled={subiendo}
        on:click={() => inputCamara?.click()}
      >
        <Camera size={24} class="shrink-0" aria-hidden="true" />
        Tomar foto
      </button>
      <button
        type="button"
        class="flex items-center justify-center gap-3 w-full min-h-[3.25rem] rounded-xl bg-white border-2 border-slate-200 text-slate-800 font-medium text-base shadow-sm hover:bg-slate-50 active:scale-[0.99] transition disabled:opacity-50 disabled:pointer-events-none"
        disabled={subiendo}
        on:click={() => inputGaleria?.click()}
      >
        <ImageIcon size={24} class="shrink-0 text-slate-600" aria-hidden="true" />
        Elegir de la galería
      </button>
    </div>

    {#if subiendo}
      <div class="flex items-center justify-center gap-3 py-8 text-slate-600">
        <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-medium">Subiendo…</span>
      </div>
    {/if}

    {#if errorMsg}
      <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
        {errorMsg}
      </div>
    {/if}

    {#if ultimaUrl && !subiendo}
      <div class="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-3">
        <div class="flex items-center gap-2 text-emerald-800 font-medium text-sm">
          <Check size={18} class="shrink-0" />
          Imagen subida correctamente
        </div>
        {#if carpetaServidor}
          <p class="text-xs text-slate-600 font-mono">Carpeta: {carpetaServidor}/</p>
        {/if}
        {#if ultimoPublicId}
          <p class="text-xs text-slate-600 break-all font-mono">{ultimoPublicId}</p>
        {/if}
        <div class="flex flex-col sm:flex-row gap-2">
          <a
            href={ultimaUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-blue-600 hover:underline break-all"
          >
            Abrir imagen
          </a>
          <Button variant="secondary" class="inline-flex items-center gap-2 w-full sm:w-auto justify-center" on:click={copiarUrl}>
            {#if copiado}
              <Check size={16} /> Copiado
            {:else}
              <Copy size={16} /> Copiar enlace
            {/if}
          </Button>
        </div>
      </div>
    {/if}
  </main>
</div>
