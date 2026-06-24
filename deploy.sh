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
echo "[1/4] Verificando pre-requisitos..."
command -v docker >/dev/null 2>&1 || { echo "ERRO: Docker nao encontrado. Instale o Docker Desktop."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "ERRO: Docker Compose v2 nao encontrado."; exit 1; }

# -----------------------------------------------------------------
# 2. Build + subida dos containers
#    Nao precisa de .env: o docker-compose.yml ja traz valores padrao.
#    Um .env na raiz e opcional, apenas para sobrescrever as senhas.
# -----------------------------------------------------------------
echo "[2/4] Construindo imagem e subindo containers..."
docker compose up --build -d

# -----------------------------------------------------------------
# 3. Aguarda app ficar saudavel
# -----------------------------------------------------------------
echo "[3/4] Aguardando aplicacao ficar saudavel..."
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
# 4. Migrations (e seed opcional)
# -----------------------------------------------------------------
echo "[4/4] Rodando migrations..."
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
echo "   docker compose ps                     # status dos containers"
echo "   docker compose logs -f                # logs em tempo real"
echo "   docker network inspect cursos_internal # inspeciona rede interna"
echo "   docker compose down                   # para (preserva dados)"
echo "   docker compose down -v                # para + apaga volumes"
echo "========================================"
