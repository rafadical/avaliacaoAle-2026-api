# Desenvolvimento Web — Avaliação Prática 2º Bimestre

## Requisitos atendidos

| Requisito | Onde |
|-----------|------|
| Node.js 24+ | `app/package.json` |
| PostgreSQL 17+ | `docker-compose.yml` |
| Express | `app/server.js` |
| Sequelize com driver `pg` | `app/src/config/database.js` |
| 4+ tabelas | `usuarios`, `categorias`, `cursos`, `matriculas`, `avaliacoes` |
| Email único na tabela usuarios | `app/src/models/usuario.js` |
| Senha com bcrypt | hook `beforeCreate` em `usuario.js` |
| Tabela pivô N:N | `matriculas` (usuarios ↔ cursos) |
| Model para cada tabela | `app/src/models/` |
| CRUD completo por entidade | 25 endpoints (5 por entidade) |
| Login com JWT | `app/src/controllers/auth.controller.js` |
| Rotas protegidas por JWT | `router.use(autenticarJWT)` em `routes/index.js` |
| Middlewares próprios | `log.middleware.js`, `auth.middleware.js`, `error.middleware.js` |
| docker-compose.yml | raiz do projeto |
| Container Postgres | serviço `postgres` |
| Container Node | serviço `app` |
| Container Nginx | serviço `nginx` |
| Node privado (sem porta no host) | `app` não tem `ports:` |
| Arquitetura Host → Nginx → Node → Postgres | `nginx/nginx.conf` |
| Entrypoint web | `app/server.js` |
| Entrypoint CLI | `app/command.js` |
| Migrations via CLI | `node command.js migrate` |
| Swagger | `app/src/config/swagger.js`, disponível em `/api-docs` |

## Rotas

Rotas públicas:

```
POST /login
GET  /health
```

Rotas autenticadas (Bearer JWT) — para cada entidade (`usuarios`, `categorias`, `cursos`, `matriculas`, `avaliacoes`):

```
GET    /<entidade>
GET    /<entidade>/:id
POST   /<entidade>
PUT    /<entidade>/:id
DELETE /<entidade>/:id
```

## Testar

```bash
curl -X POST http://localhost/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@cursos.com","senha":"admin123"}'

TOKEN="eyJhbGciOiJI..."
curl http://localhost/cursos -H "Authorization: Bearer $TOKEN"
```

## Middlewares

- `log.middleware.js` — loga método, URL, status e tempo de cada requisição
- `auth.middleware.js` — valida o JWT e bloqueia rotas não autenticadas
- `error.middleware.js` — captura erros do Sequelize e retorna JSON estruturado
