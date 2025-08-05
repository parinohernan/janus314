# Despliegue en Netlify

Este proyecto está configurado para desplegarse en Netlify. Sigue estos pasos para hacer el despliegue:

## Configuración Actual

El proyecto ya está configurado con:
- `@sveltejs/adapter-netlify` instalado
- `netlify.toml` configurado
- `_redirects` configurado para SPA routing

## Pasos para Desplegar

### Opción 1: Despliegue desde GitHub (Recomendado)

1. **Sube tu código a GitHub**
   ```bash
   git add .
   git commit -m "Configuración para Netlify"
   git push origin main
   ```

2. **Conecta con Netlify**
   - Ve a [netlify.com](https://netlify.com)
   - Crea una cuenta o inicia sesión
   - Haz clic en "New site from Git"
   - Selecciona tu repositorio de GitHub
   - Configura:
     - **Build command**: `npm run build`
     - **Publish directory**: `build`
     - **Base directory**: `frontend` (si tu repositorio contiene todo el proyecto)

3. **Variables de entorno (si es necesario)**
   - En la configuración del sitio en Netlify, ve a "Site settings" > "Environment variables"
   - Agrega cualquier variable de entorno que necesite tu aplicación

### Opción 2: Despliegue Manual

1. **Construye el proyecto**
   ```bash
   npm run build
   ```

2. **Sube a Netlify**
   - Ve a [netlify.com](https://netlify.com)
   - Arrastra y suelta la carpeta `build` en el área de despliegue

## Configuración del Backend

**Importante**: Este despliegue es solo del frontend. Necesitarás:

1. **Desplegar el backend por separado** (Heroku, Railway, DigitalOcean, etc.)
2. **Configurar las variables de entorno** en Netlify para apuntar a tu backend
3. **Actualizar las URLs de la API** en tu código si es necesario

## Variables de Entorno Recomendadas

```env
VITE_API_URL=https://tu-backend-url.com
VITE_APP_NAME=Janus314
```

## Troubleshooting

### Error de Build
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que el comando `npm run build` funcione localmente

### Error de Routing
- El archivo `_redirects` ya está configurado para SPA routing
- Si tienes problemas, verifica que el archivo esté en la raíz del proyecto

### Error de CORS
- Configura CORS en tu backend para permitir requests desde tu dominio de Netlify
- Agrega tu dominio de Netlify a la lista de orígenes permitidos

## Comandos Útiles

```bash
# Construir para producción
npm run build

# Previsualizar build local
npm run preview

# Verificar configuración
npm run check
```

## Notas Importantes

- El frontend se desplegará en un dominio como `https://tu-app.netlify.app`
- Cada push a la rama principal activará un nuevo despliegue automáticamente
- Puedes configurar un dominio personalizado en la configuración de Netlify 