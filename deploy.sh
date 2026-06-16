#!/usr/bin/env bash
# deploy.sh — sobe toda a infraestrutura da Avaliacao Pratica (Opcao A: Docker)
# Uso: bash deploy.sh [--seed]
#   --seed   popula o banco com dados de exemplo apos subir

set -euo pipefail

SEED=false
for arg in "$@"; do
  [[ "$arg" == "--seed" ]] && SEED=true
done

# -----------------------------------------------------------------
# 1. Verifica pre-requisitos
# -----------------------------------------------------------------
echo "[1/5] Verificando pre-requisitos..."
command -v docker >/dev/null 2>&1 || { echo "ERRO: Docker nao encontrado. Instale o Docker Desktop."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "ERRO: Docker Compose v2 nao encontrado."; exit 1; }

# -----------------------------------------------------------------
# 2. Garante que o .env raiz existe
# -----------------------------------------------------------------
echo "[2/5] Verificando configuracao de ambiente..."
if [[ ! -f .env ]]; then
  echo "  Arquivo .env nao encontrado. Copiando .env.example -> .env"
  cp .env.example .env
fi
if [[ ! -f app/.env ]]; then
  echo "  Arquivo app/.env nao encontrado. Copiando app/.env.example -> app/.env"
  cp app/.env.example app/.env
fi

# Sincroniza DB_PASSWORD: o app/.env deve usar a mesma senha do .env raiz
ROOT_PASS=$(grep '^DB_PASSWORD=' .env | cut -d= -f2)
APP_PASS=$(grep '^DB_PASSWORD=' app/.env | cut -d= -f2)
if [[ "$ROOT_PASS" != "$APP_PASS" ]]; then
  echo "  Sincronizando DB_PASSWORD no app/.env com o valor do .env raiz..."
  sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=${ROOT_PASS}/" app/.env
fi

# -----------------------------------------------------------------
# 3. Build + subida dos containers
# -----------------------------------------------------------------
echo "[3/5] Construindo imagem e subindo containers..."
docker compose up --build -d

# -----------------------------------------------------------------
# 4. Aguarda app ficar saudavel
# -----------------------------------------------------------------
echo "[4/5] Aguardando aplicacao ficar saudavel..."
RETRIES=20
until docker compose ps app | grep -q "healthy" || [[ $RETRIES -eq 0 ]]; do
  echo "  Aguardando... (tentativas restantes: $RETRIES)"
  sleep 5
  RETRIES=$((RETRIES - 1))
done
if [[ $RETRIES -eq 0 ]]; then
  echo "ERRO: Aplicacao nao ficou saudavel. Veja os logs:"
  docker compose logs app --tail=30
  exit 1
fi

# -----------------------------------------------------------------
# 5. Migrations (e seed opcional)
# -----------------------------------------------------------------
echo "[5/5] Rodando migrations..."
docker compose exec app node command.js migrate

if [[ "$SEED" == "true" ]]; then
  echo "  Populando banco com dados de exemplo..."
  docker compose exec app node command.js seed
fi

# -----------------------------------------------------------------
# Resumo
# -----------------------------------------------------------------
echo ""
echo "========================================"
echo " Infraestrutura no ar!"
echo "========================================"
echo " API:     http://localhost/health"
echo " Swagger: http://localhost/api-docs"
echo ""
echo " Comandos uteis:"
echo "   docker compose ps                  # status dos containers"
echo "   docker compose logs -f             # logs em tempo real"
echo "   docker network inspect tcc_internal # inspeciona rede interna"
echo "   docker compose down                # para (preserva dados)"
echo "   docker compose down -v             # para + apaga volumes"
echo "========================================"
