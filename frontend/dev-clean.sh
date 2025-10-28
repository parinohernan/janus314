#!/bin/bash

# Script para iniciar el servidor de desarrollo con entorno limpio
# Limpia todas las variables de entorno relacionadas con Vite y Node

echo "🧹 Limpiando variables de entorno..."

# Desactivar variables de entorno que puedan interferir
unset VITE_ROOT
unset VITE_CWD
unset NODE_PATH

# Limpiar cachés
echo "🗑️  Limpiando cachés..."
rm -rf .svelte-kit node_modules/.vite

# Sincronizar SvelteKit
echo "🔄 Sincronizando SvelteKit..."
npx svelte-kit sync

# Iniciar servidor
echo "🚀 Iniciando servidor de desarrollo..."
npm run dev

