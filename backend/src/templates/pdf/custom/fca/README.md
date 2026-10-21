# Plantillas personalizadas — Factura A (FCA)

Cada archivo `{slug}.template.js` en esta carpeta puede elegirse por empresa con `t_configuracion`:

- **Codigo:** `PDF_PLANTILLA_FCA`
- **ValorConfig:** el `slug` (sin `.template.js`)

## Contrato

El módulo debe exportar una función async con la misma firma que la plantilla estándar:

```js
async function renderFacturaA(doc, data) {
  const { factura, items, logoPath, typography } = data;
  // ...
}
module.exports = renderFacturaA;
```

Podés copiar [`../../facturaA.template.js`](../../facturaA.template.js) como base o delegar en ella pasando `typography` u otras opciones.

## Despliegue

1. Agregar `miempresa.template.js` en esta carpeta.
2. Deploy del backend.
3. En **Configuración → Plantilla Factura A**, elegir la opción personalizada (o setear `PDF_PLANTILLA_FCA=miempresa` en la base).

Si el slug no existe, el sistema usa la plantilla **estándar** y registra una advertencia en logs.
