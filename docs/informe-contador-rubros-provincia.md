# Informe mensual Rubros por Provincia (contador → Google Drive)

## Objetivo

Que el contador obtenga cada mes el informe **Ventas / Informes / Rubros por Provincia** sin usuario ni acceso a Janus.

Flujo:

1. Se configura la empresa en **Configuración → Reportes automáticos** (`/configuracion/reportes`).
2. Un job de Node genera los PDF del mes anterior en una carpeta local del servidor.
3. **rclone** sube esa carpeta a Google Drive (service account).
4. La carpeta de Drive se comparte en **solo lectura** con el mail del contador.

```
UI /configuracion/reportes → t_configuracion
Cron (día 1) → npm run job:rubros-provincia → PDFs locales → rclone → Google Drive → Contador
```

---

## Configuración desde la UI (recomendado)

Ruta: **`/configuracion/reportes`**

| Campo en pantalla | Código `t_configuracion` | Descripción |
|-------------------|--------------------------|-------------|
| Activar export automático | `reportes_auto_enabled` | `1` = el cron procesa esta empresa |
| Carpeta local en el servidor | `reportes_auto_dir` | Path absoluto, ej. `/var/janus/contador/rubros-provincia` |
| Remoto rclone | `reportes_auto_rclone` | Opcional, ej. `gdrive:Contabilidad/RubrosProvincia` |

También hay **Generar ahora** (período a demanda) vía `POST /api/informes/ventas-rubros-provincia/export-auto`.

Migración SQL (una vez por DB de empresa):

```bash
mysql -u ... -p nombre_db_empresa < backend/src/migrations/20260805_add_reportes_auto_config.sql
```

Si las filas no existen, al **Guardar** desde la UI el `PUT /api/config/:codigo` las crea (upsert).

---

## Funcionalidad

### Qué genera

Por defecto (sin flags), el job usa el **mes calendario anterior** y crea:

| Archivo | Contenido |
|---------|-----------|
| `ventas-rubros-provincia-YYYY-MM-01-YYYY-MM-DD.pdf` | Facturas (tipos FCA/FCB/FCC/PRF) |
| `notas-credito-rubros-provincia-YYYY-MM-01-YYYY-MM-DD.pdf` | Notas de crédito |

Se guardan bajo:

```text
{reportes_auto_dir}/YYYY-MM/
```

Ejemplo: `/var/janus/contador/rubros-provincia/2026-07/ventas-rubros-provincia-2026-07-01-2026-07-31.pdf`

Si hay remoto rclone, copia esa subcarpeta:

```text
gdrive:Contabilidad/RubrosProvincia/2026-07/
```

### Criterios del informe (iguales a la UI)

Mismos que `/ventas/informes/rubros-provincia` y `GET /api/informes/ventas-rubros-provincia`:

- Rango de fechas obligatorio.
- Solo comprobantes **no anulados**.
- Solo con **CAE** (`afip_cae > 0`).
- Facturas: tipos `FCA`, `FCB`, `FCC`, `PRF`.
- Agrupación por provincia (cliente / CP) y rubro.
- Columnas por categoría IVA × alícuota (RI/RM/Otros × 10.5% / 21%).

El job **no** filtra por forma de pago ni por provincia: exporta el informe completo del período.

### Componentes en el código

| Pieza | Path |
|-------|------|
| UI configuración | `frontend/src/routes/configuracion/reportes/+page.svelte` |
| Service datos + PDF | `backend/src/services/informeRubrosProvincia.service.js` |
| Service export disco/rclone | `backend/src/services/reportesAuto.service.js` |
| Script CLI | `backend/src/scripts/export-rubros-provincia-mensual.js` |
| API | `GET .../ventas-rubros-provincia`, `/pdf`, `POST .../export-auto` |
| Informe UI | `/ventas/informes/rubros-provincia` |

---

## Fallback `.env` (servidor)

Si un valor no está en `t_configuracion`, se usa el entorno:

```bash
# Opcional: forzar una sola empresa en el cron
# CONTADOR_EMPRESA_ID=uuid-de-la-empresa
# Fallback si reportes_auto_dir / rclone están vacíos:
# CONTADOR_REPORTS_DIR=/var/janus/contador/rubros-provincia
# CONTADOR_RCLONE_REMOTE=gdrive:Contabilidad/RubrosProvincia
```

Sin `CONTADOR_EMPRESA_ID`, el job recorre empresas **activas** con `reportes_auto_enabled=1`.

También conviene fijar timezone del proceso/cron:

```bash
TZ=America/Argentina/Buenos_Aires
```

---

## Uso manual

Desde `janus314/backend`:

```bash
# Empresas con export automático activo (mes anterior)
npm run job:rubros-provincia

# Forzar una empresa aunque esté desactivado
npm run job:rubros-provincia -- --empresa UUID --force

# Período a demanda
npm run job:rubros-provincia -- --desde 2026-07-01 --hasta 2026-07-31

# Solo un tipo
npm run job:rubros-provincia -- --tipo facturas

npm run job:rubros-provincia -- --help
```

---

## Cron (servidor)

Ejemplo: día 1 de cada mes a las 06:00 (hora Argentina):

```cron
TZ=America/Argentina/Buenos_Aires
0 6 1 * * cd /ruta/a/janus314/backend && /usr/bin/npm run job:rubros-provincia >> /var/log/janus-rubros-provincia.log 2>&1
```

Ajustá la ruta de Node/npm si usás nvm:

```cron
0 6 1 * * cd /ruta/a/janus314/backend && /home/usuario/.nvm/versions/node/v20.x.x/bin/npm run job:rubros-provincia >> /var/log/janus-rubros-provincia.log 2>&1
```

---

## Acceso del servidor a Google Drive (rclone + service account)

### 1. Proyecto GCP y API

1. Entrá a [Google Cloud Console](https://console.cloud.google.com/).
2. Creá un proyecto (o usá uno existente).
3. Habilitá **Google Drive API** (APIs y servicios → Biblioteca → Google Drive API → Habilitar).

### 2. Service account + JSON

1. IAM y administración → Cuentas de servicio → **Crear cuenta de servicio**.
2. Nombre sugerido: `janus-contador-reports`.
3. Creá una clave: Acciones → Administrar claves → Agregar clave → JSON.
4. Guardá el JSON en el servidor, fuera del repo, con permisos restringidos, por ejemplo:

```bash
sudo mkdir -p /etc/janus/secrets
sudo mv ~/descargas/janus-contador-xxxxx.json /etc/janus/secrets/gdrive-sa.json
sudo chown root:janus /etc/janus/secrets/gdrive-sa.json   # o el usuario del cron
sudo chmod 640 /etc/janus/secrets/gdrive-sa.json
```

Anotá el email de la service account (`...@....iam.gserviceaccount.com`).

### 3. Carpeta en Drive y permisos

1. En Google Drive (cuenta de la empresa), creá la carpeta, p. ej. `Contabilidad/RubrosProvincia`.
2. Compartila con el email de la **service account** con rol **Editor**.
3. Compartila con el mail del **contador** con rol **Lector** (solo lectura).

> Importante: las service accounts no usan “Mi unidad” personal de un usuario humano. La carpeta debe estar compartida explícitamente con el email de la SA. Para evitar líos de cuotas de “Drive de service account”, usá una carpeta de un usuario/organización y compartila con la SA (no subas a la unidad raíz de la SA).

### 4. Instalar y configurar rclone

```bash
# Debian/Ubuntu (o https://rclone.org/install/)
curl https://rclone.org/install.sh | sudo bash
rclone version
```

Configuración interactiva:

```bash
rclone config
```

Valores típicos:

| Campo | Valor |
|-------|--------|
| name | `gdrive` |
| Storage | `drive` (Google Drive) |
| client_id / client_secret | dejar vacío (usa defaults de rclone) o OAuth propio |
| scope | `drive` (acceso completo a archivos compartidos) |
| service_account_file | `/etc/janus/secrets/gdrive-sa.json` |
| team_drive | vacío (salvo Shared Drive) |

En Shared Drives (Google Workspace), configurá el `team_drive` / `root_folder_id` según la doc de rclone.

### 5. Probar

```bash
rclone lsd gdrive:
rclone lsf gdrive:Contabilidad/RubrosProvincia

mkdir -p /tmp/rclone-test && echo ok > /tmp/rclone-test/ping.txt
rclone copy /tmp/rclone-test gdrive:Contabilidad/RubrosProvincia/_test
rclone ls gdrive:Contabilidad/RubrosProvincia/_test
```

Luego en `/configuracion/reportes` poné el remoto `gdrive:Contabilidad/RubrosProvincia` y usá **Generar ahora**, o:

```bash
cd /ruta/a/janus314/backend
npm run job:rubros-provincia -- --empresa UUID --force --desde 2026-07-01 --hasta 2026-07-31
```

### 6. Contador

1. Abrí el mail de invitación de Drive (o la URL de la carpeta).
2. Acceso solo lectura a `Contabilidad/RubrosProvincia`.
3. Cada mes debería aparecer `YYYY-MM/` con los PDF.

No hace falta cuenta en Janus.

---

## Checklist de verificación

- [ ] Migración / filas `reportes_auto_*` en la DB de la empresa (o guardado desde la UI).
- [ ] En `/configuracion/reportes`: activar, carpeta local, remoto rclone.
- [ ] **Generar ahora** deja PDF en la carpeta y (si aplica) en Drive.
- [ ] Drive API habilitada; JSON de SA en el servidor.
- [ ] Carpeta Drive compartida con la SA (Editor) y el contador (Lector).
- [ ] `rclone lsd gdrive:` funciona sin pedir browser.
- [ ] Cron del día 1 configurado con `TZ=America/Argentina/Buenos_Aires`.
- [ ] La UI `/ventas/informes/rubros-provincia` sigue generando el mismo informe.

---

## Troubleshooting

| Síntoma | Qué revisar |
|---------|-------------|
| Skip empresa / no procesa | `reportes_auto_enabled` ≠ 1; usá `--force` o activá en la UI. |
| Falta carpeta de salida | `reportes_auto_dir` vacío y sin `CONTADOR_REPORTS_DIR`. |
| PDF vacío / totales en 0 | Período sin facturas con CAE; comparar con la UI el mismo rango. |
| `rclone: command not found` | Instalar rclone o dejar remoto vacío (solo disco). |
| rclone: directory not found / vacío | Carpeta no compartida con la SA; scope; path remoto. |
| Cron no corre | Logs; path absoluto a `npm`; permisos del directorio. |
| Timezone raro | Fijar `TZ=America/Argentina/Buenos_Aires` en cron y/o `.env`. |

---

## Fuera de alcance

- Envío por email / SMTP.
- Usuario o portal del contador en Janus.
- Export Excel (solo PDF por ahora).
- Scheduler embebido en `server.js` (el cron del SO evita jobs duplicados con varias instancias de la API).
