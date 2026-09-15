<script lang="ts">
  import InformeIvaComprobantes from '$lib/components/informes/InformeIvaComprobantes.svelte';
</script>

<InformeIvaComprobantes
  titulo="IVA — Facturas"
  descripcion="Comprobantes A/B/C no anulados del período, con IVA 10,5 % y 21 % para exportar."
  endpoint="/informes/iva/facturas"
  pagePath="/ventas/informes/iva/facturas"
  nombreExcel="iva_facturas"
/>
