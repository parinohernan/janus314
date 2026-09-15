<script lang="ts">
  import InformeIvaComprobantes from '$lib/components/informes/InformeIvaComprobantes.svelte';
</script>

<InformeIvaComprobantes
  titulo="IVA — Notas de crédito"
  descripcion="Notas de crédito A/B no anuladas del período, con IVA 10,5 % y 21 % para exportar."
  endpoint="/informes/iva/notas-credito"
  pagePath="/ventas/informes/iva/notas-credito"
  nombreExcel="iva_notas_credito"
/>
