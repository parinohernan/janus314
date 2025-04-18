<script lang="ts">
  import { formatDate } from '$lib/utils/dateUtils';

  export let recibo: any;
</script>

<div class="recibo-pdf">
  <!-- Encabezado del recibo -->
  <div class="header">
    <h1>RECIBO</h1>
    <p>Número: {recibo.DocumentoSucursal}-{recibo.DocumentoNumero}</p>
    <p>Fecha: {formatDate(recibo.Fecha)}</p>
    {#if recibo.FechaAnulacion}
      <div class="anulado">
        <span>ANULADO</span>
        <p>Fecha de anulación: {formatDate(recibo.FechaAnulacion)}</p>
      </div>
    {/if}
  </div>

  <!-- Información del cliente -->
  <div class="cliente">
    <h2>Cliente</h2>
    <div class="cliente-info">
      <p>{recibo.ClienteRelacion?.Descripcion || 'Cliente no asignado'}</p>
      {#if recibo.ClienteRelacion?.NombreFantasia}
        <p>{recibo.ClienteRelacion.NombreFantasia}</p>
      {/if}
    </div>
  </div>

  <!-- Detalles del pago -->
  <div class="detalles">
    <h2>Detalles del Pago</h2>
    <div class="grid">
      <!-- Columna de Deuda -->
      <div class="columna">
        <h3>Documentos de Deuda</h3>
        <table>
          <thead>
            <tr>
              <th>Documento</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            {#if recibo.Items && recibo.Items.length > 0}
              {#each recibo.Items as item}
                <tr>
                  <td>{item.FacturaTipo}-{item.FacturaSucursal}-{item.FacturaNumero}</td>
                  <td class="text-right">{item.ImportePagado.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                </tr>
              {/each}
            {:else}
              <tr>
                <td colspan="2" class="text-center">No hay documentos de deuda</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>

      <!-- Columna de Pagos -->
      <div class="columna">
        <h3>Documentos de Pago</h3>
        <table>
          <thead>
            <tr>
              <th>Valor</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            {#if recibo.Valores && recibo.Valores.length > 0}
              {#each recibo.Valores as valor}
                <tr>
                  <td>
                    {valor.ValorCodigo}
                    {#if valor.ValorNumero}
                      - {valor.ValorNumero}
                    {/if}
                    {#if valor.Valorbanco}
                      ({valor.Valorbanco})
                    {/if}
                  </td>
                  <td class="text-right">{valor.ValorImporte.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                </tr>
              {/each}
            {:else}
              <tr>
                <td colspan="2" class="text-center">No hay documentos de pago</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Total -->
    <div class="total">
      <div class="total-row">
        <span>Total:</span>
        <span>{recibo.ImporteTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
      </div>
    </div>
  </div>

  <!-- Observaciones -->
  {#if recibo.Observaciones}
    <div class="observaciones">
      <h2>Observaciones</h2>
      <div class="observaciones-content">
        <p>{recibo.Observaciones}</p>
      </div>
    </div>
  {/if}

  <!-- Pie del recibo -->
  <div class="firmas">
    <div class="firma">
      <p>Firma del Cliente</p>
      <div class="linea"></div>
    </div>
    <div class="firma">
      <p>Firma del Empleado</p>
      <div class="linea"></div>
    </div>
  </div>
</div>

<style>
  .recibo-pdf {
    font-family: Arial, sans-serif;
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 30px;
  }

  .header h1 {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .anulado {
    margin-top: 10px;
  }

  .anulado span {
    background-color: #fee2e2;
    color: #991b1b;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
  }

  .anulado p {
    color: #dc2626;
    font-size: 14px;
    margin-top: 5px;
  }

  .cliente, .detalles, .observaciones {
    margin-bottom: 30px;
  }

  h2 {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .cliente-info {
    border: 1px solid #e5e7eb;
    padding: 10px;
    border-radius: 4px;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .columna {
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }

  h3 {
    background-color: #f9fafb;
    padding: 8px;
    margin: 0;
    font-size: 14px;
    font-weight: bold;
    border-bottom: 1px solid #e5e7eb;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 8px;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }

  th {
    font-size: 12px;
    font-weight: bold;
    color: #6b7280;
    text-transform: uppercase;
  }

  .text-right {
    text-align: right;
  }

  .text-center {
    text-align: center;
    color: #6b7280;
  }

  .total {
    margin-top: 20px;
    border: 1px solid #e5e7eb;
    padding: 10px;
    background-color: #f9fafb;
    border-radius: 4px;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }

  .observaciones-content {
    border: 1px solid #e5e7eb;
    padding: 10px;
    border-radius: 4px;
  }

  .firmas {
    margin-top: 40px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }

  .firma {
    text-align: center;
  }

  .firma p {
    margin-bottom: 40px;
    font-weight: bold;
  }

  .linea {
    border-top: 1px dashed #e5e7eb;
    margin-top: 10px;
  }
</style> 