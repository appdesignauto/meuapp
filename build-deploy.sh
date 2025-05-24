#!/bin/bash

echo "🚀 Iniciando build otimizado para deployment..."

# Configurar variáveis de ambiente para otimização
export NODE_OPTIONS="--max-old-space-size=2048"
export NODE_ENV="production"

# Limpar cache e diretórios de build antigos
echo "🧹 Limpando cache..."
rm -rf dist/
rm -rf client/dist/
rm -rf node_modules/.vite/

# Build do frontend com configurações otimizadas
echo "🎨 Construindo frontend..."
npx vite build --mode production --no-minify

# Build do backend
echo "⚙️ Construindo backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18 --minify=false

echo "✅ Build concluído com sucesso!"
echo "📁 Arquivos gerados em: dist/"