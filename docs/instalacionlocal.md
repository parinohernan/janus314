# Instalar Janus314 en una PC con Windows 10

Dejá MySQL, el backend y el frontend corriendo en la misma máquina, sin XAMPP y sin Docker. Al terminar, la API responde en `http://localhost:3330` y el ERP se abre en `http://localhost:5173`.

MySQL tiene que quedar como servicio de Windows. El backend y el frontend se levantan a mano, cada uno en su terminal, cada vez que vas a usar el sistema.

## Qué instalar

| Pieza | Versión | Para qué |
| --- | --- | --- |
| Git for Windows | última estable | clonar el repo y evitar el límite de rutas |
| Node.js | 22 LTS | backend y frontend. Incluye npm |
| MySQL Community Server | 8.0 | base maestra y una base por empresa |
| MySQL Workbench | el del mismo instalador | ver y restaurar dumps. Opcional |

No instales XAMPP. Trae MariaDB, y un dump de este MySQL puede no restaurar ahí. Apache y PHP no los usa este proyecto.

Redis no hace falta para desarrollar. Si `REDIS_HOST` no está en el `.env`, la caché queda apagada y el servidor arranca igual.

## 1. Git y Node

1. Instalá Git desde https://git-scm.com/download/win.
2. Abrí **PowerShell** y ejecutá:

```powershell
git config --global core.longpaths true
```

Sin eso, `npm install` del frontend se corta: `node_modules` de SvelteKit supera el límite de rutas de Windows.

3. Instalá Node.js 22 LTS desde https://nodejs.org (el instalador de Windows, no el de Microsoft Store). Dejá marcada la opción de agregar Node al PATH.
4. Cerrá y volvé a abrir PowerShell. Comprobá:

```powershell
node -v
npm -v
git --version
```

`node -v` tiene que mostrar una 22.x.

## 2. MySQL 8

1. Descargá **MySQL Installer** desde https://dev.mysql.com/downloads/installer/.
2. En el asistente elegí **Server only** (MySQL Server 8.0). Workbench lo podés agregar en el mismo instalador si lo querés.
3. Dejá el puerto **3306**.
4. Anotá la contraseña de `root`. La vas a poner en el `.env`.
5. Configurá el servidor para que arranque con Windows (servicio de Windows).
6. Comprobá, en PowerShell:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "SELECT VERSION();"
```
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -h 127.0.0.1 -P 3307 -e "SELECT VERSION();"

Tiene que imprimir una versión 8.0.

## 3. Código

Cloná el repositorio y entrá a la carpeta raíz (ahí están `backend/` y `frontend/`).

No copies el `.env` de otra máquina. Ese archivo apunta al MySQL remoto y trae claves que no son de esta PC.

## 4. Backend

En PowerShell, desde la raíz del repo:

```powershell
cd backend
copy .env.example .env
npm install
```

Editá `backend/.env`. El ejemplo del repo trae `PORT=3000`; en local tiene que ser **3330**, porque el frontend ya llama a ese puerto.

```env
NODE_ENV=development
PORT=3330
JWT_SECRET=una-clave-larga-solo-de-esta-pc

JANUS_SUPERADMIN_USER=janus
JANUS_SUPERADMIN_PASSWORD_HASH=

EMPRESAS_DB_NAME=janus314_master
EMPRESAS_DB_USER=root
EMPRESAS_DB_PASSWORD=la-clave-de-root
EMPRESAS_DB_HOST=localhost
EMPRESAS_DB_PORT=3306

MYSQLDUMP_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe
MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
BACKUP_DIR=backups
BACKUP_KEEP=5
```

Dejá vacíos `CLOUDINARY_*` si no vas a usar la galería de remitos. No pongas `REDIS_HOST`.

El hash del superadmin (pantalla `/admin`) se genera en `backend/`:

```powershell
node -e "require('bcrypt').hash('tu-clave', 12).then(console.log)"
```

Copiá el resultado en `JANUS_SUPERADMIN_PASSWORD_HASH`.

Si `npm install` falla en `bcrypt`, instalá **Visual Studio Build Tools** con la carga “Desarrollo para el escritorio con C++” y volvé a correr `npm install`.

## 5. Bases de datos

El arranque solo comprueba que exista la base maestra. Cada empresa tiene otra base, y el nombre, el host y la clave de esa base están en la tabla `empresas`.

### Base vacía, solo para ver si enciende

```sql
CREATE DATABASE janus314_master CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Con eso el backend conecta. El login de una empresa no va a funcionar hasta importar datos.

### Con los datos reales

1. Creá `janus314_master` (o el nombre que uses en `EMPRESAS_DB_NAME`).
2. Importá el dump de la base maestra.
3. Importá el dump de cada empresa. El nombre de la base tiene que coincidir con `empresas.db_name`.
4. En la base maestra, apuntá todas las empresas a este MySQL local. Si no, el login sigue yendo al servidor remoto:

```sql
UPDATE empresas
SET db_host = 'localhost',
    db_port = 3306,
    db_user = 'root',
    db_password = 'la-clave-de-root';
```

Usá la misma clave que pusiste en `EMPRESAS_DB_PASSWORD`.

La facturación electrónica usa el `arcaendpoint` que venga en ese registro. Un dump de producción puede seguir hablando con AFIP real. No emitas comprobantes desde esta copia hasta confirmar ese endpoint.

## 6. Frontend

En otra terminal, desde la raíz del repo:

```powershell
cd frontend
npm install
```

Creá `frontend/.env`:

```env
PUBLIC_API_URL="http://localhost:3330/api"
```

`PUBLIC_API_URL` tiene que terminar en `/api`. El proxy de Vite manda `/api` al mismo origen (`http://localhost:3330`).

## 7. Arrancar

MySQL ya tiene que estar corriendo como servicio.

Terminal 1:

```powershell
cd backend
npm run dev
```

Tiene que aparecer la conexión a la base maestra y `Servidor escuchando en el puerto 3330`.

Terminal 2:

```powershell
cd frontend
npm run dev
```

Abrí `http://localhost:5173`.

Para cortar cada proceso: `Ctrl+C` en su terminal. MySQL se queda como servicio.

## Cada vez que uses la PC

1. Confirmá que el servicio MySQL está en ejecución.
2. `npm run dev` en `backend`.
3. `npm run dev` en `frontend`.
4. Entrá a `http://localhost:5173`.

No hace falta volver a instalar ni a correr `npm install`, salvo que cambien dependencias.

## Si algo falla

| Lo que ves | Qué revisar |
| --- | --- |
| `node` no se reconoce | Cerrá la terminal después de instalar Node, o reinstalá marcando “Add to PATH”. |
| `npm install` del front se corta por una ruta larga | `git config --global core.longpaths true` y borra `frontend/node_modules` antes de reinstalar. |
| El backend sale al toque con error de base | MySQL apagado, clave distinta, o `EMPRESAS_DB_NAME` que todavía no existe. |
| El front abre y el login no llega a la API | `PORT=3330` en el backend y `PUBLIC_API_URL="http://localhost:3330/api"` en el front. Reiniciá los dos `npm run dev` después de cambiar un `.env`. |
| Entra al login pero no hay empresas o no conecta | Falta el dump, o `empresas.db_host` sigue apuntando afuera. Repetí el `UPDATE` del paso 5. |
| Backup de empresa dice que no encuentra `mysqldump` | `MYSQLDUMP_PATH` y `MYSQL_PATH` con la ruta completa de los `.exe`. |
| Desde el celular en la misma Wi-Fi no carga | El backend, en desarrollo, acepta Vite en la red local (puerto 5173). Windows tiene que permitir Node en redes privadas. |

## Checklist

- [ ] `node -v` es 22.x y `core.longpaths` está en `true`
- [ ] MySQL 8.0 escucha en el puerto 3306 y arranca con Windows
- [ ] `backend/.env` usa `localhost`, `PORT=3330` y la clave local de `root`
- [ ] `frontend/.env` tiene `PUBLIC_API_URL="http://localhost:3330/api"`
- [ ] Existe la base maestra
- [ ] Si importaste dumps, cada base de empresa existe y `empresas.db_host` es `localhost`
- [ ] `npm run dev` del backend muestra el puerto 3330
- [ ] `http://localhost:5173` abre el ERP
