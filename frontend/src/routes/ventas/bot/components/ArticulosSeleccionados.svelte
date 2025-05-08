<script lang="ts">
  import type { ArticuloSeleccionado } from './types';
  import { onMount } from 'svelte';
  export let selectedArticulos: ArticuloSeleccionado[] = [];
  export let aumentarCantidad: (codigo: string) => void;
  export let disminuirCantidad: (codigo: string) => void;
  export let quitarArticulo: (codigo: string) => void;
  export let cambiarCantidadDecimal: (codigo: string, valor: number) => void;

  let focusedCodigo: string | null = null;
  let focusTimeout: any = null;

  function handleDecimalInput(e: Event, codigo: string) {
    let value = (e.target as HTMLInputElement).value;
    value = value.replace(/[^0-9]/g, '').slice(0, 3);
    cambiarCantidadDecimal(codigo, Number(value));
  }

  function cantidadTotal(articulo: ArticuloSeleccionado): number {
    return (articulo.cantidadEntera || 0) + (articulo.cantidadDecimal || 0) / 1000;
  }

  function getDecimalDigits(decimal: number) {
    const str = decimal.toString().padStart(3, '0').slice(0, 3);
    return [
      Number(str[0]),
      Number(str[1]),
      Number(str[2])
    ];
  }

  function setDecimalDigit(codigo: string, pos: number, delta: number) {
    const articulo = selectedArticulos.find(a => a.Codigo === codigo);
    if (!articulo) return;
    let digits = getDecimalDigits(articulo.cantidadDecimal);
    digits[pos] = (digits[pos] + delta + 10) % 10;
    const nuevoDecimal = digits[0] * 100 + digits[1] * 10 + digits[2];
    cambiarCantidadDecimal(codigo, nuevoDecimal);
  }

  function handleFocusIn(codigo: string) {
    if (focusTimeout) clearTimeout(focusTimeout);
    focusedCodigo = codigo;
  }
  function handleFocusOut() {
    focusTimeout = setTimeout(() => {
      focusedCodigo = null;
    }, 250); // retardo para permitir el click en los botones
  }
</script>

<div class="selected-articulos">
  <h3>Artículos seleccionados</h3>
  {#if selectedArticulos.length === 0}
    <p>No hay artículos seleccionados</p>
  {:else}
    {#each selectedArticulos as articulo}
      <div class="selected-articulo">
        <div class="articulo-info">
          <div class="articulo-nombre">{articulo.Descripcion}</div>
          <div class="articulo-codigo">{articulo.Codigo}</div>
        </div>
        <div class="articulo-actions">
          <div class="cantidad-control">
            <button type="button" class="btn-cantidad" on:click={() => disminuirCantidad(articulo.Codigo)} disabled={articulo.cantidadEntera <= 0} aria-label="Disminuir cantidad">-</button>
            <input type="number" min="0" class="cantidad-input" value={articulo.cantidadEntera} on:input={(e) => { articulo.cantidadEntera = Math.max(0, Number((e.target as HTMLInputElement).value)); }} style="width: 40px; text-align: right;" />
            <span>,</span>
            <div class="decimal-group-wrapper" on:focusin={() => handleFocusIn(articulo.Codigo)} on:focusout={handleFocusOut}>
              <div class="decimal-group">
                {#each getDecimalDigits(articulo.cantidadDecimal) as dig, i (i)}
                  <div class="decimal-digit-group">
                    {#if focusedCodigo === articulo.Codigo}
                      <button type="button" class="btn-decimal" on:click={() => setDecimalDigit(articulo.Codigo, i, 1)}>▲</button>
                    {/if}
                    <input type="text" class="cantidad-decimal-input" value={dig} maxlength="1" size="1" on:input={(e) => {
                      let digits = getDecimalDigits(articulo.cantidadDecimal);
                      let val = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, '').slice(0, 1);
                      digits[i] = Number(val || 0);
                      const nuevoDecimal = digits[0] * 100 + digits[1] * 10 + digits[2];
                      cambiarCantidadDecimal(articulo.Codigo, nuevoDecimal);
                    }}
                    style="width: 32px; height: 40px; font-size: 1.2em; text-align: center; display: inline-block; margin: 2px;" />
                    {#if focusedCodigo === articulo.Codigo}
                      <button type="button" class="btn-decimal" on:click={() => setDecimalDigit(articulo.Codigo, i, -1)}>▼</button>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
            <button type="button" class="btn-cantidad" on:click={() => aumentarCantidad(articulo.Codigo)} aria-label="Aumentar cantidad">+</button>
          </div>
          <div class="articulo-precio-container">
            <span class="articulo-precio-unitario">${articulo.PrecioVenta?.toFixed(2) || '0.00'}</span>
            <div class="articulo-total">
              ${((articulo.PrecioVenta || 0) * cantidadTotal(articulo)).toFixed(2)}
            </div>
          </div>
          <button type="button" class="btn-remove" on:click={() => quitarArticulo(articulo.Codigo)} aria-label="Quitar artículo">×</button>
        </div>
      </div>
    {/each}
    <div class="total">
      <strong>Total:</strong> ${selectedArticulos.reduce((sum, a) => sum + ((a.PrecioVenta || 0) * ((a.cantidadEntera || 0) + (a.cantidadDecimal || 0) / 1000)), 0).toFixed(2)} (IVA incluido)
    </div>
  {/if}
</div>

<style>
  .selected-articulos {
    margin: 20px 0;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
  }
  
  .selected-articulos h3 {
    margin-top: 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #ddd;
  }
  
  .selected-articulo {
    padding: 12px 8px;
    border-bottom: 1px solid #ddd;
    background-color: var(--tg-theme-bg-color, #fff);
    border-radius: 6px;
    margin-bottom: 8px;
  }
  
  .selected-articulo .articulo-info {
    margin-bottom: 8px;
  }
  
  .selected-articulo .articulo-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .cantidad-control {
    display: flex;
    align-items: center;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .btn-cantidad {
    width: 28px;
    height: 28px;
    background: var(--tg-theme-bg-color, #fff);
    border: none;
    font-size: 16px;
    cursor: pointer;
  }
  
  .btn-cantidad:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .cantidad-input, .cantidad-decimal-input {
    border: 1px solid #ddd;
    border-radius: 2px;
    padding: 2px 4px;
    font-size: 1em;
    width: 40px;
    margin: 0 2px;
  }
  
  .cantidad-decimal-input {
    width: 36px;
  }
  
  .articulo-precio-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  
  .articulo-precio-unitario {
    font-size: 0.8em;
    color: #666;
  }
  
  .articulo-total {
    font-weight: bold;
    color: #2481cc;
  }
  
  .btn-remove {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: #ff4d4f;
    color: white;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
  }
  
  .total {
    padding: 10px;
    text-align: right;
    font-size: 18px;
    border-top: 2px solid #ddd;
    margin-top: 10px;
  }

  .decimal-group-wrapper {
    display: flex;
    outline: none;
  }
  .decimal-group {
    display: flex;
    gap: 2px;
  }
  .decimal-digit-group {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .btn-decimal {
    background: #eee;
    border: none;
    font-size: 1.5em;
    padding: 6px 10px;
    cursor: pointer;
    line-height: 1;
    margin: 2px 0;
    border-radius: 6px;
    min-width: 36px;
    min-height: 36px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.07);
    transition: background 0.2s;
  }
  .btn-decimal:active {
    background: #ccc;
  }
  .cantidad-decimal-input {
    width: 18px;
    text-align: center;
    margin: 0 1px;
  }
</style> 